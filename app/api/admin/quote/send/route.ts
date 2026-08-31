import { NextRequest, NextResponse } from "next/server";
import {
  getSubmission,
  updateSubmission,
  appendActivity,
  getNextSequence,
  formatDocNumber,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { sendEmail, isEmailConfigured, type EmailAttachment } from "@/lib/email";
import { buildQuotePdfBase64, computeQuoteTotals } from "@/lib/quotePdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";
// How long to wait before the first follow-up is due (days).
const FOLLOWUP_DAYS = Number(process.env.FOLLOWUP_DAYS || 2);

function esc(v: string) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const actor = session?.username || "staff";

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  // Automatic step: mint a sequential quote number the first time it's sent.
  const quoteNumber = lead.quoteNumber || formatDocNumber("GX-Q", await getNextSequence("quote"));

  const items = Array.isArray(lead.quoteItems) ? lead.quoteItems : [];
  const { subtotal, gst, total } = computeQuoteTotals(
    items,
    lead.quoteTaxMode,
    lead.quoteTaxRate ?? 10,
    lead.quoteAmount
  );

  const itemRows =
    items
      .map(
        (it) => `<tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;color:#334155;">${esc(
            it.service || it.description || "Service"
          )}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;color:#334155;text-align:right;">$${Number(
            it.price || 0
          ).toFixed(2)}</td>
        </tr>`
      )
      .join("") ||
    `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(
      lead.service || "Regrouting & waterproof resealing"
    )}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;">$${total.toFixed(
      2
    )}</td></tr>`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#001f97;margin:0 0 4px;">Your Groutix Quotation</h2>
    <p style="margin:0 0 16px;color:#64748b;">Quote ${esc(quoteNumber)}</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${esc(
      lead.name || "there"
    )}, thank you for your enquiry. Please find your quotation below.</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;">Service</th>
          <th style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;">Total (AUD)</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;text-align:right;">$${total.toFixed(
            2
          )}</td>
        </tr>
      </tfoot>
    </table>
    ${
      lead.quoteTerms
        ? `<p style="margin:16px 0 0;color:#64748b;font-size:12px;line-height:1.5;">${esc(
            lead.quoteTerms
          ).replace(/\n/g, "<br/>")}</p>`
        : ""
    }
    <p style="margin:20px 0 0;color:#334155;line-height:1.6;">Reply to this email or call us to proceed with your booking.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">Stay Sealed. Stay Smiling. — The Groutix Team</p>
  </div>`;

  // Automatic step: generate a branded PDF quotation and attach it.
  const attachments: EmailAttachment[] = [];
  try {
    const pdfBase64 = await buildQuotePdfBase64({
      quoteNumber,
      date: new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      customerName: lead.name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      items,
      subtotal,
      gst,
      total,
      terms: lead.quoteTerms,
    });
    attachments.push({
      name: `Groutix_Quote_${quoteNumber}.pdf`,
      content: pdfBase64,
      contentType: "application/pdf",
    });
  } catch (err) {
    // A PDF failure must not block the quote email; send without it.
    console.error("quote PDF generation failed (sending without attachment):", err);
  }

  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix Quotation ${quoteNumber} — AUD $${total.toFixed(2)}`,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    console.error("quote send failed:", err);
    return NextResponse.json({ error: "Could not send the quote email." }, { status: 502 });
  }

  // Automatic steps: record the send, set status, and start the follow-up clock.
  const now = new Date();
  const followUpNext = new Date(now.getTime() + FOLLOWUP_DAYS * 86400000).toISOString();
  await updateSubmission(body.id, {
    status: "Quote Sent",
    quoteNumber,
    quoteAmount: total,
    quoteUpdated: now.toISOString(),
    followUpStage: 0,
    followUpNext,
  });
  await appendActivity(body.id, {
    time: now.toISOString(),
    actor,
    action: "Quote emailed",
    detail: `${quoteNumber} to ${lead.email}`,
  });

  return NextResponse.json({ ok: true, quoteNumber, total });
}
