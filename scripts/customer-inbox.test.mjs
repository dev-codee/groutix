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
  assert.equal(email.messageCount, 1);
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

test("generated lead enquiries and website submissions are not received emails", () => {
  const enquiry = { ...lead, messages: [], service: "Shower Regrouting", notes: "Please call me", source: "Website" };
  const sentOnly = { ...enquiry, id: "sent-only", messages: [lead.messages[1]] };
  for (const folder of ["inbox", "unread", "sent", "all"]) {
    assert.equal(getInboxThreads([enquiry], folder, "email").length, 0);
  }
  assert.equal(getInboxThreads([sentOnly], "inbox", "email").length, 0);
  assert.equal(getInboxThreads([sentOnly], "all", "email").length, 1);
  assert.equal(getInboxThreads([sentOnly], "sent", "email")[0].latest.id, "old");
  assert.equal(getLeadConversation(enquiry)[0].initial, true);
});

test("folder previews, counts, search and sorting use messages from that folder", () => {
  const outgoing = { ...lead.messages[1], id: "outgoing", subject: "Outgoing-only subject", time: "2026-10-12T12:00:00Z" };
  const mixed = { ...lead, messages: [...lead.messages, outgoing] };
  const inbox = getInboxThreads([mixed], "inbox", "email")[0];
  assert.equal(inbox.latest.id, "new");
  assert.equal(inbox.messageCount, 1);
  const sent = getInboxThreads([mixed], "sent", "email")[0];
  assert.equal(sent.latest.id, "outgoing");
  assert.equal(sent.messageCount, 2);
  assert.equal(sent.unreadCount, 0);
  assert.equal(getInboxThreads([mixed], "all", "email")[0].messageCount, 3);
  assert.equal(getInboxThreads([mixed], "inbox", "email", "Outgoing-only subject").length, 0);
  assert.equal(getInboxThreads([mixed], "sent", "email", "Outgoing-only subject").length, 1);
  const newerReceived = { ...lead, id: "newer-received", messages: [{ ...lead.messages[0], time: "2026-10-11T12:00:00Z" }] };
  assert.equal(getInboxThreads([mixed, newerReceived], "inbox", "email")[0].lead.id, "newer-received");
});

test("legacy emails remain visible while saved initial enquiries and SMS stay out of Email", () => {
  const legacy = { ...lead.messages[0], id: "legacy", channel: undefined };
  const initial = { ...lead.messages[0], id: "initial", channel: undefined, initial: true };
  const storedEnquiry = { ...lead.messages[0], id: "lead-message", channel: "lead" };
  const example = { ...lead, messages: [legacy, initial, storedEnquiry, lead.messages[2]] };
  assert.equal(getInboxThreads([example], "inbox", "email")[0].messageCount, 1);
  assert.equal(getInboxThreads([example], "all", "email")[0].latest.id, "legacy");
  assert.equal(getInboxThreads([example], "all", "all")[0].messageCount, 2);
});

test("Intake inbox includes only leads assigned to the current account by name, username or ID", () => {
  const { getInboxLeads } = loadTs("lib/customerInbox.ts");
  const staff = [
    { id: "staff-a", username: "intake.a", name: "Alice Smith", role: "intake", active: true },
    { id: "staff-b", username: "intake.b", name: "Bob Smith", role: "intake", active: true },
  ];
  const leads = [
    { ...lead, id: "name", assigned: " Alice Smith " },
    { ...lead, id: "username", assigned: "INTAKE.A" },
    { ...lead, id: "id", assigned: "staff-a" },
    { ...lead, id: "other", assigned: "Bob Smith", technicianId: "staff-a" },
    { ...lead, id: "unassigned", assigned: "Unassigned" },
    { ...lead, id: "blank", assigned: "" },
  ];
  const own = getInboxLeads(leads, "intake", "intake.a", staff);
  assert.equal(own.map(item => item.id).join(","), "name,username,id");
  assert.equal(getInboxLeads(leads, "intake", "Alice Smith", staff).length, 3, "manager role preview uses the selected staff identity");
  assert.equal(getInboxLeads(leads, "intake", "intake.b", staff).map(item => item.id).join(","), "other");
  assert.equal(getInboxLeads(leads, "intake", "", staff).length, 0);
  assert.equal(getInboxLeads(leads, "intake", "Unassigned", staff).length, 0);
  assert.equal(getInboxLeads(leads, "manager", "manager", staff), leads);
  for (const folder of ["inbox", "unread", "sent", "all"]) {
    assert.equal(getInboxThreads(own, folder, "all").length, 3);
    assert.equal(getInboxThreads(own, folder, "all", "Bob").length, 0);
  }
  leads[0].assigned = "Bob Smith";
  assert.equal(getInboxLeads(leads, "intake", "intake.a", staff).length, 2, "reassignment removes the conversation");
});
