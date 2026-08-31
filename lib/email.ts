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

