import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';
const { bookingReminderCandidates } = loadTs('lib/bookingReminders.ts');

test('additional visits retain independent reminders when the primary is already reminded', () => {
  const lead = { id: 'lead', name: 'Customer', jobAt: '2026-10-18T15:00', jobReminderSent: true, jobReminder1hSent: true };
  const candidates = bookingReminderCandidates([lead], [
    { leadId: 'lead', type: 'job', date: '2026-10-18', time: '15:00' },
    { leadId: 'lead', type: 'job', date: '2026-10-19', time: '08:00', reminderSent: false, reminder1hSent: false },
  ]);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].jobReminderSent, true);
  assert.equal(candidates[1].jobReminderSent, false);
  assert.equal(candidates[1].jobReminder1hSent, false);
  assert.equal(candidates[1].jobAt, '2026-10-19T08:00');
  assert.equal(candidates[1].id, lead.id);
});

test('legacy schedules remain supported without duplicate reminders for stored bookings', () => {
  const lead = { id: 'lead', jobAt: '2026-10-19T08:00', inspectionAt: '2026-10-17T09:00' };
  const candidates = bookingReminderCandidates([lead], [{ leadId: 'lead', type: 'job', date: '2026-10-19', time: '08:00', reminderSent: true }]);
  assert.equal(candidates.length, 2);
  assert.equal(candidates.filter(c => c.inspectionAt).length, 1);
  assert.equal(candidates.filter(c => c.jobAt).length, 1);
  assert.equal(candidates.find(c => c.jobAt).jobReminderSent, true);
});
