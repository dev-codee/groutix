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
import { sendEmail, isEmailConfigured, type EmailAttachment } from "@/lib/email";

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
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#001f97;margin:0 0 4px;">Your 10-Year Groutix Warranty</h2>
    <p style="margin:0 0 16px;color:#64748b;">Warranty ${esc(warrantyNo)}</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${esc(
      warranty.customerName || "there"
    )}, thank you for choosing Groutix. Your work is complete and covered by our 10-year warranty.</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Warranty No.</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(
        warrantyNo
      )}</td></tr>
      ${warranty.jobNo ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Job No.</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(warranty.jobNo)}</td></tr>` : ""}
      ${warranty.address ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Property</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(warranty.address)}</td></tr>` : ""}
      ${warranty.completionDate ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Completed</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(warranty.completionDate)}</td></tr>` : ""}
      ${warranty.expiryDate ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Warranty Expiry</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(warranty.expiryDate)} (10 Years)</td></tr>` : ""}
    </table>
    <p style="margin:20px 0 0;color:#334155;line-height:1.6;">Your warranty card is attached. Keep it for your records.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">Stay Sealed. Stay Smiling. — The Groutix Team</p>
  </div>`;

  try {
    await sendEmail({
      toEmail: lead.email,
      fromName: FROM_NAME,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Your Groutix 10-Year Warranty ${warrantyNo}`,
      html,
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
