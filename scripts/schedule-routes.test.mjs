import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { applyRouteOrders, appointmentKey, estimateRoute, optimizeRouteStops, validScheduleDate } = loadTs("lib/scheduleRoutes.ts");
const stop = (id, address, date = "2026-10-08", time = "09:00") => ({ id, date, time, customer: { address } });

test("saved route orders survive reload and handle moved/new appointments", () => {
  const entries = [stop("a", "Ringwood", undefined, "09:00"), stop("b", "Keilor", undefined, "10:00"), stop("c", "Sunshine", undefined, "11:00")];
  const ordered = applyRouteOrders(entries, { "2026-10-08": ["b", "deleted", "a"] });
  assert.deepEqual(Array.from(ordered, (entry) => entry.id), ["b", "a", "c"]);
  assert.deepEqual(entries.map((entry) => entry.id), ["a", "b", "c"]);
  assert.equal(appointmentKey({ leadId: "lead", type: "job", date: "2026-10-08", time: "10:00" }), "lead:job:2026-10-08:10:00");
});

test("optimization shortens the estimated route without changing times or crossing days", () => {
  const entries = [stop("east", "Ringwood"), stop("west", "Werribee", undefined, "10:00"), stop("east2", "Croydon", undefined, "11:00"), stop("unknown", "Unknown address", undefined, "12:00"), stop("tomorrow", "Keilor", "2026-10-09")];
  const optimized = optimizeRouteStops(entries);
  assert.ok(estimateRoute(optimized).km < estimateRoute(entries).km);
  assert.equal(optimized[3].id, "unknown");
  assert.equal(optimized[4].id, "tomorrow");
  assert.deepEqual(new Set(optimized.map((entry) => entry.id)), new Set(entries.map((entry) => entry.id)));
  for (const entry of optimized) assert.equal(entry.time, entries.find((original) => original.id === entry.id).time);
  assert.equal(estimateRoute(optimized).missing, 1);
});

test("estimates count a return to base per day and report unknown locations", () => {
  const one = estimateRoute([stop("one", "Ringwood")]);
  const twoDays = estimateRoute([stop("one", "Ringwood"), stop("two", "Ringwood", "2026-10-09")]);
  assert.ok(Math.abs(twoDays.km - one.km * 2) <= 0.1);
  assert.equal(twoDays.minutes, one.minutes * 2);
  assert.equal(estimateRoute([stop("unknown", "Unknown address")]).missing, 1);
  assert.equal(estimateRoute([]).km, 0);
});

test("calendar dates reject impossible dates", () => {
  assert.ok(validScheduleDate("2028-02-29"));
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01", "not-a-date", null]) assert.equal(validScheduleDate(date), false);
});

const json = (body, options = {}) => ({ body, status: options.status || 200 });
function routeApi({ session = { username: "manager" }, appointments = [], fail = false } = {}) {
  const writes = [];
  const api = loadTs("app/api/admin/schedule-routes/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => session },
    "@/lib/mongodb": { isMongoConfigured: () => true },
    "@/lib/bookings": { listAppointmentsBetween: async () => { if (fail) throw new Error("database unavailable"); return appointments; } },
    "@/lib/scheduleRoutesServer": { saveScheduleRouteOrders: async (...args) => writes.push(args) },
  });
  return { writes, put: (body) => api.PUT({ cookies: { get: () => ({ value: "token" }) }, json: async () => body }) };
}
const appointment = { leadId: "lead", type: "job", date: "2026-10-08", time: "09:00" };
const order = [appointmentKey(appointment)];

test("route API validates membership before persisting the reviewed order", async () => {
  const { put, writes } = routeApi({ appointments: [appointment] });
  assert.equal((await put({ routes: [{ date: appointment.date, order }] })).status, 200);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1], "manager");
  assert.deepEqual(Array.from(writes[0][0][0].order), order);
});

test("route API rejects unauthorized, duplicate and stale route saves", async () => {
  assert.equal((await routeApi({ session: null }).put({ routes: [] })).status, 401);
  const { put, writes } = routeApi({ appointments: [appointment] });
  assert.equal((await put({ routes: [{ date: appointment.date, order: [...order, ...order] }] })).status, 400);
  assert.equal((await put({ routes: [{ date: appointment.date, order: [] }] })).status, 409);
  assert.equal(writes.length, 0);
});

test("route API reports database failure without claiming a successful save", async () => {
  const { put, writes } = routeApi({ fail: true });
  assert.equal((await put({ routes: [{ date: appointment.date, order }] })).status, 500);
  assert.equal(writes.length, 0);
});

test("route storage reads back the exact saved order", async () => {
  const documents = new Map();
  const collection = {
    bulkWrite: async (operations) => operations.forEach(({ updateOne }) => documents.set(updateOne.filter._id, { _id: updateOne.filter._id, ...updateOne.update.$set })),
    find: () => ({ toArray: async () => [...documents.values()] }),
  };
  const api = loadTs("lib/scheduleRoutesServer.ts", { "@/lib/mongodb": { isMongoConfigured: () => true, getDb: async () => ({ collection: () => collection }) } });
  await api.saveScheduleRouteOrders([{ date: appointment.date, order: ["second", "first"] }], "manager");
  const reloaded = await api.getScheduleRouteOrders(appointment.date, appointment.date);
  assert.deepEqual(Array.from(reloaded[appointment.date]), ["second", "first"]);
});
