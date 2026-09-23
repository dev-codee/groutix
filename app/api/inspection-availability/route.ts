import { NextRequest, NextResponse } from "next/server";
import { resolveArea, computeAvailability } from "@/lib/scheduling";
import { listUpcomingBookings } from "@/lib/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() || "";

  const area = resolveArea(address);

  // Availability changes the instant any slot is booked, so it must never be
  // cached — a stale copy would show a just-booked slot as still free.
  const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

  if (!area.serviced || area.zone === "outside") {
    return NextResponse.json({
      days: [],
      inServiceArea: false,
      suburb: area.suburb,
      distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
      message: "This location is outside our 50 km free inspection service area from Tullamarine.",
    }, { headers: NO_STORE });
  }

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

  return NextResponse.json({
    days,
    inServiceArea: true,
    suburb: area.suburb,
    distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
  }, { headers: NO_STORE });
}
