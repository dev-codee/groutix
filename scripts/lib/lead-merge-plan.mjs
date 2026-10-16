import { createHash } from 'node:crypto';
import { EJSON } from 'bson';

export const fingerprint = value => createHash('sha256').update(EJSON.stringify(value, { relaxed: false })).digest('hex');
const populated = value => value != null && value !== '' && value !== false && (!Array.isArray(value) || value.length > 0);
const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export function buildMergePlan(primary, duplicate, bookings, duplicateQuotes) {
  if (!primary || !duplicate || String(primary._id) === String(duplicate._id)) throw new Error('Two distinct existing leads are required.');
  if (duplicate.source !== 'Dispatch board') throw new Error('The duplicate was not created by Dispatch.');
  for (const field of ['name', 'email', 'phone', 'address', 'service']) {
    if (!normalize(primary[field]) || normalize(primary[field]) !== normalize(duplicate[field])) throw new Error(`Customer ${field} does not match.`);
  }
  if (primary.status !== duplicate.status || primary.status !== 'Job Booked') throw new Error('Review changed workflow states before merging.');
  const safe = new Set(['_id','type','status','jobNo','createdAt','name','email','phone','address','service','priority','received','source','activity',
    'customerTrackingEndedAt','jobAt','jobEndAt','jobWorkSegments','jobReminderSent','jobReminder1hSent','technician','technicianId','technicianUsername','quoteTaxMode','quoteTaxRate']);
  const conflicts = Object.keys(duplicate).filter(key => !safe.has(key) && populated(duplicate[key]));
  if (conflicts.length) throw new Error(`Duplicate contains additional data requiring review: ${conflicts.join(', ')}`);
  for (const quote of duplicateQuotes) {
    if (quote.state !== 'draft') throw new Error('Duplicate has a non-draft quote.');
    const values = quote.values || {};
    if (Object.keys(values).some(key => /quoteItems|quoteAmount|quoteScope|quoteTerms|quoteSignature|quoteSigned|quoteAccepted|quoteSent|invoice|payment|paid/i.test(key) && populated(values[key]) && values[key] !== 0)) {
      throw new Error('Duplicate has substantive quote content; review before merging.');
    }
  }
  const own = bookings.filter(b => b.leadId === String(primary._id));
  const moved = bookings.filter(b => b.leadId === String(duplicate._id));
  if (!moved.length || !moved.some(b => `${b.date}T${b.time}` === duplicate.jobAt?.slice(0,16))) throw new Error('Duplicate booking is missing.');
  for (const b of moved) {
    if (b.type !== 'job') throw new Error('Unexpected duplicate appointment type.');
    if (own.some(a => a.type === b.type && a.date === b.date && a.time === b.time)) throw new Error('Booking identity collision.');
  }
  return {
    primaryId: String(primary._id), duplicateId: String(duplicate._id),
    primaryJobNo: primary.jobNo, duplicateJobNo: duplicate.jobNo,
    fingerprint: fingerprint({ primary, duplicate, bookings, duplicateQuotes }),
    activitiesToPreserve: duplicate.activity?.length || 0,
    archivedDraftQuotes: duplicateQuotes.length,
    bookings: bookings.map(b => ({ id: String(b._id), leadId: b.leadId, type: b.type, date: b.date, time: b.time, endAt: b.endAt, technician: b.technician })),
  };
}
