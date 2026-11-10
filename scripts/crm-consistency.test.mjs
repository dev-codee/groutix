import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-ts-loader.mjs';
const { statusFilterAfterChange } = loadTs('lib/statusFilterTransition.ts');
const { canonicalLeadBookings, isPrimaryBooking } = loadTs('lib/leadBookings.ts');
test('status filters follow a changed lead and preserve all-status, unrelated and matching group filters', () => {
  assert.equal(statusFilterAfterChange('Inspection Booked', 'Inspection Booked', 'Inspection Completed'), 'Inspection Completed');
  assert.equal(statusFilterAfterChange('New|Contacted', 'Contacted', 'Inspection Booked'), 'Inspection Booked');
  assert.equal(statusFilterAfterChange('New|Contacted', 'New', 'Contacted'), 'New|Contacted');
  assert.equal(statusFilterAfterChange('', 'New', 'Contacted'), '');
  assert.equal(statusFilterAfterChange('Won', 'New', 'Contacted'), 'Won');
});
test('a stable inspection booking identity gives lead cards the saved date, time and inspector', () => {
  const primary = { bookingId: 'inspection-primary', type: 'inspection', date: '2026-11-15', time: '10:30', assigned: 'Sam', inspectorId: 'sam', endAt: '2026-11-15T11:30' };
  const lead = { id: 'lead', status: 'Inspection Booked', primaryInspectionBookingId: primary.bookingId, inspectionAt: '2026-11-11T09:00', assigned: 'Alex', inspectorId: 'alex', bookings: [primary, { ...primary, bookingId: 'second', date: '2026-11-16' }] };
  const canonical = canonicalLeadBookings(lead);
  assert.equal(canonical.inspectionAt, '2026-11-15T10:30'); assert.equal(canonical.assigned, 'Sam'); assert.equal(canonical.inspectorId, 'sam');
  assert.equal(canonical.inspectionEndAt, primary.endAt); assert.equal(lead.inspectionAt, '2026-11-11T09:00');
  assert.equal(isPrimaryBooking(lead, lead.bookings[1]), false);
});
test('a unique same-time booking remains primary after reassignment; same-time sibling identities stay separate', () => {
  const booking = { bookingId: 'primary', type: 'inspection', date: '2026-11-11', time: '09:00', assigned: 'Sam', inspectorId: 'sam' };
  const lead = { id: 'lead', status: 'Inspection Booked', inspectionAt: '2026-11-11T09:00', assigned: 'Alex', inspectorId: 'alex', bookings: [booking] };
  assert.equal(isPrimaryBooking(lead, booking), true); assert.equal(canonicalLeadBookings(lead).assigned, 'Sam');
  const sibling = { ...booking, bookingId: 'other', inspectorId: 'alex', assigned: 'Alex' };
  assert.equal(isPrimaryBooking({ ...lead, bookings: [booking, sibling] }, booking), false);
});
test('confirmed CRM changes notify this tab and other tabs without broadcasting customer details', () => {
  const listeners = new Map(), stored = [];
  const window = { addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event), dispatchEvent: event => listeners.get(event.type)?.(event), localStorage: { setItem: (key, value) => stored.push([key, value]) } };
  const { publishCrmChange, subscribeCrmChanges } = loadTs('lib/crmChanges.ts', {}, { window, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  const calls = []; const unsubscribe = subscribeCrmChanges(item => calls.push(item));
  const item = { id: 'customer', name: 'Private name', status: 'Inspection Booked' };
  publishCrmChange(item); assert.equal(calls[0], item); assert.doesNotMatch(stored[0][1], /Private name|customer/);
  listeners.get('storage')({ key: stored[0][0] }); assert.equal(calls[1], undefined);
  unsubscribe(); assert.equal(listeners.size, 0);
});

test('an older background response cannot overwrite a newer saved booking', async () => {
  const { readFileSync } = await import('node:fs');
  const { default: ts } = await import('typescript');
  const { default: vm } = await import('node:vm');
  const source = readFileSync('app/admin/page.tsx', 'utf8');
  const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'loadData') declaration = node.getText(tree); ts.forEachChild(node, visit); }
  visit(tree);
  const module = { exports: {} }, ref = { current: 0 }, writes = [];
  let resolveOld, calls = 0;
  const old = new Promise(resolve => { resolveOld = resolve; });
  vm.runInNewContext(ts.transpileModule(`const ${declaration}; module.exports = loadData;`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, {
    module, useCallback: fn => fn, leadReadVersion: ref, setLoading() {}, setError() {}, getNewLeadsCutoffMs: () => 0, setNewLeadsCutoffMs() {},
    normalizeStatus: status => status, generateJobNos: items => items, jobNumberChanges: () => [], setLeads: items => writes.push(items), setTasks() {},
    fetch: async url => url.includes('submissions') ? (++calls === 1 ? await old : { ok: true, json: async () => ({ items: [{ id: 'lead', inspectionAt: 'new-date' }] }) }) : { ok: true, json: async () => ({ items: [] }) },
  });
  const first = module.exports({ silent: true });
  ++ref.current; // A confirmed mutation invalidates reads already in flight.
  await module.exports({ silent: true });
  resolveOld({ ok: true, json: async () => ({ items: [{ id: 'lead', inspectionAt: 'old-date' }] }) });
  await first;
  assert.equal(writes.length, 1); assert.equal(writes[0][0].inspectionAt, 'new-date');
});

