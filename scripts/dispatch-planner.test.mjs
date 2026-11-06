import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const planner = loadTs("lib/dispatchPlanner.ts");
const { appointmentKey } = loadTs("lib/scheduleRoutes.ts");
const date = "2026-10-20";
const appointment = (id, address = "Ringwood", overrides = {}) => ({
  leadId: id, type: "job", date, time: "09:00", name: id, address,
  technician: "Alex", source: "staff", scheduledMinutes: 90, ...overrides,
});
const stop = (id, address, overrides) => planner.dispatchStop(appointment(id, address, overrides), planner.emptyDispatchPlan(), 15);
const ids = entries => Array.from(entries, entry => entry.id);

test("dispatch zones cover the reference's three inner and five outer sectors with inclusive radius", () => {
  assert.equal(planner.dispatchZoneAt(290, 15, 15), "L1");
  assert.equal(planner.dispatchZoneAt(25, 15, 15), "R1");
  assert.equal(planner.dispatchZoneAt(110, 15, 15), "R2");
  for (const [angle, expected] of [[0, "N"], [65, "E1"], [130, "E2"], [230, "W2"], [290, "W1"], [-10, "N"]]) {
    assert.equal(planner.dispatchZoneAt(angle, 15.01, 15), expected);
  }
  assert.equal(planner.dispatchZoneAt(65, 17, 20), "R1", "configured inner radius is respected");
});

test("unknown locations stay unknown and dispatch zone overrides never invent distances", () => {
  const original = appointment("unknown", "Unrecognised property");
  const first = planner.dispatchStop(original, planner.emptyDispatchPlan(), 15);
  assert.equal(first.zone, "unlocated");
  assert.equal(first.point, null);
  assert.equal(first.baseKm, null);
  assert.equal(planner.travelLeg(first.point, planner.dispatchBase), null);
  const plan = { ...planner.emptyDispatchPlan(), zones: { [first.id]: "E1" }, groups: { [first.id]: "Morning crew" } };
  const overridden = planner.dispatchStop(original, plan, 15);
  assert.equal(overridden.zone, "E1");
  assert.equal(overridden.baseKm, null);
  assert.equal(overridden.group, "Morning crew");
  assert.equal(original.zone, undefined, "business record is not mutated");
});

test("each staff member and day gets a separate route; unassigned visits are independent", () => {
  const entries = [stop("one", "Ringwood"), stop("two", "Croydon", { technician: "Bob" }),
    stop("tomorrow", "Ringwood", { date: "2026-10-21" }),
    stop("none1", "Ringwood", { technician: undefined }), stop("none2", "Croydon", { technician: undefined })];
  assert.equal(planner.routeLanes(entries).length, 5);
  const mixedRole = [stop("job", "Ringwood", { technicianUsername: "alex" }),
    stop("inspection", "Croydon", { type: "inspection", assigned: "Alex", inspectorUsername: "ALEX" })];
  assert.equal(planner.routeLanes(mixedRole).length, 1, "dual-role staff member has a single route");
});

test("manual order reloads per day, retaining new visits and separate booking identities", () => {
  const first = stop("same-lead", "Ringwood", { bookingId: "first", time: "09:00" });
  const second = stop("same-lead", "Ringwood", { bookingId: "second", time: "09:00" });
  const added = stop("added", "Croydon", { time: "10:00" });
  assert.notEqual(first.id, second.id);
  const sorted = planner.sortDispatchStops([first, second, added], "manual", { [date]: { ...planner.emptyDispatchPlan(), order: [second.id, first.id] } });
  assert.deepEqual(ids(sorted), [second.id, first.id, added.id]);
  assert.deepEqual(Array.from(planner.mergeDispatchOrder(["hidden1", first.id, "hidden2", second.id], [second.id, first.id, added.id])), ["hidden1", second.id, "hidden2", first.id, added.id]);
});

