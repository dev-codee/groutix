import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { loadTs } from "./test-ts-loader.mjs";
const work = loadTs("lib/dispatchWorklist.ts");
const planner = loadTs("lib/dispatchPlanner.ts");
const plain = value => JSON.parse(JSON.stringify(value));
const booking = (id, type = "job", overrides = {}) => ({ bookingId: id, type, date: "2026-10-21", time: "09:00", technician: "Alex", assigned: "Bob", status: type === "job" ? "Job Booked" : "Inspection Booked", ...overrides });
const leads = [
  { id: "a", name: "A", status: "Job Booked", address: "10 Main St, Ringwood VIC", bookings: [booking("first"), booking("second", "job", { date: "2026-10-23", technician: "Chris" }), booking("inspection", "inspection")] },
  { id: "b", name: "B", status: "New", address: "Croydon" },
  { id: "c", name: "C", status: "Contacted", address: "Werribee" },
];
const rows = () => work.workRows(leads, planner.emptyDispatchPlan(), 15);
const options = { visitType: "all", staff: "all", includeUnbooked: true };

test("worklist keeps one row per customer, unbooked leads and distinct saved visit identities", () => {
  const list = rows(); assert.equal(list.length, 3); assert.equal(list[0].bookings.length, 3);
  assert.equal(list[1].booking, undefined); assert.equal(work.workMinutes(list[1].booking), 0);
  const selected = work.workRows(leads, planner.emptyDispatchPlan(), 15, { a: "job:second" });
  assert.equal(selected[0].booking.bookingId, "second");
  assert.equal(leads[0].bookings[0].bookingId, "first");
});

test("date, staff and visit-type filters find any matching saved visit, preserving unbooked leads", () => {
  let filtered = work.filterWorkBookings(rows(), { ...options, from: "2026-10-23", to: "2026-10-23", validDates: true });
  assert.equal(filtered[0].booking.bookingId, "second"); assert.equal(filtered.length, 3);
  filtered = work.filterWorkBookings(rows(), { ...options, staff: "chris" });
  assert.equal(filtered.length, 1); assert.equal(filtered[0].booking.bookingId, "second");
  filtered = work.filterWorkBookings(rows(), { ...options, visitType: "inspection" });
  assert.equal(filtered[0].booking.bookingId, "inspection");
  assert.equal(work.filterWorkBookings(rows(), { ...options, from: "2026-12-01", to: "2026-12-02", validDates: true, includeUnbooked: false }).length, 0);
});

test("cancelled and completed inspections never reappear as active visits", () => {
  const lead = { ...leads[0], status: "Inspection Booked", bookings: [booking("cancelled", "inspection", { status: "Cancelled" }), booking("done", "inspection", { status: "Inspection Completed" })] };
  const active = work.workRows([lead], planner.emptyDispatchPlan(), 15);
  assert.equal(work.workBookingCandidates(active[0]).length, 0);
  const explicit = work.workRows([{ ...lead, status: "Inspection Completed" }], planner.emptyDispatchPlan(), 15);
  assert.equal(work.workBookingCandidates(explicit[0])[0].bookingId, "done");
});

test("drag order changes previous-location distances immediately while keeping base distances", () => {
  const list = rows(), before = work.workDistances(list, {}), after = work.workDistances([list[2], list[0], list[1]], {});
  assert.equal(before[0].fromBase.km, after[1].fromBase.km);
  assert.equal(after[1].previous.id, "c");
  assert.notEqual(before[0].fromPrevious.km, after[1].fromPrevious.km);
  const plan = { ...planner.emptyDispatchPlan(), order: ["c", "a", "b"] };
  assert.deepEqual(plain(work.sortWorkRows(list, "manual", plan).map(row => row.id)), ["c", "a", "b"]);
  assert.deepEqual(plain(planner.mergeDispatchOrder(["a", "hidden", "b", "c"], ["c", "a", "b"])), ["c", "hidden", "a", "b"]);
});

test("road results are tied to exact addresses and adjacency, rejecting stale responses after drag", () => {
  const list = rows();
  const saved = { b: { id: "b", address: "Croydon", previousId: "a", previousAddress: leads[0].address, fromBase: { km: 44, minutes: 30 }, fromPrevious: { km: 9, minutes: 12 }, returnToBase: { km: 47, minutes: 35 } } };
  let metrics = work.workDistances(list, saved);
  assert.equal(metrics[1].fromPrevious.road, true); assert.equal(metrics[1].fromPrevious.km, 9);
  metrics = work.workDistances([list[2], list[1], list[0]], saved);
  assert.equal(metrics[1].fromPrevious.road, false); assert.equal(metrics[1].fromBase.km, 44);
  assert.equal(metrics[1].returnToBase.km, 47, "return direction is measured independently");
  metrics = work.workDistances([{ ...list[1], lead: { ...list[1].lead, address: "Changed address" } }], saved);
  assert.equal(metrics[0].fromBase.road, false);
  const unknown = work.workRows([{ id: "missing", address: "Unknown", status: "New" }], planner.emptyDispatchPlan(), 15);
  assert.equal(work.workDistances(unknown, {})[0].fromPrevious.km, null);
});

