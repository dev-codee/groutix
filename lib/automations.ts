// Server-side automation helpers fired on pipeline transitions (see the
// submissions PATCH route). Each is idempotent and best-effort — it logs and
// returns rather than throwing, so an email/SMS hiccup can never break the
// status change that triggered it.

import {
  getSubmission,
  updateSubmission,
  appendActivity,
  getNextSequence,
  formatDocNumber,
  type WarrantyDoc,
} from "@/lib/submissions";
import { sendEmail, isEmailConfigured, wrapEmailHtml } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { buildQuotePdfBase64 } from "@/lib/quotePdf";

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "info@groutix.com";
const FROM_NAME = "Groutix";
const REPLY_TO = "info@groutix.com";

function esc(v: string) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A 1x1 open-tracking pixel for invoice emails (see /api/track/invoice/[id]). */
export function invoiceTrackingPixel(leadId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://groutix.com").replace(/\/$/, "");
  return `<img src="${base}/api/track/invoice/${leadId}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
}

/**
 * Auto-generate and email the tax invoice when a job is marked done. Uses the
 * accepted quote amount as the (GST-inclusive) total. Sets the lead to
 * "Invoice Sent". Idempotent: does nothing if an invoice was already sent.
 */
export async function autoSendInvoice(leadId: string): Promise<void> {
  try {
    const lead = await getSubmission(leadId);
    if (!lead) return;
    if (lead.invoiceSentAt) return; // already invoiced
    if (!lead.email) {
      await appendActivity(leadId, {
        time: new Date().toISOString(),
        actor: "system",
        action: "Auto-invoice skipped — no email on file",
      });
      return;
    }
    const total = Number(lead.quoteAmount || 0);
    if (total <= 0) {
      await appendActivity(leadId, {
        time: new Date().toISOString(),
        actor: "system",
        action: "Auto-invoice skipped — no quote amount set",
      });
      return;
    }

    const gstRate = 10;
    const subtotal = total / (1 + gstRate / 100);
    const gst = total - subtotal;
    const service = lead.service || "Regrouting & waterproof resealing";
    const invoiceNumber = lead.invoiceNumber || `INV-${leadId.slice(-6).toUpperCase()}`;

    const html = `
      <h2 style="margin:0 0 4px;color:#001f97;font-size:24px;">Your Groutix Tax Invoice</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Invoice ${esc(invoiceNumber)}</p>
      <p style="margin:0 0 16px;">Hi ${esc(lead.name || "there")}, your work is complete — please find your tax invoice below.</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:24px 0;">
        <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
          <tr><td style="padding:12px;color:#334155;"><b>${esc(service)}</b></td>
              <td style="padding:12px;text-align:right;color:#334155;">$${total.toFixed(2)}</td></tr>
          <tr><td style="padding:8px 12px;color:#64748b;text-align:right;">Subtotal</td><td style="padding:8px 12px;text-align:right;">$${subtotal.toFixed(2)}</td></tr>
          <tr><td style="padding:8px 12px;color:#64748b;text-align:right;">GST (${gstRate}%)</td><td style="padding:8px 12px;text-align:right;">$${gst.toFixed(2)}</td></tr>
          <tr><td style="padding:14px 12px;font-weight:700;background:#f8fafc;text-align:right;">Total (AUD)</td><td style="padding:14px 12px;font-weight:700;background:#f8fafc;text-align:right;">$${total.toFixed(2)}</td></tr>
        </table>
      </div>
      <p style="margin:0 0 8px;">Payment status: <b style="color:#b91c1c;">UNPAID</b></p>
      <p style="margin:16px 0 0;color:#64748b;font-size:13px;">All services and payments are subject to the <a href="https://groutix.com.au/terms-conditions" style="color:#001f97;font-weight:700;">Groutix Terms &amp; Conditions</a>.</p>
      ${invoiceTrackingPixel(leadId)}`;

    const attachments = [];
    try {
      const pdfBase64 = await buildQuotePdfBase64({
        docType: "invoice",
        statusLabel: "Unpaid",
        quoteNumber: invoiceNumber,
        date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
        customerName: lead.name,
        address: lead.address,
        phone: lead.phone,
        email: lead.email,
        items: [{ service, description: "", price: total, qty: 1 }],
        subtotal,
        gst,
        total,
      });
      attachments.push({
        name: `Groutix_Invoice_${invoiceNumber}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      });
    } catch (err) {
      console.error("auto-invoice PDF failed (sending without attachment):", err);
    }

    if (isEmailConfigured()) {
      await sendEmail({
        toEmail: lead.email,
        fromName: FROM_NAME,
        fromEmail: FROM_EMAIL,
        replyTo: REPLY_TO,
        subject: `Your Groutix Tax Invoice ${invoiceNumber} — AUD $${total.toFixed(2)}`,
        html: wrapEmailHtml(html, `Your Groutix invoice ${invoiceNumber} is ready.`),
        attachments: attachments.length ? attachments : undefined,
      });
    }

    const now = new Date().toISOString();
    await updateSubmission(leadId, {
      invoiceNumber,
      invoiceSentAt: now,
      invoiceStatus: "Unpaid",
      quoteAmount: total,
      status: "Invoice Sent",
    });
    await appendActivity(leadId, {
      time: now,
      actor: "system",
      action: "Invoice auto-generated & emailed",
      detail: `${invoiceNumber} → ${lead.email} (AUD $${total.toFixed(2)})`,
    });

    if (lead.phone) {
      await sendSms({
        to: lead.phone,
        body: `Hi ${lead.name || "there"}, your Groutix tax invoice ${invoiceNumber} for AUD $${total.toFixed(2)} has been emailed to you. Thank you! — Groutix`,
      });
    }
  } catch (err) {
    console.error("autoSendInvoice failed (non-fatal):", err);
  }
}

