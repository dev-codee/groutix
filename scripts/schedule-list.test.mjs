import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { loadTs } from "./test-ts-loader.mjs";

const { scheduleListDetails, scheduleDistanceLabel } = loadTs("lib/scheduleList.ts");
const stop = (id, address, assignment = {}, date = "2026-10-24") => ({
  id, date, time: "09:00", type: "inspection", customer: { name: id, address }, ...assignment,
});

test("travel follows the same person across booking types in supplied visit order and resets each day", () => {
  const entries = [
    stop("first", "Ringwood", { assigned: "Alex" }),
    stop("other", "Keilor", { assigned: "Sam" }),
    stop("second", "Croydon", { type: "job", technicianId: "alex-id" }),
    stop("tomorrow", "Croydon", { assigned: "Alex" }, "2026-10-25"),
  ];
  const details = scheduleListDetails(entries, [{ id: "alex-id", name: "Alex", active: true }]);
  assert.equal(details.get("second").previous.id, "first");
  assert.equal(details.get("second").assignee, "Alex");
  assert.equal(details.get("other").previous, undefined);
  assert.equal(details.get("tomorrow").previous, undefined);
  assert.match(scheduleDistanceLabel(details.get("first")), /Gowanbrae base/);
  assert.match(scheduleDistanceLabel(details.get("second")), /from first/);
  assert.ok(details.get("second").km > 0);
  // Display filtering must use the details computed from the complete route.
  assert.equal(entries.filter(entry => entry.id === "second").map(entry => details.get(entry.id).previous.id)[0], "first");
});

test("unassigned appointments show base distances without forming a shared route or using the wrong role", () => {
  const entries = [stop("a", "Ringwood", { technician: "Alex" }), stop("b", "Keilor", { assigned: "Unassigned" })];
  for (const detail of scheduleListDetails(entries).values()) {
    assert.equal(detail.assignee, "Unassigned");
    assert.ok(detail.km > 0);
    assert.equal(detail.previous, undefined);
    assert.match(scheduleDistanceLabel(detail), /km from Gowanbrae base/);
  }
});

test("unassigned bookings do not change an assigned person's previous stop", () => {
  const details = scheduleListDetails([
    stop("first", "Ringwood", { assigned: "Alex" }),
    stop("unassigned", "Keilor"),
    stop("second", "Croydon", { assigned: "Alex" }),
  ]);
  assert.equal(details.get("second").previous.id, "first");
  assert.equal(details.get("unassigned").previous, undefined);
  assert.match(scheduleDistanceLabel(details.get("unassigned")), /km from Gowanbrae base/);
  const unknown = scheduleListDetails([stop("unknown", "Unknown address")]).get("unknown");
  assert.equal(unknown.km, null);
  assert.match(scheduleDistanceLabel(unknown), /Distance unavailable from Gowanbrae base/);
});

test("unknown locations are not skipped and zero distance remains valid", () => {
  const entries = [stop("a", "Ringwood", { assigned: "Alex" }), stop("b", "Ringwood", { assigned: "alex" }),
    stop("unknown", "Unknown address", { assigned: "Alex" }), stop("last", "Keilor", { assigned: "Alex" })];
  const details = scheduleListDetails(entries);
  assert.equal(details.get("b").km, 0);
  assert.match(scheduleDistanceLabel(details.get("b")), /~0.0 km/);
  assert.equal(details.get("unknown").km, null);
  assert.equal(details.get("last").previous.id, "unknown");
  assert.equal(details.get("last").km, null);
});

test("upcoming bookings API preserves each booking's assignment", async () => {
  const bookings = [
    { ...stop("inspection", "Ringwood", { inspectorId: "inspector", assigned: "Alex", inspectorUsername: "alex" }), leadId: "lead-a" },
    { ...stop("job", "Keilor", { type: "job", technicianId: "technician", technician: "Sam", technicianUsername: "sam" }), leadId: "lead-b" },
  ];
  const { GET } = loadTs("app/api/admin/bookings/route.ts", {
    "next/server": { NextResponse: { json: body => body } },
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "admin" }) },
    "@/lib/bookings": { listAppointmentsBetween: async () => bookings },
    "@/lib/submissions": { getSubmission: async () => ({ assigned: "Wrong inspector", technician: "Wrong technician" }) },
    "@/lib/scheduleRoutesServer": { getScheduleRouteOrders: async () => ({}) },
  });
  const result = await GET({ cookies: { get: () => ({ value: "token" }) } });
  const inspection = result.bookings.find(entry => entry.type === "inspection");
  const job = result.bookings.find(entry => entry.type === "job");
  assert.equal(inspection.assigned, "Alex");
  assert.equal(inspection.inspectorId, "inspector");
  assert.equal(inspection.inspectorUsername, "alex");
  assert.equal(job.technician, "Sam");
  assert.equal(job.technicianId, "technician");
  assert.equal(job.technicianUsername, "sam");
});

test("primary calendar reservations retain lead assignments when old staff fields are empty", async () => {
  for (const type of ["job", "inspection"]) {
    for (const placeholder of [undefined, "", "Unassigned"]) {
      const lead = {
        _id: new ObjectId(), name: "Customer", city: "Ringwood", address: "Ringwood",
        status: type === "job" ? "Job Booked" : "Inspection Booked",
        [type === "job" ? "jobAt" : "inspectionAt"]: "2026-11-03T09:00",
        technicianId: "alex-id", technician: "Alex", technicianUsername: "alex",
        inspectorId: "sam-id", assigned: "Sam", inspectorUsername: "sam",
      };
      const lock = { leadId: lead._id.toString(), type, date: "2026-11-03", time: "09:00",
        technician: placeholder, assigned: placeholder };
      const reservations = {
        createIndex: async () => {}, listIndexes: () => ({ toArray: async () => [] }),
        find: () => ({ toArray: async () => [lock] }),
      };
      const { listAppointmentsOnDate } = loadTs("lib/bookings.ts", {
        "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({
          collection: name => name === "bookings" ? reservations : {
            find: () => ({ project: () => ({ toArray: async () => [lead] }) }),
          },
        }) },
        "./bookingRulesServer": { getBookingRules: async () => loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES },
      });
      const entries = await listAppointmentsOnDate("2026-11-03");
      assert.equal(entries.length, 1);
      assert.equal(entries[0].technicianId, "alex-id");
      assert.equal(entries[0].technician, "Alex");
      assert.equal(entries[0].inspectorId, "sam-id");
      assert.equal(entries[0].assigned, "Sam");
      const detail = scheduleListDetails(entries.map((entry, index) => ({ ...entry, id: String(index) }))).get("0");
      assert.equal(detail.assignee, type === "job" ? "Alex" : "Sam");
      assert.ok(detail.km > 0);
    }
  }
});
