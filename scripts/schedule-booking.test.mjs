import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const json = (body, options = {}) => ({ body, status: options.status || 200 });
function patchApi({ conflict = false, conflictType, updateFails = false, appointments = [], before = {}, messaging = false, smsFails = false } = {}) {
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
      createBooking: async (...args) => { calls.push(["reserve", ...args]); return conflict || conflictType === args[0].type ? { ok: false, conflict: true, error: "Slot taken" } : { ok: true, acquired: true }; },
      releaseBookingSlot: async (...args) => calls.push(["release", ...args]),
      deleteBooking: async (...args) => calls.push(["delete", ...args]),
    },
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "manager" }) },
    "@/lib/automations": {},
    "@/lib/bookingRulesServer": { getBookingRules: async () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
    "@/lib/email": { sendEmail: async args => { calls.push(["email", args]); }, sendInternalAlert: noop, getEmailLogoUrl: noop, wrapEmailHtml: value => value, isEmailConfigured: () => messaging },
    "@/lib/sms": { isSmsConfigured: () => messaging, prepareSinglePartSms: value => value, sendSms: async args => { calls.push(["sms", args]); return { ok: !smsFails }; } },
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
  for (const value of ["2026-02-30T09:00", "2026-10-08T25:00", 123, {}, []]) {
    const { patch, calls } = patchApi();
    assert.equal((await patch({ inspectionAt: value })).status, 400);
    assert.equal(calls.length, 0);
  }
});

test("inspection edits save when the untouched job date is null", async () => {
  const { patch, calls } = patchApi({ before: { inspectionAt: "2026-10-14T10:00", jobAt: null } });
  assert.equal((await patch({ inspectionAt: "2026-10-15T11:30", jobAt: null, notes: "Customer requested later time" })).status, 200);
  const saved = calls.find(([action]) => action === "update")[2];
  assert.equal(saved.inspectionAt, "2026-10-15T11:30");
  assert.equal(saved.jobAt, "");
  assert.equal(saved.notes, "Customer requested later time");
  assert.equal(calls.some(([action, , type]) => action === "delete" && type === "job"), false);
});

test("a legacy appointment with seconds is unchanged and does not recheck capacity or notify", async () => {
  const { patch, calls } = patchApi({ conflict: true, before: { inspectionAt: "2026-10-14T10:00:00", jobAt: "2026-10-15T09:00:00" } });
  assert.equal((await patch({ inspectionAt: "2026-10-14T10:00", jobAt: "2026-10-15T09:00", notes: "Updated notes" })).status, 200);
  assert.equal(calls.some(([action]) => action === "reserve"), false);
  assert.equal(calls.some(([action]) => action === "delete"), false);
});

test("clearing an appointment using null releases that booking", async () => {
  const { patch, calls } = patchApi({ before: { inspectionAt: "2026-10-14T10:00" } });
  assert.equal((await patch({ inspectionAt: null })).status, 200);
  assert.equal(calls.find(([action]) => action === "update")[2].inspectionAt, "");
  assert.deepEqual(Array.from(calls.find(([action]) => action === "delete")), ["delete", "lead", "inspection"]);
});