test('lead cards show the saved dates for additional inspections as well as the primary inspection', async () => {
  const React = await import('react'); const { renderToStaticMarkup } = await import('react-dom/server');
  const { InspectionBookingDates } = loadTs('components/admin/InspectionBookingDates.tsx');
  const lead = { id: 'lead', status: 'Inspection Booked', inspectionAt: '2026-11-11T09:00', assigned: 'Alex', bookings: [
    { bookingId: 'primary', type: 'inspection', date: '2026-11-11', time: '09:00', assigned: 'Alex' },
    { bookingId: 'additional', type: 'inspection', date: '2026-11-15', time: '11:00', assigned: 'Sam' },
  ] };
  const html = renderToStaticMarkup(React.createElement(InspectionBookingDates, { lead }));
  assert.match(html, /11 Nov/); assert.match(html, /15 Nov/); assert.match(html, /Sam/); assert.match(html, /Alex/);
  const updated = { ...lead, bookings: lead.bookings.map(booking => booking.bookingId === 'additional' ? { ...booking, date: '2026-11-18' } : booking) };
  const after = renderToStaticMarkup(React.createElement(InspectionBookingDates, { lead: updated }));
  assert.match(after, /18 Nov/); assert.doesNotMatch(after, /15 Nov/);
});

test('the actual lead save follows the confirmed status filter only after a successful write', async () => {
  const { readFileSync } = await import('node:fs'); const { default: ts } = await import('typescript'); const { default: vm } = await import('node:vm');
  const tree = ts.createSourceFile('page.tsx', readFileSync('app/admin/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'updateLeadField') declaration = node.getText(tree); ts.forEachChild(node, visit); }
  visit(tree);
  for (const ok of [true, false]) {
    const module = { exports: {} }; let filter = 'Inspection Booked', records = [{ id: 'lead', status: 'Inspection Booked' }];
    vm.runInNewContext(ts.transpileModule(`${declaration}; module.exports = updateLeadField;`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, {
      module, leads: records, quoteModalOpen: false, leadReadVersion: { current: 0 }, statusFilterAfterChange,
      saveLeadChanges: async () => ok ? { ok: true, item: { id: 'lead', status: 'Inspection Completed' } } : { ok: false, error: 'Could not save' },
      setStatusFilter: update => { filter = update(filter); }, setLeads: update => { records = update(records); },
    });
    assert.equal(await module.exports('lead', { status: 'Inspection Completed' }), ok);
    assert.equal(filter, ok ? 'Inspection Completed' : 'Inspection Booked');
    assert.equal(records[0].status, filter);
  }
});
