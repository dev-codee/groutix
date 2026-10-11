import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
test("quote edits are sent completely and a successful save reports success", async () => {
  let request;
  const { saveLeadChanges } = loadTs("lib/saveLeadChanges.ts", {}, { fetch: async (url, options) => { request = { url, ...options }; return { ok: true }; } });
  const updates = { quoteItems: [{ service: "Regrouting", qty: 2, price: 300 }], quoteScope: "Shower", agency: "Agency", tenants: [{ name: "Tenant", phone: "0400000000" }] };
  assert.equal((await saveLeadChanges("lead-1", updates)).ok, true);
  assert.equal(request.method, "PATCH");
  assert.deepEqual(JSON.parse(request.body), updates);
});
test("failed quote saves return the server error instead of silently reporting success", async () => {
  const { saveLeadChanges } = loadTs("lib/saveLeadChanges.ts", {}, { fetch: async () => ({ ok: false, status: 409, json: async () => ({ error: "Booking conflict" }) }) });
  const result = await saveLeadChanges("lead-1", {});
  assert.equal(result.ok, false); assert.equal(result.error, "Booking conflict");
});
test("expired sessions and connection errors give actionable messages", async () => {
  for (const [fetch, expected] of [
    [async () => ({ ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) }), /session has expired/],
    [async () => { throw new Error("network"); }, /Check your connection/],
  ]) {
    const { saveLeadChanges } = loadTs("lib/saveLeadChanges.ts", {}, { fetch });
    assert.match((await saveLeadChanges("lead-1", {})).error, expected);
  }
});
