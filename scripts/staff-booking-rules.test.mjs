import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { DEFAULT_BOOKING_RULES, slotsForDate } = loadTs("lib/bookingRules.ts");
const { staffBookingRules } = loadTs("lib/staffBookingRules.ts");
const { bookingSegments, bookingEndForDuration } = loadTs("lib/bookingSpan.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const closed = structuredClone(DEFAULT_BOOKING_RULES);
for (const type of ["job", "inspection"]) closed[type].days.forEach(day => { day.open = false; });
closed.closedDates = [{ date: "2026-10-18", label: "Closed for customers" }];
closed.minDate = "2027-01-01";
const staff = staffBookingRules(closed);
const techs = [{ id: "a", name: "Alex", active: true, workDays: [] }];

test("customer closures remain closed while staff may choose any day and time", () => {
  for (const type of ["job", "inspection"]) {
    assert.equal(slotsForDate(closed, type, "2026-10-18").length, 0);
    assert.equal(slotsForDate(staff, type, "2026-10-18").length, 24);
    assert.equal(bookingSegments(type, "2026-10-18T20:00", "2026-10-18T22:00", staff)[0].scheduledMinutes, 120);
    assert.throws(() => bookingSegments(type, "2026-10-18T20:00", "2026-10-18T22:00", closed));
  }
  assert.equal(closed.job.days[0].open, false);
  assert.equal(staffBookingRules(closed), staff);
});
test("staff continuous durations span midnight without dropping occupied time", () => {
  const end = bookingEndForDuration("job", "2026-10-18T22:00", 120, staff);
  assert.equal(end, "2026-10-19T00:00");
  const segments = bookingSegments("job", "2026-10-18T22:00", "2026-10-19T02:00", staff);
  assert.equal(segments.length, 2);
  assert.equal(segments.reduce((sum, part) => sum + part.scheduledMinutes, 0), 240);
});
test("staff can override a roster day off but never a person's existing booking", () => {
  const candidate = { leadId: "new", type: "job", date: "2026-10-18", time: "20:00", technicianId: "a" };
  assert.equal(bookingAvailability([], candidate, closed, techs).available, false);
  assert.equal(bookingAvailability([], candidate, staff, techs).available, true);
  assert.equal(bookingAvailability([{ ...candidate, leadId: "old" }], candidate, staff, techs).available, false);
});
test("only an explicit server-side staff override bypasses closed customer hours", async () => {
  const writes = [];
  const col = { createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }), find: () => ({ toArray: async () => [] }), findOne: async () => null, insertOne: async row => writes.push(row), deleteMany: async () => {} };
  const db = { collection: name => name === "bookings" ? col : { findOne: async () => null, find: () => ({ project: () => ({ toArray: async () => [] }) }) } };
  const api = loadTs("lib/bookings.ts", { "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db }, "./bookingRulesServer": { getBookingRules: async () => closed }, "./technicians": { listTechnicians: async () => techs }, "./bookingCalendarLock": { withBookingCalendarLock: async (_date, _type, action) => action() } });
  const candidate = { leadId: "new", type: "job", date: "2026-10-18", time: "20:00", endAt: "2026-10-18T22:00", technicianId: "a", zone: "flexible", reference: "test" };
  assert.equal((await api.createBooking(candidate)).ok, false);
  assert.equal(writes.length, 0);
  assert.equal((await api.createBooking(candidate, { staffOverride: true })).ok, true);
  assert.equal(writes.length, 1);
});
