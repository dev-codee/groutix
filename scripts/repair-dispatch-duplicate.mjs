// Explicit two-record repair. Defaults to read-only; requires a reviewed fingerprint to apply.
import { MongoClient, ObjectId } from 'mongodb';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { buildMergePlan, fingerprint } from './lib/lead-merge-plan.mjs';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const [primaryId, duplicateId, action = 'review', expected] = process.argv.slice(2);
if (![primaryId, duplicateId].every(id => ObjectId.isValid(id)) || !['review','apply','verify','rollback'].includes(action)) throw new Error('Usage: node scripts/repair-dispatch-duplicate.mjs PRIMARY_ID DUPLICATE_ID [review|apply FINGERPRINT|verify|rollback]');
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const repairId = `dispatch-merge:${duplicateId}:${primaryId}`;
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'groutix');
  const backups = db.collection('lead_merge_backups');
  const submissions = db.collection('submissions');
  async function snapshot(session) {
    const opts = session ? { session } : {};
    const primary = await submissions.findOne({ _id: new ObjectId(primaryId) }, opts);
    const duplicate = await submissions.findOne({ _id: new ObjectId(duplicateId) }, opts);
    const bookings = await db.collection('bookings').find({ leadId: { $in: [primaryId, duplicateId] } }, opts).sort({ _id: 1 }).toArray();
    const duplicateQuotes = await db.collection('customer_quotes').find({ leadId: duplicateId }, opts).sort({ _id: 1 }).toArray();
    return { primary, duplicate, bookings, duplicateQuotes };
  }
  const prior = await backups.findOne({ _id: repairId });
  if (action === 'rollback') {
    if (!prior?.afterFingerprint || prior.rolledBackAt) throw new Error('No completed, reversible repair found.');
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await snapshot(session);
        if (fingerprint(current) !== prior.afterFingerprint) throw new Error('Customer records changed after the merge; manual recovery review is required.');
        await submissions.replaceOne({ _id: prior.before.primary._id }, prior.before.primary, { session });
        await submissions.insertOne(prior.before.duplicate, { session });
        for (const booking of prior.before.bookings) await db.collection('bookings').replaceOne({ _id: booking._id }, booking, { session });
        if (prior.before.duplicateQuotes.length) await db.collection('customer_quotes').insertMany(prior.before.duplicateQuotes, { session });
        await backups.updateOne({ _id: repairId }, { $set: { rolledBackAt: new Date() } }, { session });
      }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
      console.log(JSON.stringify({ restored: true, repairId }));
    } finally { await session.endSession(); }
  } else if (action === 'verify' || prior) {
    if (!prior || prior.rolledBackAt) throw new Error('No active committed repair backup found.');
    const current = await snapshot();
    const { activity, mergedLeadIds, ...protectedCurrent } = current.primary;
    const { activity: oldActivity, mergedLeadIds: oldIds, ...protectedBefore } = prior.before.primary;
    if (fingerprint(protectedCurrent) !== fingerprint(protectedBefore)) throw new Error('Original customer/business fields differ from the backup.');
    if (current.duplicate || current.duplicateQuotes.length) throw new Error('Duplicate is still active.');
    if (current.bookings.length !== prior.before.bookings.length) throw new Error('Booking count changed.');
    for (const old of prior.before.bookings) {
      const actual = current.bookings.find(b => String(b._id) === String(old._id));
      const wanted = old.leadId === duplicateId ? { ...old, leadId: primaryId, reference: prior.before.primary.jobNo,
        reminderSent: prior.before.duplicate.jobReminderSent === true, reminder1hSent: prior.before.duplicate.jobReminder1hSent === true } : old;
      if (fingerprint(actual) !== fingerprint(wanted)) throw new Error('Booking fields changed unexpectedly.');
    }
    if (activity.length !== (oldActivity?.length || 0) + (prior.before.duplicate.activity?.length || 0) + 1) throw new Error('Activity count mismatch.');
    if (fingerprint(activity.slice(0, oldActivity?.length || 0)) !== fingerprint(oldActivity || [])) throw new Error('Original history was changed.');
    if (fingerprint(activity.slice(oldActivity?.length || 0, -1)) !== fingerprint(prior.before.duplicate.activity || [])) throw new Error('Duplicate history was changed.');
    console.log(JSON.stringify({ verified: true, repairId, retainedJobNo: current.primary.jobNo, archivedJobNo: prior.before.duplicate.jobNo, bookings: current.bookings.map(b => ({type:b.type,date:b.date,time:b.time,endAt:b.endAt,technician:b.technician})), customerFieldsUnchanged: true, historyPreserved: true, recoveryBackup: 'lead_merge_backups' }, null, 2));
  } else {
    // Fail closed if there are linked records other than the reviewed bookings and empty draft quotes.
    for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
      if (['submissions','bookings','customer_quotes','lead_merge_backups'].includes(name)) continue;
      const linked = await db.collection(name).findOne({ $or: ['leadId','submissionId','customerId'].map(k => ({ [k]: { $in: [duplicateId, new ObjectId(duplicateId)] } })) });
      if (linked) throw new Error(`Additional linked data in ${name}; review before merging.`);
      if (name === 'scheduleRoutes' && (await db.collection(name).find({}).toArray()).some(r => JSON.stringify(r).includes(duplicateId))) throw new Error('Saved route references need review.');
    }
    const before = await snapshot();
    const plan = buildMergePlan(before.primary, before.duplicate, before.bookings, before.duplicateQuotes);
    if (action === 'review') console.log(JSON.stringify(plan, null, 2));
    else {
      if (!expected || expected !== plan.fingerprint) throw new Error('Data changed or reviewed fingerprint missing; review again.');
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          const current = await snapshot(session);
          const checked = buildMergePlan(current.primary, current.duplicate, current.bookings, current.duplicateQuotes);
          if (checked.fingerprint !== expected) throw new Error('Records changed during repair.');
          const now = new Date();
          await backups.insertOne({ _id: repairId, createdAt: now, reason: 'User-requested repair of confirmed Dispatch duplicate', before: current, fingerprint: expected }, { session });
          const res = await submissions.updateOne({ _id: new ObjectId(primaryId) }, {
            $push: { activity: { $each: [...(current.duplicate.activity || []), { time: now.toISOString(), actor: 'repair', action: 'Duplicate Dispatch lead consolidated', detail: `${current.duplicate.jobNo} merged into ${current.primary.jobNo}; original records preserved in ${repairId}.` }] } },
            $addToSet: { mergedLeadIds: duplicateId },
          }, { session });
          if (res.matchedCount !== 1) throw new Error('Original lead disappeared.');
          await db.collection('bookings').updateMany({ leadId: duplicateId }, { $set: { leadId: primaryId, reference: current.primary.jobNo,
            reminderSent: current.duplicate.jobReminderSent === true, reminder1hSent: current.duplicate.jobReminder1hSent === true } }, { session });
          await db.collection('customer_quotes').deleteMany({ leadId: duplicateId }, { session });
          const removed = await submissions.deleteOne({ _id: new ObjectId(duplicateId) }, { session });
          if (removed.deletedCount !== 1) throw new Error('Duplicate changed during repair.');
          await backups.updateOne({ _id: repairId }, { $set: { afterFingerprint: fingerprint(await snapshot(session)) } }, { session });
        }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
        console.log(JSON.stringify({ committed: true, repairId, message: 'Run verify to compare the saved customer fields, bookings and history with the backup.' }));
      } finally { await session.endSession(); }
    }
  }
} catch (error) {
  console.error('Repair stopped:', error.message?.includes(process.env.MONGODB_URI) ? error.name : error.message);
  process.exitCode = 1;
} finally { await client.close(); }
