// Nodemailer SMTP email sender for Google Workspace and standard SMTP hosts.
//
// Leads and customer notifications are delivered via SMTP with per-attempt
// timeout and automatic retries.

import nodemailer from "nodemailer";

export type EmailAttachment = {
  name: string;
  content: string; // base64 string
  contentType?: string;
};

export type SendEmailArgs = {
  fromName?: string;
  fromEmail?: string;
  toEmail: string;
  replyTo?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

let cachedTransporter: nodemailer.Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465; // true for 465, false for other ports (587)
  const user = process.env.SMTP_USER || "info@groutix.com";
  const pass = process.env.SMTP_PASS || "";

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Pool connections to speed up multiple sends in the same request
    pool: true,
    maxConnections: 3,
  });

  return cachedTransporter;
}

/**
 * Sanitizes any outgoing email subject, text, or HTML to enforce correct branding:
 * Phone: 7023 8094
 * Email: info@groutix.com (on second line)
 * Website: www.groutix.com (strictly .com, on third line)
 */
export function cleanEmailText(content: string): string {
  if (!content || typeof content !== "string") return content;
  let text = content;

  // 1. Pipe-separated combos into multi-line signature
  text = text.replace(
    /📞\s*(?:1300\s*476\s*884|\(03\)\s*7023\s*8094|7023\s*8094)\s*(?:&nbsp;|\s)*\|(?:&nbsp;|\s)*✉️\s*info@groutix\.com(?:\.au)?/gi,
    () => {
      if (text.includes("<body") || text.includes("<p") || text.includes("<div") || text.includes("<br")) {
        return "📞 7023 8094<br/>✉️ info@groutix.com";
      }
      return "📞 7023 8094\n✉️ info@groutix.com";
    }
  );

  text = text.replace(
    /(?:1300\s*476\s*884|\(03\)\s*7023\s*8094|7023\s*8094)\s*(?:&nbsp;|\s)*\|(?:&nbsp;|\s)*info@groutix\.com(?:\.au)?/gi,
    () => {
      if (text.includes("<body") || text.includes("<p") || text.includes("<div") || text.includes("<br")) {
        return "7023 8094<br/>info@groutix.com";
      }
      return "7023 8094\ninfo@groutix.com";
    }
  );

  // 2. Normalize old phone numbers to 7023 8094
  text = text.replace(/1300\s*476\s*884/gi, "7023 8094");
  text = text.replace(/\(03\)\s*7023\s*8094/gi, "7023 8094");
  text = text.replace(/1300476884/gi, "70238094");
  text = text.replace(/tel:1300476884/gi, "tel:70238094");
  text = text.replace(/tel:\(03\)70238094/gi, "tel:70238094");

  // 3. Normalize website references to groutix.com
  text = text.replace(/https?:\/\/(?:www\.)?groutix\.com\.au/gi, "https://groutix.com");
  text = text.replace(/groutix\.com\.au/gi, "groutix.com");
  text = text.replace(/Groutix\.com\.au/gi, "groutix.com");

  return text;
}

/**
 * Send an email via Google Workspace / SMTP with retry logic.
 */
export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const user = process.env.SMTP_USER || "info@groutix.com";
  const defaultFrom = process.env.SMTP_FROM || user;
  const fromAddress = args.fromEmail || defaultFrom;
  const fromName = args.fromName || "Groutix";

  const cleanedSubject = cleanEmailText(args.subject);
  let cleanedHtml = cleanEmailText(args.html);

  // Guarantee that every outgoing email contains the official contact number (7023 8094)
  // and a clickable link to groutix.com
  const hasPhone = /7023\s*8094/.test(cleanedHtml);
  const hasWebsiteLink = /href=["']https?:\/\/(?:www\.)?groutix\.com(?:\/|["'#?])/i.test(cleanedHtml);

  if (!hasPhone || !hasWebsiteLink) {
    const contactFooter = `
      <div style="margin-top:24px;padding:16px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.9;color:#001f97;text-align:center;">
        <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">Groutix Customer Care</div>
        <div>📞 Phone: <a href="tel:70238094" style="color:#001f97;text-decoration:none;font-weight:700;">7023 8094</a></div>
        <div>✉️ Email: <a href="mailto:info@groutix.com" style="color:#001f97;text-decoration:none;font-weight:600;">info@groutix.com</a></div>
        <div>🌐 Website: <a href="https://groutix.com" target="_blank" style="color:#001f97;text-decoration:underline;font-weight:700;">groutix.com</a></div>
      </div>
    `;
    if (cleanedHtml.includes("</body>")) {
      cleanedHtml = cleanedHtml.replace("</body>", `${contactFooter}</body>`);
    } else {
      cleanedHtml += contactFooter;
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: args.toEmail,
    replyTo: args.replyTo || fromAddress,
    subject: cleanedSubject,
    html: cleanedHtml,
    attachments: args.attachments?.map((att) => ({
      filename: att.name,
      content: Buffer.from(att.content, "base64"),
      contentType: att.contentType,
    })),
  };

  const transporter = getTransporter();

  // Attempt send with retry
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return;
    } catch (err) {
      lastErr = err;
      console.error(`Email send attempt ${attempt} failed:`, err);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastErr;
}

/** Who receives internal CRM alerts (new customer replies, etc.). Comma/space
 *  separated in CRM_NOTIFY_EMAILS; falls back to the mailbox we send from. */
export function getNotifyRecipients(): string[] {
  const raw = process.env.CRM_NOTIFY_EMAILS || "";
  const list = raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length) return list;
  const fallback = process.env.SMTP_FROM || process.env.SMTP_USER || "";
  return fallback ? [fallback] : [];
}

