import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./test-ts-loader.mjs";

const customer = (id = "lead-1", extra = {}) => ({ _id: { toString: () => id }, name: "Customer", email: "customer@example.com", status: "Quote Sent", quoteNumber: "QT-1482", createdAt: "2026-10-01", messages: [], activity: [], ...extra });
const mail = (uid, extra = {}) => ({ uid, seen: false, from: "customer@example.com", subject: "Re: Quote QT-1482", messageId: `<reply-${uid}@example.com>`, text: `Reply ${uid}`, ...extra });

function fixture({ messages = [mail(1)], leads = [customer()], failUid, state: initialState, failNotification = false, allMail = true, uploads = false } = {}) {
  let state = initialState;
  let failure = failUid;
  const calls = { searches: [], fetches: [], locks: [], connections: 0, notifications: 0, flags: 0, uploads: [] };
  const col = {
    find(query) {
      const match = query.$or[0].email;
      const regex = new RegExp(match.$regex, match.$options);
      const result = leads.filter(lead => regex.test(lead.email || "") || lead.tenants?.some(tenant => regex.test(tenant.email || "")));
      const cursor = { sort: () => cursor, limit: () => cursor, toArray: async () => result };
      return cursor;
    },
    findOne: async query => leads.find(lead => lead.messages?.some(message => message.id === query["messages.id"])),
    async updateOne(query, update) {
      const lead = leads.find(lead => lead._id === query._id);
      if (Array.isArray(update)) {
        lead.messages ??= [];
        lead.activity ??= [];
        return { modifiedCount: 1 };
      }
      if (update.$push) {
        const message = update.$push.messages;
        if (failure && message.id === `<reply-${failure}@example.com>`) throw new Error("Database unavailable");
        if (lead.messages.some(existing => existing.id === message.id)) return { modifiedCount: 0 };
        lead.messages.push(message);
        lead.activity.push(update.$push.activity);
      } else if (update.$set?.["messages.$.attachments"]) {
        lead.messages.find(message => message.id === query["messages.id"]).attachments = update.$set["messages.$.attachments"];
      } else if (update.$set && lead.status === query.status) Object.assign(lead, update.$set);
      return { modifiedCount: 1 };
    },
  };
  class Imap {
    mailbox = { uidValidity: 7n };
    async connect() { calls.connections++; }
    async list() { return allMail ? [{ specialUse: "\\All", path: "[Gmail]/All Mail" }] : []; }
    async getMailboxLock(path, options) { calls.locks.push({ path, options }); return { release() {} }; }
    async search(query, options) {
      calls.searches.push({ query, options });
      // Include the cursor UID as well, exercising n:*'s last-UID behavior.
      const last = query.uid ? Number(query.uid.split(":")[0]) - 1 : 0;
      return messages.filter(message => message.uid >= last).map(message => message.uid).reverse();
    }
    async fetchOne(uid, query, options) {
      calls.fetches.push({ uid, query, options });
      const message = messages.find(message => message.uid === Number(uid));
      return query.source ? { source: message } : { envelope: { from: [{ address: message.from }], subject: message.subject } };
    }
    async messageFlagsAdd() { calls.flags++; }
    close() {}
  }
  const { syncUnreadEmails } = loadTs("lib/imap.ts", {
    imapflow: { ImapFlow: Imap }, mailparser: { simpleParser: async source => ({ ...source, date: new Date("2026-10-12T10:00:00Z") }) },
    "@/lib/mongodb": { getDb: async () => ({ collection: name => name === "submissions" ? col : {
      findOne: async query => state?.uidValidity === query.uidValidity ? state : null,
      updateOne: async (query, update) => { state = { ...query, lastUid: Math.max(state?.uidValidity === query.uidValidity ? state.lastUid : 0, update.$max.lastUid) }; },
    } }) },
    "@/lib/submissions": {},
    "@/lib/email": { getNotifyRecipients: () => ["staff@example.com"], sendReplyNotification: async () => { calls.notifications++; if (failNotification) throw new Error("SMTP unavailable"); } },
    "@/lib/cloudinary": {
      isCloudinaryConfigured: () => uploads,
      uploadBufferToCloudinary: async (content, options) => {
        calls.uploads.push(options.filename);
        return { secureUrl: `https://res.cloudinary.com/test/${options.filename}`, publicId: options.filename };
      },
    },
  }, { process: { env: { SMTP_USER: "info@groutix.com", SMTP_PASS: "fixture-only" } }, console: { error() {}, log() {} } });
  return { sync: syncUnreadEmails, calls, leads, cursor: () => state, clearFailure: () => { failure = undefined; } };
}

