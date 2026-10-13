import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const rules = loadTs("lib/bookingRules.ts").DEFAULT_BOOKING_RULES;
function harness(type = "job", conflict = false) {
  const states = []; let cursor = 0;
  const requests = [], completed = [], saved = [];
  const lead = { id: "lead", name: "Jane", address: "10 Test Street", jobAt: "2099-10-14T10:00", jobEndAt: "2099-10-15T12:00", technician: "Alex", inspectionAt: "2099-10-14T09:00", inspectionEndAt: "2099-10-14T09:30", assigned: "Clara" };
  const technicians = [{ id: "alex", name: "Alex", active: true }, { id: "bob", name: "Bob", active: true }];
  const react = {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; }, useEffect: () => {},
  };
  const { EditBookingModal } = loadTs("components/admin/modals/EditBookingModal.tsx", {
    react, "@/lib/useBookingRules": { useBookingRules: () => rules },
    "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ({ assignableTechnicians: technicians, inspectionStaff: [{ id: "clara", name: "Clara", active: true }], upsertLead: lead => saved.push(lead) }) },
  }, { fetch: async (url, options = {}) => {
    requests.push({ url, ...options });
    return { ok: true, json: async () => options.method === "PATCH" ? {} : { appointments: conflict ? [{ leadId: "other", type: "inspection", date: "2099-10-14", time: "10:00", scheduledMinutes: 60, assigned: "Bob" }] : [] } };
  } });
  const render = () => {
    cursor = 0; const nodes = [];
    const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); };
    visit(EditBookingModal({ lead, type, onClose: () => completed.push("closed"), onSaved: (...args) => completed.push(args) }));
    return nodes;
  };
  const submit = async () => { render().find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate); };
  return { render, submit, requests, completed, saved };
}

test("popup opens the selected job, preserves its multi-day finish and confirms before saving changed timing and staff", async () => {
  const h = harness(); let nodes = h.render();
  assert.ok(nodes.some(node => node.props?.role === "dialog"));
  assert.equal(nodes.find(node => node.type === "input" && node.props.type === "time").props.value, "10:00");
  assert.equal(nodes.find(node => node.type === "input" && node.props.type === "datetime-local").props.value, "2099-10-15T12:00");
  nodes.find(node => node.type === "select").props.onChange({ target: { value: "Bob" } });
  nodes.find(node => node.type === "input" && node.props.type === "datetime-local").props.onChange({ target: { value: "2099-10-15T13:00" } });
  await h.submit();
  assert.equal(h.requests.filter(request => request.method === "PATCH").length, 0);
  assert.match(h.requests[0].url, /to=2099-10-15/);
  await h.submit();
  const body = JSON.parse(h.requests.find(request => request.method === "PATCH").body);
  assert.equal(body.jobAt, "2099-10-14T10:00");
  assert.equal(body.jobEndAt, "2099-10-15T13:00");
  assert.equal(body.technicianId, "bob");
  assert.equal(body.technician, "Bob");
  assert.equal(body.inspectionAt, undefined);
  assert.equal(body.bookingNotifications, true);
  assert.equal(h.saved.length, 1);
  assert.equal(h.completed.length, 1);
});

test("the inspection popup uses its own timing and inspector", () => {
  const nodes = harness("inspection").render();
  assert.equal(nodes.find(node => node.type === "input" && node.props.type === "time").props.value, "09:00");
  assert.equal(nodes.find(node => node.type === "input" && node.props.type === "datetime-local").props.value, "2099-10-14T09:30");
  assert.equal(nodes.find(node => node.type === "select").props.value, "Clara");
});

test("an overlapping inspection blocks a job for the same person before any write", async () => {
  const h = harness("job", true);
  h.render().find(node => node.type === "select").props.onChange({ target: { value: "Bob" } });
  await h.submit();
  assert.ok(h.render().some(node => node.props?.role === "alert"));
  assert.equal(h.requests.filter(request => request.method === "PATCH").length, 0);
});
