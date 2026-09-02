import { NextRequest, NextResponse } from "next/server";
import {
  getSubmission,
  updateSubmission,
  appendActivity,
  getNextSequence,
  formatDocNumber,
  type WarrantyDoc,
} from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { sendEmail, isEmailConfigured, wrapEmailHtml, type EmailAttachment } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const actor = session?.username || "staff";

  let body: { id?: string; warranty?: WarrantyDoc; imageDataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });

  const lead = await getSubmission(body.id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "This lead has no email address." }, { status: 400 });

  const incoming = body.warranty || {};
  const existing = lead.warranty || {};
  // Automatic step: mint a sequential warranty number the first time.
  const warrantyNo =
    existing.warrantyNo || formatDocNumber("GX-W", await getNextSequence("warranty"));

  const now = new Date();
  const warranty: WarrantyDoc = {
    ...existing,
    ...incoming,
    warrantyNo,
    customerName: incoming.customerName || existing.customerName || lead.name,
    address: incoming.address || existing.address || lead.address,
    sentAt: now.toISOString(),
  };

  // Optional PNG card generated client-side (canvas dataURL).
  const attachments: EmailAttachment[] = [];
  if (body.imageDataUrl && body.imageDataUrl.startsWith("data:")) {
    const comma = body.imageDataUrl.indexOf(",");
    const meta = body.imageDataUrl.slice(5, comma); // e.g. image/png;base64
    const contentType = meta.split(";")[0] || "image/png";
    const content = body.imageDataUrl.slice(comma + 1);
    attachments.push({
      name: `Groutix_Warranty_${warrantyNo}.png`,
      content,
      contentType,
    });
  }

  const html = `
    <h2 style="margin:0 0 4px;color:#001f97;font-size:24px;">Your 10-Year Groutix Warranty</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Warranty ${esc(warrantyNo)}</p>
    <p style="margin:0 0 16px;">Hi ${esc(
      warranty.customerName || "there"
    )}, thank you for choosing Groutix. Your work is complete and covered by our 10-year warranty.</p>
    
    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:24px 0;">
      <table style="border-collapse:collapse;width:100%;font-size:15px;text-align:left;">
        <tr><td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;width:140px;">Warranty No.</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#334155;">${esc(
          warrantyNo
        )}</td></tr>
        ${warranty.jobNo ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">Job No.</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#334155;">${esc(warranty.jobNo)}</td></tr>` : ""}
        ${warranty.address ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">Property</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#334155;">${esc(warranty.address)}</td></tr>` : ""}
        ${warranty.completionDate ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">Completed</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#334155;">${esc(warranty.completionDate)}</td></tr>` : ""}
        ${warranty.expiryDate ? `<tr><td style="padding:12px;background:#f8fafc;font-weight:600;color:#0f172a;">Warranty Expiry</td><td style="padding:12px;color:#334155;">${esc(warranty.expiryDate)} <span style="color:#64748b;font-size:13px;margin-left:4px;">(10 Years)</span></td></tr>` : ""}
      </table>
    <div style="margin:20px 0;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;color:#166534;line-height:1.5;">
      Your warranty is issued in accordance with Clause 12 of the official <a href="https://groutix.com.au/terms-conditions" target="_blank" style="color:#001f97;font-weight:700;text-decoration:underline;">Groutix Terms &amp; Conditions</a>. Please retain your certificate and tax invoice for warranty claims.
    </div>
    <p style="margin:20px 0 0;">Your warranty card is attached. Keep it safe for your records.</p>`;

  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix 10-Year Warranty ${warrantyNo}`,
      html: wrapEmailHtml(html, `Your Groutix 10-year warranty (${warrantyNo}) is ready.`),
      attachments: attachments.length ? attachments : undefined,
    });
  } catch (err) {
    console.error("warranty send failed:", err);
    return NextResponse.json({ error: "Could not send the warranty email." }, { status: 502 });
  }

  await updateSubmission(body.id, { warranty, status: "Warranty Sent" });
  await appendActivity(body.id, {
    time: now.toISOString(),
    actor,
    action: "Warranty sent",
    detail: `${warrantyNo} to ${lead.email}`,
  });

  return NextResponse.json({ ok: true, warrantyNo });
}
