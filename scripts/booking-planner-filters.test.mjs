import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { defaultPlannerFilters, filterPlannerLeads, matchesPlannerVisit } = loadTs("lib/bookingPlannerFilters.ts");
const inspection = { type: "inspection", date: "2026-10-27", time: "09:00", assigned: "Alex", status: "Inspection Booked" };
const job = { type: "job", date: "2026-10-29", time: "10:00", technician: "Bob", status: "Job Booked" };
const leads = [
  { id: "new", name: "New customer", status: "New" },
  { id: "two-visits", name: "Customer with two visits", status: "Job Booked", jobNo: "JobNo-1742", bookings: [inspection, job] },
  { id: "cancelled", name: "Cancelled visit", status: "Contacted", bookings: [{ ...inspection, status: "Cancelled" }] },
  { id: "closed", name: "Closed customer", status: "Completed", bookings: [job] },
];
const ids = filters => Array.from(filterPlannerLeads(leads, { ...defaultPlannerFilters(), ...filters }), lead => lead.id);

test("lead filters include unbooked customers by default and exclude closed records", () => {
  assert.deepEqual(ids({}), ["new", "two-visits", "cancelled"]);
  assert.deepEqual(ids({ includeUnbooked: false }), ["two-visits"]);
  assert.deepEqual(ids({ stage: "all", includeUnbooked: false }), ["two-visits", "closed"]);
  assert.deepEqual(ids({ query: "1742" }), ["two-visits"]);
});

test("staff, visit and date filters must match the same visit", () => {
  assert.deepEqual(ids({ visitType: "inspection", staff: "alex" }), ["two-visits"]);
  assert.deepEqual(ids({ visitType: "inspection", staff: "bob" }), []);
  assert.deepEqual(ids({ staff: "alex", dateMode: "range", from: "2026-10-29", to: "2026-10-29" }), []);
  assert.deepEqual(ids({ staff: "bob", dateMode: "range", from: "2026-10-29", to: "2026-10-29" }), ["two-visits"]);
});

test("invalid dates hide booked visits and spanning bookings overlap the selected range", () => {
  assert.deepEqual(ids({ includeUnbooked: false, dateMode: "range", from: "2026-10-30", to: "2026-10-27" }), []);
  assert.equal(matchesPlannerVisit({ ...job, endAt: "2026-10-31T17:00" }, {
    ...defaultPlannerFilters(), dateMode: "range", from: "2026-10-30", to: "2026-10-30",
  }), true);
  assert.equal(leads[1].bookings.length, 2, "filtering never changes the booking data used for availability");
});

test("the header renders all controls and reset restores the defaults", () => {
  const { BookingPlannerFilters } = loadTs("components/admin/BookingPlannerFilters.tsx");
  const changes = [];
  const tree = BookingPlannerFilters({ value: { ...defaultPlannerFilters(), query: "Alex", staff: "alex", dateMode: "range" }, onChange: value => changes.push(value), staff: ["Alex"], count: 1 });
  const nodes = [];
  const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== "object") return; nodes.push(node); visit(node.props?.children); };
  visit(tree);
  for (const name of ["Planner lead status", "Planner visit type", "Planner staff", "Planner booking dates", "Planner from date", "Planner to date", "Search planner leads"]) {
    assert.ok(nodes.some(node => node.props?.["aria-label"] === name), name);
  }
  assert.ok(nodes.some(node => node.props?.type === "checkbox"));
  nodes.find(node => node.type === "button" && node.props.children === "Reset filters").props.onClick();
  assert.deepEqual({ ...changes[0] }, { ...defaultPlannerFilters() });
});
