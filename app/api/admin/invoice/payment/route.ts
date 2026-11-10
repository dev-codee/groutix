import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { invoiceLeadId } from "@/lib/customerInvoices";
import { verifyRequestSession } from "@/lib/adminAuth";
import { recordInvoicePayment, InvoicePaymentError } from "@/lib/invoicePayments";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["finance", "manager", "super_admin"].includes(session.role)) return NextResponse.json({ error: "Only finance staff and managers can record invoice payments." }, { status: 403 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "Select an invoice." }, { status: 400 });
  try {
    const result = await recordInvoicePayment(body.id, body, session.username);
    return NextResponse.json({ ok: true, ...result, parent: await getSubmission(invoiceLeadId(body.id)) });
  }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not record payment." }, { status: error instanceof InvoicePaymentError ? error.status : 500 }); }
}
