import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
import { ObjectId } from "mongodb";

const { DEFAULT_BOOKING_RULES: rules } = loadTs("lib/bookingRules.ts");
const { bookingAvailability, techniciansOnDate } = loadTs("lib/bookingCapacity.ts");
const { applyBookingCapacity } = loadTs("lib/bookingAvailabilityDays.ts");
const { validateTechnicianSchedule } = loadTs("lib/technicianAvailability.ts");
const roster = [{ id: "all", name: "Everyday", active: true }, { id: "weekend", name: "Weekend", active: true, workDays: [0, 6] }];
const date = "2026-10-10";
const job = { leadId: "first", date, time: "09:00", type: "job", technicianId: "all", durationMinutes: 180 };
const candidate = { ...job, leadId: "next", technicianId: undefined, durationMinutes: 60 };

test("one weekday technician permits one job; two weekend technicians permit two", () => {
  assert.equal(techniciansOnDate(roster, "2026-10-09").length, 1);
  assert.equal(techniciansOnDate(roster, date).length, 2);
  assert.equal(bookingAvailability([job], candidate, rules, roster).available, true);
  assert.equal(bookingAvailability([job, { ...job, leadId: "second", technicianId: "weekend" }], candidate, rules, roster).available, false);
  assert.equal(bookingAvailability([{ ...job, date: "2026-10-09", time: "10:00" }], { ...candidate, date: "2026-10-09", time: "10:00" }, rules, roster).available, false);
});

test("adding a third technician expands capacity automatically", () => {
  const bookings = [job, { ...job, leadId: "second", technicianId: "weekend" }];
  assert.equal(bookingAvailability(bookings, candidate, rules, [...roster, { id: "third", name: "New technician", active: true }]).remaining, 1);
});

test("date exceptions override weekdays, while inactive technicians never add capacity", () => {
  const tech = { ...roster[1], dateOverrides: { "2026-10-10": false, "2026-10-09": true } };
  assert.equal(techniciansOnDate([tech], date).length, 0);
  assert.equal(techniciansOnDate([tech], "2026-10-09").length, 1);
  assert.equal(techniciansOnDate([{ ...tech, active: false }], "2026-10-09").length, 0);
  assert.equal(techniciansOnDate([{ ...tech, workDays: [], dateOverrides: {} }], date).length, 0);
});

test("booking pages honor one-hour windows and days without technicians", () => {
  const day = { date, label: "Saturday", weekday: "Saturday", times: ["09:00", "10:00", "12:00", "16:00"], slots: ["09:00", "10:00", "12:00", "16:00"].map((time) => ({ time, booked: false })), recommended: false };
  assert.equal(applyBookingCapacity([day], [], candidate, rules, [])[0].times.length, 0);
  const output = applyBookingCapacity([day], [job], { ...candidate, technicianId: "all", durationMinutes: 120 }, rules, roster)[0];
  assert.deepEqual(Array.from(output.times), ["10:00", "12:00", "16:00"]);
  assert.equal(output.slots.find((slot) => slot.time === "09:00").remaining, 0);
  assert.equal(applyBookingCapacity([day], [job], candidate, rules, roster)[0].slots[0].remaining, 1);
});

test("work estimates do not block later booking windows", () => {
  const bookings = [job, { ...job, leadId: "other", technicianId: "weekend", time: "12:00", durationMinutes: 120 }];
  const long = { ...candidate, time: "11:00", durationMinutes: 120 };
  assert.equal(bookingAvailability(bookings, long, rules, roster).available, true);
  assert.equal(bookingAvailability(bookings, { ...long, technicianId: "weekend" }, rules, roster).available, true);
});

test("invalid weekdays and malformed exception dates are rejected", () => {
  for (const workDays of [[7], [-1], [1.5], ["1"], "weekends"]) assert.ok(validateTechnicianSchedule({ workDays }));
  assert.ok(validateTechnicianSchedule({ dateOverrides: { "2026-02-30": true } }));
  assert.ok(validateTechnicianSchedule({ dateOverrides: { "2026-10-09": "yes" } }));
  assert.equal(validateTechnicianSchedule({ workDays: [], dateOverrides: { [date]: false } }), null);
});