test("read and archived replies with large attachments are imported using UIDs without changing Gmail flags", async () => {
  const f = fixture({ messages: [mail(40, { seen: true, attachments: [{ filename: "photo.jpg", size: 6000000, contentType: "image/jpeg" }] })] });
  assert.equal((await f.sync()).syncedCount, 1);
  assert.equal(f.calls.locks[0].path, "[Gmail]/All Mail");
  assert.equal(f.calls.locks[0].options.readOnly, true);
  assert.equal(f.calls.searches[0].query.seen, undefined);
  assert.equal(f.calls.searches[0].query.smaller, undefined);
  assert.equal(f.calls.searches[0].options.uid, true);
  assert.ok(f.calls.fetches.every(call => call.options.uid && call.uid === "40"));
  assert.equal(f.leads[0].messages[0].attachments[0].size, 6000000);
  assert.equal(f.leads[0].status, "In Progress");
  assert.equal(f.leads[0].messages[0].read, false);
  assert.equal(f.calls.flags, 0);
  assert.equal((await f.sync()).syncedCount, 0);
  assert.equal(f.leads[0].messages.length, 1);
});

test("more than 20 replies drain oldest first across bounded batches", async () => {
  const f = fixture({ messages: Array.from({ length: 105 }, (_, index) => mail(index + 1)) });
  const first = await f.sync();
  assert.equal(first.syncedCount, 100);
  assert.equal(first.hasMore, true);
  assert.equal(f.cursor().lastUid, 100);
  const second = await f.sync();
  assert.equal(second.syncedCount, 5);
  assert.equal(second.hasMore, false);
  assert.equal(f.leads[0].messages.map(message => message.text).join(","), Array.from({ length: 105 }, (_, index) => `Reply ${index + 1}`).join(","));
});

test("failed persistence does not advance past a missing reply and retries without duplicates", async () => {
  const f = fixture({ messages: [mail(1), mail(2), mail(3)], failUid: 2 });
  const first = await f.sync();
  assert.equal(first.error, "sync_failed");
  assert.equal(first.syncedCount, 1);
  assert.equal(f.cursor().lastUid, 1);
  f.clearFailure();
  assert.equal((await f.sync()).syncedCount, 2);
  assert.equal(f.leads[0].messages.length, 3);
  assert.equal(f.leads[0].activity.length, 3);
});

test("tenant replies and replies to older job references reach the matching job, including Lost leads", async () => {
  const older = customer("older", { quoteNumber: "QT-1482", email: "owner@example.com", tenants: [{ email: "Tenant@example.com" }], status: "Lost" });
  const newer = customer("newer", { quoteNumber: "QT-1500", email: "tenant@example.com" });
  const f = fixture({ leads: [newer, older], messages: [mail(1, { from: "tenant@example.com" })] });
  await f.sync();
  assert.equal(older.messages.length, 1);
  assert.equal(newer.messages.length, 0);
  assert.equal(older.status, "Lost");
});

test("duplicate messages, staff and unrelated senders do not add messages or change Gmail flags", async () => {
  const lead = customer();
  lead.messages.push({ id: "<reply-1@example.com>" });
  const f = fixture({ leads: [lead], messages: [mail(1), mail(2, { from: "staff@example.com" }), mail(3, { from: "unknown@example.com" })] });
  assert.equal((await f.sync()).syncedCount, 0);
  assert.equal(lead.messages.length, 1);
  assert.equal(f.calls.flags, 0);
  assert.equal(f.cursor().lastUid, 3);
  assert.equal(f.calls.fetches.filter(call => call.query.source).length, 1);
});

test("UIDVALIDITY reset rechecks recent mail and missing Message-ID has a stable fallback", async () => {
  const f = fixture({ state: { uidValidity: "old", lastUid: 999 }, messages: [mail(1, { messageId: undefined, text: undefined, html: "<p>Yes, please book it.</p>" })], allMail: false });
  assert.equal((await f.sync()).syncedCount, 1);
  assert.equal(f.calls.locks[0].path, "INBOX");
  assert.ok(f.calls.searches[0].query.since);
  assert.match(f.leads[0].messages[0].id, /^imap:.*:7:1$/);
  assert.match(f.leads[0].messages[0].text, /Yes, please book it/);
  assert.equal((await f.sync()).syncedCount, 0);
});

test("concurrent dashboard calls share a sync and notification errors do not drop later replies", async () => {
  const f = fixture({ messages: [mail(1), mail(2)], failNotification: true });
  const first = f.sync();
  assert.equal(f.sync(), first);
  assert.equal((await first).syncedCount, 2);
  assert.equal(f.calls.connections, 1);
});

