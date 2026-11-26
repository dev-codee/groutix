import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';
const member = { id: 'worker-1', name: 'Test Worker', role: 'technician', active: true, aliases: [] };
const invoice = { number: 'INV-TEST', totalCents: 110000, baseCents: 100000, gstBps: 1000 };
const job = { id: 'job-1', jobLabel: 'JOB-TEST', customer: 'Test Customer', service: 'Regrouting', status: 'Completed', scheduledAt: '2026-01-01T08:00:00+11:00', receipts: [{ number: 'INV-TEST', totalCents: 110000, paidCents: 50000, remainingCents: 60000 }], assignedIds: [member.id], assignedNames: [member.name], completedVisits: 1, totalVisits: 1, workVisits: [], memberWork: [], daysDone: 1, daysPlanned: 1, invoice, invoicePaid: false, eligible: true, changed: false, ledger: { id: 'job-1', version: 1, status: 'approved', basis: 'ex_gst', invoice, shares: [{ memberId: member.id, name: member.name, rateBps: 2500, earnedCents: 25000, paidCents: 10000 }], notes: '', updatedAt: '2026-11-19' } };
function render({ open = false, pay = false, failed = false, draft = false } = {}) {
  let index = 0;
  const mocked = { ...React, useState: initial => {
    const position = index++;
    const overrides = { 0: { members: [member], jobs: [draft ? { ...job, ledger: null } : job] }, 1: false, 2: failed ? 'Connection failed' : '', 8: new Set(open ? [job.id] : []), 9: pay ? { id: job.id, memberId: member.id } : null, 12: 'all', 15: open ? job.id : '' };
    return [Object.hasOwn(overrides, position) ? overrides[position] : typeof initial === 'function' ? initial() : initial, () => {}];
  }, useEffect: () => {}, useCallback: fn => fn, useRef: value => ({ current: value }) };
  const { TeamEarningsView } = loadTs('components/admin/views/TeamEarningsView.tsx', { react: mocked });
  return renderToStaticMarkup(React.createElement(TeamEarningsView, { query: '', onQueryChange() {}, onOpenJob() {}, onAddJob() {}, onManageTeam() {} }));
}
test('monthly register renders receipts, employee balances and manager reserve from the same jobs', () => {
  const html = render();
  for (const text of ['Job &amp; Team Payment Management', 'Received', 'Test Worker', 'Employee Summary', 'Manager Summary', '$500', '$250', '$150', 'Edit Job', 'Add Job', 'Settings']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('aria-expanded="false"'));
});
test('selected job exposes team shares and direct worker payment form inline', () => {
  const html = render({ open: true, pay: true });
  for (const text of ['INV-TEST', 'Remaining', '$600', 'Invoices', 'Team Shares', 'Record Payment', 'Payments &amp; audit log']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('aria-expanded="true"'));
  assert.ok(!html.includes('<dialog'));
});
test('failed refresh hides stale balances and exposes retry', () => {
  const html = render({ failed: true });
  assert.ok(html.includes('Connection failed'));
  assert.ok(html.includes('Retry'));
  assert.ok(!html.includes('$500'));
  assert.ok(!html.includes('Manager Summary'));
});

test('unconfigured jobs immediately render editable CRM members and share amounts', () => {
  const html = render({ open: true, draft: true });
  for (const text of ['Employee 1', 'Share type 1', 'Save draft shares', 'Test Worker', 'Add Employee']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('type="number"'));
  assert.ok(!html.includes('No team shares configured.'));
});

test('saved invoices sort onto the first register page before uninvoiced leads', () => {
  const { compareRegisterJobs } = loadTs('lib/teamEarningsRegister.ts');
  const freshLeads = Array.from({ length: 25 }, (_, i) => ({ ...job, id: `new-${i}`, invoice: null, scheduledAt: '2027-01-01' }));
  const sorted = [...freshLeads, job].sort(compareRegisterJobs);
  assert.equal(sorted[0].id, job.id);
  assert.ok(sorted.slice(0, 20).some(row => row.invoice?.totalCents === 110000));
});
