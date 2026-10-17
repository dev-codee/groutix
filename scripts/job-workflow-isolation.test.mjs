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
    updateOne: async (filter, update) => { writes.push({ filter, update }); Object.assign(lead, update.$set); return { matchedCount: 1 }; },
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
  assert.equal(await syncJobBookingWorkflow(id), false);
  assert.equal(lead.status, 'Job Booked');
  assert.equal(JSON.stringify(bookings), snapshot);
  bookings[1].status = 'Job Done';
  assert.equal(await syncJobBookingWorkflow(id), true);
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

test('legacy primary assignments remain visible without assigning unclaimed siblings to that technician', () => {
  const lead = customer();
  lead.technician = undefined;
  lead.assigned = 'Alex';
  lead.bookings.forEach(booking => { booking.technician = undefined; });
  const rows = jobBookingRows(lead);
  assert.equal(rows[0].assigned, 'Alex');
  assert.equal(rows[1].assigned, undefined);
});

test('actual travel handler saves the selected visit and offers notification only after success', async () => {
  const { readFileSync } = await import('node:fs');
  const { default: vm } = await import('node:vm');
  const { default: ts } = await import('typescript');
  const source = readFileSync('app/admin/page.tsx', 'utf8');
  const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const handlers = new Map();
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && ['updateJobBooking', 'handleOnTheWay'].includes(node.name?.text)) handlers.set(node.name.text, node.getText(tree));
    ts.forEachChild(node, visit);
  };
  visit(tree);
  const compiled = ts.transpileModule(`${[...handlers.values()].join('\n')}\nmodule.exports = handleOnTheWay;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  for (const succeeds of [true, false]) {
    let lead = customer();
    const row = jobBookingRows(lead)[1];
    const requests = [], prompts = [], errors = [];
    const moduleRecord = { exports: {} };
    vm.runInNewContext(compiled, {
      module: moduleRecord, selectedJobBooking, jobUpdatesInFlight: { current: new Set() },
      setJobBookingsSaving: () => {},
      updateLeadField: () => assert.fail('Travel must target the visit API'),
      setLeads: update => { lead = update([lead])[0]; },
      setNotifyPrompt: prompt => prompts.push(prompt),
      alert: error => errors.push(error),
      fetch: async (url, options) => {
        const body = JSON.parse(options.body);
        requests.push({ url, body });
        const item = structuredClone(lead);
        item.bookings[1].status = body.status;
        return { ok: succeeds, json: async () => succeeds ? { item } : { error: 'Booking changed' } };
      },
    });
    await moduleRecord.exports(row, 'en_route', 'job');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/admin/submissions/lead/bookings');
    assert.equal(requests[0].body.start, '2026-10-21T11:00');
    assert.equal(requests[0].body.status, 'Job En Route');
    assert.equal(requests[0].body.syncWorkflow, true);
    assert.equal(lead.bookings[0].status, 'Job Done');
    assert.equal(lead.bookings[1].status, succeeds ? 'Job En Route' : 'Job Booked');
    assert.equal(prompts.length, succeeds ? 1 : 0);
    assert.equal(errors.length, succeeds ? 0 : 1);
    if (succeeds) assert.equal(prompts[0].lead.activeBooking.start, row.activeBooking.start);
  }
});

test('manager lead row shows separate job cards and actions for each booking', () => {
  const lead = customer();
  const ctx = { role: 'manager', jobBookingsSaving: {} };
  const { LeadBookings } = loadTs('components/admin/LeadBookings.tsx', {
    './AdminPageContext': { useAdminPageCtx: () => ctx },
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
  });
  const nodes = elements(LeadBookings({ lead }));
  const cards = nodes.filter(node => node.type === 'li');
  assert.equal(cards.length, 2);
  const actions = nodes.filter(node => typeof node.type === 'function' && node.type.name === 'JobBookingActions');
  assert.equal(actions.length, 2);
  assert.equal(actions[0].props.lead.activeBooking.start, '2026-10-20T09:00');
  assert.equal(actions[0].props.lead.status, 'Job Done');
  assert.equal(actions[1].props.lead.activeBooking.start, '2026-10-21T11:00');
  assert.equal(actions[1].props.lead.status, 'Job Booked');
  ctx.role = 'super_admin';
  assert.equal(elements(LeadBookings({ lead })).filter(node => typeof node.type === 'function' && node.type.name === 'JobBookingActions').length, 2);
  lead.bookings.pop();
  assert.equal(elements(LeadBookings({ lead })).filter(node => typeof node.type === 'function' && node.type.name === 'JobBookingActions').length, 0, 'single-booking rows retain the existing main buttons');
});

test('manager booking buttons target only the selected booking and disable only saved or busy actions', () => {
  const lead = customer();
  const rows = jobBookingRows(lead);
  const updates = [], journeys = [], prompts = [];
  const ctx = {
    jobBookingsSaving: {}, onTheWayLoading: null,
    updateJobBooking: (...args) => updates.push(args),
    handleOnTheWay: (...args) => journeys.push(args),
    setStartJobDays: () => {}, setStartJobPrompt: value => prompts.push(value),
  };
  const { JobBookingActions } = loadTs('components/admin/JobBookingActions.tsx', {
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
    './AdminPageContext': { useAdminPageCtx: () => ctx },
  });
  const buttons = row => elements(JobBookingActions({ lead: row })).filter(node => node.type === 'button');
  assert.ok(buttons(rows[0]).every(button => button.props.disabled));
  for (const button of buttons(rows[1])) {
    assert.equal(button.props.disabled, false);
    button.props.onClick();
  }
  assert.equal(journeys.length, 2);
  assert.equal(prompts[0].lead.activeBooking.start, rows[1].activeBooking.start);
  assert.equal(updates[0][0].activeBooking.start, rows[1].activeBooking.start);
  assert.equal(updates[0][1].status, 'Job Done');
  for (const [row] of journeys) assert.equal(row.activeBooking.start, rows[1].activeBooking.start);
  ctx.jobBookingsSaving[leadRowKey(rows[0])] = true;
  assert.ok(buttons(rows[1]).every(button => !button.props.disabled));
  ctx.jobBookingsSaving[leadRowKey(rows[1])] = true;
  assert.ok(buttons(rows[1]).every(button => button.props.disabled));
});
