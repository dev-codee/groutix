import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';
const id = '507f1f77bcf86cd799439011';
test('the payment endpoint also safely records cumulative partial and full payments on legacy single invoices', async () => {
  const invoice = { id, name: 'Customer', invoiceNumber: 'INV-OLD', invoiceAmount: 1000, invoiceStatus: 'Unpaid' };
  const api = loadTs('lib/invoicePayments.ts', {
    './customerInvoices': { getInvoiceSubmission: async () => structuredClone(invoice), isCustomerInvoice: () => false, invoiceLeadId: id => id, refreshInvoiceSummary: async () => {}, appendInvoiceActivity: async () => {} },
    './mongodb': { getDb: async () => ({ collection: name => ({ updateOne: async (filter, update) => {
      assert.equal(name, 'submissions'); assert.equal(String(filter._id), id);
      for (const [key, value] of Object.entries(filter)) if (key !== '_id') {
        if (typeof value === 'object' && '$exists' in value ? (invoice[key] !== undefined) !== value.$exists : invoice[key] !== value) return { matchedCount: 0 };
      }
      Object.assign(invoice, structuredClone(update.$set)); (invoice.invoicePayments ||= []).push(structuredClone(update.$push.invoicePayments));
      return { matchedCount: 1 };
    } }) }) },
  }, { Error });
  await api.recordInvoicePayment(id, { type: 'partial', amount: 200, expectedPaidCents: 0, requestId: 'legacy-partial-000001' }, 'finance');
  assert.equal(invoice.amountPaid, 200); assert.equal(invoice.invoiceStatus, 'Partially Paid');
  await api.recordInvoicePayment(id, { type: 'partial', amount: 300, expectedPaidCents: 20000, requestId: 'legacy-partial-000002' }, 'finance');
  assert.equal(invoice.amountPaid, 500);
  await api.recordInvoicePayment(id, { type: 'full', expectedPaidCents: 50000, requestId: 'legacy-full-000000001' }, 'finance');
  assert.equal(invoice.amountPaid, 1000); assert.equal(invoice.paymentReceipt.total, 1000);
  assert.equal(invoice.invoicePayments[2].amountCents, 50000);
});
test('record payment endpoint requires an authorized finance role', async () => {
  let role = null, calls = 0;
  const route = loadTs('app/api/admin/invoice/payment/route.ts', {
    '@/lib/adminAuth': { verifyRequestSession: async () => role ? { role, username: 'user' } : null },
    '@/lib/invoicePayments': { recordInvoicePayment: async () => { calls++; return { item: { id } }; }, InvoicePaymentError: class extends Error {} },
    '@/lib/submissions': { getSubmission: async () => ({ id }) }, '@/lib/customerInvoices': { invoiceLeadId: id => id },
  });
  const req = { json: async () => ({ id }) };
  assert.equal((await route.POST(req)).status, 401); role = 'technician'; assert.equal((await route.POST(req)).status, 403);
  role = 'finance'; assert.equal((await route.POST(req)).status, 200); assert.equal(calls, 1);
});
