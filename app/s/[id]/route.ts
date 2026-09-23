import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteTokenShort, buildQuoteSignUrl } from "@/lib/quoteToken";

export const runtime = "nodejs";

// Short SMS redirect for quote links: /s/<leadId>?t=<short token> → the full,
// fully-tokened /quote/<id> review & accept page. See lib/quoteToken.ts.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = req.nextUrl.searchParams.get("t");

  if (!id || !verifyQuoteTokenShort(id, t)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.redirect(buildQuoteSignUrl(id));
}