function technicianStore({ linked = false } = {}) {
  const rosterId = new ObjectId();
  const userId = new ObjectId();
  const docs = linked ? [{ _id: rosterId, name: "Tech", email: "tech@example.com", active: true, workDays: [6], createdAt: new Date() }] : [];
  const users = [{ _id: userId, name: "Tech", email: "tech@example.com", username: "tech", active: true, role: "technician", createdAt: new Date() }];
  const calls = [];
  const col = { find: () => ({ sort: () => ({ toArray: async () => docs }) }), findOne: async ({ _id }) => docs.find((doc) => doc._id.equals(_id)), updateOne: async (...args) => { calls.push(["technicians", ...args]); return { matchedCount: 1 }; } };
  const staff = { find: () => ({ toArray: async () => users }), updateOne: async (...args) => { calls.push(["admin_users", ...args]); return { matchedCount: 1 }; } };
  const api = loadTs("lib/technicians.ts", { "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({ collection: (name) => name === "technicians" ? col : staff }) } });
  return { api, calls, rosterId, userId };
}

test("portal-only technician availability can be edited without disabling login", async () => {
  const { api, calls, userId } = technicianStore();
  assert.equal((await api.updateTechnician(userId.toString(), { workDays: [6, 0], dateOverrides: { [date]: false }, active: false })).ok, true);
  assert.equal(calls[0][0], "admin_users");
  assert.equal(calls[0][2].$set.jobSchedulingActive, false);
  assert.equal(calls[0][2].$set.active, undefined);
  assert.deepEqual(Array.from(calls[0][2].$set.workDays), [0, 6]);
});

test("linked roster/login accounts count once and both IDs edit the same schedule", async () => {
  const { api, calls, userId, rosterId } = technicianStore({ linked: true });
  const technicians = await api.listTechnicians();
  assert.equal(technicians.length, 1);
  assert.equal(technicians[0].id, rosterId.toString());
  assert.ok(technicians[0].aliases.includes(userId.toString()));
  assert.equal((await api.updateTechnician(userId.toString(), { workDays: null })).ok, true);
  assert.equal(calls[0][0], "technicians");
  assert.equal(calls[0][2].$unset.workDays, "");
});

test("the customer API rereads roster changes and closes days with zero technicians", async () => {
  let technicians = [];
  const lead = { id: "customer", status: "Quote Sent", name: "Customer", address: "Gowanbrae VIC 3043", inspectionReport: { estimatedTime: "2.5 hours" } };
  const api = loadTs("app/api/book/[id]/route.ts", {
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/submissions": { getSubmission: async () => lead },
    "@/lib/bookingToken": { verifyBookingToken: () => true },
    "@/lib/bookings": { listUpcomingBookings: async () => [] },
    "@/lib/bookingRulesServer": { getBookingRules: async () => ({ ...rules, minDate: "", horizonDays: 7 }) },
    "@/lib/zoneRulesServer": { getZoneRules: async () => loadTs("lib/zoneRules.ts").DEFAULT_ZONE_RULES },
    "@/lib/technicians": { listTechnicians: async () => technicians },
    "@/lib/email": {}, "@/lib/sms": {},
  });
  const get = () => api.GET({ nextUrl: new URL("https://groutix.test/api/book/customer?type=job&token=test") }, { params: Promise.resolve({ id: "customer" }) });
  const empty = await get();
  assert.equal(empty.status, 200);
  assert.ok(empty.body.days.length > 0);
  assert.ok(empty.body.days.every((day) => day.times.length === 0 && day.slots.every((slot) => slot.booked)));
  technicians = roster;
  const dynamic = await get();
  assert.equal(dynamic.body.durationMinutes, 60);
  for (const day of dynamic.body.days) {
    const count = techniciansOnDate(roster, day.date).length;
    assert.equal(day.slots[0].booked, count === 0);
    assert.equal(day.times.length > 0, count > 0);
    assert.equal(day.slots[0].capacity, undefined);
    assert.equal(day.slots[0].remaining, undefined);
  }
  technicians = [...roster, { id: "third", name: "New technician", active: true }];
  const expanded = await get();
  assert.ok(expanded.body.days.every((day) => day.times.length > 0 && day.slots.every((slot) => !slot.booked)));
});

test("unassigned capacity follows the working roster on weekdays and weekends", () => {
  const technicians = Array.from({ length: 4 }, (_, i) => ({ id: String(i), name: `Tech ${i}`, active: true }));
  for (const date of ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]) {
    const limit = technicians.length;
    const candidate = { date, time: "10:00", type: "job", leadId: "new" };
    const appointments = Array.from({ length: limit }, (_, i) => ({ ...candidate, leadId: `booking-${i}` }));
    assert.equal(bookingAvailability(appointments.slice(0, 1), candidate, rules, technicians).available, true);
    assert.equal(bookingAvailability(appointments.slice(0, limit - 1), candidate, rules, technicians).remaining, 1);
    assert.equal(bookingAvailability(appointments, candidate, rules, technicians).available, false);
    assert.equal(bookingAvailability(appointments, { ...candidate, time: "11:00" }, rules, technicians).remaining, limit);
  }
});


test("different assigned inspectors can overlap; the same inspector cannot", () => {
  const inspection = { leadId: "first", type: "inspection", date: "2026-10-12", time: "09:00", scheduledMinutes: 180, inspectorId: "inspector-a", assigned: "Alex" };
  const candidate = { ...inspection, leadId: "second", time: "10:00", scheduledMinutes: 60 };
  assert.equal(bookingAvailability([inspection], candidate, rules, roster).available, false);
  assert.equal(bookingAvailability([inspection], { ...candidate, inspectorId: "inspector-b", assigned: "Bob" }, rules, roster).available, true);
  assert.equal(bookingAvailability([inspection], { ...candidate, time: "12:00" }, rules, roster).available, true);
});
test("one person cannot overlap inspections and jobs, including on the same lead", () => {
  const technicians = [{ id: "tech-a", name: "Alex", username: "alex", aliases: ["user-a"], active: true }, { id: "tech-b", name: "Bob", active: true }];
  const inspection = { leadId: "same-lead", type: "inspection", date: "2026-10-12", time: "09:00", scheduledMinutes: 120, inspectorId: "user-a", assigned: "Alex" };
  const job = { leadId: "same-lead", type: "job", date: inspection.date, time: "10:00", technicianId: "tech-a" };
  assert.equal(bookingAvailability([inspection], job, rules, technicians).available, false);
  assert.equal(bookingAvailability([job], inspection, rules, technicians).available, false);
  assert.equal(bookingAvailability([inspection], { ...job, technicianId: "tech-b" }, rules, technicians).available, true);
  assert.equal(bookingAvailability([inspection], inspection, rules, technicians).available, true);
});
test("four different working people can share the same weekday start", () => {
  const technicians = Array.from({ length: 4 }, (_, i) => ({ id: String(i), name: `Tech ${i}`, active: true }));
  const candidate = { leadId: "new", type: "job", date: "2026-10-12", time: "10:00", technicianId: "3" };
  const bookings = technicians.slice(0, 3).map(tech => ({ ...candidate, leadId: tech.id, technicianId: tech.id }));
  assert.equal(bookingAvailability(bookings, candidate, rules, technicians).available, true);
  assert.equal(bookingAvailability(bookings, { ...candidate, technicianId: "0" }, rules, technicians).available, false);
});

test("simultaneous inspection and job reservations share the same date lock", async () => {
  const held = new Set(); let inside = 0, peak = 0;
  const collection = { updateOne: async query => { if (held.has(query._id)) throw { code: 11000 }; held.add(query._id); }, deleteOne: async query => { held.delete(query._id); } };
  const { withBookingCalendarLock } = loadTs("lib/bookingCalendarLock.ts", { "./mongodb": { getDb: async () => ({ collection: () => collection }) } });
  const action = async () => { inside++; peak = Math.max(peak, inside); await new Promise(resolve => setTimeout(resolve, 10)); inside--; };
  await Promise.all([withBookingCalendarLock("2026-10-12", "inspection", action), withBookingCalendarLock("2026-10-12", "job", action)]);
  assert.equal(peak, 1);
  assert.equal(held.size, 0);
});
