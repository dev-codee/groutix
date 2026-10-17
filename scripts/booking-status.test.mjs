import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

function harness({ conflict = false, legacy = false } = {}) {
  const lead = { id: 'lead', status: 'Invoice Sent', jobNo: 'JOBNO-1201', name: 'Jane', phone: '0400000000', notes: 'Keep', amountPaid: 500,
    jobAt: '2026-10-20T09:00', technician: 'Alex', bookings: legacy ? [] : [
      { type: 'job', date: '2026-10-20', time: '09:00', technician: 'Alex', status: 'Job Booked' },
      { type: 'job', date: '2026-10-21', time: '11:00', technician: 'Sam', status: 'Job Booked' },
    ] };
  const writes = [], activity = [];
  const api = loadTs('app/api/admin/submissions/[id]/bookings/route.ts', {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '@/lib/mongodb': { isMongoConfigured: () => true },
    '@/lib/submissions': { getSubmission: async () => lead, appendActivity: async (...args) => activity.push(args) },
    '@/lib/bookings': { createBooking: async (input, options) => {
      writes.push({ input, options });
      if (conflict) return { ok: false, conflict: true, error: 'Slot taken' };
      const booking = lead.bookings.find(b => b.type === input.type && b.date === input.date && b.time === input.time);
      if (booking) Object.assign(booking, { status: input.status, jobTotalDays: input.jobTotalDays, jobDaysDone: input.jobDaysDone });
      else lead.bookings.push(input);
      return { ok: true };
    } },
    '@/lib/adminAuth': { SESSION_COOKIE: 'session', verifySession: async () => ({ username: 'manager' }) },
  });
  return { lead, writes, activity, patch: body => api.PATCH({ json: async () => body, cookies: { get: () => ({ value: 'session' }) } }, { params: Promise.resolve({ id: lead.id }) }) };
}

test('a selected booking status changes without touching the lead, money, identity or sibling', async () => {
  const h = harness();
  const { bookings, ...shared } = structuredClone(h.lead);
  const result = await h.patch({ type: 'job', start: '2026-10-21T11:00', status: 'Job Done', amountPaid: 0, jobNo: 'WRONG', technician: 'Wrong' });
  assert.equal(result.status, 200);
  const { bookings: updated, ...after } = h.lead;
  assert.deepEqual(after, shared);
  assert.deepEqual(updated[0], bookings[0]);
  assert.equal(updated[1].status, 'Job Done');
  assert.equal(h.writes[0].input.technician, 'Sam');
  assert.equal(h.writes[0].input.reference, 'JOBNO-1201');
  assert.equal(h.writes[0].options.statusOnly, true);
  assert.equal(h.writes[0].options.retainPrevious, true);
  assert.equal(h.activity[0][0], h.lead.id);
  assert.match(h.activity[0][1].detail, /2026-10-21T11:00/);
});

test('invalid, stale and blocked booking status changes never write', async () => {
  const h = harness();
  for (const body of [null, [], { type: 'job', start: '2026-10-21T11:00', status: 'Inspection Completed' },
    { type: 'job', start: '2026-10-22T11:00', status: 'Job Done' }]) {
    assert.ok((await h.patch(body)).status >= 400);
  }
  h.lead.status = 'Cancelled';
  assert.equal((await h.patch({ type: 'job', start: '2026-10-21T11:00', status: 'Job Done' })).status, 409);
  assert.equal(h.writes.length, 0);
  assert.equal(h.activity.length, 0);
});

test('legacy primary bookings acquire an independent status without a new lead', async () => {
  const h = harness({ legacy: true });
  assert.equal((await h.patch({ type: 'job', start: '2026-10-20T09:00', status: 'Job In Progress' })).status, 200);
  assert.equal(h.lead.bookings.length, 1);
  assert.equal(h.lead.bookings[0].leadId, h.lead.id);
  assert.equal(h.lead.status, 'Invoice Sent');
});

test('a failed reopening leaves the booking and audit history unchanged', async () => {
  const h = harness({ conflict: true });
  h.lead.bookings[1].status = 'Cancelled';
  assert.equal((await h.patch({ type: 'job', start: '2026-10-21T11:00', status: 'Job Booked' })).status, 409);
  assert.equal(h.lead.bookings[1].status, 'Cancelled');
  assert.equal(h.activity.length, 0);
});

test('ordinary lead workflow changes update only the primary visit status', async () => {
  const id = '1234567890abcdef12345678';
  const lead = { jobAt: '2026-10-20T09:00', status: 'Job Booked' };
  const writes = [];
  const submissions = { createIndex: async () => {}, createIndexes: async () => {}, findOne: async () => lead,
    updateOne: async (_query, update) => { Object.assign(lead, update.$set); return { matchedCount: 1 }; } };
  const { updateSubmission, updateStatus } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: name => name === 'submissions' ? submissions : { updateOne: async (...args) => writes.push(args) } }) },
    '@/lib/users': {},
  });
  await updateSubmission(id, { status: 'Job In Progress' });
  await updateStatus(id, 'Job Done');
  assert.equal(writes.length, 2);
  for (const [query] of writes) {
    assert.equal(query.leadId, id);
    assert.equal(query.type, 'job');
    assert.equal(query.date, '2026-10-20');
    assert.equal(query.time, '09:00');
    assert.equal(query.status.$ne, 'Cancelled');
  }
  assert.equal(writes[1][1].$set.status, 'Job Done');
  await updateSubmission(id, { status: 'Invoice Sent' });
  assert.equal(writes.length, 2, 'finance workflow must not change visit statuses');
});


test('day progress is validated and saved on the selected booking only', async () => {
  const h = harness();
  const sibling = JSON.stringify(h.lead.bookings[0]);
  const base = { type: 'job', start: '2026-10-21T11:00', status: 'Job In Progress' };
  for (const progress of [{ jobTotalDays: 0 }, { jobTotalDays: 15 }, { jobTotalDays: 2.5 }, { jobTotalDays: 2, jobDaysDone: 3 }]) {
    assert.equal((await h.patch({ ...base, ...progress })).status, 400);
  }
  assert.equal(h.writes.length, 0);
  assert.equal((await h.patch({ ...base, jobTotalDays: 3, jobDaysDone: 1 })).status, 200);
  assert.equal((await h.patch({ ...base, jobDaysDone: 2 })).status, 200);
  assert.equal(h.lead.bookings[1].jobTotalDays, 3);
  assert.equal(h.lead.bookings[1].jobDaysDone, 2);
  assert.equal(JSON.stringify(h.lead.bookings[0]), sibling);
});
