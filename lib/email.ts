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
 * Send an email via Google Workspace / SMTP with retry logic.
 */
export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const user = process.env.SMTP_USER || "info@groutix.com";
  const defaultFrom = process.env.SMTP_FROM || user;
  const fromAddress = args.fromEmail || defaultFrom;
  const fromName = args.fromName || "Groutix";

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: args.toEmail,
    replyTo: args.replyTo || fromAddress,
    subject: args.subject,
    html: args.html,
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

/**
 * Wraps raw email HTML in a beautiful, modern branded container for clients.
 */
export function wrapEmailHtml(contentHtml: string, preheaderText?: string): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com"}/logo.png`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Groutix</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;-webkit-font-smoothing:antialiased;">
  ${
    preheaderText
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
              <a href="https://www.groutix.com" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="${logoUrl}" alt="Groutix" width="200" style="display:block;max-width:100%;height:auto;border:0;">
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
              <p style="margin:0 0 12px;font-size:14px;color:#001f97;font-weight:600;">Stay Sealed. Stay Smiling.</p>
              <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.5;">
                You are receiving this email because you contacted Groutix.<br/>
                If you have any questions, simply reply to this email.
              </p>
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.groutix.com" style="color:#001f97;text-decoration:none;font-size:13px;font-weight:500;">www.groutix.com</a>
                    <span style="color:#cbd5e1;margin:0 8px;">|</span>
                    <a href="tel:70238094" style="color:#001f97;text-decoration:none;font-size:13px;font-weight:500;">7023 8094</a>
                  </td>
                </tr>
              </table>
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
