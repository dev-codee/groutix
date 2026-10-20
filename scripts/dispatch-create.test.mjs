import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
function harness({ failFirstPatch = false, date = "2026-10-14", time = "10:15", closed = false } = {}) {
  const state = []; let cursor = 0;
  const requests = [], saved = [], completed = [];
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  if (closed) rules.closedDates = [{ date, label: "Shutdown" }];
  const customer = { id: "old", name: "Jane", address: "10 Test Street", email: "jane@example.com", phone: "0400000000", service: "Regrouting" };
  const customers = [customer];
  const react = { useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i]; }, useEffect: () => {} };
  const { DispatchBookingModal } = loadTs("components/admin/modals/DispatchBookingModal.tsx", {
    react, "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ({ scopedLeads: customers, inspectionStaff: [{ id: "inspector", name: "Alex", active: true }], assignableTechnicians: [{ id: "tech", name: "Technician", active: true, workDays: [1,2,3,4,5] }], upsertLead: lead => saved.push(lead) }) },
    "@/lib/useBookingRules": { useBookingRules: () => rules }, "@/lib/scheduling": { ...loadTs("lib/scheduling.ts"), todayAU: () => "2026-10-12" },
  }, { fetch: async (url, options = {}) => { requests.push({ url, ...options });
    const failed = options.method === "PATCH" && failFirstPatch && requests.filter(r => r.method === "PATCH").length === 1;
    return { ok: !failed, json: async () => failed ? { error: "Slot taken" } : options.method === "POST" ? { item: { ...customer, id: "new" } } : options.method === "PATCH" ? { notificationWarnings: [] } : { appointments: [] } }; } });
  const render = () => { cursor = 0; const result = []; const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; result.push(node); if (["BookingTimingEditor", "BookingTimingSummary"].includes(node.type?.name)) visit(node.type(node.props)); visit(node.props?.children); }; visit(DispatchBookingModal({ date, time, onClose: () => {}, onBooked: (...args) => completed.push(args) })); return result; };
  return { render, requests, saved, completed, customers };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test("reviewing a new booking writes nothing; final confirmation reuses the lead, assigns and requests notifications", async () => {
  const h = harness();
  let nodes = h.render();
  const selects = nodes.filter(n => n.type === "select");
  selects[0].props.onChange({ target: { value: "old" } });
  selects[1].props.onChange({ target: { value: "inspector" } });
  nodes = h.render();
  nodes.find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method).length, 0);
  assert.equal(h.saved.length, 0);
  nodes = h.render();
  nodes.find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method === "POST").length, 0);
  const patch = h.requests.find(r => r.method === "PATCH");
  assert.equal(patch.url, "/api/admin/submissions/old");
  const body = JSON.parse(patch.body);
  assert.equal(body.inspectionAt, "2026-10-14T10:15");
  assert.equal(body.assigned, "Alex");
  assert.equal(body.bookingNotifications, true);
  assert.equal(body.appendBooking, true);
  assert.equal(h.completed.length, 1);
});


test("a multi-day job reviews and saves the computed finish", async () => {
  const h = harness();
  h.render().find(n => n.type === "button" && n.props.children === "job").props.onClick();
  let nodes = h.render();
  const selects = nodes.filter(n => n.type === "select");
  selects[0].props.onChange({ target: { value: "old" } });
  selects[1].props.onChange({ target: { value: "tech" } });
  nodes.find(n => n.type === "input" && n.props["aria-label"] === "Working days").props.onChange({ target: { value: "2" } });
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method).length, 0);
  assert.match(h.requests[0].url, /to=2026-10-15/);
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  const body = JSON.parse(h.requests.find(r => r.method === "PATCH").body);
  assert.equal(body.jobEndAt, "2026-10-15T17:00");
});

test("a new customer still creates exactly one lead before adding the booking", async () => {
  const h = harness();
  h.render().find(n => n.type === "button" && n.props.children === "New customer").props.onClick();
  let nodes = h.render();
  for (const [type, value] of [["email", "new@example.com"], ["tel", "0400000000"]]) {
    h.render().find(n => n.type === "input" && n.props.type === type).props.onChange({ target: { value } });
  }
  let texts = h.render().filter(n => n.type === "input" && n.props.type === "text");
  texts[0].props.onChange({ target: { value: "New Customer" } });
  texts = h.render().filter(n => n.type === "input" && n.props.type === "text");
  texts[1].props.onChange({ target: { value: "10 Test Street" } });
  h.render().find(n => n.type === "input" && n.props.placeholder === "e.g. Shower regrouting").props.onChange({ target: { value: "Regrouting" } });
  h.render().filter(n => n.type === "select").at(-1).props.onChange({ target: { value: "inspector" } });
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method === "POST").length, 1);
  assert.equal(h.requests.find(r => r.method === "PATCH").url, "/api/admin/submissions/new");
});

test("an existing customer disappearing during review never creates a replacement lead or overwrites shared fields", async () => {
  const h = harness();
  let nodes = h.render();
  nodes.filter(n => n.type === "select")[0].props.onChange({ target: { value: "old" } });
  nodes.filter(n => n.type === "select")[1].props.onChange({ target: { value: "inspector" } });
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  h.customers.length = 0;
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method === "POST").length, 0);
  const request = h.requests.find(r => r.method === "PATCH");
  assert.equal(request.url, "/api/admin/submissions/old");
  const body = JSON.parse(request.body);
  for (const key of ["name", "address", "email", "phone", "service", "status", "jobNo"]) assert.equal(body[key], undefined, key);
  assert.equal(h.saved.length, 0, "never optimistically overwrite the primary booking with an additional visit");
});

test("retrying an existing customer's conflicting booking never creates a lead", async () => {
  const h = harness({ failFirstPatch: true });
  const nodes = h.render();
  nodes.filter(n => n.type === "select")[0].props.onChange({ target: { value: "old" } });
  nodes.filter(n => n.type === "select")[1].props.onChange({ target: { value: "inspector" } });
  for (let i = 0; i < 3; i++) {
    h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
    await settle();
  }
  assert.equal(h.requests.filter(r => r.method === "POST").length, 0);
  assert.equal(h.requests.filter(r => r.method === "PATCH" && r.url === "/api/admin/submissions/old").length, 2);
  assert.equal(h.completed.length, 1);
});

for (const type of ["job", "inspection"]) {
  for (const closed of [false, true]) {
    test(`${type}: staff can review and confirm ${closed ? "a closed-day" : "an after-hours"} booking`, async () => {
      const h = harness({ time: "20:00", closed });
      if (type === "job") h.render().find(n => n.type === "button" && n.props.children === "job").props.onClick();
      let nodes = h.render();
      const selects = nodes.filter(n => n.type === "select");
      selects[0].props.onChange({ target: { value: "old" } });
      selects[1].props.onChange({ target: { value: type === "job" ? "tech" : "inspector" } });
      h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
      await settle();
      assert.equal(h.requests.filter(r => r.method).length, 0);
      assert.ok(h.render().some(n => n.props?.role === "alert"));
      h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
      await settle();
      const patch = h.requests.find(r => r.method === "PATCH");
      assert.ok(patch);
      const body = JSON.parse(patch.body);
      assert.equal(body[`${type}At`], "2026-10-14T20:00");
      assert.equal(body[`${type}EndAt`], "2026-10-14T21:00");
      assert.equal(h.completed.length, 1);
    });
  }
}
