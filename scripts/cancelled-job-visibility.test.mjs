import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { jobBookingRows, leadBookings, visibleInRole } = loadTs('lib/leadBookings.ts');
const { ROLES } = loadTs('lib/roles.ts');

const customer = () => ({
  id: 'customer', status: 'Job Booked', jobAt: '2026-11-03T09:00', technician: 'Alex',
  bookings: [
    { bookingId: 'cancelled', type: 'job', date: '2026-11-03', time: '09:00', technician: 'Alex', status: 'Cancelled' },
    { bookingId: 'active', type: 'job', date: '2026-11-04', time: '09:00', technician: 'Alex', status: 'Job Booked' },
  ],
});

test('a cancelled customer disappears from every role, including legacy jobs without saved visits', () => {
  for (const bookings of [undefined, customer().bookings]) {
    const lead = { ...customer(), status: 'Cancelled', bookings };
    for (const role of [...ROLES, 'field', 'super_admin']) {
      assert.equal(visibleInRole(lead, role), false, role);
    }
    assert.equal(jobBookingRows(lead).length, 0);
  }
});

test('cancelling one visit removes only that job row and preserves its active sibling and history', () => {
  const lead = customer();
  const before = JSON.stringify(lead);
  const rows = jobBookingRows(lead);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].activeBooking.bookingId, 'active');
  assert.equal(rows[0].status, 'Job Booked');
  assert.equal(visibleInRole(lead, 'technician'), true);
  assert.equal(leadBookings(lead).length, 2);
  assert.equal(JSON.stringify(lead), before);
});

test('cancelling every job leaves no technician row or fallback customer card', () => {
  const lead = customer();
  lead.bookings[1].status = 'Cancelled';
  assert.equal(jobBookingRows(lead).length, 0);
  assert.equal(visibleInRole(lead, 'technician'), false);
});

test('cancelled inspections disappear from inspection and field queues without hiding active work', () => {
  const lead = {
    id: 'inspection', status: 'Inspection Booked', inspectionAt: '2026-11-03T09:00',
    bookings: [{ type: 'inspection', date: '2026-11-03', time: '09:00', status: 'Cancelled' }],
  };
  for (const role of ['inspection', 'field']) assert.equal(visibleInRole(lead, role), false);
  lead.bookings.push({ type: 'inspection', date: '2026-11-04', time: '09:00', status: 'Inspection Booked' });
  for (const role of ['inspection', 'field']) assert.equal(visibleInRole(lead, role), true);
});

test('unbooked and completed work remain visible', () => {
  assert.equal(jobBookingRows({ id: 'unbooked', status: 'Won' }).length, 1);
  const lead = customer();
  lead.bookings[1].status = 'Job Done';
  assert.equal(jobBookingRows(lead)[0].status, 'Job Done');
  assert.equal(visibleInRole(lead, 'technician'), true);
});
