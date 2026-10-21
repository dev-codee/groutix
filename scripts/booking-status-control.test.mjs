import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function harness(ok = true) {
  const states = [], requests = [], saved = [], updated = [];
  let cursor = 0;
  const react = {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
  };
  const { BookingStatusControl } = loadTs("components/admin/BookingStatusControl.tsx", {
    react, "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ({ upsertLead: lead => updated.push(lead) }) },
  }, { fetch: async (url, options) => {
    requests.push({ url, ...options });
    return { ok, json: async () => ok ? { item: { id: "lead" } } : { error: "Booking has changed" } };
  } });
  function render() {
    cursor = 0; const nodes = [];
    const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); };
    visit(BookingStatusControl({ leadId: "lead", compact: true,
      booking: { bookingId: "selected-inspection", type: "inspection", date: "2026-10-21", time: "10:00", status: "Inspection Booked" },
      onSaved: status => saved.push(status) }));
    return nodes;
  }
  return { render, requests, saved, updated };
}

test("compact status control confirms the selected visit before reporting completion to the route", async () => {
  const h = harness();
  h.render().find(node => node.type === "select").props.onChange({ target: { value: "Inspection Completed" } });
  await new Promise(setImmediate);
  assert.deepEqual(h.saved, ["Inspection Completed"]);
  assert.deepEqual(h.updated, [{ id: "lead" }]);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].url, "/api/admin/submissions/lead/bookings");
  const body = JSON.parse(h.requests[0].body);
  assert.equal(body.bookingId, "selected-inspection");
  assert.equal(body.start, "2026-10-21T10:00");
  assert.equal(body.status, "Inspection Completed");
  assert.equal(body.bookingNotifications, undefined);
});

test("a rejected status change does not remove a visit or replace the customer's records", async () => {
  const h = harness(false);
  h.render().find(node => node.type === "select").props.onChange({ target: { value: "Inspection Completed" } });
  await new Promise(setImmediate);
  assert.deepEqual(h.saved, []);
  assert.deepEqual(h.updated, []);
  assert.ok(h.render().some(node => node.props?.role === "alert"));
});
