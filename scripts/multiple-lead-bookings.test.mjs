import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { leadBookings, bookingLead } = loadTs("lib/leadBookings.ts");
test("two visits share the lead and financial details, with independent schedules and staff", () => {
  const lead = { id: "lead", jobNo: "JOBNO-1201", quoteAmount: 1500, amountPaid: 500, notes: "Keep", jobAt: "2026-10-20T09:00", technician: "Alex",
    bookings: [{ type: "job", date: "2026-10-20", time: "09:00", technician: "Alex" }, { type: "job", date: "2026-10-21", time: "10:00", technician: "Sam" }] };
  const visits = leadBookings(lead);
  assert.equal(visits.length, 2);
  const second = bookingLead(lead, visits[1]);
  assert.equal(second.id, lead.id);
  assert.equal(second.jobNo, lead.jobNo);
  assert.equal(second.amountPaid, 500);
  assert.equal(second.quoteAmount, 1500);
  assert.equal(second.notes, "Keep");
  assert.equal(second.technician, "Sam");
  assert.equal(lead.technician, "Alex");
  assert.equal(lead.jobAt, "2026-10-20T09:00");
});

function store() {
  const rows = [];
  const matches = (row, query) => Object.entries(query).every(([key, value]) => row[key] === value);
  const col = {
    createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }),
    find: () => ({ toArray: async () => rows }),
    findOne: async query => rows.find(row => matches(row, query)) || null,
    insertOne: async row => { rows.push({ ...row, _id: String(rows.length) }); },
    updateOne: async (query, update) => Object.assign(rows.find(row => matches(row, query)), update.$set),
    deleteOne: async query => { const index = rows.findIndex(row => matches(row, query)); if (index >= 0) rows.splice(index, 1); },
  };
  const db = { collection: name => name === "bookings" ? col : { findOne: async () => null, find: () => ({ project: () => ({ toArray: async () => [] }) }) } };
  const api = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db },
    "./bookingCalendarLock": { withBookingCalendarLock: async (_date, _type, action) => action() },
    "./technicians": { listTechnicians: async () => [{ id: "alex", name: "Alex", active: true }, { id: "sam", name: "Sam", active: true }] },
    "./bookingRulesServer": { getBookingRules: async () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
  });
  const input = { leadId: "lead", type: "job", date: "2026-10-20", time: "09:00", scheduledMinutes: 60, technicianId: "alex", technician: "Alex", reference: "JOBNO-1201", zone: "flexible" };
  return { rows, api, input };
}

test("adding and rescheduling visits retains siblings and their assignments", async () => {
  const { api, rows, input } = store();
  assert.equal((await api.createBooking(input, { append: true, retainPrevious: true, staffOverride: true })).ok, true);
  assert.equal((await api.createBooking({ ...input, time: "11:00", technicianId: "sam", technician: "Sam" }, { append: true, retainPrevious: true, staffOverride: true })).ok, true);
  assert.equal(rows.length, 2);
  assert.equal((await api.createBooking({ ...input, time: "13:00", technicianId: "sam", technician: "Sam" }, { replaceStart: "2026-10-20T11:00", staffOverride: true })).ok, true);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].time, "09:00");
  assert.equal(rows[0].technician, "Alex");
  assert.equal(rows[1].time, "13:00");
});

test("staff can confirm overlapping visits for the same or different technicians", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, retainPrevious: true, staffOverride: true });
  const overlap = await api.createBooking({ ...input, time: "09:30" }, { append: true, retainPrevious: true, staffOverride: true });
  assert.equal(overlap.ok, true);
  const duplicate = await api.createBooking({ ...input, technician: "Sam", technicianId: "sam" }, { append: true, staffOverride: true });
  assert.equal(duplicate.ok, true);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].technician, "Alex");
  assert.equal((await api.createBooking({ ...input, time: "11:00" }, { append: true, retainPrevious: true, staffOverride: true })).ok, true);
  assert.equal(rows.length, 4);
});

