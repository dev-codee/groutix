import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { planScheduleDrop, suggestedPlanningTime } = loadTs("lib/scheduleDrag.ts");
const { DEFAULT_BOOKING_RULES } = loadTs("lib/bookingRules.ts");
const entries = [
  { id: "first", leadId: "a", type: "inspection", date: "2026-10-08", time: "09:00" },
  { id: "second", leadId: "b", type: "job", date: "2026-10-08", time: "10:00" },
  { id: "friday", leadId: "c", type: "job", date: "2026-10-09", time: "10:00" },
];

test("dragging an unassigned lead proposes a booking on the destination day", () => {
  const proposal = planScheduleDrop({ kind: "unassigned", leadId: "new", type: "job" }, "2026-10-09", entries);
  assert.equal(proposal.kind, "book");
  assert.equal(proposal.date, "2026-10-09");
  assert.equal(proposal.leadId, "new");
});

test("dropping onto another day proposes a reschedule without moving or replacing another booking", () => {
  const snapshot = structuredClone(entries);
  const proposal = planScheduleDrop({ kind: "booking", id: "first" }, "2026-10-09", entries, "friday");
  assert.equal(proposal.kind, "reschedule");
  assert.equal(proposal.entry.id, "first");
  assert.equal(proposal.date, "2026-10-09");
  assert.deepEqual(entries, snapshot);
});

test("same-day drops reorder only onto another stop in that day", () => {
  assert.equal(planScheduleDrop({ kind: "booking", id: "first" }, "2026-10-08", entries, "second").kind, "reorder");
  for (const target of [undefined, "first", "friday"]) {
    assert.equal(planScheduleDrop({ kind: "booking", id: "first" }, "2026-10-08", entries, target), null);
  }
  assert.equal(planScheduleDrop({ kind: "booking", id: "deleted" }, "2026-10-09", entries), null);
});

test("suggested times honor destination hours and bookings of both types", () => {
  assert.equal(suggestedPlanningTime(DEFAULT_BOOKING_RULES, "job", "2026-10-09", entries, "09:00"), "11:00");
  assert.equal(suggestedPlanningTime(DEFAULT_BOOKING_RULES, "inspection", "2026-10-08", entries, "10:00"), "11:00");
  assert.equal(suggestedPlanningTime(DEFAULT_BOOKING_RULES, "inspection", "2026-10-09", entries, "14:00"), "14:00");
});
