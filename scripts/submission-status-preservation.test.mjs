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
  const { updateSubmission } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: () => collection }) },
  });
  return { updateSubmission, writes, record: () => record };
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
