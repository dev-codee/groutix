import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';

test('document transitions advance delivery and preserve later or closed stages', () => {
  const { statusAfterDocumentSend: next } = loadTs('lib/pipeline.ts');
  for (const [from, target, expected] of [
    ['Quote Pending', 'Quote Sent', 'Quote Sent'],
    ['Negotiation', 'Quote Sent', 'Negotiation'],
    ['Job Booked', 'Quote Sent', 'Job Booked'],
    ['Job Done', 'Invoice Sent', 'Invoice Sent'],
    ['Payment Received', 'Invoice Sent', 'Payment Received'],
    ['Paid', 'Warranty Sent', 'Warranty Sent'],
    ['Payment Received', 'Warranty Sent', 'Warranty Sent'],
    ['Completed', 'Warranty Sent', 'Completed'],
    ['Cancelled', 'Warranty Sent', 'Cancelled'],
  ]) assert.equal(next(from, target), expected);
});

test('warranty delivery saves its stage, preserves completion, and reports a failed status save', async () => {
  let saved = true, authorized = true, writes = 0, emails = 0;
  let customer = { id: 'customer', email: 'customer@example.com', name: 'Sam', status: 'Payment Received', jobNo: 'JOB-1' };
  const { POST } = loadTs('app/api/admin/warranty/send/route.ts', {
    '@/lib/submissions': {
      getSubmission: async () => customer,
      updateSubmission: async (_id, changes) => { writes++; if (saved) customer = { ...customer, ...changes }; return saved; },
      appendActivity: async () => {},
    },
    '@/lib/adminAuth': { verifyRequestSession: async () => authorized ? { username: 'finance' } : null },
    '@/lib/email': { isEmailConfigured: () => true, sendEmail: async () => { emails++; }, getEmailLogoUrl: async () => '', wrapEmailHtml: html => html },
  });
  const request = { json: async () => ({ id: 'customer' }) };
  assert.equal((await POST(request)).status, 200);
  assert.equal(customer.status, 'Warranty Sent');
  customer.status = 'Completed';
  assert.equal((await POST(request)).status, 200);
  assert.equal(customer.status, 'Completed');
  saved = false;
  const failure = await POST(request);
  assert.equal(failure.status, 500);
  assert.match((await failure.json()).error, /email was sent.*status could not be saved/);
  authorized = false;
  assert.equal((await POST(request)).status, 401);
  assert.equal(writes, 3); assert.equal(emails, 3);
});
