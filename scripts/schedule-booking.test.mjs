import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const json = (body, options = {}) => ({ body, status: options.status || 200 });
function patchApi({ conflict = false, updateFails = false, appointments = [], before = {} } = {}) {
  const calls = [];
  const lead = { id: "lead", status: "New", name: "Customer", ...before };
  const noop = async () => {};
  const api = loadTs("app/api/admin/submissions/[id]/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/mongodb": { isMongoConfigured: () => true },
    "@/lib/submissions": {
      getSubmission: async () => lead,
      updateSubmission: async (...args) => { calls.push(["update", ...args]); if (updateFails) throw new Error("write failed"); return true; },
      appendActivity: noop, deleteSubmission: noop,
    },
    "@/lib/bookings": {
      listAppointmentsOnDate: async () => appointments,
      createBooking: async (...args) => { calls.push(["reserve", ...args]); return conflict ? { ok: false, conflict: true, error: "Slot taken" } : { ok: true, acquired: true }; },
      releaseBookingSlot: async (...args) => calls.push(["release", ...args]),
      deleteBooking: async (...args) => calls.push(["delete", ...args]),
    },
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "manager" }) },
    "@/lib/automations": {},
    "@/lib/email": { sendEmail: noop, sendInternalAlert: noop, getEmailLogoUrl: noop, wrapEmailHtml: () => "", isEmailConfigured: () => false },
    "@/lib/sms": { isSmsConfigured: () => false },
    "@/lib/zoneRulesServer": { getZoneRules: async () => loadTs("lib/zoneRules.ts").DEFAULT_ZONE_RULES },
    "@/lib/technicians": {}, "@/lib/users": {},
  });
  return { calls, patch: (body) => api.PATCH({ json: async () => body, cookies: { get: () => ({ value: "token" }) } }, { params: Promise.resolve({ id: "lead" }) }) };
}

test("a competing slot reservation returns conflict before changing the lead", async () => {
  const { patch, calls } = patchApi({ conflict: true, before: { inspectionAt: "2026-10-08T09:00" } });
  assert.equal((await patch({ inspectionAt: "2026-10-09T10:00:00" })).status, 409);
  assert.equal(calls.some(([action]) => action === "update"), false);
  assert.equal(calls[0][2].retainPrevious, true);
});

test("inspection and job pools can share a start time", async () => {
  const { patch, calls } = patchApi({ appointments: [{ leadId: "lead", type: "job", time: "09:00" }] });
  assert.equal((await patch({ inspectionAt: "2026-10-08T09:00" })).status, 200);
  assert.equal(calls[0][0], "reserve");
});

test("failed lead writes release only the newly acquired slot", async () => {
  const { patch, calls } = patchApi({ updateFails: true, before: { inspectionAt: "2026-10-08T09:00" } });
  assert.equal((await patch({ inspectionAt: "2026-10-09T10:00" })).status, 500);
  assert.deepEqual(Array.from(calls.find(([action]) => action === "release")).slice(0, 5), ["release", "lead", "inspection", "2026-10-09", "10:00"]);
  assert.equal(calls.some(([action]) => action === "delete"), false);
});

test("booking removal clears the appointment and releases its slot", async () => {
  const { patch, calls } = patchApi({ before: { jobAt: "2026-10-08T09:00" } });
  assert.equal((await patch({ jobAt: "" })).status, 200);
  assert.equal(calls.find(([action]) => action === "update")[2].jobAt, "");
  assert.deepEqual(Array.from(calls.find(([action]) => action === "delete")), ["delete", "lead", "job"]);
});

test("invalid appointment dates never update a lead", async () => {
  for (const value of ["2026-02-30T09:00", "2026-10-08T25:00", null]) {
    const { patch, calls } = patchApi();
    assert.equal((await patch({ inspectionAt: value })).status, 400);
    assert.equal(calls.length, 0);
  }
});

test("booking store retains the prior reservation until the lead write commits", async () => {
  const deletes = [];
  const col = {
    createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }),
    find: () => ({ toArray: async () => [] }),
    findOne: async () => null, insertOne: async () => {}, updateOne: async () => {},
    deleteMany: async (query) => deletes.push(query),
  };
  const db = { collection: (name) => name === "bookings" ? col : { findOne: async () => null, find: () => ({ project: () => ({ toArray: async () => [] }) }) } };
  const api = loadTs("lib/bookings.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => db },
    "./bookingCalendarLock": { withBookingCalendarLock: async (_date, _type, action) => action() },
    "./technicians": { listTechnicians: async () => [{ id: "tech", name: "Technician", active: true }] },
    "./bookingRulesServer": { getBookingRules: async () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
  });
  const slot = { leadId: "lead", type: "job", date: "2026-10-08", time: "10:00", reference: "ref", zone: "flexible" };
  assert.equal((await api.createBooking(slot, { retainPrevious: true })).ok, true);
  assert.equal(deletes.length, 0);
  col.findOne = async () => slot;
  assert.equal((await api.createBooking(slot)).ok, true);
  assert.equal(deletes.length, 1);
  assert.equal(deletes[0].type, "job");
});


test("reassignment reserves the full inspection estimate before updating the technician", async () => {
  const { patch, calls } = patchApi({ before: { jobAt: "2026-10-09T09:00", technicianId: "old", inspectionReport: { estimatedTime: "4–6 hrs" } } });
  assert.equal((await patch({ technicianId: "new" })).status, 200);
  const reservation = calls.find(([action]) => action === "reserve")[1];
  assert.equal(reservation.durationMinutes, 360);
  assert.equal(reservation.technicianId, "new");
  assert.equal(calls[0][0], "reserve");
});

test("changing estimated hours on a scheduled job rechecks capacity before saving", async () => {
  const { patch, calls } = patchApi({ conflict: true, before: { jobAt: "2026-10-09T09:00", inspectionReport: { estimatedTime: "1" } } });
  assert.equal((await patch({ inspectionReport: { estimatedTime: "3.5 hours" } })).status, 409);
  assert.equal(calls.find(([action]) => action === "reserve")[1].durationMinutes, 210);
  assert.equal(calls.some(([action]) => action === "update"), false);
});
