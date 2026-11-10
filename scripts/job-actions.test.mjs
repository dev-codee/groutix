import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const { selectedJobBooking, jobBookingRows } = loadTs('lib/leadBookings.ts');
const visit = (bookingId, status, date = '2026-11-11') => ({ bookingId, type: 'job', date, time: '09:00', status, technician: 'Alex' });
const customer = bookings => ({ id: 'customer', status: 'Job Booked', jobAt: '2026-11-11T09:00', technician: 'Alex', bookings });

function nodes(root) {
  const result = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    result.push(node); walk(node.props?.children);
  }
  walk(root); return result;
}
function ui() {
  const writes = [];
  const context = { role: 'manager', jobBookingsSaving: {}, staff: [], inspectionStaff: [], assignableTechnicians: [],
    isTechnicianName: () => false, updateJobBooking: (lead, updates) => writes.push({ booking: selectedJobBooking(lead), updates }) };
  const overrides = {
    react: { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }) },
    '@/lib/useDistanceKm': { useDistanceKm: () => null },
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => context },
    './AdminPageContext': { useAdminPageCtx: () => context },
  };
  return { writes, context,
    card: loadTs('components/admin/rows/StandardLeadCard.tsx', overrides).StandardLeadCard,
    bookings: loadTs('components/admin/LeadBookings.tsx', overrides).LeadBookings,
    actions: loadTs('components/admin/JobBookingActions.tsx', overrides).JobBookingActions,
  };
}
const h = ui();
for (const sameTime of [true, false]) {
  test(`Job Done remains clickable with a cancelled ${sameTime ? 'same-time sibling' : 'primary and a replacement visit'}`, () => {
    const lead = customer([visit('cancelled', 'Cancelled'), visit('live', 'Job Booked', sameTime ? '2026-11-11' : '2026-11-14')]);
    lead.primaryJobBookingId = 'cancelled';
    const button = nodes(h.card({ l: lead })).find(node => node.type === 'button' && node.props.children === 'Job Done');
    assert.ok(button, 'one active booking must retain the main Job Done button');
    assert.equal(Boolean(button.props.disabled), false);
    button.props.onClick();
    assert.equal(h.writes.at(-1).booking.bookingId, 'live');
    assert.equal(h.writes.at(-1).updates.status, 'Job Done');
    assert.equal(h.bookings({ lead }), null, 'no duplicated booking controls for a single live visit');
  });
}

test('two live jobs keep separate controls and completing one does not disable its sibling', () => {
  const lead = customer([visit('done', 'Job Done'), visit('pending', 'Job Booked')]);
  lead.status = 'Job In Progress';
  assert.ok(h.bookings({ lead }));
  const rows = jobBookingRows(lead);
  for (const row of rows) {
    const button = nodes(h.actions({ lead: row })).find(node => node.type === 'button' && node.props.title.startsWith('Job Done'));
    assert.equal(Boolean(button.props.disabled), row.activeBooking.bookingId === 'done');
    if (!button.props.disabled) {
      button.props.onClick();
      assert.equal(h.writes.at(-1).booking.bookingId, 'pending');
    }
  }
});

test('cancelled-only visits cannot be completed from the main job buttons', () => {
  const lead = customer([visit('cancelled', 'Cancelled')]);
  const button = nodes(h.card({ l: lead })).find(node => node.type === 'button' && node.props.children === 'Job Done');
  assert.ok(button); assert.equal(Boolean(button.props.disabled), true);
});

test('a plain single job and a legacy job retain their Job Done action', () => {
  for (const bookings of [[visit('live', 'Job In Progress')], []]) {
    const lead = customer(bookings); lead.status = 'Job In Progress';
    const button = nodes(h.card({ l: lead })).find(node => node.type === 'button' && node.props.children === 'Job Done');
    assert.ok(button); assert.equal(Boolean(button.props.disabled), false);
    button.props.onClick(); assert.equal(h.writes.at(-1).updates.status, 'Job Done');
  }
});

test('the real save handler targets the remaining visit and follows technician filters after confirmation', async () => {
  const tree = ts.createSourceFile('page.tsx', readFileSync('app/admin/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  function walk(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'updateJobBooking') declaration = node.getText(tree);
    ts.forEachChild(node, walk);
  }
  walk(tree); assert.ok(declaration);
  const { statusFilterAfterChange } = loadTs('lib/statusFilterTransition.ts');
  for (const role of ['manager', 'technician']) for (const ok of [true, false]) {
    const lead = customer([visit('cancelled', 'Cancelled'), visit('live', 'Job Booked'), visit('sibling', 'Job In Progress', '2026-11-12')]);
    lead.status = 'Job In Progress';
    const clicked = { ...lead, activeBooking: { type: 'job', bookingId: 'live', start: '2026-11-11T09:00' } };
    const saved = { ...lead, bookings: lead.bookings.map(b => b.bookingId === 'live' ? { ...b, status: 'Job Done' } : b) };
    const requests = [], broadcasts = [], errors = [], saving = { current: new Set() };
    let filter = role === 'technician' ? 'Job Booked' : 'Job In Progress', records = [lead];
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(`${declaration}; module.exports = updateJobBooking;`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, {
      module, role, leads: [lead], selectedJobBooking, statusFilterAfterChange, jobUpdatesInFlight: saving, leadReadVersion: { current: 0 },
      setJobBookingsSaving() {}, setLeads: update => { records = update(records); }, setStatusFilter: update => { filter = update(filter); },
      publishCrmChange: item => broadcasts.push(item), alert: message => errors.push(message),
      updateLeadField: () => assert.fail('must update the selected visit, not the whole customer'),
      fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok, json: async () => ok ? { item: saved } : { error: 'Save failed' } }; },
    });
    assert.equal(await module.exports(clicked, { status: 'Job Done' }), ok);
    assert.equal(requests[0].bookingId, 'live'); assert.equal(requests[0].syncWorkflow, true);
    assert.equal(filter, role === 'technician' && ok ? 'Job Done' : role === 'technician' ? 'Job Booked' : 'Job In Progress');
    assert.equal(records[0], ok ? saved : lead);
    assert.equal(broadcasts.length, ok ? 1 : 0); assert.equal(errors.length, ok ? 0 : 1);
    assert.equal(saving.current.size, 0);
  }
});