test("smart route keeps times and unlocated positions; never makes the estimated round trip longer", () => {
  const entries = [stop("east", "Ringwood"), stop("west", "Werribee", { time: "10:00" }),
    stop("east2", "Croydon", { time: "11:00" }), stop("unknown", "Unknown property", { time: "12:00" })];
  const routeKm = entries => {
    const points = [planner.dispatchBase, ...entries.map(entry => entry.point), planner.dispatchBase];
    return points.slice(1).reduce((sum, point, i) => sum + (planner.travelLeg(points[i], point)?.km || 0), 0);
  };
  const sorted = planner.sortDispatchStops(entries, "smart", {});
  assert.ok(routeKm(sorted) <= routeKm(entries));
  assert.equal(sorted[3].id, entries[3].id);
  assert.deepEqual(new Set(ids(sorted)), new Set(ids(entries)));
  sorted.forEach(entry => assert.equal(entry.time, entries.find(old => old.id === entry.id).time));
  assert.equal(planner.stopMinutes(sorted[0]), 90);
  assert.equal(planner.travelLeg(planner.dispatchBase, planner.dispatchBase).minutes, 0);
});

test("nearest/farthest sorting keeps unlocated stops last", () => {
  const entries = [stop("unknown", "Unknown property"), stop("near", "Gowanbrae"), stop("far", "Ringwood")];
  assert.deepEqual(ids(planner.sortDispatchStops(entries, "nearest", {})), [entries[1].id, entries[2].id, entries[0].id]);
  assert.deepEqual(ids(planner.sortDispatchStops(entries, "farthest", {})), [entries[2].id, entries[1].id, entries[0].id]);
});

test("plan validation rejects malformed records, unknown zones, duplicate ids and excessive group labels", () => {
  assert.ok(planner.validDispatchPlan(planner.emptyDispatchPlan()));
  for (const partial of [{ revision: -1 }, { order: ["a", "a"] }, { zones: [] }, { zones: { a: "bad" } }, { groups: { a: " " } }, { groups: { a: "a".repeat(61) } }, { order: ["__proto__"] }]) {
    assert.equal(planner.validDispatchPlan({ ...planner.emptyDispatchPlan(), ...partial }), false);
  }
});

const json = (body, options = {}) => ({ body, status: options.status || 200 });
function apiHarness({ session = { role: "manager", username: "manager" }, fail = false, entries = [appointment("a")] } = {}) {
  const docs = new Map(), writes = [], notifications = [], collections = [];
  const db = { collection: name => {
    collections.push(name);
    assert.equal(name, "dispatchPlans", "dispatch plan saves must never write customer or booking collections");
    return {
    find: ({ _id }) => ({ toArray: async () => [...docs.values()].filter(doc => doc._id >= _id.$gte && doc._id <= _id.$lte) }),
    updateOne: async (filter, update, options) => {
      writes.push({ filter, update, options });
      const current = docs.get(filter._id);
      if (current && current.revision !== filter.revision) {
        if (options.upsert) throw { code: 11000 };
        return { matchedCount: 0, upsertedCount: 0 };
      }
      if (!current && !options.upsert) return { matchedCount: 0, upsertedCount: 0 };
      docs.set(filter._id, { _id: filter._id, ...update.$set });
      return { matchedCount: current ? 1 : 0, upsertedCount: current ? 0 : 1 };
    },
  }; } };
  const api = loadTs("app/api/admin/dispatch-planner/route.ts", {
    "next/server": { NextResponse: { json } },
    "@/lib/adminAuth": { verifyRequestSession: async () => session },
    "@/lib/mongodb": { getDb: async () => { if (fail) throw new Error("DB unavailable"); return db; } },
    "@/lib/bookings": { listAppointmentsBetween: async () => entries },
    "@/lib/email": { sendEmail: async (...args) => notifications.push({ channel: "email", args }) },
    "@/lib/sms": { sendSms: async (...args) => notifications.push({ channel: "sms", args }) },
  }, { console: { ...console, error: () => {} } });
  return { docs, writes, entries, notifications, collections, put: body => api.PUT({ json: async () => body }),
    get: (from = date, to = date) => api.GET({ nextUrl: new URL(`http://localhost/api/admin/dispatch-planner?from=${from}&to=${to}`) }) };
}
const key = appointmentKey(appointment("a"));
const payload = () => ({ date, snapshot: [key], plan: { ...planner.emptyDispatchPlan(), order: [key], zones: { [key]: "E1" }, groups: { [key]: "Morning" } } });

