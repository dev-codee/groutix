import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';
const { quoteNumberForJob, invoiceNumberForJob } = loadTs('lib/documentNumbers.ts');

test('quote and invoice references share the job number, overriding old GX and unrelated document numbers', () => {
  for (const jobNo of ['JOBNO-1111', 'Job No-1111', 'jobNo-1111', 'Job No - 1111', '1111']) {
    const lead = { id: 'customer~separate-document', jobNo, quoteNumber: 'GX-Q-26-0031', invoiceNumber: 'GX-I-26-0024' };
    assert.equal(quoteNumberForJob(lead), 'QT-1111');
    assert.equal(invoiceNumberForJob(lead), 'INV-1111');
    assert.equal(quoteNumberForJob({ ...lead, quoteNumber: 'QT-9999' }), 'QT-1111');
    assert.equal(invoiceNumberForJob({ ...lead, invoiceNumber: 'INV-9999' }), 'INV-1111');
  }
});

test('old records without a job number retain non-GX references and stable fallbacks never contain document UUIDs', () => {
  const lead = { id: 'customer123456~invoice~different-uuid' };
  assert.equal(quoteNumberForJob({ ...lead, quoteNumber: 'GX-Q-26-01' }), 'QT-123456');
  assert.equal(invoiceNumberForJob({ ...lead, invoiceNumber: 'GX-I-26-01' }), 'INV-123456');
  assert.equal(invoiceNumberForJob({ ...lead, invoiceNumber: 'INV-1234' }), 'INV-1234');
});

test('existing GX numbers normalize in dashboard/export responses and selected quote views without fabricating invoices', () => {
  const { toJSON } = loadTs('lib/submissions.ts');
  const lead = toJSON({ _id: 'customer', jobNo: 'JOBNO-1111', createdAt: new Date(), quoteNumber: 'GX-Q-26-1', invoiceNumber: 'GX-I-26-2' });
  assert.equal(lead.quoteNumber, 'QT-1111');
  assert.equal(lead.invoiceNumber, 'INV-1111');
  assert.equal(toJSON({ jobNo: 'JOBNO-1111', createdAt: new Date() }).invoiceNumber, undefined);
  const { customerQuoteLead } = loadTs('lib/customerQuoteSelection.ts');
  assert.equal(customerQuoteLead(lead, { values: { quoteNumber: 'GX-Q-26-99' } }).quoteNumber, 'QT-1111');
});
