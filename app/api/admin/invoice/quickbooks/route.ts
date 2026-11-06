import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getSubmission } from "@/lib/submissions";
import { syncInvoiceToQuickbooks } from "@/lib/quickbooksInvoiceSync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["finance", "manager", "super_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Only finance staff and managers can sync invoices to QuickBooks." }, { status: 403 });
  }
  let body: { id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  try {
    const lead = await getSubmission(body.id);
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (!lead.qboInvoiceId && (!lead.invoiceNumber || !lead.invoiceAmount || lead.invoiceAmount <= 0)) {
      return NextResponse.json({ error: "Save the invoice before sending it to QuickBooks." }, { status: 400 });
    }
    const result = await syncInvoiceToQuickbooks(lead, session.username);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Manual QuickBooks invoice sync failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "QuickBooks sync failed. Please retry." }, { status: 502 });
  }
}
