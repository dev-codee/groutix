import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { createQuoteInvoice, listCustomerInvoices } from "@/lib/customerInvoices";
import { listCustomerQuotes } from "@/lib/customerQuotes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Context) {
  if (!await verifyRequestSession(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  if (req.nextUrl.searchParams.get("delivery") === "1") {
    const invoices = await listCustomerInvoices(id);
    if (!invoices) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    return NextResponse.json({ invoices: invoices.map(({ id, invoiceNumber, invoiceSentAt, invoiceOpenedAt }) => ({ id, invoiceNumber, invoiceSentAt, invoiceOpenedAt })) }, { headers: { "Cache-Control": "no-store" } });
  }
  const [invoices, quotes] = await Promise.all([listCustomerInvoices(id), listCustomerQuotes(id)]);
  if (!invoices) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json({ invoices, quotes: (quotes || []).filter(quote => quote.state === "accepted").map(quote => ({ id: quote._id, number: quote.values.quoteNumber, title: quote.title })) });
}
export async function POST(req: NextRequest, { params }: Context) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["finance", "manager", "super_admin"].includes(session.role)) return NextResponse.json({ error: "Only finance staff and managers can create invoices." }, { status: 403 });
  try {
    const body = await req.json();
    if (typeof body.quoteId !== "string") return NextResponse.json({ error: "Select an accepted quote." }, { status: 400 });
    const item = await createQuoteInvoice((await params).id, body.quoteId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create invoice." }, { status: 400 });
  }
}
