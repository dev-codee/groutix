import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const leads = [
  { id: "new", status: "New", name: "New customer", email: "new@example.test", address: "Ringwood", service: "Regrouting" },
  { id: "inspection", status: "Inspection Booked", name: "Inspection customer", address: "Croydon", inspectionAt: "2099-11-05T10:00", assigned: "Inspector" },
  { id: "job", status: "Job Booked", name: "Job customer", phone: "0400000000", address: "Keilor", jobAt: "2020-01-06T11:00", technician: "Alex",
    bookings: [{ type: "job", date: "2020-01-06", time: "11:00", bookingId: "job-one", technician: "Alex", status: "Job Booked" },
      { type: "job", date: "2099-01-06", time: "11:00", bookingId: "job-two", technician: "Bob", status: "Job Booked" }] },
  { id: "cancelled-visit", status: "Contacted", name: "Cancelled visit", address: "Unknown property",
    bookings: [{ type: "inspection", date: "2099-01-06", time: "09:00", status: "Cancelled" }] },
  { id: "done", status: "Inspection Completed", name: "Finished inspection", address: "Gowanbrae", inspectionAt: "2020-01-04T10:00" },
  { id: "lost", status: "Lost", name: "Closed customer", address: "Ringwood", jobAt: "2099-01-06T10:00" },
  { id: "other", status: "Custom CRM stage", name: "Other stage", address: "Ringwood" },
];

function harness(source = leads) {
  const states = [], actions = [];
  let cursor = 0;
  const react = {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial; return [states[i], value => { states[i] = typeof value === "function" ? value(states[i]) : value; }]; },
    useMemo: callback => callback(),
  };
  const { DispatchLeadQueue } = loadTs("components/admin/DispatchLeadQueue.tsx", { react }, {
    fetch: () => { throw new Error("Browsing the lead queue must never send notifications or write records."); },
  });
  const props = { leads: source, loading: false, busy: false, radius: 15,
    onBook: (...args) => actions.push(["book", ...args]), onEdit: (...args) => actions.push(["edit", ...args]),
    onEditLead: (...args) => actions.push(["editLead", ...args]), onView: (...args) => actions.push(["view", ...args]), onShowRoute: (...args) => actions.push(["route", ...args]) };
  function render() {
    cursor = 0; const nodes = [];
    const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); };
    visit(DispatchLeadQueue(props)); return nodes;
  }
  const label = (nodes, name) => nodes.find(node => node.props?.["aria-label"] === name);
  const rows = nodes => nodes.filter(node => node.type === "tr" && node.props["data-lead-id"]).map(node => node.props["data-lead-id"]);
  const change = (name, value) => label(render(), name).props.onChange({ target: { value } });
  return { render, props, actions, label, rows, change };
}

test("the selected zone's leads render once per customer in compact rows", () => {
  const h = harness(), nodes = h.render();
  assert.deepEqual(h.rows(nodes), leads.map(lead => lead.id));
  assert.equal(h.rows(nodes).filter(id => id === "job").length, 1);
  assert.equal(nodes.some(node => node.type === "select"), false, "status filtering is owned by the main zone workspace");
  assert.equal(h.label(nodes, "Edit job:job:job-two"), undefined, "extra visits start collapsed");
  assert.deepEqual(h.actions, []);
});

test("the requested dispatch labels map to saved CRM stages without modifying statuses", () => {
  const { DISPATCH_LEAD_FILTERS, matchesDispatchLeadStatus } = loadTs("lib/dispatchLeads.ts");
  assert.deepEqual(Array.from(DISPATCH_LEAD_FILTERS, stage => stage.label), ["New Lead", "Contacted", "Waiting for Info", "Inspection Booked", "Inspection Completed", "Quote", "Quote Waiting", "Job Booked"]);
  assert.equal(matchesDispatchLeadStatus("New", "new"), true);
  assert.equal(matchesDispatchLeadStatus("Quote Sent", "quote"), true);
  assert.equal(matchesDispatchLeadStatus("Won", "quote"), true);
  assert.equal(matchesDispatchLeadStatus("Quote Pending", "quote-waiting"), true);
  assert.equal(matchesDispatchLeadStatus("Quote Waiting", "quote-waiting"), true);
  assert.equal(matchesDispatchLeadStatus("Inspection In Progress", "inspection-booked"), true);
  assert.equal(matchesDispatchLeadStatus("Job In Progress", "job-booked"), true);
  assert.equal(matchesDispatchLeadStatus("Inspection Completed", "active"), false);
  assert.equal(matchesDispatchLeadStatus("Inspection Completed", "inspection-completed"), true);
  for (const status of ["Lost", "Cancelled", "Completed", "Invoice Sent"]) assert.equal(matchesDispatchLeadStatus(status, "active"), false);
});

test("booking actions select the existing lead and correct visit type without writing anything", () => {
  const h = harness();
  h.label(h.render(), "Book inspection for new").props.onClick();
  h.label(h.render(), "Book job for new").props.onClick();
  assert.equal(h.actions[0][0], "book");
  assert.equal(h.actions[0][1], leads[0]);
  assert.equal(h.actions[0][2], "inspection");
  assert.equal(h.actions[1][1], leads[0]);
  assert.equal(h.actions[1][2], "job");
});

test("expanded visit history preserves the exact job identity for edit and route actions", () => {
  const h = harness();
  h.label(h.render(), "Toggle bookings for job").props.onClick();
  h.label(h.render(), "Edit job:job:job-two").props.onClick();
  assert.equal(h.actions[0][1], leads[2]);
  assert.equal(h.actions[0][2].bookingId, "job-two");
  assert.equal(h.actions[0][2].date, "2099-01-06");
  h.label(h.render(), "Show route job:job:job-two").props.onClick();
  assert.equal(h.actions[1][0], "route");
  assert.equal(h.actions[1][2].bookingId, "job-two");
});

test("closed leads block new bookings and allow editing details to reopen or fix missing contact information", () => {
  const h = harness();
  assert.equal(h.label(h.render(), "Book inspection for lost").props.disabled, true);
  assert.equal(h.label(h.render(), "Book job for lost").props.disabled, true);
  assert.equal(h.label(h.render(), "Edit lead lost").props.disabled, false);
  h.label(h.render(), "Edit lead lost").props.onClick();
  assert.equal(h.actions[0][0], "editLead");
  assert.equal(h.actions[0][1].id, "lost");
});

test("completed inspections can progress to a new job without putting the finished inspection on the route", () => {
  const h = harness([leads[4]]), nodes = h.render();
  assert.deepEqual(h.rows(nodes), ["done"]);
  assert.equal(nodes.some(node => node.props?.["aria-label"]?.startsWith("Show route")), false);
  h.label(nodes, "Book job for done").props.onClick();
  assert.equal(h.actions[0][1].id, "done");
  assert.equal(h.actions[0][2], "job");
});

test("pagination clamps safely when changing zones or statuses reduces the visible lead list", () => {
  const source = Array.from({ length: 45 }, (_, index) => ({ ...leads[0], id: `lead-${index}` }));
  const h = harness(source);
  assert.equal(h.rows(h.render()).length, 20);
  h.label(h.render(), "Next leads page").props.onClick();
  h.label(h.render(), "Next leads page").props.onClick();
  assert.equal(h.rows(h.render()).length, 5);
  h.props.leads = source.slice(0, 1);
  assert.deepEqual(h.rows(h.render()), ["lead-0"]);
  assert.equal(h.label(h.render(), "Next leads page").props.disabled, true);
});
