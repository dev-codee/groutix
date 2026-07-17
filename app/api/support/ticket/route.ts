import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import type { SupportMessage } from "@/lib/supportKnowledge";

export const runtime = "nodejs";

const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FIELD_LENGTH = 1000;
const MAX_TRANSCRIPT_MESSAGES = 20;
const TO_EMAIL = process.env.SUPPORT_TO_EMAIL || "info@groutix.com";
const FROM_EMAIL = process.env.BREVO_FROM || "info@groutix.com";
const CONTACT_PHONE = "7023 8094";

type TicketBody = {
  name?: string;
  email?: string;
  phone?: string;
  issue?: string;
  transcript?: SupportMessage[];
};

type SendArgs = {
  toEmail: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  html: string;
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

async function sendBrevoEmail(apiKey: string, args: SendArgs) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: args.fromName, email: FROM_EMAIL },
      to: [{ email: args.toEmail }],
      replyTo: args.replyTo ? { email: args.replyTo } : undefined,
      subject: args.subject,
      htmlContent: args.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Brevo API ${response.status}: ${detail}`);
  }
}

function row(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#0f172a;border:1px solid #e2e8f0;white-space:nowrap;vertical-align:top;">${esc(
        label
      )}</td>
      <td style="padding:8px 12px;color:#334155;border:1px solid #e2e8f0;">${esc(value).replace(
        /\n/g,
        "<br/>"
      )}</td>
    </tr>`;
}

function transcriptHtml(transcript: SupportMessage[]): string {
  if (transcript.length === 0) return "<p style=\"color:#64748b;\">No transcript supplied.</p>";

  return `
    <div style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      ${transcript
        .map(
          (message) => `
            <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
              <strong style="color:#0f172a;text-transform:capitalize;">${esc(message.role)}:</strong>
              ${esc(message.content).replace(/\n/g, "<br/>")}
            </p>`
        )
        .join("")}
    </div>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
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
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 6px;">New Chat Support Request</h2>
      <p style="margin:0 0 16px;color:#64748b;">Submitted from the website support chatbot.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:18px;">
        ${row("Name", name)}
        ${row("Email", email)}
        ${row("Phone", phone)}
        ${row("Issue", issue)}
      </table>
      <h3 style="margin:0 0 10px;">Chat Transcript</h3>
      ${transcriptHtml(transcript)}
    </div>`;

  try {
    await sendBrevoEmail(apiKey, {
      toEmail: TO_EMAIL,
      fromName: "Groutix Support Chat",
      replyTo: email,
      subject: `New Support Request — ${name}`,
      html: internalHtml,
    });
  } catch (error) {
    console.error("Support ticket email error:", error);
    return NextResponse.json(
      { error: "We couldn't send your support request right now. Please try again later." },
      { status: 502 }
    );
  }

  const customerHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 8px;color:#001f97;">Thanks, ${esc(name)}.</h2>
      <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
        Your support request has been sent to the Groutix team. We will review the details and follow up by email as soon as possible.
      </p>
      <div style="margin:0 0 16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#475569;">
        <strong style="color:#0f172a;">Your request:</strong><br/>${esc(issue).replace(/\n/g, "<br/>")}
      </div>
      <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
        If your issue is urgent, please call <a href="tel:${CONTACT_PHONE.replace(/\s/g, "")}" style="color:#001f97;font-weight:600;">${esc(
          CONTACT_PHONE
        )}</a>.
      </p>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;">- The Groutix Team</p>
    </div>`;

  try {
    await sendBrevoEmail(apiKey, {
      toEmail: email,
      fromName: "Groutix",
      replyTo: TO_EMAIL,
      subject: "We've received your support request - Groutix",
      html: customerHtml,
    });
  } catch (error) {
    console.error("Support confirmation email error:", error);
  }

  return NextResponse.json({ ok: true });
}
