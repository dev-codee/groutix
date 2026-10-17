import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { jobBookingRows, leadRowKey, selectedJobBooking } = loadTs('lib/leadBookings.ts');
const { combinedJobStatus } = loadTs('lib/bookingStatus.ts');
const customer = () => ({
  id: 'lead', status: 'Job Done', jobNo: 'JOBNO-1201', jobAt: '2026-10-20T09:00', technician: 'Alex',
  jobTotalDays: 3, jobDaysDone: 2, amountPaid: 500,
  bookings: [
    { type: 'job', date: '2026-10-20', time: '09:00', technician: 'Alex', status: 'Job Done', jobTotalDays: 3, jobDaysDone: 3 },
    { type: 'job', date: '2026-10-21', time: '11:00', technician: 'Alex', status: 'Job Booked' },
  ],
});

test('same-customer same-technician visits have distinct rows, statuses, days and completion filters', () => {
  const lead = customer();
  const before = JSON.stringify(lead);
  const rows = jobBookingRows(lead);
  assert.equal(rows.length, 2);
  assert.notEqual(leadRowKey(rows[0]), leadRowKey(rows[1]));
  assert.equal(rows[0].status, 'Job Done');
  assert.equal(rows[1].status, 'Job Booked');
  assert.equal(rows[1].jobTotalDays, undefined);
  assert.equal(rows[1].jobDaysDone, undefined);
  assert.equal(rows.filter(l => l.status === 'Job Done').length, 1);
  assert.equal(rows.filter(l => l.status === 'Job Booked').length, 1);
  assert.equal(selectedJobBooking(rows[1]).time, '11:00');
  assert.equal(rows[1].amountPaid, 500);
  assert.equal(rows[1].id, rows[0].id);
  assert.equal(JSON.stringify(lead), before);
});

test('a customer finishes only when every non-cancelled job is complete', () => {
  assert.equal(combinedJobStatus(['Job Done', 'Job Booked']), 'Job Booked');
  assert.equal(combinedJobStatus(['Job Done', 'Job En Route']), 'Job En Route');
  assert.equal(combinedJobStatus(['Job Done', 'Job Arrived']), 'Job Arrived');
  assert.equal(combinedJobStatus(['Job In Progress', 'Job Booked']), 'Job In Progress');
  assert.equal(combinedJobStatus(['Job Done', 'Job Done']), 'Job Done');
  assert.equal(combinedJobStatus(['Cancelled', 'Job Done']), 'Job Done');
  assert.equal(combinedJobStatus(['Cancelled']), undefined);
});

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}
function rowHarness(lead) {
  const updates = [], journeys = [], prompts = [];
  const ctx = {
    role: 'technician', jobWorkflowLeads: jobBookingRows(lead), jobBookingsSaving: {},
    isTechnicianName: () => true,
    updateJobBooking: (...args) => updates.push(args),
    updateLeadField: () => assert.fail('Job actions must never update the shared customer directly'),
    handleOnTheWay: (...args) => journeys.push(args),
    setStartJobDays: () => {}, setStartJobPrompt: value => prompts.push(value),
  };
  const { TechnicianLeadRow } = loadTs('components/admin/rows/TechnicianLeadRow.tsx', {
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
    '@/lib/useDistanceKm': { useDistanceKm: () => null },
  });
  const buttons = row => elements(TechnicianLeadRow({ l: row })).filter(n => n.type === 'button');
  return { ctx, updates, journeys, prompts, buttons };
}

