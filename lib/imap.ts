import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/mongodb";
import { updateSubmission, appendActivity, type CustomerMessage, type SubmissionDoc } from "@/lib/submissions";

const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

export async function syncUnreadEmails() {
  if (!user || !pass) {
    console.log("[IMAP] Missing SMTP_USER or SMTP_PASS, skipping sync.");
    return { error: "not_configured" };
  }

  // Wrap the entire process in a 9-second timeout so Vercel never hits 504 Gateway Timeout
  return Promise.race([
    new Promise((resolve) => setTimeout(() => resolve({ error: "timeout", syncedCount: 0 }), 9000)),
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
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");
        try {
      // Fetch UIDs of unread emails
      const searchResult = await client.search({ seen: false });
      
      // Limit to the 10 most recent unread emails to prevent Vercel timeout
      const uidsToFetch = Array.isArray(searchResult) ? searchResult.slice(-10) : [];
      
      if (uidsToFetch.length > 0) {
        for await (const message of client.fetch(uidsToFetch, { source: true, envelope: true })) {
          if (!message.source) continue;
        
        // Parse the raw email source
        const parsed = await simpleParser(message.source);
        const fromEmail = parsed.from?.value[0]?.address?.toLowerCase();
        
        if (fromEmail) {
          // Find if this email matches any active lead in the CRM
          const db = await getDb();
          const col = db.collection<SubmissionDoc>("submissions");
          
          // Match by exact email (you could also try to match Message-ID references here)
          const lead = await col.findOne({ 
            email: fromEmail,
            // Prioritise open leads over completely closed/lost ones
            status: { $nin: ["Lost"] } 
          }, { sort: { createdAt: -1 } });

          if (lead) {
            // Append the message
            const crmMessage: CustomerMessage = {
              id: parsed.messageId || `msg_${Date.now()}`,
              from: "customer",
              channel: "email",
              subject: parsed.subject,
              text: parsed.text || "No text content.",
              time: (parsed.date || new Date()).toISOString(),
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

            syncedCount++;
          }
        }

        // Mark as SEEN so we don't process it again
        await client.messageFlagsAdd(message.seq, ["\\Seen"]);
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
