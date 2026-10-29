import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getSubmission, updateSubmission, appendActivity } from "@/lib/submissions";
import { buildPaymentReceiptPdf } from "@/lib/paymentReceiptPdf";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!await verifyRequestSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lead = await getSubmission(req.nextUrl.searchParams.get("id") || "");
  if (!lead?.paymentReceipt) return NextResponse.json({ error: "No payment receipt has been recorded for this invoice." }, { status: 404 });
  if (req.nextUrl.searchParams.get("pdf") !== "1") return NextResponse.json({ receipt: lead.paymentReceipt, email: lead.email, sentAt: lead.receiptSentAt });
  const pdf = await buildPaymentReceiptPdf(lead.paymentReceipt);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="Groutix_${lead.paymentReceipt.number}.pdf"`, "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let id: string;
  try { const body = await req.json(); if (typeof body.id !== "string") throw new Error(); id = body.id; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const lead = await getSubmission(id);
  if (!lead?.paymentReceipt) return NextResponse.json({ error: "Record full payment before emailing a receipt." }, { status: 400 });
  if (!lead.email) return NextResponse.json({ error: "Add a customer email address first." }, { status: 400 });
  if (!isEmailConfigured()) return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
  const receipt = lead.paymentReceipt;
  try {
    const pdf = await buildPaymentReceiptPdf(receipt);
    await sendEmail({ toEmail: lead.email, subject: "Groutix payment receipt", html: `<p>Thank you for your payment of AUD $${receipt.total.toFixed(2)}.</p><p>Your payment receipt is attached. Your invoice is paid in full.</p><p>Thank you for choosing Groutix.</p>`, attachments: [{ name: `Groutix_${receipt.number}.pdf`, content: pdf.toString("base64"), contentType: "application/pdf" }] });
  } catch (error) {
    console.error("Receipt email failed", error);
    return NextResponse.json({ error: "Could not email the receipt. Please try again." }, { status: 502 });
  }
  const sentAt = new Date().toISOString();
  await updateSubmission(id, { receiptSentAt: sentAt });
  await appendActivity(id, { time: sentAt, actor: session.username, action: "Payment receipt emailed", detail: `${receipt.number} to ${lead.email}` });
  return NextResponse.json({ ok: true, sentAt });
}
