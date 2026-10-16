import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMergePlan, fingerprint } from './lib/lead-merge-plan.mjs';
const primary = { _id: 'primary', jobNo: 'Job-1', name: 'Customer', email: 'c@example.com', phone: '123', address: '1 Street', service: 'Regrouting', status: 'Job Booked', quoteAmount: 1234, activity: [{ action: 'Quote signed' }] };
const duplicate = { _id: 'duplicate', jobNo: 'Job-2', name: 'Customer', email: 'c@example.com', phone: '123', address: '1 Street', service: 'Regrouting', status: 'Job Booked', source: 'Dispatch board', jobAt: '2026-10-19T08:00', quoteItems: [], activity: [{ action: 'Job booked' }] };
const bookings = [{ _id: 'b1', leadId: 'primary', type: 'job', date: '2026-10-18', time: '15:00' }, { _id: 'b2', leadId: 'duplicate', type: 'job', date: '2026-10-19', time: '08:00' }];

test('review is read-only and preserves fingerprint of every original field', () => {
  const original = fingerprint({ primary, duplicate, bookings });
  const plan = buildMergePlan(primary, duplicate, bookings, []);
  assert.equal(plan.primaryJobNo, 'Job-1');
  assert.equal(plan.activitiesToPreserve, 1);
  assert.equal(original, fingerprint({ primary, duplicate, bookings }));
  assert.notEqual(plan.fingerprint, buildMergePlan({ ...primary, notes: 'new' }, duplicate, bookings, []).fingerprint);
});

test('refuses contact mismatches, separate business data and colliding appointments', () => {
  for (const change of [{ email: 'other@example.com' }, { notes: 'Important' }, { amountPaid: 500 }, { quoteItems: [{ description: 'Separate work' }] }, { source: 'Website' }]) {
    assert.throws(() => buildMergePlan(primary, { ...duplicate, ...change }, bookings, []));
  }
  assert.throws(() => buildMergePlan(primary, duplicate, [...bookings, { ...bookings[1], leadId: 'primary' }], []), /collision/);
  assert.throws(() => buildMergePlan(primary, duplicate, bookings, [{ state: 'accepted', values: {} }]), /non-draft/);
  assert.throws(() => buildMergePlan(primary, duplicate, bookings, [{ state: 'draft', values: { quoteAmount: 100 } }]), /substantive/);
});
