import { NextRequest, NextResponse } from "next/server";
import { listReminderCandidates, updateSubmission, appendActivity } from "@/lib/submissions";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";

// 24-hour appointment reminders for booked inspections and jobs. Guarded by the
// same shared CRON_SECRET as the follow-up sweep. Point a scheduler at this URL
// a few times a day (e.g. hourly) with header `x-cron-secret: <CRON_SECRET>`.

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function esc(v: string) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(dt: Date): string {
  return dt.toLocaleString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reminderHtml(name: string, kind: "inspection" | "job", whenLabel: string, address: string) {
  const heading = kind === "inspection" ? "Your Groutix inspection is tomorrow" : "Your Groutix job is tomorrow";
  return wrapEmailHtml(
    `
      <h2 style="margin:0 0 12px;color:#001f97;font-size:22px;">Hi ${esc(name || "there")},</h2>
      <p style="margin:0 0 16px;font-size:15px;">This is a friendly reminder that ${heading.toLowerCase()}.</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;">
        <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;width:120px;">When</td><td style="padding:12px;">${esc(whenLabel)}</td></tr>
          ${address ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Location</td><td style="padding:12px;">${esc(address)}</td></tr>` : ""}
        </table>
      </div>
      <p style="margin:16px 0 0;color:#64748b;font-size:13px;">Need to reschedule? Just reply to this email or call us and we'll sort it out.</p>
    `,
    heading
  );
}

async function runSweep(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Missing CRON_SECRET" }, { status: 500 });
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const provided = req.headers.get("x-cron-secret") || bearer;
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const candidates = await listReminderCandidates();
  let sent = 0;

  for (const lead of candidates) {
    // Evaluate the inspection reminder, then the job reminder, independently.
    const jobs: { kind: "inspection" | "job"; at?: string; sentFlag: boolean }[] = [
      { kind: "inspection", at: lead.inspectionAt, sentFlag: Boolean(lead.inspectionReminderSent) },
      { kind: "job", at: lead.jobAt, sentFlag: Boolean(lead.jobReminderSent) },
    ];

    for (const j of jobs) {
      if (!j.at || j.sentFlag) continue;
      const when = new Date(j.at).getTime();
      if (Number.isNaN(when)) continue;
      const delta = when - now;
      // Due when the appointment is within the next 24h and still in the future.
      if (delta > WINDOW_MS || delta < 0) continue;

      const whenLabel = fmt(new Date(when));
      if (isEmailConfigured() && lead.email) {
        try {
          await sendEmail({
            toEmail: lead.email,
            fromName: FROM_NAME,
            fromEmail: FROM_EMAIL,
            replyTo: REPLY_TO,
            subject:
              j.kind === "inspection"
                ? "Reminder: Your Groutix inspection is tomorrow"
                : "Reminder: Your Groutix job is tomorrow",
            html: reminderHtml(lead.name || "", j.kind, whenLabel, lead.address || ""),
          });
        } catch (err) {
          console.error("reminder email failed:", err);
          continue; // leave the flag unset so the next sweep retries
        }
      }

      if (lead.phone) {
        await sendSms({
          to: lead.phone,
          body: `Reminder: your Groutix ${j.kind} is on ${whenLabel}. Reply or call us to reschedule. — Groutix`,
        });
      }

      await updateSubmission(
        lead.id,
        j.kind === "inspection" ? { inspectionReminderSent: true } : { jobReminderSent: true }
      );
      await appendActivity(lead.id, {
        time: new Date().toISOString(),
        actor: "system",
        action: `24h ${j.kind} reminder sent`,
        detail: whenLabel,
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}

export async function GET(req: NextRequest) {
  return runSweep(req);
}

export async function POST(req: NextRequest) {
  return runSweep(req);
}
