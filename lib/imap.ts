import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/mongodb";
import { type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { sendReplyNotification, getNotifyRecipients } from "@/lib/email";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { stripQuotedReply } from "@/lib/emailClean";
import { needsPdfRecovery } from "@/lib/pdfAttachment";

type SyncState = { key: string; uidValidity: string; lastUid: number };
export type EmailSyncResult = { error?: string; syncedCount: number; hasMore?: boolean; step?: string };
let activeSync: Promise<EmailSyncResult> | null = null;

// Reading a reply on a phone must not prevent it from reaching the dashboard.
// Retain the existing entry point, but use a durable UID cursor, not Seen flags.
export function syncUnreadEmails(): Promise<EmailSyncResult> {
  if (activeSync) return activeSync;
  activeSync = syncEmails().finally(() => { activeSync = null; });
  return activeSync;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function bounded<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Email sync operation timed out")), Math.max(1, timeoutMs));
    })]);
  } finally { if (timer) clearTimeout(timer); }
}

async function syncEmails(): Promise<EmailSyncResult> {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!user || !pass) return { error: "not_configured", syncedCount: 0 };

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || "imap.gmail.com", port: 993, secure: true,
    auth: { user, pass }, logger: false, connectionTimeout: 10000, socketTimeout: 15000,
  });
  let step = "connecting";
  let syncedCount = 0;
  let timedOut = false;
  const deadline = Date.now() + 45000;
  // Cancel pending IMAP work instead of leaving a timed-out Promise.race writing
  // messages in the background after the request has returned.
  const timer = setTimeout(() => { timedOut = true; client.close(); }, 50000);

  try {
    await client.connect();
    step = "selecting_mailbox";
    const mailboxes = await client.list();
    const mailbox = mailboxes.find(box => box.specialUse === "\\All")?.path || "INBOX";
    const lock = await client.getMailboxLock(mailbox, { readOnly: true });
    try {
      const db = await getDb();
      const col = db.collection<SubmissionDoc>("submissions");
      const states = db.collection<SyncState>("email_sync_state");
      // A new cursor rechecks the recent mailbox once to recover inline photos
      // discarded by the previous importer. Existing messages are enriched only.
      const key = `${user.toLowerCase()}:${mailbox}`;
      const cursorKey = `${key}:media-v3-original-pdf`;
      const uidValidity = client.mailbox ? String(client.mailbox.uidValidity) : "";
      const state = await states.findOne({ key: cursorKey, uidValidity });
      const lastUid = state?.lastUid || 0;
      const since = new Date(Date.now() - 30 * 86400000);
      step = "searching";
      const found = await client.search(lastUid ? { uid: `${lastUid + 1}:*` } : { since }, { uid: true });
      // UID n:* can include the last UID even when n is higher than it.
      // Oldest first ensures a busy inbox cannot starve older replies.
      const uids = (Array.isArray(found) ? found : []).filter(uid => uid > lastUid).sort((a, b) => a - b);
      const batch = uids.slice(0, 100);
      const staffEmails = new Set([user, process.env.SMTP_FROM || "", ...getNotifyRecipients()]
        .map(value => (value.match(/<([^>]+)>/)?.[1] || value).trim().toLowerCase()).filter(Boolean));
      let processed = 0;

      for (const uid of batch) {
        if (Date.now() >= deadline || timedOut) break;
        step = `envelope_${uid}`;
        const envelope = await client.fetchOne(String(uid), { envelope: true }, { uid: true });
        const fromEmail = envelope && envelope.envelope?.from?.[0]?.address?.trim().toLowerCase();
        if (fromEmail && !staffEmails.has(fromEmail)) {
          const emailMatch = { $regex: `^${escapeRegex(fromEmail)}$`, $options: "i" };
          const leads = await col.find({ $or: [{ email: emailMatch }, { "tenants.email": emailMatch }] })
            .sort({ createdAt: -1 }).toArray();
          const subject = envelope && envelope.envelope?.subject || "";
          const lead = leads.find(item => [item.quoteNumber, item.jobNo, item.jobNo?.replace(/^(?:JOBNO|Job No)-/i, "QT-")]
            .some(ref => ref && new RegExp(`(?:^|[^a-z0-9])${escapeRegex(ref)}(?:$|[^a-z0-9])`, "i").test(subject))) || leads[0];
          if (lead) {
            step = `source_${uid}`;
            // No size filter: customer replies with photos still need importing.
            // Fetch bodies only for known customers, skipping unrelated mail.
            const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
            if (!message || !message.source) throw new Error(`Missing source for UID ${uid}`);
            const parsed = await simpleParser(message.source, { skipImageLinks: true });
            const messageId = parsed.messageId || `imap:${key}:${uidValidity}:${uid}`;
            const existing = await col.findOne({ "messages.id": messageId });
            const existingMessage = existing?.messages?.find(item => item.id === messageId);
            if (!existing || (existing._id.toString() === lead._id.toString() && parsed.attachments?.length)) {
              step = `attachments_${uid}`;
              const attachments: NonNullable<CustomerMessage["attachments"]> = [...(existingMessage?.attachments || [])];
              for (const att of parsed.attachments || []) {
                // Related images are photos embedded in the email body.
                if (att.related && !att.contentType?.startsWith("image/")) continue;
                const name = att.filename || (att.contentType?.startsWith("image/") ? `image-${attachments.length + 1}.${att.contentType.split("/")[1] === "jpeg" ? "jpg" : att.contentType.split("/")[1]}` : "attachment");
                const contentId = att.contentId?.replace(/^<|>$/g, "");
                const previousIndex = attachments.findIndex(item => (contentId && item.contentId === contentId) || (!item.contentId && item.name === name));
                if (previousIndex >= 0 && (attachments[previousIndex].url || attachments[previousIndex].secureUrl) && !needsPdfRecovery(attachments[previousIndex])) {
                  if (contentId) attachments[previousIndex] = { ...attachments[previousIndex], contentId };
                  continue;
                }
                const metadata = { name, contentType: att.contentType, size: att.size, ...(contentId ? { contentId } : {}) };
                let imported: (typeof attachments)[number] = previousIndex >= 0 ? { ...attachments[previousIndex], ...metadata } : metadata;
                if (isCloudinaryConfigured() && att.content && Date.now() < deadline) {
                  try {
                    const up = await bounded(uploadBufferToCloudinary(att.content, { folder: "groutix/inbound", filename: name, tags: ["inbound-email"] }), Math.min(10000, deadline - Date.now()));
                    imported = { ...metadata, url: up.secureUrl, secureUrl: up.secureUrl, publicId: up.publicId };
                  } catch (error) { console.error("[IMAP] attachment upload failed:", error); }
                }
                if (previousIndex >= 0) attachments[previousIndex] = imported;
                else attachments.push(imported);
              }
              if (existing) {
                await col.updateOne({ _id: lead._id, "messages.id": messageId }, {
                  $set: { "messages.$.attachments": attachments },
                });
              } else {
                const body = parsed.text || (typeof parsed.html === "string" ? parsed.html.replace(/<br\s*\/?\s*>|<\/p>/gi, "\n").replace(/<[^>]*>/g, " ") : "");
                const text = stripQuotedReply(body) || body || "No text content.";
                const crmMessage: CustomerMessage = {
                  id: messageId, from: "customer", channel: "email", subject: parsed.subject,
                  text, time: (parsed.date || new Date()).toISOString(), read: false,
                  ...(attachments.length ? { attachments } : {}),
                };
                step = `saving_${uid}`;
                if (!lead.messages || !lead.activity) {
                  // Legacy documents can have null conversation/activity fields.
                  // Normalize against the current DB value, preserving messages
                  // another sync may have appended since this lead was fetched.
                  await col.updateOne({ _id: lead._id }, [{ $set: {
                    messages: { $ifNull: ["$messages", []] }, activity: { $ifNull: ["$activity", []] },
                  } }]);
                }
                // Atomic conditional push also prevents duplicate activity when
                // cron and the dashboard import the same message concurrently.
                const saved = await col.updateOne({ _id: lead._id, "messages.id": { $ne: messageId } }, {
                  $push: { messages: crmMessage, activity: {
                    time: new Date().toISOString(), actor: "system", action: "Customer replied via Email", detail: parsed.subject,
                  } },
                });
                if (saved.modifiedCount) {
                  syncedCount++;
                  await col.updateOne({ _id: lead._id, status: "Quote Sent" }, { $set: { status: "In Progress" } });
                  // Alerts are best effort; a failure cannot block later replies.
                  try {
                    if (Date.now() < deadline) await bounded(sendReplyNotification({ leadName: lead.name, leadEmail: fromEmail, subject: parsed.subject, snippet: text, leadId: lead._id.toString() }), Math.min(5000, deadline - Date.now()));
                  } catch (error) { console.error("[IMAP] reply notification failed:", error); }
                }
              }
            }
          }
        }
        // Advance only after persistence succeeds; failures retry next run.
        // Dashboard syncing never changes Gmail's Seen flags.
        await states.updateOne({ key: cursorKey, uidValidity }, { $max: { lastUid: uid }, $set: { key: cursorKey, uidValidity } }, { upsert: true });
        processed++;
      }
      return { syncedCount, hasMore: processed < uids.length, ...(timedOut ? { error: "timeout", step } : {}) };
    } finally { lock.release(); }
  } catch (error) {
    console.error("[IMAP Sync Error]", step, error);
    return { error: timedOut ? "timeout" : "sync_failed", syncedCount, step };
  } finally {
    clearTimeout(timer);
    client.close();
  }
}
