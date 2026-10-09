import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { leadEditChanges } = loadTs("lib/leadEdit.ts");
const original = {
  id: "lead-1", name: "Sam", status: "Inspection Booked", createdAt: "2026-10-09T03:00:00Z",
  inspectionAt: "2026-10-14T10:00:00", jobAt: null, notes: "Original note",
  activity: [{ action: "Lead created" }], messages: [{ text: "Customer enquiry" }],
};
const plain = (value) => JSON.parse(JSON.stringify(value));

test("editing an inspection date only submits the changed date and reminder reset", () => {
  const changes = leadEditChanges({ ...original, inspectionAt: "2026-10-15T11:30" }, original);
  assert.deepEqual(plain(changes), { inspectionAt: "2026-10-15T11:30", inspectionReminderSent: false });
});

test("notes and contact edits preserve unchanged dates, metadata, messages and audit history", () => {
  const changes = leadEditChanges({ ...original, phone: "0412345678", notes: "Please call before arrival", inspectionAt: "2026-10-14T10:00" }, original);
  assert.deepEqual(plain(changes), { phone: "0412345678", notes: "Please call before arrival" });
});

test("both appointment dates and follow-up time can be edited together", () => {
  const changes = leadEditChanges({ ...original, inspectionAt: "2026-10-15T09:00", jobAt: "2026-10-16T11:00", follow: "2026-10-13T15:30", status: "Job Booked" }, original);
  assert.deepEqual(plain(changes), {
    status: "Job Booked", follow: "2026-10-13T15:30", inspectionAt: "2026-10-15T09:00", jobAt: "2026-10-16T11:00",
    inspectionReminderSent: false, jobReminderSent: false,
  });
});

test("clearing a date sends an explicit empty string while unchanged empty dates are omitted", () => {
  assert.deepEqual(plain(leadEditChanges({ ...original, inspectionAt: "", jobAt: "" }, original)), { inspectionAt: "", inspectionReminderSent: false });
  assert.deepEqual(plain(leadEditChanges({ ...original }, original)), {});
});
