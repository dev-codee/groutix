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

test("staff suggestions retain hours and closures while manual booking times can override them", () => {
  assert.equal(slotsForDate(configured, "job", "2026-10-19").length, 0);
  assert.equal(slotsForDate(staff, "job", "2026-10-19").length, 8);
  assert.equal(slotsForDate(staff, "job", "2026-10-18").length, 0);
  assert.equal(bookingSegments("job", "2026-10-19T20:00", "2026-10-19T22:00", staff)[0].scheduledMinutes, 120);
  assert.equal(staffBookingRules(configured), staff);
});
test("staff multi-day durations reserve working hours and skip nights", () => {
  const end = bookingEndForDuration("job", "2026-10-19T09:00", 960, staff);
  assert.equal(end, "2026-10-20T17:00");
  const segments = bookingSegments("job", "2026-10-19T09:00", end, staff);
  assert.equal(segments.length, 2);
  assert.equal(segments.reduce((sum, part) => sum + part.scheduledMinutes, 0), 960);
});
test("staff conflicts remain available as warnings", () => {
  const candidate = { leadId: "new", type: "job", date: "2026-10-19", time: "10:00", technicianId: "a" };
  assert.equal(bookingAvailability([], candidate, configured, techs).available, false);
  assert.equal(bookingAvailability([], candidate, staff, techs).available, true);
  assert.equal(bookingAvailability([{ ...candidate, leadId: "old" }], candidate, staff, techs).available, false);
});

for (const type of ["job", "inspection"]) {
  test(`${type}: manual closed-day and early/late bookings retain exact selected windows`, () => {
    for (const [start, end, minutes] of [
      ["2026-10-18T06:00", "2026-10-18T08:00", 120],
      ["2026-10-19T20:00", "2026-10-19T22:00", 120],
      ["2026-10-19T23:00", "2026-10-20T01:00", 120],
      ["2026-10-19T20:00", "2026-10-20T00:00", 240],
    ]) {
      const segments = bookingSegments(type, start, end, staff);
      assert.equal(segments[0].time, start.slice(11));
      assert.equal(segments.reduce((sum, part) => sum + part.scheduledMinutes, 0), minutes);
      assert.throws(() => bookingSegments(type, start, end, configured));
    }
    assert.equal(bookingEndForDuration(type, "2026-10-18T06:00", 60, staff), "2026-10-18T07:00");
    assert.equal(bookingEndForDuration(type, "2026-10-19T20:00", 60, staff), "2026-10-19T21:00");
  });
}

test("explicit overnight staff windows survive calendar reads instead of legacy repair", () => {
  const { savedWorkSegments } = loadTs("lib/bookingSpan.ts");
  const segments = bookingSegments("job", "2026-10-19T23:00", "2026-10-20T01:00", staff);
  assert.equal(savedWorkSegments("job", "2026-10-19T23:00", "2026-10-20T01:00", segments, configured), segments);
});

test("CRM override permits conflicting saves while customer reservations still enforce capacity", async () => {
  const rows = [];
  const rules = { ...configured, minDate: "" };
  const col = { createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }),
    find: () => ({ toArray: async () => rows }), insertOne: async row => rows.push(row) };
  const db = { collection: name => name === "bookings" ? col : {
    findOne: async () => null, find: () => ({ project: () => ({ toArray: async () => [] }) }) } };
  const { createBooking, listAppointmentsBetween } = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { getDb: async () => db, isMongoConfigured: () => true },
    "./bookingRulesServer": { getBookingRules: async () => rules },
    "./technicians": { listTechnicians: async () => [{ id: "alex", name: "Alex", active: true }] },
    "./bookingCalendarLock": { withBookingCalendarLock: async (_date, _type, action) => action() },
  });
  for (const type of ["inspection", "job"]) {
    rows.length = 0;
    const booking = { leadId: "first", type, date: "2026-10-19", time: "09:00", reference: "test", zone: "flexible",
      ...(type === "job" ? { technicianId: "alex" } : { inspectorId: "alex", assigned: "Alex" }) };
    assert.equal((await createBooking(booking, { staffOverride: true, append: true })).ok, true);
    const customer = await createBooking({ ...booking, leadId: "customer" });
    assert.equal(customer.ok, false);
    assert.equal(rows.length, 1);
    assert.equal((await createBooking({ ...booking, leadId: "staff-override" }, { staffOverride: true, append: true })).ok, true);
    assert.equal(rows.length, 2);
    const late = { ...booking, leadId: "late", time: "23:00", endAt: "2026-10-20T01:00" };
    assert.equal((await createBooking(late)).ok, false);
    assert.equal((await createBooking(late, { staffOverride: true, append: true })).ok, true);
    const appointments = await listAppointmentsBetween("2026-10-19", "2026-10-20", { strict: true });
    assert.equal(appointments.filter(a => a.leadId === "late").reduce((sum, a) => sum + a.scheduledMinutes, 0), 120);
  }
});
