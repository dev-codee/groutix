import { NextResponse } from "next/server";
import { listUpcomingBookings } from "@/lib/bookings";
import { getSubmission } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/bookings — list all upcoming bookings with lead details.
// Protected by admin middleware.
export async function GET() {
  try {
    const bookings = await listUpcomingBookings();

    // Enrich each booking with the lead's name, phone, and address.
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const lead = await getSubmission(b.leadId).catch(() => null);
        return {
          id: b._id?.toString() || "",
          leadId: b.leadId,
          type: b.type,
          date: b.date,
          time: b.time,
          zone: b.zone,
          suburb: b.suburb || null,
          reference: b.reference,
          createdAt: b.createdAt?.toISOString?.() || "",
          customer: lead
            ? {
                name: lead.name || "",
                phone: lead.phone || "",
                email: lead.email || "",
                address: lead.address || "",
                status: lead.status || "",
              }
            : null,
        };
      })
    );

    // Sort by date asc, then time asc.
    enriched.sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.time.localeCompare(b.time);
    });

    return NextResponse.json({ bookings: enriched });
  } catch (err) {
    console.error("GET /api/admin/bookings failed:", err);
    return NextResponse.json({ error: "Failed to load bookings." }, { status: 500 });
  }
}
