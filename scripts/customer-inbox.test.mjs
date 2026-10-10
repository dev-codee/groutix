import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const { getInboxThreads, getLeadConversation } = loadTs("lib/customerInbox.ts");
const lead = {
  id: "lead-1", status: "New", createdAt: "2026-10-01T10:00:00Z", name: "Test Customer",
  messages: [
    { id: "new", from: "customer", channel: "email", text: "Please check the balcony", subject: "Repair enquiry", time: "2026-10-10T12:00:00Z", read: false },
    { id: "old", from: "groutix", channel: "email", text: "Inspection confirmed", time: "2026-10-09T12:00:00Z" },
    { id: "sms", from: "customer", channel: "sms", text: "SMS only", time: "2026-10-10T13:00:00Z", read: false },
  ],
};

test("opening and reading a conversation keeps it in Inbox and All Mail", () => {
  const readLead = { ...lead, messages: lead.messages.map(message => ({ ...message, read: true })) };
  assert.equal(getInboxThreads([readLead], "inbox", "email").length, 1);
  assert.equal(getInboxThreads([readLead], "all", "email").length, 1);
  assert.equal(getInboxThreads([readLead], "unread", "email").length, 0);
  assert.equal(getInboxThreads([readLead], "sent", "email").length, 1);
});

test("emails and SMS can be viewed independently with channel-specific unread counts", () => {
  const email = getInboxThreads([lead], "inbox", "email")[0];
  assert.equal(email.latest.id, "new");
  assert.equal(email.unreadCount, 1);
  assert.equal(email.messageCount, 2);
  assert.equal(getInboxThreads([lead], "inbox", "sms")[0].latest.id, "sms");
});

test("messages display oldest first and new replies append at the bottom without mutating stored order", () => {
  assert.equal(getLeadConversation(lead).map(message => message.id).join(","), "old,new,sms");
  assert.equal(lead.messages[0].id, "new");
});

test("mailbox searches message subjects and bodies and orders newest conversations first", () => {
  assert.equal(getInboxThreads([lead], "inbox", "email", "balcony").length, 1);
  assert.equal(getInboxThreads([lead], "inbox", "email", "repair enquiry").length, 1);
  assert.equal(getInboxThreads([lead], "inbox", "email", "no match").length, 0);
  const earlier = { ...lead, id: "earlier", messages: [lead.messages[1]] };
  assert.equal(getInboxThreads([earlier, lead], "all", "email")[0].lead.id, "lead-1");
});

test("internal notes are excluded from customer mailbox folders", () => {
  const internal = { ...lead, messages: [{ ...lead.messages[0], channel: "internal" }] };
  assert.equal(getInboxThreads([internal], "all", "all").length, 0);
});
