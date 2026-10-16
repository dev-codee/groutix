import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listCustomerQuotes, deleteCustomerQuote, createCustomerQuote, saveCustomerQuote, updateQuoteSubmission, getQuoteSubmission } from "@/lib/customerQuotes";
import { updateSubmission } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function authenticated(req: NextRequest) { return verifySession(req.cookies.get(SESSION_COOKIE)?.value); }

export async function GET(req: NextRequest, { params }: Context) {
  if (!await authenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const quotes = await listCustomerQuotes((await params).id);
  return quotes ? NextResponse.json({ quotes }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Customer not found." }, { status: 404 });
}
export async function POST(req: NextRequest, { params }: Context) {
  if (!await authenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (body.copyId !== undefined && typeof body.copyId !== "string") return NextResponse.json({ error: "Invalid quote." }, { status: 400 });
    const quote = await createCustomerQuote((await params).id, body.copyId);
    return quote ? NextResponse.json({ quote }) : NextResponse.json({ error: "Customer not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Could not create the quote." }, { status: 400 }); }
}
export async function PATCH(req: NextRequest, { params }: Context) {
  if (!await authenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (typeof body.quoteId !== "string" || !body.updates || typeof body.updates !== "object" || Array.isArray(body.updates) || (body.title !== undefined && typeof body.title !== "string")) return NextResponse.json({ error: "Invalid quote." }, { status: 400 });
    const leadId = (await params).id;
    if (!body.quoteId.startsWith(`${leadId}~`)) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    if (body.markSent === true || body.markNegotiation === true) {
      const quote = await getQuoteSubmission(body.quoteId, true);
      if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
      const ok = body.markSent ? await updateQuoteSubmission(body.quoteId, { status: "Quote Sent", quoteSentAt: new Date().toISOString() }) : await updateSubmission(leadId, { status: "Negotiation" });
      return NextResponse.json({ ok });
    }
    const saved = await saveCustomerQuote(leadId, body.quoteId, body.updates, body.title);
    return saved ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Sent quotes are kept unchanged. Duplicate this quote to prepare a revision." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Could not save the quote." }, { status: 503 }); }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  if (!await authenticated(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const leadId = (await params).id;
    if (typeof body.quoteId !== "string") return NextResponse.json({ error: "Invalid quote." }, { status: 400 });
    if (!body.quoteId.startsWith(`${leadId}~`)) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    const deleted = await deleteCustomerQuote(leadId, body.quoteId);
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Quote unavailable or currently being sent. Please refresh and try again." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Could not delete the quote." }, { status: 503 }); }
}
