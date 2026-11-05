import assert from 'node:assert/strict';
import test from 'node:test';
import { BSON, ObjectId } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';

function database() {
  let record = { _id: new ObjectId(), status: 'Inspection Completed', notes: 'Keep existing notes' };
  const writes = [];
  const collection = {
    findOne: async () => ({ ...record }),
    updateOne: async (_filter, update) => {
      const stored = BSON.deserialize(BSON.serialize(update, { ignoreUndefined: false }));
      writes.push(stored);
      record = { ...record, ...stored.$set };
      return { matchedCount: 1 };
    },
  };
  const { updateSubmission, updateStatus } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => collection }) },
  });
  return { updateSubmission, updateStatus, writes, record: () => record };
}

test('partial assignment writes preserve status and omitted optional fields after MongoDB serialization', async () => {
  for (const emptyStatus of [undefined, null, '', ' ']) {
    const db = database();
    assert.equal(await db.updateSubmission(db.record()._id.toString(), { assigned: 'Alex', status: emptyStatus, notes: undefined }), true);
    assert.equal(db.record().status, 'Inspection Completed');
    assert.equal(db.record().notes, 'Keep existing notes');
    assert.equal(db.record().assigned, 'Alex');
    assert.equal(Object.hasOwn(db.writes[0].$set, 'status'), false);
    assert.equal(Object.hasOwn(db.writes[0].$set, 'notes'), false);
  }
});

test('explicit workflow status updates still save normally', async () => {
  const db = database();
  await db.updateSubmission(db.record()._id.toString(), { status: 'Quote Sent' });
  assert.equal(db.record().status, 'Quote Sent');
});


test('all status setters reject empty statuses and stale New saves preserve established workflow', async () => {
  for (const value of [undefined, null, '', '   ']) {
    const db = database();
    assert.equal(await db.updateStatus(db.record()._id.toString(), value), false);
    assert.equal(db.writes.length, 0);
    assert.equal(db.record().status, 'Inspection Completed');
  }
  for (const value of ['New', 'new', ' New Lead ']) {
    const db = database();
    assert.equal(await db.updateSubmission(db.record()._id.toString(), { status: value, assigned: 'Alex', notes: 'Updated note' }), true);
    assert.equal(db.record().status, 'Inspection Completed');
    assert.equal(db.record().notes, 'Updated note');
    assert.equal(db.record().assigned, 'Alex');
    assert.equal(Object.hasOwn(db.writes[0].$set, 'status'), false);
  }
});

test('the shared MongoDB connection ignores undefined fields even for direct and nested writes', async () => {
  let options;
  class MongoClient {
    constructor(_uri, config) { options = config; }
    async connect() { return this; }
  }
  const previous = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://unit-test';
  try {
    const { getMongoClient } = loadTs('lib/mongodb.ts', { mongodb: { MongoClient } });
    await getMongoClient();
    assert.equal(options.ignoreUndefined, true);
    const saved = BSON.deserialize(BSON.serialize({ $set: { status: undefined, notes: 'Keep', nested: { status: undefined } } }, options));
    assert.equal(Object.hasOwn(saved.$set, 'status'), false);
    assert.equal(Object.hasOwn(saved.$set.nested, 'status'), false);
    assert.equal(saved.$set.notes, 'Keep');
  } finally {
    if (previous === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous;
  }
});

test('intentional removal of an optional staff email still clears it when undefined is ignored', async () => {
  let email = 'staff@example.test';
  const { updateUser } = loadTs('lib/users.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => ({
      createIndex: async () => {},
      updateOne: async (_filter, update) => {
        const stored = BSON.deserialize(BSON.serialize(update, { ignoreUndefined: true }));
        if (Object.hasOwn(stored.$set, 'email')) email = stored.$set.email;
        return { matchedCount: 1 };
      },
    }) }) },
  });
  assert.equal((await updateUser(new ObjectId().toString(), { email: '  ' })).ok, true);
  assert.equal(email, '');
});

test('every workflow stage survives contact, schedule, assignment, quote and invoice metadata saves', async () => {
  const { STATUS_KEYS } = loadTs('lib/pipeline.ts');
  const db = database();
  const id = db.record()._id.toString();
  const changes = [
    { notes: 'Updated note' }, { phone: '0412345678' }, { assigned: 'Alex' },
    { technician: 'Sam', technicianId: 'sam' }, { inspectorId: 'alex' },
    { quoteOpenedAt: '2026-11-05T00:00:00Z' }, { invoiceAmount: 3565 },
    { inspectionAt: '2026-11-06T10:00' }, { jobAt: '2026-11-07T11:00' },
  ];
  for (const status of STATUS_KEYS) {
    for (const updates of changes) {
      db.record().status = status;
      db.record().inspectionAt = '2026-11-05T09:00';
      db.record().jobAt = '2026-11-05T09:00';
      assert.equal(await db.updateSubmission(id, { ...updates, status: undefined }), true);
      assert.equal(db.record().status, status, `${status}: ${Object.keys(updates).join(', ')}`);
    }
  }
});

test('a workflow advancement racing a stale New save is never overwritten', async () => {
  const id = new ObjectId();
  let status = 'New', writes = 0;
  const { updateSubmission } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => ({
      findOne: async () => { const snapshot = { _id: id, status }; status = 'Job In Progress'; return snapshot; },
      updateOne: async (filter, update) => {
        if (filter.status !== status) return { matchedCount: 0 };
        writes++; status = update.$set.status; return { matchedCount: 1 };
      },
    }) }) },
  });
  assert.equal(await updateSubmission(id.toString(), { status: 'New', assigned: 'Alex' }), false);
  assert.equal(status, 'Job In Progress');
  assert.equal(writes, 0);
});
