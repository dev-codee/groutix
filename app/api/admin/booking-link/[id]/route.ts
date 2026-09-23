import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";
import { buildBookingUrl } from "@/lib/bookingToken";

export const runtime = "nodejs";

// Returns signed booking URLs for a lead so admin staff can copy them
// (e.g. to send via WhatsApp, manual SMS, or paste into a chat).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({
    inspectionUrl: buildBookingUrl(id, "inspection"),
    jobUrl: buildBookingUrl(id, "job"),
  });
}
