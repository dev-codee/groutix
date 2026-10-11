import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
function api({ fail = false } = {}) {
  const writes = [];
  const { PATCH } = loadTs("app/api/admin/submissions/[id]/route.ts", {
    "@/lib/mongodb": { isMongoConfigured: () => true },
    "@/lib/submissions": { updateSubmission: async (...args) => { if (fail) throw new Error("database unavailable"); writes.push(args); return true; },
      getSubmission: async () => { throw new Error("quote save must not read the complete lead"); } },
    "@/lib/zoneRulesServer": { getZoneRules: async () => { throw new Error("quote save must not load booking rules"); } },
  }, { console: { error: () => {} } });
  return { writes, run: updates => PATCH({ json: async () => updates }, { params: Promise.resolve({ id: "lead-1" }) }) };
}
test("quote and contact edits save directly without booking, lead-read or notification dependencies", async () => {
  const fixture = api();
  const edits = { quoteItems: [{ service: "Tile repair", price: 100, qty: 2 }], quoteScope: "Repair", quoteUpdated: "2026-10-11", name: "Manager", agency: "Agency", tenants: [{ name: "Tenant", phone: "0400000000" }] };
  const response = await fixture.run(edits);
  assert.equal(response.status, 200);
  assert.equal(fixture.writes.length, 1);
  assert.equal(JSON.stringify(fixture.writes[0][1]), JSON.stringify(edits));
});
test("quote database errors return a failure response instead of leaving the request pending", async () => {
  assert.equal((await api({ fail: true }).run({ quoteItems: [] })).status, 503);
});
test("direct quote data writes do not wait for index creation", async () => {
  let indexed = false, saved = false;
  const collection = { createIndexes: () => { indexed = true; return new Promise(() => {}); }, updateOne: async () => { saved = true; return { matchedCount: 1 }; } };
  const { updateSubmission } = loadTs("lib/submissions.ts", {
    "@/lib/mongodb": { getDb: async () => ({ collection: () => collection }) }, "@/lib/users": {},
  });
  assert.equal(await updateSubmission("507f1f77bcf86cd799439011", { quoteItems: [] }), true);
  assert.equal(saved, true); assert.equal(indexed, false);
});
