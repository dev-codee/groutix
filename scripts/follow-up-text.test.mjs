import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";
const { getFollowupPrompt } = loadTs("lib/adminHelpers.ts");
const lead = { id: "test", status: "New", createdAt: "2026-10-10" };
test("follow-up shows the current status and next action across the workflow", () => {
  for (const [status, action] of [["New", "Contact customer"], ["Contacted", "Arrange inspection"], ["Waiting for Info", "Request missing information"], ["Inspection In Progress", "Complete inspection report"], ["Quote Pending", "Prepare and send quote"], ["Won", "Book job"], ["Job En Route", "Technician on the way"], ["Partial Payment", "Follow up remaining balance"]]) {
    assert.equal(getFollowupPrompt({ ...lead, status }), `${status} — ${action}`);
  }
});
test("old invoice and warranty metadata cannot override a reopened lead's next action", () => {
  assert.equal(getFollowupPrompt({ ...lead, invoiceSentAt: "2026-10-01", warranty: { sentAt: "2026-10-02" } }), "New — Contact customer");
  assert.equal(getFollowupPrompt({ ...lead, status: "Lost", previousStatus: "Quote Sent" }), "Lost — No follow-up required");
});
test("quote opens, acceptance, payments and warranty requirements update the action", () => {
  assert.match(getFollowupPrompt({ ...lead, status: "Quote Sent", quoteOpenedAt: "2026-10-10" }), /Quote opened/);
  assert.match(getFollowupPrompt({ ...lead, status: "Quote Sent", quoteAcceptedAt: "2026-10-10" }), /Book job/);
  assert.match(getFollowupPrompt({ ...lead, status: "Payment Received", warrantyProvided: false }), /No warranty required/);
  assert.match(getFollowupPrompt({ ...lead, status: "Payment Received" }), /Issue warranty/);
});
test("edited follow-up times are displayed, with manual dates taking priority over the automatic quote schedule", () => {
  const text = getFollowupPrompt({ ...lead, status: "Quote Sent", follow: "2026-10-13T15:30", followUpNext: "2026-10-15T09:00" });
  assert.match(text, /13 Oct 2026/); assert.match(text, /03:30|3:30/); assert.equal(text.includes("15 Oct"), false);
});
