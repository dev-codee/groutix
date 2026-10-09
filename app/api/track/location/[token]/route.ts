import { NextRequest, NextResponse } from "next/server";
import { getCustomerTracking } from "@/lib/customerTrackingServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const tracking = await getCustomerTracking(token);
    if (!tracking) return NextResponse.json({ error: "This tracking link is unavailable or has expired." }, { status: 404, headers });
    return NextResponse.json(tracking, { headers });
  } catch (err) {
    console.error("Customer tracking unavailable:", err);
    return NextResponse.json({ error: "Location updates are temporarily unavailable. Please try again shortly." }, { status: 503, headers });
  }
}