test("legacy null conversations do not block customer replies or the rest of the batch", async () => {
  const f = fixture({ leads: [customer("legacy", { messages: null, activity: null })], messages: [mail(1), mail(2)] });
  assert.equal((await f.sync()).syncedCount, 2);
  assert.equal(f.leads[0].messages.length, 2);
  assert.equal(f.leads[0].activity.length, 2);
});

test("the sync route reports mailbox failures as failures rather than success", async () => {
  const { GET } = loadTs("app/api/cron/sync-emails/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    "@/lib/imap": { syncUnreadEmails: async () => ({ error: "sync_failed", syncedCount: 1 }) },
  });
  const response = await GET({});
  assert.equal(response.status, 503);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.syncedCount, 1);
});

test("embedded customer photos are uploaded with CID metadata and shown alongside regular attachments", async () => {
  const f = fixture({ uploads: true, messages: [mail(1, { attachments: [
    { related: true, contentId: "<bathroom-photo>", contentType: "image/jpeg", size: 1234, content: Buffer.from("photo") },
    { related: true, filename: "styles.css", contentType: "text/css", content: Buffer.from("css") },
    { filename: "quote.pdf", contentType: "application/pdf", content: Buffer.from("pdf") },
  ] })] });
  assert.equal((await f.sync()).syncedCount, 1);
  const attachments = f.leads[0].messages[0].attachments;
  assert.equal(attachments.length, 2);
  assert.equal(attachments[0].contentId, "bathroom-photo");
  assert.match(attachments[0].secureUrl, /image-1.jpg$/);
  assert.equal(attachments[1].name, "quote.pdf");
  assert.equal(f.calls.uploads.length, 2);
});

test("recent previously imported messages recover photos without duplicate messages, notifications or read changes", async () => {
  const lead = customer();
  lead.messages.push({ id: "<reply-1@example.com>", text: "[cid:photo]", read: true, attachments: [
    { name: "old.jpg", url: "https://res.cloudinary.com/test/old.jpg" },
    { name: "new.jpg", contentId: "photo", contentType: "image/jpeg" },
  ] });
  const f = fixture({ leads: [lead], uploads: true, messages: [mail(1, { attachments: [
    { related: true, filename: "new.jpg", contentId: "<photo>", contentType: "image/jpeg", content: Buffer.from("photo") },
  ] })] });
  assert.equal((await f.sync()).syncedCount, 0);
  assert.equal(lead.messages.length, 1);
  assert.equal(lead.messages[0].read, true);
  assert.equal(lead.messages[0].attachments.length, 2);
  assert.match(lead.messages[0].attachments[1].secureUrl, /new.jpg$/);
  assert.equal(lead.activity.length, 0);
  assert.equal(f.calls.notifications, 0);
  assert.match(f.cursor().key, /:media-v3-original-pdf$/);
});

test("media recovery keeps legacy fallback IDs and adds CIDs to existing uploads without reuploading", async () => {
  const lead = customer();
  lead.messages.push({
    id: "imap:info@groutix.com:[Gmail]/All Mail:7:1", read: true,
    attachments: [{ name: "photo.jpg", url: "https://res.cloudinary.com/test/photo.jpg" }],
  });
  const f = fixture({ leads: [lead], uploads: true, messages: [mail(1, {
    messageId: undefined, attachments: [{ filename: "photo.jpg", contentId: "<photo>", contentType: "image/jpeg", content: Buffer.from("photo") }],
  })] });
  assert.equal((await f.sync()).syncedCount, 0);
  assert.equal(lead.messages.length, 1);
  assert.equal(lead.messages[0].attachments.length, 1);
  assert.equal(lead.messages[0].attachments[0].contentId, "photo");
  assert.equal(f.calls.uploads.length, 0);
});

test("sync replaces a PDF converted to PNG using the original email without duplicate messages or notifications", async () => {
  const lead = customer();
  lead.messages.push({ id: "<reply-1@example.com>", attachments: [{ name: "report.pdf", contentType: "application/pdf", url: "https://res.cloudinary.com/test/image/upload/v1/inbound/file.png" }] });
  const f = fixture({ leads: [lead], uploads: true, messages: [mail(1, { attachments: [{ filename: "report.pdf", contentType: "application/pdf", content: Buffer.from("%PDF-1.7"), size: 8 }] })] });
  await f.sync();
  assert.deepEqual(f.calls.uploads, ["report.pdf"]);
  assert.match(lead.messages[0].attachments[0].url, /report\.pdf$/);
  assert.equal(lead.messages.length, 1);
  assert.equal(f.calls.notifications, 0);
});