test('actual technician buttons target the clicked visit while completed siblings stay disabled', () => {
  const lead = customer();
  const rows = jobBookingRows(lead);
  const h = rowHarness(lead);
  const complete = h.buttons(rows[0]).find(b => b.props.title === 'Job Done (Completed)');
  assert.equal(complete.props.disabled, true);
  const active = h.buttons(rows[1]);
  for (const title of ['Mark On the Way', 'Mark Reached', 'Start Job', 'Mark Job Done']) {
    const button = active.find(b => b.props.title === title);
    assert.ok(button, title);
    assert.equal(button.props.disabled, false);
    button.props.onClick();
  }
  assert.equal(h.journeys.length, 2);
  for (const [row] of h.journeys) assert.equal(row.activeBooking.start, '2026-10-21T11:00');
  assert.equal(h.prompts[0].lead.activeBooking.start, '2026-10-21T11:00');
  assert.equal(h.updates[0][0].activeBooking.start, '2026-10-21T11:00');
  assert.equal(h.updates[0][1].status, 'Job Done');
  h.ctx.jobBookingsSaving[leadRowKey(rows[1])] = true;
  assert.equal(h.buttons(rows[1]).find(b => b.props.title === 'Mark Job Done').props.disabled, true);
});

test('completing a day updates only that visit and preserves its in-progress status', () => {
  const lead = customer();
  Object.assign(lead.bookings[1], { status: 'Job In Progress', jobTotalDays: 2, jobDaysDone: 1 });
  const row = jobBookingRows(lead)[1];
  const h = rowHarness(lead);
  const button = h.buttons(row).find(b => b.props.children === 'Complete Day');
  button.props.onClick();
  assert.equal(h.updates[0][0].activeBooking.start, '2026-10-21T11:00');
  assert.equal(h.updates[0][1].jobDaysDone, 2);
  assert.equal(h.updates[0][1].status, undefined);
  assert.equal(lead.bookings[0].jobDaysDone, 3);
});

test('workflow summary writes never change sibling statuses or regress finance', async () => {
  const id = '507f1f77bcf86cd799439011';
  const { bookings, ...fields } = customer();
  const lead = { ...fields, _id: id, createdAt: new Date(), status: 'Job In Progress' };
  const writes = [];
  const submissions = {
    createIndexes: async () => {}, findOne: async () => lead,
    updateOne: async (filter, update) => { writes.push({ filter, update }); Object.assign(lead, update.$set); },
  };
  const { syncJobBookingWorkflow } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: name => name === 'submissions' ? submissions : {
      find: () => ({ toArray: async () => bookings.map(b => ({ ...b, leadId: id })) }),
      updateOne: () => assert.fail('Summary must not write booking status'),
    } }) },
    './bookingCalendarLock': { withBookingCalendarLock: async (_key, _type, action) => action() },
    '@/lib/users': {},
  });
  const snapshot = JSON.stringify(bookings);
  await syncJobBookingWorkflow(id);
  assert.equal(lead.status, 'Job Booked');
  assert.equal(JSON.stringify(bookings), snapshot);
  bookings[1].status = 'Job Done';
  await syncJobBookingWorkflow(id);
  assert.equal(lead.status, 'Job Done');
  lead.status = 'Invoice Sent';
  bookings[1].status = 'Job Booked';
  await syncJobBookingWorkflow(id);
  assert.equal(lead.status, 'Invoice Sent');
  assert.equal(writes.length, 2);
});

test('an unsaved legacy primary cannot inherit the sibling summary status', async () => {
  const id = '507f1f77bcf86cd799439011';
  const lead = { _id: id, createdAt: new Date(), status: 'Job Done', jobAt: '2026-10-20T09:00' };
  const { syncJobBookingWorkflow } = loadTs('lib/submissions.ts', {
    '@/lib/mongodb': { getDb: async () => ({ collection: name => name === 'submissions' ? {
      createIndexes: async () => {}, findOne: async () => lead,
      updateOne: () => assert.fail('Changing workflow would change the unsaved primary'),
    } : { find: () => ({ toArray: async () => [{ leadId: id, type: 'job', date: '2026-10-21', time: '11:00', status: 'Job In Progress' }] }) } }) },
    './bookingCalendarLock': { withBookingCalendarLock: async (_key, _type, action) => action() },
    '@/lib/users': {},
  });
  await syncJobBookingWorkflow(id);
  assert.equal(lead.status, 'Job Done');
});