const ids = ["000000000000000000000001", "000000000000000000000002", "000000000000000000000003"];
function apiHarness(session = { role: "manager", username: "manager" }) {
  const docs = ids.map((id, i) => ({ _id: new ObjectId(id), address: ["Ringwood", "Croydon", "Werribee"][i] }));
  const writes = [], legs = [], messages = []; let saved;
  const subset = filter => docs.filter(doc => filter._id.$in.some(id => String(id) === String(doc._id)));
  const api = loadTs("app/api/admin/dispatch-workspace/route.ts", {
    "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    "@/lib/adminAuth": { verifyRequestSession: async () => session },
    "@/lib/mongodb": { getDb: async () => ({ collection: name => name === "submissions" ? {
      countDocuments: async filter => subset(filter).length,
      find: filter => ({ project: () => ({ toArray: async () => subset(filter) }) }),
    } : { findOne: async () => saved, updateOne: async (filter, update, options) => {
      assert.equal(name, "dispatchWorkspaces");
      if (saved && saved.revision !== filter.revision) { if (options.upsert) throw { code: 11000 }; return { matchedCount: 0 }; }
      writes.push({ name, update }); saved = update.$set; return { matchedCount: 1 };
    } } }) },
    "@/lib/dispatchRoadDistances": { drivingLeg: async (from, to) => { legs.push([from, to]); return { km: from.length + to.length, minutes: 12 }; } },
    "@/lib/email": { sendEmail: (...args) => messages.push(args) },
    "@/lib/sms": { sendSms: (...args) => messages.push(args) },
  });
  return { docs, writes, legs, messages, get: () => api.GET({}), put: body => api.PUT({ json: async () => body }), post: body => api.POST({ json: async () => body }) };
}

test("shared lead-order saves use revision control and never write bookings or send notifications", async () => {
  const h = apiHarness(), plan = { ...planner.emptyDispatchPlan(), order: [...ids].reverse(), zones: { [ids[0]]: "E1" } };
  assert.equal((await h.put({ plan })).status, 200);
  assert.deepEqual(plain((await h.get()).body.plan.order), [...ids].reverse());
  assert.equal((await h.put({ plan })).status, 409);
  assert.equal((await h.put({ plan: { ...plan, revision: 1 } })).status, 200);
  assert.deepEqual(h.messages, []); assert.equal(h.writes.length, 2);
  assert.ok(h.writes.every(write => write.name === "dispatchWorkspaces"));
  const removed = { ...plan, order: ["000000000000000000000004"] };
  assert.equal((await h.put({ plan: removed })).status, 409);
});

test("road lookup uses saved addresses, actual previous lead and return to base with batch boundaries", async () => {
  const h = apiHarness(); let result = await h.post({ ids: ids.slice(0, 2), lastBatch: true });
  assert.equal(result.status, 200);
  assert.equal(result.body.measurements[0].previousId, null);
  assert.equal(result.body.measurements[1].previousId, ids[0]);
  assert.equal(result.body.measurements[1].previousAddress, "Ringwood");
  assert.ok(h.legs.some(([from, to]) => from === "Ringwood" && to === "Croydon"));
  assert.ok(h.legs.some(([from, to]) => from === "Croydon" && to === planner.DISPATCH_BASE_ADDRESS));
  result = await h.post({ ids: [ids[2]], previousId: ids[1], lastBatch: false });
  assert.equal(result.body.measurements[0].previousAddress, "Croydon");
  assert.equal(result.body.measurements[0].returnToBase, null);
  assert.equal(h.writes.length, 0); assert.deepEqual(h.messages, []);
  assert.equal((await h.post({ ids: [ids[0], ids[0]] })).status, 400);
  assert.equal((await h.post({ ids: [ids[0]], previousId: ids[0] })).status, 400);
});

test("workspace read, save and road lookup require dispatch privileges", async () => {
  for (const session of [null, { role: "technician", username: "tech" }, { role: "finance", username: "finance" }]) {
    const h = apiHarness(session);
    assert.equal((await h.get()).status, 403); assert.equal((await h.put({})).status, 403);
    assert.equal((await h.post({ ids })).status, 403); assert.equal(h.writes.length, 0);
  }
});

test("road provider uses address-based driving, caches by direction and deduplicates concurrent calls", async () => {
  const old = process.env.GOOGLE_PLACES_API_KEY; process.env.GOOGLE_PLACES_API_KEY = "test-only";
  try {
    const urls = [];
    const { drivingLeg } = loadTs("lib/dispatchRoadDistances.ts", {}, { fetch: async url => {
      urls.push(url); return { ok: true, json: async () => ({ status: "OK", rows: [{ elements: [{ status: "OK", distance: { value: urls.length === 1 ? 12340 : 14560 }, duration: { value: 901 } }] }] }) };
    } });
    const [a, b] = await Promise.all([drivingLeg("Origin", "Destination"), drivingLeg("Origin", "Destination")]);
    assert.equal(urls.length, 1); assert.deepEqual(plain(a), { km: 12.34, minutes: 16 }); assert.deepEqual(plain(a), plain(b));
    await drivingLeg("Origin", "Destination"); assert.equal(urls.length, 1);
    const reverse = await drivingLeg("Destination", "Origin"); assert.equal(reverse.km, 14.56); assert.equal(urls.length, 2);
    assert.equal(urls[0].searchParams.get("mode"), "driving"); assert.equal(urls[0].searchParams.get("origins"), "Origin");
    assert.equal(urls[0].searchParams.get("destinations"), "Destination");
    const denied = loadTs("lib/dispatchRoadDistances.ts", {}, { fetch: async () => ({ ok: true, json: async () => ({ status: "REQUEST_DENIED" }) }) });
    assert.equal(await denied.drivingLeg("A", "B"), null, "unavailable road measurements never become invented distances");
  } finally { if (old === undefined) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = old; }
});
