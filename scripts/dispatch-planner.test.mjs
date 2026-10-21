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
function pageHarness({ storage = new Map(), failLoad = false, failSave = false, extraLeads = [] } = {}) {
  const states = [], effects = [], requests = [], updated = [];
  let cursor = 0;
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
  } }, fetch: async (url, options = {}) => {
    requests.push({ url, ...options });
    if (url.startsWith("/api/admin/dispatch-planner") && options.method !== "PUT") {
      if (failLoad) return { ok: false, json: async () => ({ error: "Could not load dispatch bookings. Please retry." }) };
      const params = new URL(url, "http://localhost").searchParams;
      return { ok: true, json: async () => ({ appointments: entries.filter(entry => entry.date >= params.get("from") && entry.date <= params.get("to")), plans: {} }) };
    }
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
    return nodes;
  }
  const flush = async () => { await new Promise(setImmediate); return render(); };
  const text = node => typeof node === "string" ? node : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
  const button = (nodes, label) => nodes.find(node => node.type === "button" && text(node) === label);
  const label = (nodes, name) => nodes.find(node => node.props?.["aria-label"] === name);
  return { render, flush, requests, updated, button, label, entries, text, storage };
}

test("page connects booking actions to the selected visit and confirms cancellation before writing", async () => {
  const h = pageHarness();
  let nodes = h.render();
  h.label(nodes, "Start date").props.onChange({ target: { value: date } });
  h.label(h.render(), "End date").props.onChange({ target: { value: date } });
  h.render(); nodes = await h.flush();
  assert.equal(h.label(nodes, "Select all displayed bookings").type, "input");
  h.label(nodes, "Edit booking B").props.onClick();
  nodes = await h.flush();
  const modal = nodes.find(node => node.type?.name === "EditBookingModal");
  assert.ok(modal);
  assert.equal(modal.props.lead.activeBooking.bookingId, "visit-b");
  assert.equal(modal.props.lead.jobAt, `${date}T11:00`);
  modal.props.onClose(); h.render(); nodes = await h.flush();
  h.label(nodes, "Cancel booking A").props.onClick(); nodes = h.render();
  assert.equal(h.requests.filter(request => request.method === "PATCH").length, 0);
  await h.button(nodes, "Cancel booking").props.onClick(); await h.flush();
  const cancelled = JSON.parse(h.requests.find(request => request.method === "PATCH").body);
  assert.equal(cancelled.start, `${date}T09:00`);
  assert.equal(cancelled.type, "job");
  assert.equal(cancelled.status, "Cancelled");
});

test("page saves a route draft for its original date after navigating to another day", async () => {
  const h = pageHarness(); let nodes = h.render();
  h.label(nodes, "Start date").props.onChange({ target: { value: date } });
  h.label(h.render(), "End date").props.onChange({ target: { value: date } });
  h.render(); nodes = await h.flush();
  h.label(nodes, "Move B up").props.onClick(); nodes = h.render();
  assert.ok(h.button(nodes, "Save plan"));
  h.label(nodes, "Next day").props.onClick(); h.render(); nodes = await h.flush();
  assert.equal(h.button(nodes, "Save plan").props.disabled, false);
  await h.button(nodes, "Save plan").props.onClick(); await h.flush();
  const body = JSON.parse(h.requests.find(request => request.method === "PUT").body);
  assert.equal(body.date, date);
  assert.deepEqual(body.snapshot, h.entries.map(appointmentKey));
  assert.deepEqual(body.plan.order, [...h.entries].reverse().map(appointmentKey));
  assert.ok(h.requests.filter(request => request.method && request.method !== "GET")
    .every(request => request.method === "PUT" && request.url === "/api/admin/dispatch-planner"),
  "reordering must not call booking edits, email, SMS or notification endpoints");
  assert.equal(body.bookingNotifications, undefined);
  assert.deepEqual(h.updated, [], "customer records are not updated by route ordering");
});

