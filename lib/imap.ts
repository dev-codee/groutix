import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/mongodb";
import { updateSubmission, appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";
import { sendReplyNotification, getNotifyRecipients } from "@/lib/email";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

export async function syncUnreadEmails() {
  if (!user || !pass) {
    console.log("[IMAP] Missing SMTP_USER or SMTP_PASS, skipping sync.");
    return { error: "not_configured" };
  }

  let step = "init";
  
  // Wrap the entire process in a 25-second timeout so cron-job.org doesn't timeout (max 30s)
  return Promise.race([
    new Promise((resolve) => setTimeout(() => resolve({ error: "timeout", syncedCount: 0, step }), 25000)),
    (async () => {
      // imap.gmail.com is standard for Google Workspace
      const client = new ImapFlow({
        host: "imap.gmail.com",
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false,
      });

      let syncedCount = 0;

      try {
        step = "connecting";
        console.log("[IMAP] Connecting...");
        await client.connect();
        step = "connected";
        console.log("[IMAP] Connected!");
        
        step = "locking_inbox";
        console.log("[IMAP] Locking INBOX...");
        const lock = await client.getMailboxLock("INBOX");
        step = "inbox_locked";
        console.log("[IMAP] INBOX locked.");
        try {
          step = "searching";
          console.log("[IMAP] Searching for unread...");
          // Only fetch emails smaller than 5MB to prevent Vercel from hanging on huge attachments
          const searchResult = await client.search({ seen: false, smaller: 5000000 });
          
          step = "slicing";
          // Limit to the 3 most recent unread emails to ensure it completes within 25s
          const uidsToFetch = Array.isArray(searchResult) ? searchResult.slice(-3) : [];
          console.log(`[IMAP] Found ${Array.isArray(searchResult) ? searchResult.length : 0} unread (under 5MB), fetching latest ${uidsToFetch.length}...`);
          
          if (uidsToFetch.length > 0) {
            const emailsToProcess: any[] = [];
            step = "fetching";
            for await (const message of client.fetch(uidsToFetch, { source: true, envelope: true })) {
              const currentId = message.uid || message.seq;
              step = "parsing_source_" + currentId;
              console.log("[IMAP] Parsing email ID:", currentId);
              if (!message.source) continue;
        
              // Parse the raw email source
              const parsed = await simpleParser(message.source);
              emailsToProcess.push({ parsed, seq: message.seq });
            }
            
            step = "db_processing";
            for (const item of emailsToProcess) {
              const parsed = item.parsed;
              const seq = item.seq;
              const fromEmail = parsed.from?.value[0]?.address?.toLowerCase();
              
              if (fromEmail) {
                // Ignore any emails sent by staff / Groutix company addresses (outgoing messages, alerts, etc.)
                const staffEmails = new Set(
                  [
                    user.toLowerCase(),
                    (process.env.SMTP_FROM || "").toLowerCase(),
                    ...getNotifyRecipients().map((e) => e.toLowerCase()),
                  ].filter(Boolean)
                );

                if (staffEmails.has(fromEmail)) {
                  console.log("[IMAP] Skipping staff/outgoing email from:", fromEmail);
                  await client.messageFlagsAdd(seq, ["\\Seen"]);
                  continue;
                }

                step = "db_lookup_" + seq;
                // Find if this email matches any active lead in the CRM
                const db = await getDb();
                const col = db.collection<SubmissionDoc>("submissions");
                
                // Match by exact email
                const lead = await col.findOne({ 
                  email: fromEmail,
                  status: { $nin: ["Lost"] } 
                }, { sort: { createdAt: -1 } });

                if (lead) {
                  // Prevent duplicate processing if already recorded
                  if (parsed.messageId && lead.messages?.some((m) => m.id === parsed.messageId)) {
                    await client.messageFlagsAdd(seq, ["\\Seen"]);
                    continue;
                  }

                  step = "attachments_" + seq;
                  // Capture any real file attachments (skip inline/related parts
                  // like signature logos). Upload each to Cloudinary so staff can
                  // open them from the dashboard; fall back to metadata-only if the
                  // upload isn't configured or fails.
                  const crmAttachments: NonNullable<CustomerMessage["attachments"]> = [];
                  const rawAttachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
                  for (const att of rawAttachments) {
                    if (att.related) continue; // inline (e.g. logo in signature)
                    const name = att.filename || "attachment";
                    if (isCloudinaryConfigured() && att.content) {
                      try {
                        const up = await uploadBufferToCloudinary(att.content as Buffer, {
                          folder: "groutix/inbound",
                          filename: name,
                          tags: ["inbound-email"],
                        });
                        crmAttachments.push({
                          name,
                          contentType: att.contentType,
                          size: att.size,
                          url: up.secureUrl,
                          secureUrl: up.secureUrl,
                          publicId: up.publicId,
                        });
                        continue;
                      } catch (e) {
                        console.error("[IMAP] attachment upload failed:", e);
                      }
                    }
                    crmAttachments.push({ name, contentType: att.contentType, size: att.size });
                  }

                  step = "db_update_" + seq;
                  // Append the message
                  const crmMessage: CustomerMessage = {
                    id: parsed.messageId || `msg_${Date.now()}`,
                    from: "customer",
                    channel: "email",
                    subject: parsed.subject,
                    text: parsed.text || "No text content.",
                    time: (parsed.date || new Date()).toISOString(),
                    read: false,
                    ...(crmAttachments.length ? { attachments: crmAttachments } : {}),
                  };

                  await col.updateOne(
                    { _id: lead._id },
                    { $push: { messages: crmMessage } }
                  );

                  // Log activity
                  await appendActivity(lead._id.toString(), {
                    time: new Date().toISOString(),
                    actor: "system",
                    action: "Customer replied via Email",
                    detail: parsed.subject,
                  });

                  // Automatically stop follow-ups if they are in "Quote Sent"
                  if (lead.status === "Quote Sent") {
                    await updateSubmission(lead._id.toString(), { status: "In Progress" });
                  }

                  // Alert the team by email that a reply came in (best-effort,
                  // never throws — so a mail hiccup can't fail the sync).
                  await sendReplyNotification({
                    leadName: lead.name,
                    leadEmail: fromEmail,
                    subject: parsed.subject,
                    snippet: parsed.text || "",
                    leadId: lead._id.toString(),
                  });

                  syncedCount++;
                }
              }

              // Mark as SEEN so we don't process it again
              await client.messageFlagsAdd(seq, ["\\Seen"]);
            }
          }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("[IMAP Sync Error]", err);
    // don't throw, just return error so it doesn't crash the race
    return { error: "sync_failed", syncedCount: 0 };
  } finally {
    // Attempt graceful logout, but don't await indefinitely if it hangs
    Promise.race([
      client.logout(),
      new Promise(r => setTimeout(r, 1000))
    ]).catch(() => {});
    client.close();
  }

  return { syncedCount };
  })()
  ]) as Promise<{ error?: string; syncedCount?: number }>;
}
