import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Where new quote requests are delivered internally.
const TO_EMAIL = "info@Groutix.com";
// The "from" address must be a sender you've verified in Brevo. Set it via
// BREVO_FROM in .env.local.
const FROM_EMAIL = process.env.BREVO_FROM || "info@Groutix.com";
// Shown in the inbox for the internal notification (customer confirmation
// uses a plain "Groutix" name below).
const INTERNAL_FROM_NAME = "Groutix Website Enquiry";
const CUSTOMER_FROM_NAME = "Groutix";
// Public phone shown to customers for urgent enquiries.
const CONTACT_PHONE = "7023 8094";

// Anti-spam limits.
const RATE_LIMIT = 5; // submissions...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes per IP.

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Verify a Cloudflare Turnstile token. Returns true when the token is valid,
// or when Turnstile isn't configured yet (so setup isn't blocked).
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification.");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}

// Max total attachment size. Brevo caps the whole message near 10MB for the
// transactional API; stay under it.
const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024;

type EmailAttachment = { name: string; content: string };
type SendArgs = {
  toEmail: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

// Send one email through Brevo's transactional HTTP API. Uses the API key,
// which (unlike SMTP) is not restricted by authorized IPs — so it works from
// a dynamic local IP and from serverless hosts. Throws on a non-2xx response.
async function sendBrevoEmail(apiKey: string, args: SendArgs) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
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
      attachment: args.attachments?.length ? args.attachments : undefined,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo API ${res.status}: ${detail}`);
  }
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export async function POST(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  // Throttle repeated submissions from the same IP.
  const ip = clientIp(req);
  if (!rateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  // Bot check — must pass before we do any work or send any mail.
  const captchaToken = ((form.get("cf-turnstile-response") as string | null) ?? "").trim();
  if (!(await verifyTurnstile(captchaToken, ip))) {
    return NextResponse.json(
      { error: "Verification failed. Please tick the box and try again." },
      { status: 403 }
    );
  }

  const get = (key: string) => ((form.get(key) as string | null) ?? "").trim();

  const firstName = get("firstName");
  const lastName = get("lastName");
  const email = get("email");
  const phone = get("phone");
  const address = get("address");
  const city = get("city");
  const state = get("state");
  const enquiry = get("enquiry");
  const message = get("message");
  const areas = get("areas");
  const heard = get("heard");
  const sourcePage = get("sourcePage");

  // Minimal server-side validation mirroring the client.
  if (!firstName || !lastName || !email || !phone) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }

  // Collect optional photo attachments (Brevo wants base64-encoded content).
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  let totalBytes = 0;
  const attachments: EmailAttachment[] = [];
  for (const file of photos) {
    totalBytes += file.size;
    if (totalBytes > MAX_ATTACHMENT_BYTES) break;
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      name: file.name || "photo",
      content: buffer.toString("base64"),
    });
  }

  const fullName = `${firstName} ${lastName}`.trim();

  // 1) Internal notification to the Groutix inbox with all the details.
  const internalHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
    <h2 style="margin:0 0 4px;">New Quote Request</h2>
    <p style="margin:0 0 16px;color:#64748b;">Submitted via the Groutix website${
      sourcePage ? ` (${esc(sourcePage)})` : ""
    }</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      ${row("Name", fullName)}
      ${row("Email", email)}
      ${row("Phone", phone)}
      ${row("Address", address)}
      ${row("City", city)}
      ${row("State", state)}
      ${row("Areas to service", areas)}
      ${row("Enquiry about", enquiry)}
      ${row("Message", message)}
      ${row("Heard about us", heard)}
      ${row("Photos attached", attachments.length ? String(attachments.length) : "")}
    </table>
  </div>`;

  try {
    await sendBrevoEmail(apiKey, {
      toEmail: TO_EMAIL,
      fromName: INTERNAL_FROM_NAME,
      replyTo: email || undefined,
      subject: `New Quote Request — ${fullName || "Website"}`,
      html: internalHtml,
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    logSendError("internal notification", err);
    return NextResponse.json(
      { error: "We couldn't send your request. Please try again or call us." },
      { status: 502 }
    );
  }

  // 2) Confirmation to the customer. If this fails we still succeed overall —
  //    the lead has already reached the Groutix inbox, so we don't lose it.
  const customerHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <h2 style="margin:0 0 8px;color:#001f97;">Thanks, ${esc(firstName)}!</h2>
    <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
      We've received your quote request and a Groutix specialist will be in touch
      shortly to arrange the next steps.
    </p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
      If your enquiry is urgent, call us on
      <a href="tel:${CONTACT_PHONE.replace(/\s/g, "")}" style="color:#001f97;font-weight:600;">${esc(
        CONTACT_PHONE
      )}</a>.
    </p>
    ${
      message
        ? `<div style="margin:0 0 16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#475569;">
             <strong style="color:#0f172a;">Your message:</strong><br/>${esc(message).replace(
               /\n/g,
               "<br/>"
             )}
           </div>`
        : ""
    }
    <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;">
      — The Groutix Team
    </p>
  </div>`;

  try {
    await sendBrevoEmail(apiKey, {
      toEmail: email,
      fromName: CUSTOMER_FROM_NAME,
      replyTo: TO_EMAIL,
      subject: "We've received your request — Groutix",
      html: customerHtml,
    });
  } catch (err) {
    logSendError("customer confirmation", err);
    // Intentionally not failing the request.
  }

  return NextResponse.json({ ok: true });
}

function logSendError(label: string, err: unknown) {
  console.error(`Brevo email error (${label}):`, err);
}
