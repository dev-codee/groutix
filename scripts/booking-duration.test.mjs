import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { estimatedJobMinutes } = loadTs("lib/bookingDuration.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const { DEFAULT_BOOKING_RULES: rules } = loadTs("lib/bookingRules.ts");
const technicians = [{ id: "a", name: "Alex", active: true }, { id: "b", name: "Bob", active: true }];
const job = { leadId: "existing", type: "job", date: "2026-10-09", time: "09:00", technicianId: "a", durationMinutes: 150 };
const check = (overrides = {}, appointments = [job]) => bookingAvailability(appointments, { ...job, leadId: "new", time: "11:00", durationMinutes: 60, ...overrides }, rules, technicians);
test("hour estimates support decimals and reserve the upper bound of ranges", () => {
  for (const [value, minutes] of [["4",240],["2.5 hours",150],["4–6 hrs",360],["4 to 6 hours",360],["0",undefined],["tomorrow",undefined],["1.5 days",undefined]]) assert.equal(estimatedJobMinutes(value), minutes);
});
test("full duration blocks the assigned technician and leaves another technician free", () => {
  assert.equal(check().available, false);
  assert.equal(check({ technicianId: "b" }).available, true);
  assert.equal(check({ time: "11:30" }).available, true);
});
test("a new long job checks its entire interval, including a later booking", () => {
  assert.equal(check({ time: "08:00", durationMinutes: 180 }).available, false);
});
test("inspection capacity remains separate from long jobs", () => {
  assert.equal(check({ type: "inspection", technicianId: undefined }).available, true);
});
test("unassigned capacity is booked throughout a long job, not only its start", () => {
  assert.equal(bookingAvailability([job], { leadId: "new", date: job.date, time: "10:00", type: "job" }, rules, [technicians[0]]).available, false);
});

test("planning suggestions skip the occupied hours of a long job", () => {
  const { suggestedPlanningTime } = loadTs("lib/scheduleDrag.ts");
  assert.equal(suggestedPlanningTime(rules, "job", job.date, [{ ...job, id: "existing" }], "10:00"), "12:00");
});
