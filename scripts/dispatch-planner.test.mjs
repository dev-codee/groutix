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

test("planner API gates both reads and writes to dispatch planner roles", async () => {
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

// Drive the page's actual event handlers with mocked network/React boundaries.
// No booking notifications or real customer records are touched by these checks.
function pageHarness({ storage = new Map(), failLoad = false, failSave = false, extraLeads = [], openRoute = false } = {}) {
  const states = [], effects = [], requests = [], updated = [];
  let cursor = 0; let initialized = false;
  const entries = [appointment("a", "Ringwood"), appointment("b", "Croydon", { time: "11:00", bookingId: "visit-b" })];
  const scopedLeads = entries.map(entry => ({ id: entry.leadId, status: "Job Booked", name: entry.name, address: entry.address,
    jobAt: `${entry.date}T${entry.time}`, bookings: [{ type: entry.type, date: entry.date, time: entry.time, bookingId: entry.bookingId, technician: entry.technician, status: "Job Booked" }] })).concat(extraLeads);
  const react = {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial; return [states[i], value => { states[i] = typeof value === "function" ? value(states[i]) : value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
    useEffect: (callback, dependencies) => {
      const i = cursor++, previous = states[i];
      if (!previous || dependencies.some((value, index) => value !== previous.dependencies[index])) {
        effects.push(() => { previous?.cleanup?.(); states[i] = { dependencies, cleanup: callback() }; });
      }
    },
    useMemo: callback => callback(), useCallback: callback => callback,
  };
  const context = { scopedLeads, upsertLead: lead => updated.push(lead), openJobCard: () => {},
    assignableTechnicians: [{ id: "alex", name: "Alex", active: true }], inspectionStaff: [], loading: false, username: "manager" };
  const { DispatchPlannerView } = loadTs("components/admin/views/DispatchPlannerView.tsx", {
    react, "../AdminPageContext": { useAdminPageCtx: () => context },
    "@/lib/useZoneRules": { useZoneRules: () => ({ flexRadiusKm: 15 }) },
    "../modals/EditBookingModal": { EditBookingModal: function EditBookingModal() {} },
    "../modals/DispatchBookingModal": { DispatchBookingModal: function DispatchBookingModal() {} },
    "../BookingStatusControl": { BookingStatusControl: function BookingStatusControl() {} },
  }, { window: { addEventListener() {}, removeEventListener() {}, sessionStorage: {
    getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key),
  } }, setTimeout: () => 0, clearTimeout() {}, fetch: async (url, options = {}) => {
    requests.push({ url, ...options });
    if (url.startsWith("/api/admin/dispatch-workspace") && !options.method) {
      if (failLoad) return { ok: false, json: async () => ({ error: "Could not load dispatch bookings. Please retry." }) };
      return { ok: true, json: async () => ({ plan: planner.emptyDispatchPlan() }) };
    }
    if (options.method === "POST") return { ok: true, json: async () => ({ measurements: [] }) };
    if (options.method === "PUT") return failSave
      ? { ok: false, json: async () => ({ error: "Another dispatcher updated this plan. Reload to get their changes." }) }
      : { ok: true, json: async () => ({ plan: { ...JSON.parse(options.body).plan, revision: 1 } }) };
    if (options.method === "PATCH") return { ok: true, json: async () => ({ item: scopedLeads[0] }) };
    return { ok: true, json: async () => ({ item: scopedLeads.find(lead => url.endsWith(lead.id)) }) };
  } });
  function render() {
    cursor = 0; const nodes = [];
    function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); }
    visit(DispatchPlannerView());
    effects.splice(0).forEach(effect => effect());
    if (!initialized) { initialized = true; if (openRoute) { nodes.find(node => node.props?.["aria-label"] === "Toggle route details").props.onClick(); return render(); } }
    return nodes;
  }
  const flush = async () => { await new Promise(setImmediate); return render(); };
  const text = node => typeof node === "string" ? node : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
  const button = (nodes, label) => nodes.find(node => node.type === "button" && text(node) === label);
  const label = (nodes, name) => nodes.find(node => node.props?.["aria-label"] === name);
  return { render, flush, requests, updated, button, label, entries, text, storage };
}


const rowIds = nodes => nodes.filter(node => node.type === "tr" && node.props["data-lead-id"]).map(node => node.props["data-lead-id"]);

test("one table includes booked visits and unbooked leads with the same drag actions", async () => {
  const h = pageHarness({ extraLeads: [{ id: "new", name: "New customer", status: "New", address: "Ringwood" }] });
  h.render(); let nodes = await h.flush();
  assert.equal(nodes.filter(node => node.type === "table").length, 1);
  assert.deepEqual(rowIds(nodes), ["a", "b", "new"]);
  const dataTransfer = { setData() {} };
  h.label(nodes, "Drag lead new").props.onDragStart({ dataTransfer }); nodes = h.render();
  nodes.find(node => node.props?.["data-lead-id"] === "a").props.onDrop({ preventDefault() {} }); nodes = h.render();
  assert.deepEqual(rowIds(nodes), ["new", "a", "b"]);
  await h.button(nodes, "Save plan").props.onClick(); nodes = await h.flush();
  const request = h.requests.find(request => request.method === "PUT");
  assert.equal(request.url, "/api/admin/dispatch-workspace");
  assert.deepEqual(JSON.parse(request.body).plan.order, ["new", "a", "b"]);
  assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  assert.deepEqual(h.updated, [], "reorder does not mutate customer or booking records");
});

test("zone and phase filters control that same table; completed inspections are opt-in", async () => {
  const east = planner.dispatchLocation("Ringwood", undefined, 15).zone;
  const west = planner.dispatchLocation("Werribee", undefined, 15).zone;
  const h = pageHarness({ extraLeads: [
    { id: "east", status: "New", address: "Ringwood" }, { id: "west", status: "New", address: "Werribee" },
    { id: "complete", status: "Inspection Completed", address: "Ringwood" }, { id: "quote", status: "Quote Pending", address: "Ringwood" },
  ] });
  h.render(); let nodes = await h.flush();
  assert.equal(rowIds(nodes).includes("complete"), false);
  h.label(nodes, `Show ${east} leads`).props.onClick(); nodes = h.render();
  h.label(nodes, "Filter leads by status").props.onChange({ target: { value: "new" } }); nodes = h.render();
  assert.deepEqual(rowIds(nodes), ["east"]);
  h.label(nodes, `Include ${west} in selection`).props.onChange(); nodes = h.render();
  assert.deepEqual(rowIds(nodes), ["east", "west"]);
  h.label(nodes, `Show ${east} leads`).props.onClick(); nodes = h.render();
  h.label(nodes, "Filter leads by status").props.onChange({ target: { value: "quote-waiting" } }); nodes = h.render();
  assert.deepEqual(rowIds(nodes), ["quote"]);
  h.label(nodes, "Filter leads by status").props.onChange({ target: { value: "inspection-completed" } }); nodes = h.render();
  assert.deepEqual(rowIds(nodes), ["complete"]);
  assert.equal(h.requests.some(request => request.method), false);
});

test("row actions book the existing customer and reschedule the exact selected visit", async () => {
  const h = pageHarness({ extraLeads: [{ id: "new", name: "New customer", status: "New", address: "Ringwood" }] });
  h.render(); let nodes = await h.flush();
  h.label(nodes, "Book job for new").props.onClick(); nodes = h.render();
  const create = nodes.find(node => node.type?.name === "DispatchBookingModal");
  assert.equal(create.props.initialLeadId, "new"); assert.equal(create.props.initialType, "job");
  create.props.onClose(); nodes = h.render();
  h.label(nodes, "Reschedule b").props.onClick(); nodes = await h.flush();
  const edit = nodes.find(node => node.type?.name === "EditBookingModal");
  assert.equal(edit.props.lead.activeBooking.bookingId, "visit-b");
  assert.equal(edit.props.lead.jobAt, `${date}T11:00`);
  assert.equal(h.requests.some(request => request.method), false, "opening a modal performs no booking write");
});

test("cancellation waits for confirmation and addresses only the selected booking", async () => {
  const h = pageHarness(); h.render(); let nodes = await h.flush();
  h.label(nodes, "Cancel booking b").props.onClick(); nodes = h.render();
  assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  await h.button(nodes, "Cancel booking").props.onClick(); await h.flush();
  const request = h.requests.find(request => request.method === "PATCH");
  assert.equal(request.url, "/api/admin/submissions/b/bookings");
  const body = JSON.parse(request.body);
  assert.equal(body.bookingId, "visit-b"); assert.equal(body.start, `${date}T11:00`);
  assert.equal(body.status, "Cancelled");
});

test("draft order recovers across navigation and survives a conflicting save", async () => {
  const storage = new Map(); const h = pageHarness({ storage }); h.render(); let nodes = await h.flush();
  h.label(nodes, "Move b up").props.onClick(); h.render(); assert.equal(storage.size, 1);
  const returning = pageHarness({ storage, failSave: true }); returning.render(); nodes = await returning.flush();
  assert.deepEqual(rowIds(nodes), ["b", "a"]);
  await returning.button(nodes, "Save plan").props.onClick(); nodes = await returning.flush();
  assert.ok(returning.button(nodes, "Save plan")); assert.equal(storage.size, 1);
  assert.ok(nodes.some(node => node.props?.role === "alert" && returning.text(node).includes("Another dispatcher")));
});

test("loading failure blocks reorder but preserves useful booking actions", async () => {
  const h = pageHarness({ failLoad: true }); h.render(); const nodes = await h.flush();
  assert.equal(h.label(nodes, "Drag lead a").props.disabled, true);
  assert.equal(h.button(nodes, "Suggest route order").props.disabled, true);
  assert.equal(h.label(nodes, "Book inspection for a").props.disabled, false);
});
