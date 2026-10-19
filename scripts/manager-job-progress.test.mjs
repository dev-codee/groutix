import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object") return [];
  return [node, ...elements(node.props?.children)];
}
function harness() {
  const prompts = [], days = [], updates = [];
  const ctx = {
    role: "manager", jobBookingsSaving: {}, staff: [], inspectionStaff: [], assignableTechnicians: [],
    isTechnicianName: () => false, setStartJobDays: value => days.push(value),
    setStartJobPrompt: value => prompts.push(value), updateJobBooking: (...args) => updates.push(args),
  };
  const overrides = {
    react: { useState: value => [value, () => {}] },
    "@/lib/useDistanceKm": { useDistanceKm: () => null },
    "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ctx },
    "./AdminPageContext": { useAdminPageCtx: () => ctx },
  };
  const { StandardLeadCard } = loadTs("components/admin/rows/StandardLeadCard.tsx", overrides);
  const { JobBookingActions } = loadTs("components/admin/JobBookingActions.tsx", overrides);
  return { ctx, prompts, days, updates,
    nodes: lead => elements(StandardLeadCard({ l: lead })),
    bookingNodes: lead => elements(JobBookingActions({ lead })),
  };
}
const lead = { id: "lead", status: "Job Booked", name: "Sam", jobAt: "2026-10-20T09:00", technician: "Alex" };

test("manager Start opens the day-count prompt instead of immediately starting a single-day job", () => {
  const h = harness();
  const job = { ...lead, jobTotalDays: 3 };
  h.nodes(job).find(node => node.type === "button" && node.props.title === "Set status: Job In Progress").props.onClick();
  assert.equal(h.days[0], 3);
  assert.equal(h.prompts[0].lead, job);
  assert.equal(h.updates.length, 0);
});

test("manager Start defaults to the booking's scheduled working days", () => {
  const h = harness();
  const job = { ...lead, jobWorkSegments: [
    { date: "2026-10-20", time: "09:00", scheduledMinutes: 480 },
    { date: "2026-10-21", time: "09:00", scheduledMinutes: 240 },
  ] };
  h.nodes(job).find(node => node.type === "button" && node.props.title === "Set status: Job In Progress").props.onClick();
  assert.equal(h.days[0], 2);
});

test("manager progress shows the saved booking day count and advances only the selected job", () => {
  const h = harness();
  const job = { ...lead, status: "Job In Progress", jobTotalDays: 5, jobDaysDone: 1, bookings: [
    { bookingId: "job-1", type: "job", date: "2026-10-20", time: "09:00", technician: "Alex", status: "Job In Progress", jobTotalDays: 3, jobDaysDone: 2 },
  ] };
  const nodes = h.nodes(job);
  const bar = nodes.find(node => node.props?.role === "progressbar");
  assert.equal(bar.props["aria-valuemax"], 3);
  assert.equal(bar.props["aria-valuenow"], 2);
  nodes.find(node => node.type === "button" && node.props.children === "Complete Day").props.onClick();
  assert.equal(h.updates[0][0], job);
  assert.equal(h.updates[0][1].jobDaysDone, 3);
  assert.equal(h.updates[0][1].status, undefined);
  job.bookings[0].jobDaysDone = 3;
  h.nodes(job).find(node => node.type === "button" && node.props.children === "Complete Job").props.onClick();
  assert.equal(h.updates[1][1].status, "Job Done");
});

test("each manager booking has its own visible progress bar and respects saving state", () => {
  const h = harness();
  const job = { ...lead, status: "Job In Progress", jobTotalDays: 4, jobDaysDone: 2,
    activeBooking: { type: "job", bookingId: "second", start: lead.jobAt } };
  const nodes = h.bookingNodes(job);
  assert.equal(nodes.find(node => node.props?.role === "progressbar").props["aria-valuenow"], 2);
  assert.equal(nodes.find(node => node.props?.role === "progressbar").props["aria-valuemax"], 4);
  h.ctx.jobBookingsSaving["lead:job:second"] = true;
  assert.equal(h.bookingNodes(job).find(node => node.type === "button" && node.props.children === "Complete Day").props.disabled, true);
});