/**
 * Auto-generate and email the 10-year warranty when payment is received. Mints a
 * sequential GX-W number and computes a 10-year expiry. Advances the lead to
 * "Completed" (the achieved end state). Idempotent on an already-sent warranty.
 */
export async function autoSendWarranty(leadId: string): Promise<void> {
  try {
    const lead = await getSubmission(leadId);
    if (!lead) return;
    if (lead.warranty?.sentAt) return; // already issued
    if (!lead.email) {
      await appendActivity(leadId, {
        time: new Date().toISOString(),
        actor: "system",
        action: "Auto-warranty skipped — no email on file",
      });
      return;
    }

    const existing = lead.warranty || {};
    const warrantyNo = existing.warrantyNo || formatDocNumber("GX-W", await getNextSequence("warranty"));
    const now = new Date();
    const completion = now.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);
    const expiry = expiryDate.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });

    const warranty: WarrantyDoc = {
      ...existing,
      warrantyNo,
      customerName: existing.customerName || lead.name,
      address: existing.address || lead.address,
      completionDate: existing.completionDate || completion,
      expiryDate: existing.expiryDate || expiry,
      dateIssued: existing.dateIssued || completion,
      authorisedBy: existing.authorisedBy || "GROUTIX PTY LTD",
      sentAt: now.toISOString(),
    };

    const html = `
      <h2 style="margin:0 0 4px;color:#001f97;font-size:24px;">Your 10-Year Groutix Warranty</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Warranty ${esc(warrantyNo)}</p>
      <p style="margin:0 0 16px;">Hi ${esc(warranty.customerName || "there")}, thank you for your payment. Your work is complete and covered by our 10-year warranty.</p>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:24px 0;">
        <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;width:140px;">Warranty No.</td><td style="padding:12px;">${esc(warrantyNo)}</td></tr>
          ${warranty.address ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Property</td><td style="padding:12px;">${esc(warranty.address)}</td></tr>` : ""}
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Completed</td><td style="padding:12px;">${esc(completion)}</td></tr>
          <tr><td style="padding:12px;background:#f8fafc;font-weight:600;">Warranty Expiry</td><td style="padding:12px;">${esc(expiry)} <span style="color:#64748b;font-size:13px;">(10 Years)</span></td></tr>
        </table>
      </div>
      <p style="margin:16px 0 0;color:#166534;font-size:13px;">Issued under Clause 12 of the <a href="https://groutix.com.au/terms-conditions" style="color:#001f97;font-weight:700;">Groutix Terms &amp; Conditions</a>. Please retain this certificate and your tax invoice.</p>`;

    if (isEmailConfigured()) {
      await sendEmail({
        toEmail: lead.email,
        fromName: FROM_NAME,
        fromEmail: FROM_EMAIL,
        replyTo: REPLY_TO,
        subject: `Your Groutix 10-Year Warranty ${warrantyNo}`,
        html: wrapEmailHtml(html, `Your Groutix 10-year warranty (${warrantyNo}) is ready.`),
      });
    }

    const nowIso = now.toISOString();
    // Warranty sent = the job is fully done; advance to the achieved end state.
    await updateSubmission(leadId, { warranty, status: "Completed" });
    await appendActivity(leadId, {
      time: nowIso,
      actor: "system",
      action: "Warranty auto-generated & emailed",
      detail: `${warrantyNo} → ${lead.email}`,
    });
    await appendActivity(leadId, {
      time: nowIso,
      actor: "system",
      action: "Job 100% completed 🏆",
    });

    if (lead.phone) {
      await sendSms({
        to: lead.phone,
        body: `Hi ${lead.name || "there"}, your Groutix 10-year warranty ${warrantyNo} has been emailed to you. Thank you for choosing Groutix!`,
      });
    }
  } catch (err) {
    console.error("autoSendWarranty failed (non-fatal):", err);
  }
}
