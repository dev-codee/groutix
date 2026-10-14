import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES, sanitizeBookingRules, validateBookingRules } = loadTs("lib/bookingRules.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const { applyBookingCapacity } = loadTs("lib/bookingAvailabilityDays.ts");
const { staffBookingRules } = loadTs("lib/staffBookingRules.ts");
const technicians = Array.from({ length: 6 }, (_, i) => ({ id: `tech-${i}`, name: `Tech ${i}`, active: true }));
const rulesFor = (type, limit) => ({ ...DEFAULT_BOOKING_RULES, [type]: { ...DEFAULT_BOOKING_RULES[type], maxBookingsPerSlot: limit } });
const candidateFor = (type) => ({ leadId: "new", type, date: "2026-10-15", time: "09:00" });

for (const type of ["inspection", "job"]) {
  test(`${type} slots close at the configured limit and reopen when a booking is removed`, () => {
    const rules = rulesFor(type, 5);
    const candidate = candidateFor(type);
    const bookings = Array.from({ length: 5 }, (_, i) => ({ ...candidate, leadId: `lead-${i}` }));
    for (let count = 0; count < 5; count++) {
      const result = bookingAvailability(bookings.slice(0, count), candidate, rules, technicians);
      assert.equal(result.available, true);
      assert.equal(result.remaining, 5 - count);
    }
    assert.equal(bookingAvailability(bookings, candidate, rules, technicians).available, false);
    assert.equal(bookingAvailability(bookings.slice(1), candidate, rules, technicians).available, true);
    assert.equal(bookingAvailability(bookings, { ...candidate, time: "10:00" }, rules, technicians).available, true);
    assert.equal(bookingAvailability(bookings, { ...candidate, leadId: "lead-0" }, rules, technicians).available, true);
    assert.equal(bookingAvailability(bookings.slice(0, 1), candidate, rulesFor(type, 1), technicians).available, false);
  });

  test(`${type} customer limits apply to assigned people while staff can choose another free person`, () => {
    const rules = rulesFor(type, 1);
    const assign = (i) => type === "job" ? { technicianId: `tech-${i}` } : { inspectorId: `tech-${i}` };
    const existing = { ...candidateFor(type), ...assign(0), leadId: "old" };
    const candidate = { ...candidateFor(type), ...assign(1) };
    assert.equal(bookingAvailability([existing], candidate, rules, technicians).available, false);
    assert.equal(bookingAvailability([existing], candidate, staffBookingRules(rules), technicians).available, true);
    assert.equal(bookingAvailability([existing], { ...candidate, ...assign(0) }, staffBookingRules(rules), technicians).available, false);
  });

  test(`${type} public slot availability follows the saved limit across overlapping intervals`, () => {
    const rules = rulesFor(type, 2);
    const candidate = candidateFor(type);
    const day = { date: candidate.date, slots: ["09:00", "10:00", "11:00"].map(time => ({ time, booked: false })), times: [] };
    const bookings = [
      { ...candidate, leadId: "long", scheduledMinutes: 120 },
      { ...candidate, leadId: "later", time: "10:00" },
    ];
    const result = applyBookingCapacity([day], bookings, { leadId: "new", type }, rules, technicians)[0];
    assert.deepEqual(Array.from(result.times), ["09:00", "11:00"]);
    assert.equal(result.slots[1].booked, true);
    assert.equal(result.slots[0].remaining, 1);
  });
}

test("job limits retain roster and whole-interval person availability checks", () => {
  const candidate = candidateFor("job");
  const rules = rulesFor("job", 5);
  assert.equal(bookingAvailability([], candidate, rules, technicians.slice(0, 2)).capacity, 2);
  assert.equal(bookingAvailability([], candidate, rules, []).available, false);
  const inspection = { ...candidate, type: "inspection", leadId: "other", inspectorId: "tech-0" };
  assert.equal(bookingAvailability([inspection], { ...candidate, technicianId: "tech-0" }, rules, technicians).available, false);
});

test("slot limits persist through sanitization and reject invalid values", () => {
  const saved = sanitizeBookingRules({ ...rulesFor("inspection", 5), job: { ...DEFAULT_BOOKING_RULES.job, maxBookingsPerSlot: 3 } });
  assert.equal(saved.inspection.maxBookingsPerSlot, 5);
  assert.equal(saved.job.maxBookingsPerSlot, 3);
  assert.equal(sanitizeBookingRules(saved).inspection.maxBookingsPerSlot, 5);
  assert.equal(sanitizeBookingRules(DEFAULT_BOOKING_RULES).job.maxBookingsPerSlot, undefined);
  for (const limit of [0, -1, 1.5, 6, 100, "bad"]) {
    assert.equal(sanitizeBookingRules(rulesFor("inspection", limit)).inspection.maxBookingsPerSlot, undefined);
    assert.ok(validateBookingRules(rulesFor("inspection", limit)).length > 0);
  }
});
