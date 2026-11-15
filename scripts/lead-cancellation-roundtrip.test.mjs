import test from 'node:test';
import assert from 'node:assert/strict';
import { BSON, ObjectId } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';

// Exercise the save route and real persistence normalizer together, with the
// production MongoDB option that silently omits undefined fields.
test('Edit Lead cancellation survives the database round trip and reopened lead response', async () => {
  const { canonicalLeadBookings } = loadTs('lib/leadBookings.ts');
  for (const fields of [['inspectionAt'], ['jobAt'], ['inspectionAt', 'jobAt']]) {
    const id = new ObjectId();
    let record = { _id: id, name: 'Customer', status: 'Inspection Arrived',
      inspectionAt: '2026-11-06T17:00', jobAt: '2026-11-05T11:15' };
    const collection = {
      findOne: async () => ({ ...record }),
      updateOne: async (_filter, updates) => {
        const stored = BSON.deserialize(BSON.serialize(updates, { ignoreUndefined: true }));
        record = { ...record, ...stored.$set };
        return { matchedCount: 1 };
      },
    };
    const { updateSubmission } = loadTs('lib/submissions.ts', {
      '@/lib/mongodb': { getDb: async () => ({ collection: () => collection }) },
    });
    const released = [];
    const { PATCH } = loadTs('app/api/admin/submissions/[id]/route.ts', {
      '@/lib/mongodb': { isMongoConfigured: () => true },
      '@/lib/submissions': {
        getSubmission: async () => canonicalLeadBookings({ ...record, id: id.toString(), bookings: [] }),
        updateSubmission, appendActivity: async () => {},
      },
      '@/lib/bookings': { releaseBookingSlot: async (...args) => released.push(args) },
      '@/lib/adminAuth': { SESSION_COOKIE: 'session', verifySession: async () => ({ username: 'manager' }) },
    });
    const response = await PATCH({ json: async () => Object.fromEntries(fields.map(field => [field, ''])), cookies: { get: () => undefined } }, { params: Promise.resolve({ id: id.toString() }) });
    assert.equal(response.status, 200);
    const { item } = await response.json();
    for (const field of fields) {
      assert.equal(record[field], '', `${field} must actually be cleared in storage`);
      assert.equal(item[field], '', `${field} must stay empty in the response used by the lead row`);
      assert.equal(canonicalLeadBookings(item)[field], '', `${field} must stay empty when reopened`);
    }
    assert.equal(released.length, fields.length);
    for (const field of ['inspectionAt', 'jobAt'].filter(field => !fields.includes(field))) {
      assert.ok(item[field], 'An uncancelled appointment must remain booked');
    }
  }
});
