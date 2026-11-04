import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getSubmission, updateSubmission } from "@/lib/submissions";
import { invoiceChanges, type InvoiceInput } from "@/lib/invoiceDraft";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!await verifyRequestSession(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: InvoiceInput & { id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body?.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  try {
    const lead = await getSubmission(body.id);
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    let updates;
    try { updates = invoiceChanges({ ...lead, id: body.id }, body); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const saved = await updateSubmission(body.id, { ...updates, ...(updates.invoiceStatus === "Paid" ? { status: "Payment Received" } : {}) });
    if (!saved) return NextResponse.json({ error: "Could not save the invoice. Please try again." }, { status: 500 });
    return NextResponse.json({ ok: true, item: { ...lead, ...updates, ...(updates.invoiceStatus === "Paid" ? { status: "Payment Received" } : {}), id: body.id } });
  } catch (error) {
    console.error("Invoice save failed:", error);
    return NextResponse.json({ error: "Could not save the invoice. Your edits are still in the form." }, { status: 500 });
  }
}
