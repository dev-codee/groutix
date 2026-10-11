import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { estimatedJobMinutes, appointmentDurationMinutes } = loadTs("lib/bookingDuration.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const { DEFAULT_BOOKING_RULES: rules } = loadTs("lib/bookingRules.ts");
const technicians = [{ id: "a", name: "Alex", active: true }, { id: "b", name: "Bob", active: true }];
const job = { leadId: "existing", type: "job", date: "2026-10-09", time: "09:00", technicianId: "a", durationMinutes: 150 };
const check = (overrides = {}, appointments = [job]) => bookingAvailability(appointments, { ...job, leadId: "new", time: "11:00", durationMinutes: 60, ...overrides }, rules, technicians);
test("hour estimates support decimals and reserve the upper bound of ranges", () => {
  for (const [value, minutes] of [["4",240],["2.5 hours",150],["4–6 hrs",360],["4 to 6 hours",360],["0",undefined],["tomorrow",undefined],["1.5 days",undefined]]) assert.equal(estimatedJobMinutes(value), minutes);
});
test("booking windows remain one hour even when estimated work takes several hours", () => {
  assert.equal(appointmentDurationMinutes(job, rules), 60);
  assert.equal(check({ time: "09:00" }).available, false);
  assert.equal(check({ time: "09:00", technicianId: "b" }).available, true);
  assert.equal(check({ time: "10:00" }).available, true);
  assert.equal(check({ time: "08:00", durationMinutes: 240 }).available, true);
});
test("inspection capacity stays separate from jobs", () => {
  assert.equal(check({ time: "09:00", type: "inspection", technicianId: undefined }).available, true);
});
test("one booking leaves the second technician available; the second booking fills the hour", () => {
  const first = { ...job, technicianId: undefined };
  assert.equal(bookingAvailability([first], { ...first, leadId: "new" }, rules, technicians).remaining, 1);
  assert.equal(bookingAvailability([first, { ...first, leadId: "second" }], { ...first, leadId: "new" }, rules, technicians).available, false);
});
test("planning suggestions offer the next hour despite a longer work estimate", () => {
  const { suggestedPlanningTime } = loadTs("lib/scheduleDrag.ts");
  assert.equal(suggestedPlanningTime(rules, "job", job.date, [{ ...job, id: "existing" }], "10:00"), "10:00");
});
