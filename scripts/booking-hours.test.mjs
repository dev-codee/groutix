import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES, consolidateBookingHours, slotsForDate, sanitizeBookingRules } = loadTs("lib/bookingRules.ts");

test("one weekly schedule retains the active October hours and booking limits", () => {
  const original = structuredClone(DEFAULT_BOOKING_RULES);
  original.inspection.maxBookingsPerSlot = 5;
  original.job.maxBookingsPerSlot = 3;
  const rules = consolidateBookingHours(original, "2026-10-14");
  assert.ok(rules.inspection.days.every(day => day.open));
  assert.equal(rules.inspection.changeovers.length, 0);
  assert.equal(rules.job.changeovers.length, 0);
  assert.equal(rules.inspection.maxBookingsPerSlot, 5);
  assert.equal(rules.job.maxBookingsPerSlot, 3);
  assert.equal(rules.job.days[5].start, "10:00");
  assert.equal(original.inspection.days[1].open, false);
  rules.inspection.days[1].start = "08:00";
  assert.equal(original.inspection.changeovers[0].days[1].start, "09:00");
  const saved = sanitizeBookingRules(rules);
  assert.equal(slotsForDate(saved, "inspection", "2026-10-19")[0], "08:00");
});

test("hidden dated overrides cannot replace changes to the single weekly schedule", () => {
  const original = structuredClone(DEFAULT_BOOKING_RULES);
  original.job.changeovers = [{ from: "2026-11-01", days: original.job.days.map(day => ({ ...day, open: false })) }];
  const rules = consolidateBookingHours(original, "2026-10-14");
  rules.job.days[1].start = "08:00";
  assert.equal(slotsForDate(sanitizeBookingRules(rules), "job", "2026-11-02")[0], "08:00");
});
