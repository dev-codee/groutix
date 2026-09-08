import { NextRequest, NextResponse } from "next/server";
import { listReminderCandidates, updateSubmission, appendActivity } from "@/lib/submissions";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";

// Appointment reminders for booked inspections and jobs. Sends two reminders per
// appointment: one ~24 hours before and another ~1 hour before. Guarded by the
// same shared CRON_SECRET as the follow-up sweep. Point a scheduler at this URL
// frequently (e.g. every 15 min) with header `x-cron-secret: <CRON_SECRET>` so
// the 1-hour reminder lands close to the appointment time.

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Reminder tiers, evaluated closest-deadline first so the 1-hour reminder wins
// when both happen to be due in the same sweep. `floor`/`within` bound the
// "time until the appointment" that makes each tier due.
const TIERS = [
  { key: "1h" as const, floor: 0, within: HOUR_MS, when: "in about an hour", soon: true },
  { key: "24h" as const, floor: HOUR_MS, within: DAY_MS, when: "tomorrow", soon: false },
];

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

function reminderHtml(
  name: string,
  kind: "inspection" | "job",
  whenLabel: string,
  address: string,
  tierWhen: string
) {
  const heading = `Your Groutix ${kind} is ${tierWhen}`;
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
    // Evaluate the inspection appointment, then the job appointment, independently.
    const appts: { kind: "inspection" | "job"; at?: string }[] = [
      { kind: "inspection", at: lead.inspectionAt },
      { kind: "job", at: lead.jobAt },
    ];

    for (const a of appts) {
      if (!a.at) continue;
      const when = new Date(a.at).getTime();
      if (Number.isNaN(when)) continue;
      const delta = when - now;
      if (delta < 0) continue; // appointment already passed

      for (const tier of TIERS) {
        // Has this specific tier's reminder already gone out for this appointment?
        const alreadySent =
          a.kind === "inspection"
            ? tier.key === "1h"
              ? Boolean(lead.inspectionReminder1hSent)
              : Boolean(lead.inspectionReminderSent)
            : tier.key === "1h"
            ? Boolean(lead.jobReminder1hSent)
            : Boolean(lead.jobReminderSent);
        if (alreadySent) continue;
        // Due when the time-until-appointment falls inside this tier's window.
        if (delta <= tier.floor || delta > tier.within) continue;

        const whenLabel = fmt(new Date(when));
        if (isEmailConfigured() && lead.email) {
          try {
            await sendEmail({
              toEmail: lead.email,
              fromName: FROM_NAME,
              fromEmail: FROM_EMAIL,
              replyTo: REPLY_TO,
              subject: `Reminder: Your Groutix ${a.kind} is ${tier.when}`,
              html: reminderHtml(lead.name || "", a.kind, whenLabel, lead.address || "", tier.when),
            });
          } catch (err) {
            console.error("reminder email failed:", err);
            continue; // leave the flag unset so the next sweep retries
          }
        }

        if (lead.phone) {
          await sendSms({
            to: lead.phone,
            body: `Reminder: your Groutix ${a.kind} is ${tier.soon ? "coming up " : ""}on ${whenLabel}. Reply or call us to reschedule. — Groutix`,
          });
        }

        const flagField =
          a.kind === "inspection"
            ? tier.key === "1h"
              ? "inspectionReminder1hSent"
              : "inspectionReminderSent"
            : tier.key === "1h"
            ? "jobReminder1hSent"
            : "jobReminderSent";
        await updateSubmission(lead.id, { [flagField]: true });
        await appendActivity(lead.id, {
          time: new Date().toISOString(),
          actor: "system",
          action: `${tier.key} ${a.kind} reminder sent`,
          detail: whenLabel,
        });
        sent++;
        break; // one reminder per appointment per sweep
      }
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
