import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { loadTs } from './test-ts-loader.mjs';

const { invoiceChanges, invoiceDraftForLead } = loadTs('lib/invoiceDraft.ts');
const lead = { id: 'customer123', name: 'Sam', service: 'Shower Regrouting', status: 'Job Done', quoteAmount: 3465, email: 'customer@example.com' };
const input = { id: lead.id, service: lead.service, description: 'Original work', extraWork: 'Extra Work Done During Job', extraCharge: 100, price: 3565, gst: 10, status: 'Unpaid', bankName: 'ANZ', accountName: 'Groutix', accountNumber: '669909988', bsb: '013442', dueDate: 'Within 7 days' };

test('saving and reopening extra work retains the $3,565 total without adding the $100 twice', () => {
  const changes = invoiceChanges(lead, input);
  const draft = invoiceDraftForLead({ ...lead, ...changes });
  assert.equal(changes.invoiceAmount, 3565);
  assert.equal(draft.basePrice, 3465);
  assert.equal(draft.extraCharge, 100);
  assert.equal(draft.extraWork, input.extraWork);
  assert.equal(draft.description, input.description);
  assert.equal(draft.basePrice + draft.extraCharge, 3565);
  assert.equal(invoiceDraftForLead({ ...lead, invoiceAmount: 3565 }).basePrice, 3565, 'legacy totals are preserved');
  for (const price of [NaN, Infinity, -1, 0]) assert.throws(() => invoiceChanges(lead, { ...input, price }));
  assert.throws(() => invoiceChanges(lead, { ...input, extraCharge: -100 }));
});

test('Save Invoice persists the complete draft and reports database failures without sending mail', async () => {
  let stored, fail = false;
  const { POST } = loadTs('app/api/admin/invoice/save/route.ts', {
    '@/lib/adminAuth': { verifyRequestSession: async req => req.authorized ? { username: 'manager' } : null },
    '@/lib/customerInvoices': { getInvoiceSubmission: async () => ({ ...lead, ...stored }), updateInvoiceSubmission: async (_id, updates) => { stored = updates; return !fail; } },
  });
  const req = authorized => ({ authorized, json: async () => input });
  assert.equal((await POST(req(false))).status, 401);
  const response = await POST(req(true));
  assert.equal(response.status, 200);
  assert.equal(stored.invoiceDraft.extraCharge, 100);
  assert.equal(stored.invoiceAmount, 3565);
  assert.equal(stored.status, undefined, 'saving an unpaid draft preserves the workflow');
  assert.equal((await response.json()).item.invoiceDraft.extraWork, input.extraWork);
  fail = true;
  assert.equal((await POST(req(true))).status, 500);
});

test('PDF and email use the saved extra work and matching inclusive total', async () => {
  const saved = { ...lead, ...invoiceChanges(lead, input) };
  const pdfs = [], emails = [], writes = [];
  const overrides = {
    '@/lib/customerInvoices': { getInvoiceSubmission: async () => saved, updateInvoiceSubmission: async (_id, values) => { writes.push(values); return true; }, appendInvoiceActivity: async () => {} },
    '@/lib/adminAuth': { verifyRequestSession: async () => ({ username: 'manager' }) },
    '@/lib/quotePdf': { buildQuotePdfBase64: async values => { pdfs.push(values); return Buffer.from('pdf').toString('base64'); } },
    '@/lib/email': { isEmailConfigured: () => true, sendEmail: async values => emails.push(values), getEmailLogoUrl: async () => '', wrapEmailHtml: html => html },
    '@/lib/automations': { invoiceTrackingPixel: () => '' },
    '@/lib/quickbooks': { isQboConfigured: () => false },
  };
  const { GET } = loadTs('app/api/admin/invoice/pdf/[id]/route.ts', overrides);
  assert.equal((await GET({ nextUrl: new URL('https://example.com/invoice') }, { params: Promise.resolve({ id: lead.id }) })).status, 200);
  const { POST } = loadTs('app/api/admin/invoice/send/route.ts', overrides);
  assert.equal((await POST({ json: async () => input })).status, 200);
  for (const pdf of pdfs) {
    assert.equal(pdf.total, 3565);
    assert.equal(pdf.items.length, 2);
    assert.equal(pdf.items[0].price, 3465);
    assert.equal(pdf.items[1].price, 100);
    assert.equal(pdf.items[1].description, input.extraWork);
    assert.ok(Math.abs(pdf.subtotal + pdf.gst - 3565) < 0.001);
  }
  assert.equal(pdfs.length, 2);
  assert.equal(writes[0].invoiceDraft.extraWork, input.extraWork);
  assert.match(emails[0].html, /Extra Work Done During Job/);
});

test('the invoice editor retains its selected record and errors after saving', async () => {
  const source = readFileSync('app/admin/page.tsx', 'utf8');
  const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSaveInvoice') handler = node.getText(tree); ts.forEachChild(node, visit); };
  visit(tree);
  const compiled = ts.transpileModule(`${handler}\nmodule.exports = handleSaveInvoice;`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  for (const ok of [true, false]) {
    const state = { closed: false, error: '', leads: [lead] }, module = { exports: {} };
    vm.runInNewContext(compiled, { module, activeInvoiceLead: lead, invoiceSaveInFlight: { current: false }, sendingInvoice: false,
      currentInvoiceInput: () => input, setSavingInvoice() {},
      leads: [lead], leadReadVersion: { current: 0 }, setStatusFilter() {}, publishCrmChange() {},
      setInvoiceSaveError: error => { state.error = error; }, setInvoiceModalOpen: open => { state.closed = !open; },
      setCustomerInvoices() {}, setLeads: update => { state.leads = update(state.leads); }, setActiveInvoiceLead() {},
      fetch: async () => { assert.equal(state.closed, false); return { ok, json: async () => ok ? { item: { ...lead, ...invoiceChanges(lead, input) } } : { error: 'Database unavailable' } }; },
    });
    await module.exports();
    assert.equal(state.closed, false);
    assert.equal(state.error, ok ? '' : 'Database unavailable');
    if (ok) assert.equal(state.leads[0].invoiceAmount, 3565);
  }
});