test("moving one visit onto a different technician’s start retains both bookings", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, retainPrevious: true, staffOverride: true });
  await api.createBooking({ ...input, time: "11:00", technicianId: "sam", technician: "Sam" }, { append: true, retainPrevious: true, staffOverride: true });
  const result = await api.createBooking({ ...input, time: "11:00" }, { replaceStart: "2026-10-20T09:00", staffOverride: true });
  assert.equal(result.ok, true);
  assert.equal(rows.length, 2);
  assert.equal(rows.find(b => b.technician === "Sam").time, "11:00");
  assert.equal(rows.find(b => b.technician === "Alex").time, "11:00");
});

test("each visit owns its status and rescheduling preserves it", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, staffOverride: true });
  await api.createBooking({ ...input, time: "11:00", technicianId: "sam", technician: "Sam" }, { append: true, staffOverride: true });
  assert.equal(rows[0].status, "Job Booked");
  const sibling = JSON.stringify(rows[1]);
  rows[0].reminderSent = true;
  const result = await api.createBooking({ ...rows[0], status: "Job Done" }, { statusOnly: true, staffOverride: true, replaceStart: "2026-10-20T09:00" });
  assert.equal(result.ok, true);
  assert.equal(rows[0].status, "Job Done");
  assert.equal(rows[0].reminderSent, true);
  assert.equal(JSON.stringify(rows[1]), sibling);
  const moved = await api.createBooking({ ...input, time: "13:00" }, { staffOverride: true, replaceStart: "2026-10-20T09:00" });
  assert.equal(moved.ok, true);
  assert.equal(rows.find(b => b.time === "13:00").status, "Job Done");
  assert.equal(rows.find(b => b.time === "11:00").status, "Job Booked");
});

test("cancelling one visit frees only its slot and staff can confirm reopening despite a conflict", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, staffOverride: true });
  await api.createBooking({ ...input, time: "11:00" }, { append: true, staffOverride: true });
  const change = status => api.createBooking({ ...rows[0], status }, { statusOnly: true, staffOverride: true, replaceStart: "2026-10-20T09:00" });
  assert.equal((await change("Cancelled")).ok, true);
  const appointments = await api.listAppointmentsBetween(input.date, input.date);
  assert.deepEqual(Array.from(appointments, a => a.time), ["11:00"]);
  assert.equal(rows.length, 2, "keep cancelled booking history");
  assert.equal((await api.createBooking({ ...input, leadId: "another-customer" }, { append: true, staffOverride: true })).ok, true);
  assert.equal((await change("Job Booked")).ok, true);
  assert.equal(rows[0].status, "Job Booked");
  rows.pop();
  assert.equal((await change("Job Booked")).ok, true);
});

test("status changes cannot restore a removed visit or overwrite a changed assignment", async () => {
  const { api, rows, input } = store();
  assert.equal((await api.createBooking({ ...input, status: "Job Done" }, { statusOnly: true, staffOverride: true })).ok, false);
  await api.createBooking(input, { append: true, staffOverride: true });
  assert.equal((await api.createBooking({ ...input, technician: "Sam", status: "Job Done" }, { statusOnly: true, staffOverride: true })).ok, false);
  assert.equal(rows[0].technician, "Alex");
  assert.equal(rows[0].status, "Job Booked");
});

test("legacy primary status never leaks into a secondary visit", () => {
  const lead = { id: "lead", status: "Job Done", jobAt: "2026-10-20T09:00", bookings: [
    { type: "job", date: "2026-10-20", time: "09:00" },
    { type: "job", date: "2026-10-21", time: "09:00" },
  ] };
  const visits = leadBookings(lead);
  assert.equal(visits[0].status, "Job Done");
  assert.equal(visits[1].status, "Job Booked");
  const second = bookingLead(lead, visits[1]);
  assert.equal(leadBookings(second)[1].status, "Job Booked");
  assert.equal(second.status, "Job Done", "shared workflow is unchanged");
});


