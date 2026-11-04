import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';

const { DEFAULT_BOOKING_RULES, sanitizeBookingRules, bookingNoticeDays, validateBookingRules } = loadTs('lib/bookingRules.ts');
let now = '2026-11-04T01:00:00Z';
class ClockDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return new Date(now).getTime(); }
}
const scheduling = loadTs('lib/scheduling.ts', {}, { Date: ClockDate });
const { staffBookingRules } = loadTs('lib/staffBookingRules.ts');
const area = scheduling.resolveArea('Gowanbrae');
function rulesFor(skip = 2) {
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  rules.minDate = '';
  rules.horizonDays = 20;
  rules.inspection.minNoticeDays = skip + 1;
  for (const type of ['inspection', 'job']) {
    rules[type].days = Array.from({ length: 7 }, () => ({ open: true, start: '09:00', end: '17:00' }));
    rules[type].changeovers = [];
  }
  return rules;
}
const days = (rules, type = 'inspection') => scheduling.computeAvailability(area, new Map(), new Set(), type, rules);

test('skipping two upcoming days on the 4th offers inspections from the 7th and rejects earlier submissions', () => {
  now = '2026-11-04T01:00:00Z';
  const rules = rulesFor();
  assert.equal(days(rules)[0].date, '2026-11-07');
  for (const date of ['2026-11-04', '2026-11-05', '2026-11-06']) assert.equal(scheduling.isSlotOffered(area, date, '09:00', 'inspection', rules), false);
  assert.equal(scheduling.isSlotOffered(area, '2026-11-07', '09:00', 'inspection', rules), true);
  assert.equal(days(rules, 'job')[0].date, '2026-11-05');
  now = '2026-11-05T01:00:00Z';
  assert.equal(days(rules)[0].date, '2026-11-08', 'the delay rolls forward every day');
});

test('closed dates and a fixed earliest date remain in force after the inspection delay', () => {
  now = '2026-11-04T01:00:00Z';
  const rules = rulesFor();
  rules.closedDates = [{ date: '2026-11-07' }];
  assert.equal(days(rules)[0].date, '2026-11-08');
  rules.minDate = '2026-11-10';
  assert.equal(days(rules)[0].date, '2026-11-10');
  now = '2026-12-30T01:00:00Z';
  rules.minDate = '';
  rules.closedDates = [];
  assert.equal(days(rules)[0].date, '2027-01-02');
});

test('the inspection setting persists, can be cleared, and does not constrain staff bookings', () => {
  const rules = sanitizeBookingRules(rulesFor());
  assert.equal(rules.inspection.minNoticeDays, 3);
  assert.equal(bookingNoticeDays(rules, 'inspection'), 3);
  assert.equal(bookingNoticeDays(rules, 'job'), 1);
  assert.equal(bookingNoticeDays(staffBookingRules(rules), 'inspection'), 0);
  assert.equal(validateBookingRules(rules).length, 0);
  const reset = sanitizeBookingRules({ ...rules, inspection: { ...rules.inspection, minNoticeDays: undefined } });
  assert.equal(bookingNoticeDays(reset, 'inspection'), 1);
  const invalid = sanitizeBookingRules({ ...rules, inspection: { ...rules.inspection, minNoticeDays: -2 } });
  assert.equal(invalid.inspection.minNoticeDays, undefined);
  rules.horizonDays = 2;
  assert.ok(validateBookingRules(rules).some(error => error.startsWith('Inspection: minimum notice')));
});
