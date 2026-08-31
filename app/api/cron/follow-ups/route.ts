import { NextRequest, NextResponse } from "next/server";
import {
  listFollowUpCandidates,
  updateSubmission,
  appendActivity,
} from "@/lib/submissions";
import { sendBrevoEmail } from "@/lib/email";

// Scheduled follow-up sweep. Lives OUTSIDE /api/admin so it isn't behind the
// session guard; instead it requires a shared secret. Point an external
// scheduler (Vercel Cron, cron-job.org, GitHub Actions) at this URL with the
// header `x-cron-secret: <CRON_SECRET>`, e.g. once or twice a day.

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.BREVO_FROM || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
const FOLLOWUP_DAYS = Number(process.env.FOLLOWUP_DAYS || 2);
const MAX_FOLLOWUPS = 3;

function esc(v: string) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function followUpHtml(name: string, stage: number) {
  const nudges = [
    "Just checking you received the quotation we sent — happy to answer any questions.",
    "Following up on your Groutix quote. Would you like to lock in a booking date?",
    "Last check-in on your quotation before we close the file — let us know if you'd still like to go ahead.",
  ];
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#001f97;margin:0 0 8px;">Hi ${esc(name || "there")},</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">${esc(
      nudges[Math.min(stage, nudges.length - 1)]
    )}</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Reply to this email or call us and we'll take care of the rest.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">Stay Sealed. Stay Smiling. — The Groutix Team</p>
  </div>`;
}

async function runSweep(req: NextRequest) {
  // Cron jobs are disabled for now
  const cronEnabled = process.env.ENABLE_CRON_FOLLOWUPS === "true";
  if (!cronEnabled) {
    return NextResponse.json({
      ok: false,
      message: "Automated follow-up cron jobs are currently disabled.",
    });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  // Accept either an `x-cron-secret` header (cron-job.org and most external
  // schedulers) or `Authorization: Bearer <secret>` (Vercel Cron sends this
  // automatically when CRON_SECRET is set).
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const provided = req.headers.get("x-cron-secret") || bearer;
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BREVO_API_KEY;
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
    if (apiKey && lead.email) {
      try {
        await sendBrevoEmail(apiKey, {
          toEmail: lead.email,
          fromName: FROM_NAME,
          fromEmail: FROM_EMAIL,
          replyTo: REPLY_TO,
          subject: `Following up on your Groutix quote`,
          html: followUpHtml(lead.name || "", stage),
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
