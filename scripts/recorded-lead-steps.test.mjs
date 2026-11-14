import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { getStepActive, getVisitStepActive, isVisitStepUnavailable } = loadTs("lib/adminHelpers.ts");
const lead = { id: "lead", status: "Job In Progress", inspectionAt: "2026-11-13T11:00", jobAt: "2026-11-14T09:00" };
const transition = (from, to) => ({ action: "Status changed", detail: `${from} → ${to}` });

test("screenshot case: job progress does not invent inspection, travel, or quote actions", () => {
  for (const status of ["Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed"]) {
    assert.equal(getVisitStepActive(lead, "inspection", status), false, status);
    assert.equal(isVisitStepUnavailable(lead, "inspection", status), true);
  }
  for (const status of ["Job En Route", "Job Arrived", "Job Done"]) assert.equal(getVisitStepActive(lead, "job", status), false);
  assert.equal(getVisitStepActive(lead, "job", "Job In Progress"), true);
  assert.equal(getStepActive(lead, "Inspection Booked"), true);
  assert.equal(getStepActive(lead, "Quote Sent"), false);
  assert.equal(getStepActive({ ...lead, quoteNumber: "draft" }, "Quote Sent"), false);
});

test("only destinations of saved transitions count, including compact dashboard evidence", () => {
  const steps = [transition("Inspection Booked", "Inspection Arrived"), transition("Job Booked", "Job In Progress")];
  for (const evidence of [{ activity: steps }, { recordedWorkflowSteps: steps }, { activity: [], recordedWorkflowSteps: steps }]) {
    const saved = { ...lead, ...evidence };
    assert.equal(getVisitStepActive(saved, "inspection", "Inspection Arrived"), true);
    assert.equal(getVisitStepActive(saved, "inspection", "Inspection En Route"), false);
  }
});

test("actual reports and delivery timestamps retain their own completion indicators", () => {
  const saved = { ...lead, inspectionReport: { status: "completed" }, quoteSentAt: "2026-11-13", invoiceSentAt: "2026-11-14", warranty: { sentAt: "2026-11-14" } };
  for (const step of ["Inspection Completed", "Quote Sent", "Invoice Sent", "Warranty Sent"]) assert.equal(getStepActive(saved, step), true);
  assert.equal(getVisitStepActive(saved, "inspection", "Inspection En Route"), false);
  assert.equal(getStepActive({ status: "Payment Received" }, "Invoice Sent"), false);
});

test("an additional booking cannot inherit another booking's recorded travel", () => {
  const saved = { ...lead, primaryJobBookingId: "first", activeBooking: { type: "job", bookingId: "second", start: "2026-11-15T09:00" }, bookings: [
    { bookingId: "first", type: "job", date: "2026-11-14", time: "09:00", status: "Job In Progress" },
    { bookingId: "second", type: "job", date: "2026-11-15", time: "09:00", status: "Job Booked" },
  ], activity: [transition("Job Booked", "Job En Route"), { action: "Booking status changed", detail: "job 2026-11-14T09:00: Job En Route → Job Arrived" }] };
  assert.equal(getVisitStepActive(saved, "job", "Job En Route"), false);
  assert.equal(getVisitStepActive(saved, "job", "Job Arrived"), false);
  saved.activity.push({ action: "Booking status changed", detail: "job 2026-11-15T09:00: Job Booked → Job In Progress (day 1 of 3)" });
  assert.equal(getVisitStepActive(saved, "job", "Job In Progress"), true);
});

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object") return [];
  return [node, ...elements(node.props?.children)];
}
test("manager card leaves skipped buttons neutral and disabled and the unsaved report unhighlighted", () => {
  const { StandardLeadCard } = loadTs("components/admin/rows/StandardLeadCard.tsx", {
    react: { useState: value => [value, () => {}], useRef: current => ({ current }) },
    "./AdminPageContext": { useAdminPageCtx: () => ({}) },
    "@/lib/useDistanceKm": { useDistanceKm: () => null },
    "@/components/admin/AdminPageContext": { useAdminPageCtx: () => ({ role: "manager", jobBookingsSaving: {}, staff: [], inspectionStaff: [], assignableTechnicians: [], isTechnicianName: () => false }) },
  });
  const nodes = elements(StandardLeadCard({ l: lead }));
  const skipped = nodes.filter(node => node.type === "button" && node.props.title === "No recorded action; workflow has already advanced");
  assert.ok(skipped.length >= 6);
  for (const button of skipped) {
    assert.equal(button.props.disabled, true);
    assert.doesNotMatch(button.props.className, /bg-amber-500|bg-blue-600/);
  }
  const form = nodes.find(node => node.type === "button" && node.props.title === "Open Inspection form");
  assert.ok(form);
  assert.doesNotMatch(form.props.className, /bg-emerald-600/);
});


test("same-time bookings use their identity instead of sharing legacy travel history", () => {
  const saved = { ...lead, primaryJobBookingId: "first", activeBooking: { type: "job", bookingId: "second", start: lead.jobAt }, bookings: [
    { bookingId: "first", type: "job", date: "2026-11-14", time: "09:00", status: "Job In Progress" },
    { bookingId: "second", type: "job", date: "2026-11-14", time: "09:00", status: "Job Booked" },
  ], activity: [{ action: "Booking status changed", detail: "job 2026-11-14T09:00: Job Booked → Job En Route" }] };
  assert.equal(getVisitStepActive(saved, "job", "Job En Route"), false);
  saved.activity[0].bookingId = "first";
  assert.equal(getVisitStepActive(saved, "job", "Job En Route"), false);
  saved.activity[0].bookingId = "second";
  assert.equal(getVisitStepActive(saved, "job", "Job En Route"), true);
});