/**
 * Alert the team that a customer replied. Best-effort: never throws, so a
 * notification failure can't break the inbox sync that triggered it.
 */
export async function sendReplyNotification(args: {
  leadName?: string;
  leadEmail?: string;
  subject?: string;
  snippet?: string;
  leadId?: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const recipients = getNotifyRecipients();
  if (recipients.length === 0) return;

  const name = args.leadName || "A customer";
  const crmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://groutix.com"}/admin`;
  const snippet = (args.snippet || "").slice(0, 300);

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:#001f97;color:#fff;padding:18px 24px;font-size:16px;font-weight:800;">📨 New customer reply</td></tr>
      <tr><td style="padding:24px;">
        <p style="margin:0 0 6px;font-size:15px;"><b>${name}</b> just replied by email.</p>
        <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${args.leadEmail || ""}</p>
        ${args.subject ? `<p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Subject</p><p style="margin:0 0 16px;font-size:14px;font-weight:600;">${escapeHtml(args.subject)}</p>` : ""}
        ${snippet ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.5;color:#334155;white-space:pre-wrap;">${escapeHtml(snippet)}${(args.snippet || "").length > 300 ? "…" : ""}</div>` : ""}
        <div style="margin-top:24px;">
          <a href="${crmUrl}" style="display:inline-block;background:#001f97;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">Open the conversation in the CRM →</a>
        </div>
      </td></tr>
    </table>
  </body></html>`;

  try {
    await sendEmail({
      fromName: "Groutix CRM",
      toEmail: recipients.join(", "),
      replyTo: args.leadEmail,
      subject: `New reply from ${name}${args.subject ? ` — ${args.subject}` : ""}`,
      html,
    });
  } catch (err) {
    console.error("sendReplyNotification failed (non-fatal):", err);
  }
}

/**
 * Generic internal alert to the team inbox (finance completion, payment
 * received, etc.). Best-effort: never throws.
 */
export async function sendInternalAlert(args: {
  title: string;
  emoji?: string;
  lines: string[]; // each rendered as its own row
  leadId?: string;
  accent?: string; // header colour
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const recipients = getNotifyRecipients();
  if (recipients.length === 0) return;

  const crmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://groutix.com"}/admin`;
  const accent = args.accent || "#001f97";
  const rows = args.lines
    .map(
      (l) =>
        `<p style="margin:0 0 8px;font-size:14px;color:#334155;">${escapeHtml(l)}</p>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:${accent};color:#fff;padding:18px 24px;font-size:16px;font-weight:800;">${args.emoji ? args.emoji + " " : ""}${escapeHtml(args.title)}</td></tr>
      <tr><td style="padding:24px;">
        ${rows}
        <div style="margin-top:20px;">
          <a href="${crmUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">Open the CRM →</a>
        </div>
      </td></tr>
    </table>
  </body></html>`;

  try {
    await sendEmail({
      fromName: "Groutix CRM",
      toEmail: recipients.join(", "),
      subject: `${args.title}`,
      html,
    });
  } catch (err) {
    console.error("sendInternalAlert failed (non-fatal):", err);
  }
}

/** Minimal HTML escaping for values interpolated into notification emails. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Returns the current logo URL (with cache-busting) for use in emails.
 * Falls back to the default if DB is unavailable.
 */
export async function getEmailLogoUrl(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com";
  try {
    const { getSiteSettings, getLogoPublicUrl } = await import("./settings");
    const settings = await getSiteSettings();
    return `${base}${getLogoPublicUrl(settings)}`;
  } catch {
    return `${base}/new_logo.jpeg`;
  }
}

/**
 * Wraps raw email HTML in a beautiful, modern branded container for clients.
 * Pass logoUrl from getEmailLogoUrl() for dynamic logo support; omit to use default.
 */
export function wrapEmailHtml(contentHtml: string, preheaderText?: string, logoUrl?: string): string {
  const resolvedLogoUrl = logoUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com"}/new_logo.jpeg`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Groutix</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  ${preheaderText
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheaderText}</div>`
      : ""
    }
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 32px;background-color:#ffffff;border-bottom:2px solid #f1f5f9;">
              <a href="https://groutix.com" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="${resolvedLogoUrl}" alt="Groutix" width="200" style="display:block;max-width:100%;height:auto;border:0;">
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;font-size:16px;line-height:1.6;color:#334155;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 12px;font-size:14px;color:#001f97;font-weight:700;">Stay Sealed. Stay Smiling.</p>
              <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.5;">
                You are receiving this email because you contacted Groutix.<br/>
                If you have any questions, simply reply to this email or call us.
              </p>
              <div style="font-size:14px;line-height:2.0;color:#001f97;font-weight:600;">
                <div>📞 <a href="tel:70238094" style="color:#001f97;text-decoration:none;font-weight:700;">7023 8094</a></div>
                <div>✉️ <a href="mailto:info@groutix.com" style="color:#001f97;text-decoration:none;font-weight:600;">info@groutix.com</a></div>
                <div>🌐 <a href="https://groutix.com" target="_blank" style="color:#001f97;text-decoration:underline;font-weight:700;">groutix.com</a></div>
              </div>
            </td>
          </tr>

        </table>
        
        <!-- Bottom spacing -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:24px 0;text-align:center;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} Groutix. All rights reserved.
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}
