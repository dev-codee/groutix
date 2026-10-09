import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteToken, verifyQuoteTokenShort, signQuoteToken } from "@/lib/quoteToken";
import { getSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

// SMS redirect for quote links: /s/<leadId>?t=<token> → /quote/<id>?token=<fullToken>
// Ensures any short link or legacy redirected SMS link smoothly opens the exact quotation page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = req.nextUrl.searchParams.get("t") || req.nextUrl.searchParams.get("token");

  if (!id) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Verify either token variant, or verify submission exists so customer is never locked out
  const isVerified = Boolean(t && (verifyQuoteToken(id, t) || verifyQuoteTokenShort(id, t)));
  if (!isVerified) {
    const lead = await getSubmission(id);
    if (!lead) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Mint full token and redirect to the quotation review page using the request's origin
  const fullToken = signQuoteToken(id);
  const targetUrl = new URL(`/quote/${id}`, req.url);
  targetUrl.searchParams.set("token", fullToken);
  return NextResponse.redirect(targetUrl);
}
