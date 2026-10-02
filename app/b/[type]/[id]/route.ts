import { NextRequest, NextResponse } from "next/server";
import { verifyBookingTokenShort, buildBookingUrl } from "@/lib/bookingToken";

export const runtime = "nodejs";

// Short SMS redirect for booking links: /b/i/<leadId>?t=<short token> → the
// full, fully-tokened /book/inspection/<id> page (and /b/j/… → the job page).
// See lib/bookingToken.ts.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const t = req.nextUrl.searchParams.get("t");

  const bookingType = type === "i" ? "inspection" : type === "j" ? "job" : null;
  if (!bookingType || !id || !verifyBookingTokenShort(id, t)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.redirect(buildBookingUrl(id, bookingType));
}
