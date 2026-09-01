import { NextRequest, NextResponse } from "next/server";
import {
  listFollowUpCandidates,
  updateSubmission,
  appendActivity,
} from "@/lib/submissions";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";
import { buildQuoteResponseUrl } from "@/lib/quoteToken";

// Scheduled follow-up sweep. Lives OUTSIDE /api/admin so it isn't behind the
// session guard; instead it requires a shared secret. Point an external
// scheduler (Vercel Cron, cron-job.org, GitHub Actions) at this URL with the
// header `x-cron-secret: <CRON_SECRET>`, e.g. once or twice a day.

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
const FOLLOWUP_DAYS = Number(process.env.FOLLOWUP_DAYS || 2);
const MAX_FOLLOWUPS = 3;

function esc(v: string) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function followUpHtml(id: string, name: string, stage: number) {
  const nudges = [
    "Just checking you received the quotation we sent — happy to answer any questions.",
    "Following up on your Groutix quote. Would you like to lock in a booking date?",
    "Last check-in on your quotation before we close the file — let us know if you'd still like to go ahead.",
  ];
  const acceptUrl = buildQuoteResponseUrl(id, "accept");
  const declineUrl = buildQuoteResponseUrl(id, "decline");
  return wrapEmailHtml(
    `
      <h2 style="margin:0 0 12px;color:#001f97;font-size:24px;">Hi ${esc(name || "there")},</h2>
      <p style="margin:0 0 16px;">${esc(nudges[Math.min(stage, nudges.length - 1)])}</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
        <tr>
          <td style="padding-right:12px;">
            <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">✓ Accept Quote</a>
          </td>
          <td>
            <a href="${declineUrl}" style="display:inline-block;background:#ffffff;color:#64748b;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:10px;border:1px solid #cbd5e1;">Decline</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;">Or simply reply to this email or call us and we'll take care of the rest.</p>
    `,
    "Checking in on your Groutix quotation."
  );
}

async function runSweep(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing CRON_SECRET" }, { status: 500 });
  }

  // Vercel Cron sends a Bearer token; some external schedulers might use
  // a custom header. We accept both (Vercel passes `authorization: Bearer ...`
  // automatically when CRON_SECRET is set).
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const provided = req.headers.get("x-cron-secret") || bearer;
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const candidates = await listFollowUpCandidates();

  let sent = 0;
  let skipped = 0;
  for (const lead of candidates) {
    const stage = lead.followUpStage ?? 0;
    const due = lead.followUpNext ? new Date(lead.followUpNext).getTime() <= now : true;
    if (!due || stage >= MAX_FOLLOWUPS) {
      skipped++;
      continue;
    }

    const nextStage = stage + 1;
    if (isEmailConfigured() && lead.email) {
      try {
        await sendEmail({
          toEmail: lead.email,
          fromName: FROM_NAME,
          fromEmail: FROM_EMAIL,
          replyTo: REPLY_TO,
          subject: `Following up on your Groutix quote`,
          html: followUpHtml(lead.id, lead.name || "", stage),
        });
      } catch (err) {
        console.error("follow-up email failed:", err);
        skipped++;
        continue;
      }
    }

    const nowIso = new Date().toISOString();
    const isLast = nextStage >= MAX_FOLLOWUPS;
    const updates: Record<string, unknown> = { followUpStage: nextStage };
    if (!isLast) {
      updates.followUpNext = new Date(now + FOLLOWUP_DAYS * 86400000).toISOString();
    }
    await updateSubmission(lead.id, updates);
    await appendActivity(lead.id, {
      time: nowIso,
      actor: "system",
      action: isLast ? "Follow-up complete (no response)" : `Follow-up ${nextStage} sent`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent, skipped });
}

export async function GET(req: NextRequest) {
  return runSweep(req);
}

export async function POST(req: NextRequest) {
  return runSweep(req);
}
