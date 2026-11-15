import test from 'node:test';
import assert from 'node:assert/strict';
import { BSON, ObjectId } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';

function harness() {
  const id = new ObjectId();
  let record = { _id: id, name: 'Customer', status: 'Inspection Completed', inspectionAt: '2026-11-06T17:00' };
  const col = {
    findOne: async () => ({ ...record }),
    updateOne: async (filter, updates) => {
      if (filter.status && filter.status !== record.status) return { matchedCount: 0 };
      const stored = BSON.deserialize(BSON.serialize(updates, { ignoreUndefined: true }));
      record = { ...record, ...stored.$set };
      return { matchedCount: 1 };
    },
  };
  const { updateSubmission } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => col }) },
  });
  const { PATCH } = loadTs('app/api/admin/submissions/[id]/route.ts', {
    '@/lib/mongodb': { isMongoConfigured: () => true },
    '@/lib/submissions': { getSubmission: async () => ({ ...record, id: id.toString() }), updateSubmission, appendActivity: async () => {} },
    '@/lib/adminAuth': { SESSION_COOKIE: 'session', verifySession: async () => ({ username: 'manager' }) },
  });
  return { record: () => record, patch: body => PATCH({ json: async () => body, cookies: { get: () => undefined } }, { params: Promise.resolve({ id: id.toString() }) }) };
}

test('explicit dropdown changes persist New and other early statuses through both server guards', async () => {
  for (const status of ['New', 'Contacted', 'Waiting for Info']) {
    const h = harness();
    const response = await h.patch({ status, expectedStatus: 'Inspection Completed' });
    assert.equal(response.status, 200);
    assert.equal(h.record().status, status);
    assert.equal((await response.json()).item.status, status);
    assert.equal(h.record().inspectionAt, '2026-11-06T17:00');
  }
});

test('explicit Edit Lead status wins even when the same save includes unchanged booking timing', async () => {
  const h = harness();
  const response = await h.patch({ status: 'New', expectedStatus: 'Inspection Completed', inspectionAt: h.record().inspectionAt });
  assert.equal(response.status, 200);
  assert.equal(h.record().status, 'New');
});

test('a dropdown based on an older status is rejected rather than overwriting another account', async () => {
  const h = harness();
  const response = await h.patch({ status: 'New', expectedStatus: 'Contacted' });
  assert.equal(response.status, 409);
  assert.equal(h.record().status, 'Inspection Completed');
});

test('older forms without the observed status keep stale-New protection', async () => {
  const h = harness();
  const response = await h.patch({ status: 'New' });
  assert.equal(response.status, 200);
  assert.equal(h.record().status, 'Inspection Completed');
});
