import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';
const { normalizeStatus, getEffectiveWorkflowStatus, getStepActive } = loadTs('lib/adminHelpers.ts');

test('legacy statuses resolve to the same customer workflow in every role', () => {
  for (const [saved, expected] of [['paid', 'Payment Received'], ['Payment Request', 'Payment Pending'], ['QUOTE ACCEPTED', 'Won'], ['read', 'Contacted'], ['In Progress', 'Job In Progress']]) {
    assert.equal(normalizeStatus(saved), expected);
    assert.equal(getEffectiveWorkflowStatus({ status: saved }), expected);
  }
  assert.equal(getStepActive({ status: 'Job Done', invoiceSentAt: '2026-11-13' }, 'Invoice Sent'), true);
});

test('a stale manager or finance save is rejected before any write or notification', async () => {
  const { PATCH } = loadTs('app/api/admin/submissions/[id]/route.ts', {
    '@/lib/mongodb': { isMongoConfigured: () => true },
    '@/lib/submissions': { getSubmission: async () => ({ id: 'lead', status: 'Warranty Sent' }),
      updateSubmission: async () => assert.fail('Must not overwrite the newer status') },
  });
  const response = await PATCH({ json: async () => ({ status: 'Payment Received', expectedStatus: 'Job Done' }) }, { params: Promise.resolve({ id: 'lead' }) });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /changed in another account/);
});

test('the database write also checks status atomically when another account changes it after the route reads', async () => {
  const id = new ObjectId(); let status = 'Payment Received';
  const { updateSubmission } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => ({ updateOne: async (filter, update) => {
      if (filter.status !== status) return { matchedCount: 0 };
      status = update.$set.status; return { matchedCount: 1 };
    } }) }) },
  });
  assert.equal(await updateSubmission(id.toString(), { status: 'Invoice Sent' }, { expectedStatus: 'Job Done' }), false);
  assert.equal(status, 'Payment Received');
  assert.equal(await updateSubmission(id.toString(), { status: 'Warranty Sent' }, { expectedStatus: 'Payment Received' }), true);
  assert.equal(status, 'Warranty Sent');
});

test('the client sends the status it actually displayed and surfaces a rejected write', async () => {
  let payload;
  const { saveLeadChanges } = loadTs('lib/saveLeadChanges.ts', {}, { fetch: async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: false, status: 409, json: async () => ({ error: 'Status changed. Refresh before saving.' }) };
  } });
  const result = await saveLeadChanges('lead', { status: 'Completed' }, 'Payment Received');
  assert.equal(payload.expectedStatus, 'Payment Received');
  assert.equal(result.ok, false);
  assert.match(result.error, /Refresh/);
});
