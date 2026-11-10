import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function namedFunction(file, name) {
  const tree = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === name) result = node.getText(tree); ts.forEachChild(node, visit); }
  visit(tree); assert.ok(result, name);
  return ts.transpileModule(`${result}\nmodule.exports = ${name};`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
}
for (const file of ['components/admin/rows/FinanceLeadRow.tsx', 'components/admin/rows/StandardLeadCard.tsx']) {
  test(`${file}: Full and Partial never redirect a multi-invoice payment into the invoice editor`, async () => {
    for (const type of ['full', 'partial']) {
      const module = { exports: {} }, opened = [];
      vm.runInNewContext(namedFunction(file, 'handlePaymentReceived'), { module, l: { id: 'customer', customerInvoiceCount: 2 }, openInvoicePayment: (...args) => opened.push(args), openInvoiceModal: () => assert.fail('Payment must not open the invoice editor'), setPayStep() {} });
      await module.exports(type, 200); assert.deepEqual(opened[0], ['customer', type]);
    }
  });
  test(`${file}: existing single-invoice Full and Partial actions continue to record payment`, async () => {
    for (const type of ['full', 'partial']) {
      const module = { exports: {} }, writes = [], receipts = [];
      vm.runInNewContext(namedFunction(file, 'handlePaymentReceived'), {
        module, l: { id: 'customer' }, invoiceTotal: 1000, paymentSaving: { current: false }, setPayStep() {}, setPartialAmt() {},
        updateLeadField: async (_id, values) => { writes.push(values); return true; }, openPaymentReceipt: id => receipts.push(id),
        openInvoiceModal: () => assert.fail('Payment must not open the invoice editor'),
      });
      await module.exports(type, 200);
      assert.equal(writes[0].amountPaid, type === 'full' ? 1000 : 200);
      assert.equal(writes[0].status, type === 'full' ? 'Payment Received' : 'Payment Pending');
      assert.equal(receipts.length, type === 'full' ? 1 : 0);
    }
  });
}
test('payment dialog sends an additional partial amount and a stable retry ID, keeping failed saves open', async () => {
  const module = { exports: {} }, requests = [], notices = [], receipts = [];
  let fail = true;
  const context = { module, selected: { id: 'customer~invoice~a' }, balance: { totalCents: 100000, paidCents: 20000, remainingCents: 80000 }, type: 'partial', amount: '150', pending: { current: false }, paymentRequest: { current: null },
    crypto: { randomUUID: () => 'same-request-on-retry-0001' }, setBusy() {}, setError() {}, setNotice: notice => notices.push(notice), setAmount() {}, setInvoices() {}, onChanged() {},
    setRequest: () => assert.fail('Partial payment must keep the dialog open'), openPaymentReceipt: id => receipts.push(id), money: cents => `AUD $${(cents / 100).toFixed(2)}`, invoiceBalance: invoice => ({ remainingCents: (1000 - invoice.amountPaid) * 100 }),
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok: !fail, json: async () => fail ? { error: 'Temporary failure' } : { item: { id: 'customer~invoice~a', amountPaid: 350, invoiceStatus: 'Partially Paid', invoiceNumber: 'INV-A' } } }; },
  };
  vm.runInNewContext(namedFunction('components/admin/InvoicePaymentModal.tsx', 'save'), context);
  await module.exports(); fail = false; await module.exports();
  assert.equal(requests[0].amount, 150); assert.equal(requests[0].expectedPaidCents, 20000);
  assert.equal(requests[0].requestId, requests[1].requestId); assert.equal(receipts.length, 0);
  assert.match(notices.at(-1), /650.00 remains/);
});
