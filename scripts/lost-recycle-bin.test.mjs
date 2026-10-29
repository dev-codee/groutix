import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

for (const status of ["New", "Inspection Completed", "Job In Progress", "Quote Sent"]) {
  test(`marking ${status} lost archives its saved workflow without updating status`, async () => {
    const lead = { id: "lead-1", status, previousStatus: "New", bookings: [{ type: "job", status: "Job Started" }] };
    const snapshot = structuredClone(lead);
    let archived, released = false;
    const { PATCH } = loadTs("app/api/admin/submissions/[id]/route.ts", {
      "@/lib/mongodb": { isMongoConfigured: () => true },
      "@/lib/submissions": {
        getSubmission: async () => lead,
        deleteSubmission: async (id, actor) => { archived = { id, actor, lead: structuredClone(lead) }; return true; },
        updateSubmission: async () => assert.fail("Lost must not write a workflow status"),
        appendActivity: async () => assert.fail("Lost must not trigger a status transition"),
      },
      "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "manager" }) },
      "@/lib/bookings": { deleteBooking: async id => { assert.equal(id, lead.id); released = true; } },
      "@/lib/bookingRulesServer": { getBookingRules: async () => assert.fail("Archiving must not reschedule bookings") },
    });
    const response = await PATCH({ json: async () => ({ status: "Lost", previousStatus: "Completed" }), cookies: { get: () => ({ value: "token" }) } }, { params: Promise.resolve({ id: lead.id }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).recycled, true);
    assert.deepEqual(archived.lead, snapshot);
    assert.equal(archived.actor, "manager");
    assert.equal(released, true);
  });
}

test("client save result identifies archived leads so they are removed instead of recoloured", async () => {
  const { saveLeadChanges } = loadTs("lib/saveLeadChanges.ts", {}, {
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, recycled: true }) }),
  });
  const result = await saveLeadChanges("lead-1", { status: "Lost" });
  assert.equal(result.ok, true);
  assert.equal(result.recycled, true);
});
