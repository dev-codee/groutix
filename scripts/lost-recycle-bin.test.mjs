import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

for (const action of ["Lost", "Cancelled"]) for (const status of ["New", "Inspection Completed", "Job In Progress", "Quote Sent"]) {
  test(`marking ${status} as ${action} updates its status and releases bookings without deleting to recycle bin`, async () => {
    const lead = { id: "lead-1", status, previousStatus: "New", bookings: [{ type: "job", status: "Job Started" }] };
    let savedUpdates = null, released = false;
    const { PATCH } = loadTs("app/api/admin/submissions/[id]/route.ts", {
      "@/lib/mongodb": { isMongoConfigured: () => true },
      "@/lib/submissions": {
        getSubmission: async () => lead,
        deleteSubmission: async () => assert.fail("Lost/Cancelled must not delete to recycle bin"),
        updateSubmission: async (_id, updates) => { savedUpdates = updates; return true; },
        appendActivity: async () => {},
      },
      "@/lib/adminAuth": { SESSION_COOKIE: "session", verifySession: async () => ({ username: "manager" }) },
      "@/lib/bookings": { deleteBooking: async id => { assert.equal(id, lead.id); released = true; } },
      "@/lib/bookingRulesServer": { getBookingRules: async () => ({}) },
    });
    const response = await PATCH({ json: async () => ({ status: action, previousStatus: status }), cookies: { get: () => ({ value: "token" }) } }, { params: Promise.resolve({ id: lead.id }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.recycled, undefined);
    assert.equal(savedUpdates?.status, action);
    assert.equal(released, true);
  });
}

test("client save result keeps lost lead in CRM so it appears under Lost button", async () => {
  const updatedItem = { id: "lead-1", status: "Lost", previousStatus: "New" };
  const { saveLeadChanges } = loadTs("lib/saveLeadChanges.ts", {}, {
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, item: updatedItem }) }),
  });
  const result = await saveLeadChanges("lead-1", { status: "Lost" });
  assert.equal(result.ok, true);
  assert.equal(result.recycled, undefined);
  assert.equal(result.item?.status, "Lost");
});
