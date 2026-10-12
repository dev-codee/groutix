import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
function harness() {
  const state = []; let cursor = 0;
  const requests = [], saved = [], completed = [];
  const rules = structuredClone(DEFAULT_BOOKING_RULES);
  const customer = { id: "old", name: "Jane", address: "10 Test Street", email: "jane@example.com", phone: "0400000000", service: "Regrouting" };
  const react = { useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i]; }, useEffect: () => {} };
  const { DispatchBookingModal } = loadTs("components/admin/modals/DispatchBookingModal.tsx", {
    react, "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ({ scopedLeads: [customer], inspectionStaff: [{ id: "inspector", name: "Alex", active: true }], assignableTechnicians: [{ id: "tech", name: "Technician", active: true, workDays: [1,2,3,4,5] }], upsertLead: lead => saved.push(lead) }) },
    "@/lib/useBookingRules": { useBookingRules: () => rules }, "@/lib/scheduling": { ...loadTs("lib/scheduling.ts"), todayAU: () => "2026-10-12" },
  }, { fetch: async (url, options = {}) => { requests.push({ url, ...options }); return { ok: true, json: async () => options.method === "POST" ? { item: { ...customer, id: "new" } } : options.method === "PATCH" ? { notificationWarnings: [] } : { appointments: [] } }; } });
  const render = () => { cursor = 0; const result = []; const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; result.push(node); visit(node.props?.children); }; visit(DispatchBookingModal({ date: "2026-10-14", time: "10:15", onClose: () => {}, onBooked: (...args) => completed.push(args) })); return result; };
  return { render, requests, saved, completed };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test("reviewing a new booking writes nothing; final confirmation creates, assigns and requests notifications", async () => {
  const h = harness();
  let nodes = h.render();
  const selects = nodes.filter(n => n.type === "select").slice(1);
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
  assert.equal(h.requests.filter(r => r.method === "POST").length, 1);
  const patch = h.requests.find(r => r.method === "PATCH");
  assert.equal(patch.url, "/api/admin/submissions/new");
  const body = JSON.parse(patch.body);
  assert.equal(body.inspectionAt, "2026-10-14T10:15");
  assert.equal(body.assigned, "Alex");
  assert.equal(body.bookingNotifications, true);
  assert.equal(h.completed.length, 1);
});


test("a multi-day job reviews and saves the computed finish", async () => {
  const h = harness();
  h.render().find(n => n.type === "button" && n.props.children === "job").props.onClick();
  let nodes = h.render();
  const selects = nodes.filter(n => n.type === "select").slice(1);
  selects[0].props.onChange({ target: { value: "old" } });
  selects[1].props.onChange({ target: { value: "tech" } });
  nodes.find(n => n.type === "input" && n.props.type === "number").props.onChange({ target: { value: "26" } });
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  assert.equal(h.requests.filter(r => r.method).length, 0);
  assert.match(h.requests[0].url, /to=2026-10-15/);
  h.render().find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await settle();
  const body = JSON.parse(h.requests.find(r => r.method === "PATCH").body);
  assert.equal(body.jobEndAt, "2026-10-15T12:15");
});
