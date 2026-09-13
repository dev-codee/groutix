import { NextRequest, NextResponse } from "next/server";
import { resolveArea, computeAvailability } from "@/lib/scheduling";
import { listUpcomingBookings } from "@/lib/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() || "";

  const area = resolveArea(address);

  let bookedByDate = new Map<string, Set<string>>();
  let sameZoneDates = new Set<string>();
  try {
    const bookings = await listUpcomingBookings();
    for (const b of bookings) {
      if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, new Set());
      bookedByDate.get(b.date)!.add(b.time);
      if (b.zone === area.zone || area.inner) sameZoneDates.add(b.date);
    }
  } catch {
    // non-fatal — return empty availability
  }

  const days = computeAvailability(area, bookedByDate, sameZoneDates).slice(0, 7);

  return NextResponse.json({ days });
}
