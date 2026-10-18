import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { DEFAULT_BOOKING_RULES, slotsForDate } = loadTs("lib/bookingRules.ts");
const { staffBookingRules } = loadTs("lib/staffBookingRules.ts");
const { bookingSegments, bookingEndForDuration } = loadTs("lib/bookingSpan.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const configured = structuredClone(DEFAULT_BOOKING_RULES);
configured.job.days = configured.job.days.map(() => ({ open: true, start: "09:00", end: "17:00" }));
configured.closedDates = [{ date: "2026-10-18", label: "Closed" }];
configured.minDate = "2027-01-01";
const staff = staffBookingRules(configured);
const techs = [{ id: "a", name: "Alex", active: true, workDays: [] }];

test("staff retain configured working hours and closures, with a notice override", () => {
  assert.equal(slotsForDate(configured, "job", "2026-10-19").length, 0);
  assert.equal(slotsForDate(staff, "job", "2026-10-19").length, 8);
  assert.equal(slotsForDate(staff, "job", "2026-10-18").length, 0);
  assert.throws(() => bookingSegments("job", "2026-10-19T20:00", "2026-10-19T22:00", staff));
  assert.equal(staffBookingRules(configured), staff);
});
test("staff multi-day durations reserve working hours and skip nights", () => {
  const end = bookingEndForDuration("job", "2026-10-19T09:00", 960, staff);
  assert.equal(end, "2026-10-20T17:00");
  const segments = bookingSegments("job", "2026-10-19T09:00", end, staff);
  assert.equal(segments.length, 2);
  assert.equal(segments.reduce((sum, part) => sum + part.scheduledMinutes, 0), 960);
});
test("staff can override a roster day off but never a person's existing booking", () => {
  const candidate = { leadId: "new", type: "job", date: "2026-10-19", time: "10:00", technicianId: "a" };
  assert.equal(bookingAvailability([], candidate, configured, techs).available, false);
  assert.equal(bookingAvailability([], candidate, staff, techs).available, true);
  assert.equal(bookingAvailability([{ ...candidate, leadId: "old" }], candidate, staff, techs).available, false);
});
