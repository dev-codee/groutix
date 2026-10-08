import { NextRequest, NextResponse } from "next/server";
import { resolveArea, computeAvailability, shortlistDays, zoneDayName } from "@/lib/scheduling";
import { listUpcomingBookings } from "@/lib/bookings";
import { getBookingRules } from "@/lib/bookingRulesServer";
import { getZoneRules } from "@/lib/zoneRulesServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() || "";

  const zoneRules = await getZoneRules();
  const area = resolveArea(address, zoneRules);

  // Availability changes the instant any slot is booked, so it must never be
  // cached — a stale copy would show a just-booked slot as still free.
  const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

  if (!area.serviced || area.zone === "outside" || area.zone === "coastal") {
    return NextResponse.json({
      days: [],
      inServiceArea: false,
      suburb: area.suburb,
      zone: area.zone,
      distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
      message:
        area.zone === "coastal"
          ? "We don't currently run inspection routes through coastal / ocean areas. Please contact us and we'll let you know if we can help."
          : "This location is outside our 50 km free inspection service area.",
    }, { headers: NO_STORE });
  }

  const bookedByDate = new Map<string, Set<string>>();
  const sameZoneDates = new Set<string>();
  try {
    const bookings = await listUpcomingBookings();
    for (const b of bookings) {
      if (b.type === "inspection") {
        if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, new Set());
        bookedByDate.get(b.date)!.add(b.time);
      }
      if (b.zone === area.zone || area.inner) sameZoneDates.add(b.date);
    }
  } catch {
    // non-fatal — return empty availability
  }

  const rules = await getBookingRules();
  // Compact in-form picker: a handful of near-term choices. Bounded by a window as
  // well as a count — an outer-zone address only has one bookable day a week, so a
  // count alone would offer dates two months out.
  const days = shortlistDays(
    computeAvailability(area, bookedByDate, sameZoneDates, "inspection", rules, zoneRules),
    { maxOptions: 7, maxDaysAhead: 28 }
  );

  return NextResponse.json({
    days,
    inServiceArea: true,
    suburb: area.suburb,
    zone: area.zone,
    // Outer areas are only visited on their zone's weekday — surface that so the
    // UI can explain why fewer days came back.
    zoneDay: zoneDayName(area.zone, zoneRules),
    label: area.label,
    inner: area.inner,
    distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
  }, { headers: NO_STORE });
}
