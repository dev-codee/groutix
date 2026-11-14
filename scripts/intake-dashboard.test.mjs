import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}
function harness(role) {
  const filters = [], edits = [], modals = [];
  const Notes = () => null, Leads = () => null;
  const ctx = {
    role, username: 'staff', scopedLeads: [
      { id: 'new', status: 'New', name: 'New customer' },
      { id: 'job', status: 'Job In Progress', name: 'Active job' },
      { id: 'done', status: 'Job Done', name: 'Finished job' },
    ], counts: {}, assignableTechnicians: [], staff: [], inspectionStaff: [], staffLocations: [],
    unreadReplyCount: 0, globalSearch: '', setEditingLead: value => edits.push(value),
    setLeadModalOpen: value => modals.push(value), openLeadsFiltered: value => filters.push(value),
  };
  const { ManagerDashboard } = loadTs('components/admin/ManagerDashboard.tsx', {
    react: { useState: value => [value, () => {}], useRef: current => ({ current }), useMemo: fn => fn(), useCallback: fn => fn, useEffect: () => {} },
    '@/components/admin/AdminPageContext': { useAdminPageCtx: () => ctx },
    '@/components/admin/ManagerNotesCard': { ManagerNotesCard: Notes },
    '@/components/admin/views/LeadsView': { LeadsView: Leads },
  });
  return { nodes: elements(ManagerDashboard()), filters, edits, modals, Notes, Leads };
}
const cards = h => h.nodes.filter(n => n.type === 'button' && /leads \(click to view\)$/.test(n.props.title || ''));
test('Intake renders the exact Manager stage sequence, counts and click filters through Job Done', () => {
  const intake = harness('intake'), manager = harness('manager');
  const expected = cards(manager).slice(0, cards(manager).findIndex(n => n.props.title.startsWith('Job Done:')) + 1);
  assert.deepEqual(cards(intake).map(n => n.props.title), expected.map(n => n.props.title));
  assert.equal(cards(intake).length, 12);
  cards(intake).forEach(n => n.props.onClick());
  expected.forEach(n => n.props.onClick());
  assert.deepEqual(intake.filters.map(value => Array.from(value)), manager.filters.map(value => Array.from(value)));
  assert.ok(cards(intake).some(n => n.props.title === 'Job In Progress: 1 leads (click to view)'));
  assert.ok(cards(intake).some(n => n.props.title === 'Job Done: 1 leads (click to view)'));
});
test('Intake shows personal notes and functional Add Lead above the stage buttons', () => {
  const h = harness('intake');
  const add = h.nodes.find(n => n.type === 'button' && elements(n).some(child => child.props?.children?.includes?.(' Add Lead')));
  assert.ok(add);
  assert.ok(h.nodes.findIndex(n => n.type === h.Notes) < h.nodes.indexOf(cards(h)[0]));
  assert.ok(h.nodes.indexOf(add) < h.nodes.indexOf(cards(h)[0]));
  add.props.onClick();
  assert.equal(h.edits[0].status, 'New');
  assert.equal(h.modals[0], true);
  assert.ok(h.nodes.some(n => n.type === h.Leads));
});
test('Intake can access the requested screens and personal notes while administration stays restricted', () => {
  const { canView, canAccessApi } = loadTs('lib/roles.ts');
  for (const view of ['jobs', 'leads', 'inbox', 'dispatch', 'schedule', 'completed']) assert.equal(canView('intake', view), true);
  for (const view of ['settings', 'team', 'analytics']) assert.equal(canView('intake', view), false);
  assert.equal(canAccessApi('intake', '/api/admin/manager-notes'), true);
  assert.equal(canAccessApi('intake', '/api/admin/users'), false);
  assert.equal(canAccessApi('technician', '/api/admin/manager-notes'), false);
});
