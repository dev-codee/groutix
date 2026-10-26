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
