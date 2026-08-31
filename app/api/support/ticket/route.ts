import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { recordSubmission } from "@/lib/submissions";
import { getSiteContent } from "@/lib/siteContentServer";
import type { SupportMessage } from "@/lib/supportKnowledge";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
// Room for the send retry sequence before the platform tears the instance down.
export const maxDuration = 60;

const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FIELD_LENGTH = 1000;
const MAX_TRANSCRIPT_MESSAGES = 20;
const TO_EMAIL = process.env.SUPPORT_TO_EMAIL || "info@groutix.com";
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const DEFAULT_CONTACT_PHONE = "7023 8094";

type TicketBody = {
  name?: string;
  email?: string;
  phone?: string;
  issue?: string;
  transcript?: SupportMessage[];
};

function clientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanText(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeTranscript(value: unknown): SupportMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_TRANSCRIPT_MESSAGES)
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const role = "role" in entry ? entry.role : undefined;
      const content = cleanText("content" in entry ? entry.content : "", 1500);
      if ((role !== "user" && role !== "assistant") || !content) return [];
      return [{ role, content }];
    });
}

function row(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;white-space:nowrap;vertical-align:top;width:120px;">${esc(
        label
      )}</td>
      <td style="padding:12px;color:#334155;border-bottom:1px solid #e2e8f0;">${esc(value).replace(
        /\n/g,
        "<br/>"
      )}</td>
    </tr>`;
}

function transcriptHtml(transcript: SupportMessage[]): string {
  if (transcript.length === 0) return "<p style=\"color:#64748b;\">No transcript supplied.</p>";

  return `
    <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      ${transcript
        .map(
          (message) => `
            <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
              <strong style="color:#0f172a;text-transform:capitalize;display:block;margin-bottom:4px;">${esc(message.role)}:</strong>
              ${esc(message.content).replace(/\n/g, "<br/>")}
            </p>`
        )
        .join("")}
    </div>`;
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  const ip = clientIp(req);
  if (!rateLimit(`support-ticket:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many support requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: TicketBody;
  try {
    body = (await req.json()) as TicketBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 60);
  const issue = cleanText(body.issue, 2000);
  const transcript = normalizeTranscript(body.transcript);

  if (!name || !email || !issue) {
    return NextResponse.json(
      { error: "Please provide your name, email, and support request details." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const internalHtml = `
      <h2 style="margin:0 0 8px;color:#001f97;font-size:24px;">New Chat Support Request</h2>
      <p style="margin:0 0 24px;color:#64748b;">Submitted from the website support chatbot.</p>
      
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:32px;">
        <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
          ${row("Name", name)}
          ${row("Email", email)}
          ${row("Phone", phone)}
          ${row("Issue", issue)}
        </table>
      </div>

      <h3 style="margin:0 0 16px;color:#0f172a;font-size:18px;">Chat Transcript</h3>
      ${transcriptHtml(transcript)}`;

  try {
    await sendEmail({
      toEmail: TO_EMAIL,
      fromName: "Groutix Support Chat",
      fromEmail: FROM_EMAIL,
      replyTo: email,
      subject: `New Support Request: ${name}`,
      html: wrapEmailHtml(internalHtml, `New support request received from ${name}.`),
    });
  } catch (error) {
    console.error("Support ticket email error:", error);
    return NextResponse.json(
      { error: "We couldn't send your support request right now. Please try again later." },
      { status: 502 }
    );
  }

  // Persist the ticket (with transcript) for the admin panel. Best-effort.
  await recordSubmission({
    type: "support_ticket",
    name,
    email,
    phone,
    issue,
    transcript,
    ip,
    userAgent: req.headers.get("user-agent") || undefined,
    emailDelivered: true,
  });

  const CONTACT_PHONE =
    (await getSiteContent().catch(() => null))?.business.phone || DEFAULT_CONTACT_PHONE;

  const customerHtml = `
      <h2 style="margin:0 0 12px;color:#001f97;font-size:24px;">Thanks, ${esc(name)}.</h2>
      <p style="margin:0 0 16px;">
        Your support request has been sent to the Groutix team. We will review the details and follow up by email as soon as possible.
      </p>
      <div style="margin:24px 0;padding:16px;background:#f8fafc;border-left:4px solid #001f97;border-radius:4px;color:#475569;font-size:15px;">
        <strong style="color:#0f172a;display:block;margin-bottom:8px;">Your request:</strong>
        ${esc(issue).replace(/\n/g, "<br/>")}
      </div>
      <p style="margin:0 0 16px;">
        If your issue is urgent, please call <a href="tel:${CONTACT_PHONE.replace(/\s/g, "")}" style="color:#001f97;font-weight:600;text-decoration:none;">${esc(CONTACT_PHONE)}</a>.
      </p>`;

  try {
    await sendEmail({
      toEmail: email,
      fromName: "Groutix",
      fromEmail: FROM_EMAIL,
      replyTo: TO_EMAIL,
      subject: "We've received your support request | Groutix",
      html: wrapEmailHtml(customerHtml, "Your support request has been sent to the Groutix team."),
    });
  } catch (error) {
    console.error("Support confirmation email error:", error);
  }

  return NextResponse.json({ ok: true });
}