test("multi-day progress persists through booking saves and rescheduling without touching siblings", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, staffOverride: true });
  await api.createBooking({ ...input, time: "11:00" }, { append: true, staffOverride: true });
  const sibling = JSON.stringify(rows[1]);
  assert.equal((await api.createBooking({ ...rows[0], status: "Job In Progress", jobTotalDays: 3, jobDaysDone: 2 },
    { statusOnly: true, staffOverride: true, replaceStart: "2026-10-20T09:00" })).ok, true);
  assert.equal(rows[0].jobDaysDone, 2);
  assert.equal(rows[0].jobTotalDays, 3);
  assert.equal((await api.createBooking({ ...input, time: "13:00" }, { staffOverride: true, replaceStart: "2026-10-20T09:00" })).ok, true);
  assert.equal(rows.find(row => row.time === "13:00").jobDaysDone, 2);
  assert.equal(rows.find(row => row.time === "13:00").jobTotalDays, 3);
  assert.equal(JSON.stringify(rows.find(row => row.time === "11:00")), sibling);
});

test("simultaneous visits keep separate identities, capacity, status and cancellation", async () => {
  const { api, rows, input } = store();
  const options = { append: true, staffOverride: true };
  assert.equal((await api.createBooking({ ...input, endAt: "2026-10-21T17:00" }, options)).ok, true);
  assert.equal((await api.createBooking({ ...input, technicianId: "sam", technician: "Sam", endAt: "2026-10-21T17:00" }, options)).ok, true);
  const first = { ...rows[0] }, second = { ...rows[1] };
  assert.notEqual(first.bookingId, second.bookingId);
  let appointments = await api.listAppointmentsBetween(input.date, "2026-10-21");
  assert.equal(appointments.length, 4, "both multi-day visits appear on both days");
  const { appointmentKey } = loadTs("lib/scheduleRoutes.ts");
  assert.equal(new Set(appointments.map(appointmentKey)).size, 4);
  const conflict = await api.createBooking({ ...input, leadId: "other", date: "2026-10-21", time: "10:00" }, options);
  assert.equal(conflict.ok, true, "staff can override an occupied continuation day");
  rows.pop(); // Keep subsequent identity/cancellation assertions focused on the original visits.
  const cancel = await api.createBooking({ ...first, status: "Cancelled" }, { statusOnly: true, bookingId: first.bookingId, replaceStart: `${input.date}T${input.time}`, staffOverride: true });
  assert.equal(cancel.ok, true);
  assert.equal(rows[1].status, "Job Booked");
  appointments = await api.listAppointmentsBetween(input.date, "2026-10-21");
  assert.equal(appointments.length, 2);
  assert.ok(appointments.every(a => a.bookingId === second.bookingId));
  const reopen = await api.createBooking({ ...rows[0], status: "Job Booked" }, { statusOnly: true, bookingId: first.bookingId, replaceStart: `${input.date}T${input.time}`, staffOverride: true });
  assert.equal(reopen.ok, true);
  const sibling = JSON.stringify(rows[1]);
  const move = await api.createBooking({ ...input, time: "10:00", endAt: "2026-10-20T11:00" }, { bookingId: first.bookingId, replaceStart: `${input.date}T${input.time}`, staffOverride: true });
  assert.equal(move.ok, true);
  assert.equal(JSON.stringify(rows.find(b => b.bookingId === second.bookingId)), sibling);
  assert.equal(rows.find(b => b.bookingId === first.bookingId).time, "10:00");
});

test("same-start projections have distinct row keys and keep primary status on its technician", () => {
  const { jobBookingRows, leadRowKey, selectedJobBooking } = loadTs("lib/leadBookings.ts");
  const lead = { id: "lead", status: "Job Done", jobAt: "2026-10-20T09:00", technicianId: "alex", technician: "Alex", bookings: [
    { bookingId: "first", type: "job", date: "2026-10-20", time: "09:00", technicianId: "alex", technician: "Alex" },
    { bookingId: "second", type: "job", date: "2026-10-20", time: "09:00", technicianId: "sam", technician: "Sam" },
  ] };
  const rows = jobBookingRows(lead);
  assert.equal(new Set(rows.map(leadRowKey)).size, 2);
  assert.equal(rows[0].status, "Job Done");
  assert.equal(rows[1].status, "Job Booked");
  assert.equal(selectedJobBooking(rows[1]).bookingId, "second");
});
