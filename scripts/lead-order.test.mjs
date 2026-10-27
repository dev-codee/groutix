import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { newestLeadsFirst } = loadTs("lib/leadOrder.ts");
const ids = list => Array.from(list, lead => lead.id);

test("newest lead comes first regardless of inspection date, job date, priority or later edits", () => {
  const leads = [
    { id: "old", createdAt: "2026-10-01T09:00:00Z", inspectionAt: "2026-10-26T09:00", quoteUpdated: "2026-10-26", priority: "Urgent" },
    { id: "new", createdAt: "2026-10-26T09:00:00Z", inspectionAt: "2026-11-01T09:00", jobAt: "2026-11-03T09:00" },
    { id: "middle", createdAt: "2026-10-15T09:00:00Z", jobAt: "2026-10-26T10:00" },
  ];
  assert.deepEqual(ids(newestLeadsFirst(leads)), ["new", "middle", "old"]);
  assert.deepEqual(ids(leads), ["old", "new", "middle"], "sorting does not mutate shared role data");
});

test("equal timestamps have deterministic pagination and invalid dates fall back safely", () => {
  const leads = [
    { id: "a", createdAt: "2026-10-26T09:00:00Z" },
    { id: "unknown", createdAt: "invalid" },
    { id: "b", createdAt: "2026-10-26T09:00:00Z" },
    { id: "legacy", createdAt: "invalid", received: "2026-10-25T09:00:00Z" },
  ];
  const first = newestLeadsFirst(leads);
  const refreshed = newestLeadsFirst([...leads].reverse());
  assert.deepEqual(ids(first.slice(0, 2)), ["b", "a"]);
  assert.deepEqual(ids(first.slice(2)), ["legacy", "unknown"]);
  assert.deepEqual(ids(refreshed), ids(first));
});

const { dashboardLeadsFirst } = loadTs("lib/leadOrder.ts");

test("inspection queues sort upcoming visits by Melbourne date and time, then recent past and undated leads", () => {
  const leads = [
    { id: "later", inspectionAt: "2026-10-28T09:00" },
    { id: "past", inspectionAt: "2026-10-26T15:00" },
    { id: "next", inspectionAt: "2026-10-27T10:00" },
    { id: "today-later", inspectionAt: "2026-10-27T14:00" },
    { id: "recent", inspectionAt: "2026-10-27T08:00" },
    { id: "invalid", inspectionAt: "invalid", createdAt: "2026-10-26T00:00Z" },
    { id: "undated", createdAt: "2026-10-27T00:00Z" },
  ];
  const original = ids(leads);
  const now = Date.parse("2026-10-27T09:00:00+11:00");
  for (const role of ["inspection", "field"]) {
    assert.deepEqual(ids(dashboardLeadsFirst(leads, role, now)), ["next", "today-later", "later", "recent", "past", "undated", "invalid"]);
  }
  assert.deepEqual(ids(leads), original);
});

test("technician queues use the individual visit time and other dashboards remain newest first", () => {
  const leads = [
    { id: "new", createdAt: "2026-10-27T00:00Z", jobAt: "2026-10-29T10:00" },
    { id: "old", createdAt: "2026-10-26T00:00Z", jobAt: "2026-10-30T10:00", activeBooking: { start: "2026-10-28T10:00" } },
  ];
  const now = Date.parse("2026-10-27T00:00Z");
  assert.deepEqual(ids(dashboardLeadsFirst(leads, "technician", now)), ["old", "new"]);
  for (const role of ["manager", "super_admin", "intake", "finance"]) {
    assert.deepEqual(ids(dashboardLeadsFirst(leads, role, now)), ["new", "old"]);
  }
});
