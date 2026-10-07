import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Compile with the project's TypeScript dependency so no extra test runner or
// native Node TypeScript support is required.
const source = readFileSync(new URL("../lib/unassignedLeads.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { getLeadSchedulingType, getUnassignedSchedulingType } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const inspectors = [{ id: "inspector-1", name: "Inspector One", username: "inspect1" }];
const technicians = [{ id: "tech-1", name: "Tech One", username: "tech1" }];
const classify = (status, fields = {}) => getUnassignedSchedulingType(
  { id: "lead-1", createdAt: "2026-10-07", status, ...fields }, inspectors, technicians,
);

test("early statuses belong to inspections, even when they have a job number", () => {
  for (const status of ["New", "Contacted", "Waiting for Info"]) {
    assert.equal(classify(status, { jobNo: "GX-123" }), "inspection");
  }
});

test("inspection-completed and quote statuses belong to jobs", () => {
  for (const status of ["Inspection Completed", "Quote", "Quote Pending", "Quote Sent", "Quote Waiting for Approval"]) {
    assert.equal(classify(status), "job");
  }
});

test("unrelated, booked, and terminal statuses are excluded", () => {
  for (const status of ["Inspection Booked", "Job Booked", "Scheduled", "Won", "Negotiation", "Lost", "Cancelled", "Completed", "Job Done", ""]) {
    assert.equal(classify(status), null);
  }
});

test("inspector IDs and legacy inspector names, usernames, and IDs exclude inspections", () => {
  assert.equal(classify("New", { inspectorId: "inspector-1" }), null);
  for (const assigned of ["Inspector One", " inspect1 ", "INSPECTOR-1"]) {
    assert.equal(classify("Contacted", { assigned }), null);
  }
  assert.equal(classify("New", { assigned: "Intake Rep" }), "inspection");
});

test("all technician assignment fields and legacy technician assignments exclude jobs", () => {
  for (const fields of [{ technicianId: "tech-1" }, { technician: "Tech One" }, { technicianUsername: "tech1" }, { assigned: " Tech One " }, { assigned: "TECH1" }, { assigned: "tech-1" }]) {
    assert.equal(classify("Quote Sent", fields), null);
  }
});

test("a prior inspector or booking does not hide a job awaiting a technician", () => {
  assert.equal(classify("Inspection Completed", { inspectorId: "inspector-1", assigned: "Inspector One", inspectionAt: "2026-10-06T09:00:00" }), "job");
  assert.equal(classify("Quote Pending", { jobAt: "2026-10-08T10:00:00" }), "job");
  assert.equal(classify("Waiting for Info", { inspectionAt: "2026-10-08T09:00:00" }), "inspection");
});

test("blank and Unassigned values are not real field assignments", () => {
  assert.equal(classify("New", { inspectorId: "  ", assigned: " UNASSIGNED " }), "inspection");
  assert.equal(classify("Quote", { technician: "Unassigned", technicianId: " ", technicianUsername: "unassigned" }), "job");
  assert.equal(getLeadSchedulingType({ status: " quote waiting for approval " }), "job");
});
