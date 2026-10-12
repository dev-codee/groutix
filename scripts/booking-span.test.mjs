import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { bookingSegments, bookingEndForDuration } = loadTs("lib/bookingSpan.ts");
const { bookingAvailability } = loadTs("lib/bookingCapacity.ts");
const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const rules = structuredClone(DEFAULT_BOOKING_RULES);
for (const type of ["job", "inspection"]) rules[type].days = Array.from({ length: 7 }, (_, day) => ({ open: day >= 1 && day <= 5, start: "09:00", end: "17:00" }));
const techs = [{ id: "alex", name: "Alex", active: true, workDays: [1,2,3,4,5] }];

test("duration rolls across nights, weekends and closed dates using working hours", () => {
  assert.equal(bookingEndForDuration("job", "2026-10-16T15:00", 600, rules), "2026-10-19T17:00");
  const closed = { ...rules, closedDates: [{ date: "2026-10-19", label: "Holiday" }] };
  assert.equal(bookingEndForDuration("job", "2026-10-16T15:00", 600, closed), "2026-10-20T17:00");
  const segments = bookingSegments("job", "2026-10-16T15:00", "2026-10-19T12:30", rules);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].scheduledMinutes, 120);
  assert.equal(segments[1].scheduledMinutes, 210);
});
test("explicit hours occupy the full window and allow back-to-back work", () => {
  const existing = { leadId: "old", type: "job", technicianId: "alex", ...bookingSegments("job", "2026-10-12T09:00", "2026-10-12T13:00", rules)[0] };
  const next = { leadId: "new", type: "job", date: "2026-10-12", time: "12:30", technicianId: "alex" };
  assert.equal(bookingAvailability([existing], next, rules, techs).available, false);
  assert.equal(bookingAvailability([existing], { ...next, time: "13:00" }, rules, techs).available, true);
});
test("invalid, reversed, excessively long and multi-day inspection ranges are rejected", () => {
  for (const end of ["2026-10-12T08:00", "2026-10-12T18:00", "2026-02-30T12:00", "2027-01-01T12:00"]) {
    assert.throws(() => bookingSegments("job", "2026-10-12T09:00", end, rules));
  }
  assert.throws(() => bookingSegments("inspection", "2026-10-12T09:00", "2026-10-13T12:00", rules));
  assert.throws(() => bookingEndForDuration("job", "2026-10-12T09:00", -1, rules));
});

test("reservation locks every occupied day and a later-day conflict writes nothing", async () => {
  const acquired = [], inserted = [];
  const locks = [{ leadId: "other", type: "job", date: "2026-10-13", time: "09:00", endAt: "2026-10-13T12:00", technicianId: "alex" }];
  const col = { createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }),
    find: () => ({ toArray: async () => locks }), findOne: async () => null,
    insertOne: async row => inserted.push(row), deleteMany: async () => {} };
  const db = { collection: name => name === "bookings" ? col : { findOne: async () => null, find: () => ({ project: () => ({ toArray: async () => [] }) }) } };
  const api = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db },
    "./bookingRulesServer": { getBookingRules: async () => rules },
    "./technicians": { listTechnicians: async () => techs },
    "./bookingCalendarLock": { withBookingCalendarLock: async (date, type, action) => { acquired.push(date); return action(); } },
  });
  const result = await api.createBooking({ leadId: "new", type: "job", date: "2026-10-12", time: "15:00", endAt: "2026-10-13T12:00", technicianId: "alex", reference: "test", zone: "flexible" });
  assert.equal(result.ok, false);
  assert.match(result.error, /2026-10-13/);
  assert.deepEqual(acquired, ["2026-10-12", "2026-10-13"]);
  assert.equal(inserted.length, 0);
  locks.length = 0;
  assert.equal((await api.createBooking({ leadId: "new", type: "job", date: "2026-10-12", time: "15:00", endAt: "2026-10-13T12:00", technicianId: "alex", reference: "test", zone: "flexible" })).ok, true);
  assert.equal(inserted[0].endAt, "2026-10-13T12:00");
});

test("a job starting before the visible range still occupies later days, using saved working windows", async () => {
  const job = { _id: { toString: () => "lead" }, name: "Customer", status: "Job Booked", jobAt: "2026-10-12T15:00", jobEndAt: "2026-10-13T12:00", jobWorkSegments: [{ date: "2026-10-12", time: "15:00", scheduledMinutes: 120 }, { date: "2026-10-13", time: "09:00", scheduledMinutes: 180 }], technicianId: "alex" };
  const col = { createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }), find: () => ({ toArray: async () => [] }) };
  const db = { collection: name => name === "bookings" ? col : { find: () => ({ project: () => ({ toArray: async () => [job] }) }) } };
  const api = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db },
    "./bookingRulesServer": { getBookingRules: async () => ({ ...rules, minDate: "2026-11-01" }) },
  });
  const result = await api.listAppointmentsBetween("2026-10-13", "2026-10-13", { strict: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].date, "2026-10-13");
  assert.equal(result[0].scheduledMinutes, 180);
});