test("planner API saves and reloads shared order, groups and zones with an audit identity", async () => {
  const api = apiHarness();
  const saved = await api.put(payload());
  assert.equal(saved.status, 200);
  assert.equal(saved.body.plan.revision, 1);
  assert.equal(api.docs.get(date).updatedBy, "manager");
  const reloaded = await api.get();
  assert.equal(reloaded.status, 200);
  assert.deepEqual(Array.from(reloaded.body.plans[date].order), [key]);
  assert.equal(reloaded.body.plans[date].zones[key], "E1");
  assert.equal(reloaded.body.plans[date].groups[key], "Morning");
  assert.equal(reloaded.body.appointments.length, 1);
});

test("saving a reordered route never sends customer email/SMS or changes appointment records", async () => {
  const entries = [appointment("a"), appointment("b", "Croydon", { time: "11:00" })];
  const original = structuredClone(entries);
  const api = apiHarness({ entries });
  const saved = await api.put({ date, snapshot: entries.map(appointmentKey),
    plan: { ...planner.emptyDispatchPlan(), order: [...entries].reverse().map(appointmentKey) } });
  assert.equal(saved.status, 200);
  assert.deepEqual(api.notifications, [], "no customer notifications when a route is reordered");
  assert.deepEqual(api.collections, ["dispatchPlans"]);
  assert.deepEqual(entries, original, "booking dates, times, assignments and reminder state are untouched");
});

test("planner API rejects stale revisions and concurrent first saves without losing the shared plan", async () => {
  const api = apiHarness();
  assert.equal((await api.put(payload())).status, 200);
  assert.equal((await api.put(payload())).status, 409);
  const next = payload(); next.plan.revision = 1; next.plan.groups[key] = "Afternoon";
  assert.equal((await api.put(next)).status, 200);
  assert.equal((await api.put(next)).status, 409);
  assert.equal(api.docs.get(date).groups[key], "Afternoon");
});

test("planner API rejects a changed calendar and foreign metadata ids before writing", async () => {
  const api = apiHarness();
  const foreign = payload(); foreign.plan.zones.foreign = "E1";
  assert.equal((await api.put(foreign)).status, 409);
  const duplicate = payload(); duplicate.snapshot = [key, key];
  assert.equal((await api.put(duplicate)).status, 400);
  api.entries.push(appointment("new-booking"));
  assert.equal((await api.put(payload())).status, 409);
  assert.equal(api.writes.length, 0);
});

test("planner API gates both reads and writes to dispatch roles", async () => {
  for (const session of [null, { role: "technician", username: "tech" }, { role: "finance", username: "finance" }]) {
    const api = apiHarness({ session });
    assert.equal((await api.get()).status, 403);
    assert.equal((await api.put(payload())).status, 403);
    assert.equal(api.writes.length, 0);
  }
});

test("planner API validates date ranges and reports storage failures", async () => {
  const api = apiHarness();
  assert.equal((await api.get("2026-02-30", date)).status, 400);
  assert.equal((await api.get("2026-10-01", "2026-11-01")).status, 400);
  assert.equal((await api.get(date, "2026-10-19")).status, 400);
  assert.equal((await apiHarness({ fail: true }).get()).status, 500);
  assert.equal((await apiHarness({ fail: true }).put(payload())).status, 500);
});
