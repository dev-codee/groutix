import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/quoteToken";
import { recordChecklistOpen } from "@/lib/checklistDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (verifyQuoteToken(id, req.nextUrl.searchParams.get("token"))) await recordChecklistOpen(id);
  } catch (error) {
    console.error("Checklist open tracking failed:", error);
  }
  return new NextResponse(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, private" },
  });
}
