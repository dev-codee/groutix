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

test("same-customer bookings still prevent staff overlaps and duplicate starts cannot overwrite a visit", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, retainPrevious: true, staffOverride: true });
  const overlap = await api.createBooking({ ...input, time: "09:30" }, { append: true, retainPrevious: true, staffOverride: true });
  assert.equal(overlap.ok, false);
  assert.match(overlap.error, /overlapping/);
  const duplicate = await api.createBooking({ ...input, technician: "Sam", technicianId: "sam" }, { append: true, staffOverride: true });
  assert.equal(duplicate.ok, false);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].technician, "Alex");
  assert.equal((await api.createBooking({ ...input, time: "11:00" }, { append: true, retainPrevious: true, staffOverride: true })).ok, true);
  assert.equal(rows.length, 2);
});

test("moving one visit onto a sibling start cannot overwrite the sibling", async () => {
  const { api, rows, input } = store();
  await api.createBooking(input, { append: true, retainPrevious: true, staffOverride: true });
  await api.createBooking({ ...input, time: "11:00", technicianId: "sam", technician: "Sam" }, { append: true, retainPrevious: true, staffOverride: true });
  const result = await api.createBooking({ ...input, time: "11:00" }, { replaceStart: "2026-10-20T09:00", staffOverride: true });
  assert.equal(result.ok, false);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].technician, "Sam");
});