test("editing both dates does not partially save if the job time is unavailable", async () => {
  const { patch, calls } = patchApi({ conflictType: "job" });
  const response = await patch({ inspectionAt: "2026-10-14T11:00", jobAt: "2026-10-15T09:00" });
  assert.equal(response.status, 409);
  assert.equal(response.body.error, "Slot taken");
  assert.equal(calls.some(([action]) => action === "update"), false);
  assert.deepEqual(Array.from(calls.find(([action]) => action === "release")).slice(0, 5), ["release", "lead", "inspection", "2026-10-14", "11:00"]);
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


test("reassignment checks its booking without passing work estimates as duration", async () => {
  const { patch, calls } = patchApi({ before: { jobAt: "2026-10-09T09:00", technicianId: "old", inspectionReport: { estimatedTime: "4–6 hrs" } } });
  assert.equal((await patch({ technicianId: "new" })).status, 200);
  const reservation = calls.find(([action]) => action === "reserve")[1];
  assert.equal(reservation.durationMinutes, undefined);
  assert.equal(reservation.technicianId, "new");
  assert.equal(calls[0][0], "reserve");
});

test("changing estimated work hours does not reserve additional booking slots", async () => {
  const { patch, calls } = patchApi({ conflict: true, before: { jobAt: "2026-10-09T09:00", inspectionReport: { estimatedTime: "1" } } });
  assert.equal((await patch({ inspectionReport: { estimatedTime: "3.5 hours" } })).status, 200);
  assert.equal(calls.some(([action]) => action === "reserve"), false);
  assert.equal(calls.find(([action]) => action === "update")[2].inspectionReport.estimatedTime, "3.5 hours");
});


test("confirmed new bookings notify only after a successful reservation and lead save", async () => {
  const { patch, calls } = patchApi({ messaging: true, before: { email: "customer@example.com", phone: "0400000000" } });
  const result = await patch({ inspectionAt: "2026-10-14T10:15", bookingNotifications: true });
  assert.equal(result.status, 200);
  assert.equal(result.body.notificationWarnings.length, 0);
  assert.equal(calls.filter(c => c[0] === "email").length, 1);
  assert.equal(calls.filter(c => c[0] === "sms").length, 1);
  assert.ok(calls.findIndex(c => c[0] === "email") > calls.findIndex(c => c[0] === "update"));
  assert.equal(calls.find(c => c[0] === "update")[2].bookingNotifications, undefined);
});

test("conflicts never notify and notification failure does not undo a saved booking", async () => {
  const blocked = patchApi({ conflict: true, messaging: true });
  assert.equal((await blocked.patch({ jobAt: "2026-10-14T10:15", bookingNotifications: true })).status, 409);
  assert.equal(blocked.calls.some(c => c[0] === "email" || c[0] === "sms"), false);
  const failure = patchApi({ messaging: true, smsFails: true, before: { email: "customer@example.com", phone: "0400000000" } });
  const result = await failure.patch({ jobAt: "2026-10-14T10:15", bookingNotifications: true });
  assert.equal(result.status, 200);
  assert.match(result.body.notificationWarnings.join(" "), /SMS failed/);
});

test("rescheduling sends reschedule messages once and unchanged bookings send nothing", async () => {
  const changed = patchApi({ messaging: true, before: { inspectionAt: "2026-10-14T09:00", email: "customer@example.com", phone: "0400000000" } });
  await changed.patch({ inspectionAt: "2026-10-14T10:15", bookingNotifications: true });
  assert.equal(changed.calls.filter(c => c[0] === "email").length, 1);
  assert.match(changed.calls.find(c => c[0] === "email")[1].subject, /Rescheduled/);
  const same = patchApi({ messaging: true, before: { inspectionAt: "2026-10-14T09:00", email: "customer@example.com", phone: "0400000000" } });
  await same.patch({ inspectionAt: "2026-10-14T09:00", bookingNotifications: true });
  assert.equal(same.calls.some(c => c[0] === "email" || c[0] === "sms"), false);
});


test("end-only edits reserve additional capacity and notify the customer after saving", async () => {
  const { patch, calls } = patchApi({ messaging: true, before: { jobAt: "2026-10-14T09:00", jobEndAt: "2026-10-14T10:00", email: "customer@example.com", phone: "0400000000" } });
  const result = await patch({ jobEndAt: "2026-10-14T13:00", bookingNotifications: true });
  assert.equal(result.status, 200);
  assert.equal(calls.find(c => c[0] === "reserve")[1].endAt, "2026-10-14T13:00");
  assert.equal(calls.filter(c => c[0] === "email").length, 1);
  assert.match(calls.find(c => c[0] === "email")[1].html, /13:00/);
});
test("invalid end dates cannot change a saved booking", async () => {
  const { patch, calls } = patchApi();
  const result = await patch({ jobAt: "2026-10-14T10:00", jobEndAt: "2026-10-14T09:00" });
  assert.equal(result.status, 400);
  assert.equal(calls.some(c => c[0] === "update" || c[0] === "reserve"), false);
});