test("page stages zone and grouping changes without patching customer geography", async () => {
  const h = pageHarness(); let nodes = h.render();
  h.label(nodes, "Start date").props.onChange({ target: { value: date } });
  h.label(h.render(), "End date").props.onChange({ target: { value: date } });
  h.render(); nodes = await h.flush();
  h.label(nodes, "Select all displayed bookings").props.onChange({ target: { checked: true } }); nodes = h.render();
  h.button(nodes, "Group visits").props.onClick(); nodes = h.render();
  nodes.find(node => node.type === "input" && node.props.maxLength === 60).props.onChange({ target: { value: "Eastern run" } });
  h.button(h.render(), "Apply to plan").props.onClick(); nodes = h.render();
  h.button(nodes, "Change zone").props.onClick(); nodes = h.render();
  nodes.find(node => node.type === "select" && node.props.value === "auto").props.onChange({ target: { value: "E2" } });
  h.button(h.render(), "Apply to plan").props.onClick(); nodes = h.render();
  assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  await h.button(nodes, "Save plan").props.onClick(); await h.flush();
  const body = JSON.parse(h.requests.find(request => request.method === "PUT").body);
  for (const id of h.entries.map(appointmentKey)) {
    assert.equal(body.plan.groups[id], "Eastern run");
    assert.equal(body.plan.zones[id], "E2");
  }
});

test("unsaved route drafts recover after navigating away and remain available after a conflicting save", async () => {
  const storage = new Map();
  const first = pageHarness({ storage }); let nodes = first.render();
  first.label(nodes, "Start date").props.onChange({ target: { value: date } });
  first.label(first.render(), "End date").props.onChange({ target: { value: date } });
  first.render(); nodes = await first.flush();
  first.label(nodes, "Move B up").props.onClick(); first.render();
  assert.equal(storage.size, 1);
  const returning = pageHarness({ storage, failSave: true }); returning.render(); nodes = await returning.flush();
  assert.ok(returning.button(nodes, "Save plan"));
  assert.ok(nodes.some(node => node.props?.role === "status" && returning.text(node).includes("restored")));
  await returning.button(nodes, "Save plan").props.onClick(); nodes = await returning.flush();
  assert.ok(returning.button(nodes, "Save plan"));
  assert.equal(storage.size, 1);
  assert.ok(nodes.some(node => node.props?.role === "alert" && returning.text(node).includes("Another dispatcher")));
});

test("failed loading does not enable booking or route mutation actions", async () => {
  const h = pageHarness({ failLoad: true }); h.render(); const nodes = await h.flush();
  assert.ok(nodes.some(node => node.props?.role === "alert"));
  assert.equal(h.button(nodes, "Optimize route order").props.disabled, true);
  assert.ok(nodes.filter(node => node.type === "button" && h.text(node) === "Book a visit").every(node => node.props.disabled));
});

test("lead queue opens prefilled booking for a New lead even when the route calendar is unavailable", async () => {
  const lead = { id: "new-lead", status: "New", name: "New lead", address: "Ringwood" };
  const h = pageHarness({ failLoad: true, extraLeads: [lead] }); h.render(); let nodes = await h.flush();
  h.label(nodes, "Leads & bookings").props.onClick(); nodes = h.render();
  let queue = nodes.find(node => node.type?.name === "DispatchLeadQueue");
  assert.ok(queue.props.leads.some(item => item.id === lead.id));
  queue.props.onBook(lead, "job"); nodes = h.render();
  let modal = nodes.find(node => node.type?.name === "DispatchBookingModal");
  assert.equal(modal.props.initialLeadId, lead.id);
  assert.equal(modal.props.initialType, "job");
  modal.props.onClose(); nodes = h.render();
  queue = nodes.find(node => node.type?.name === "DispatchLeadQueue");
  queue.props.onBook(lead, "inspection"); nodes = h.render();
  modal = nodes.find(node => node.type?.name === "DispatchBookingModal");
  assert.equal(modal.props.initialLeadId, lead.id);
  assert.equal(modal.props.initialType, "inspection");
  assert.equal(h.requests.some(request => request.method), false, "opening/filtering a queue never sends notifications or writes a booking");
});

test("showing an existing queue booking opens its own route date", async () => {
  const h = pageHarness(); h.render(); let nodes = await h.flush();
  h.label(nodes, "Leads & bookings").props.onClick(); nodes = h.render();
  const queue = nodes.find(node => node.type?.name === "DispatchLeadQueue");
  queue.props.onShowRoute(queue.props.leads[0], queue.props.leads[0].bookings[0]); nodes = h.render();
  assert.equal(h.label(nodes, "Start date").props.value, date);
  assert.equal(h.label(nodes, "End date").props.value, date);
  assert.equal(nodes.some(node => node.type?.name === "DispatchLeadQueue"), false);
});
