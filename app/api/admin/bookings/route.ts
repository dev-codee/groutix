import { NextRequest, NextResponse } from "next/server";
import { listAppointmentsBetween } from "@/lib/bookings";
import { getSubmission } from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { applyRouteOrders, appointmentKey } from "@/lib/scheduleRoutes";
import { getScheduleRouteOrders } from "@/lib/scheduleRoutesServer";
import { todayAU, resolveArea } from "@/lib/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/bookings — list all upcoming bookings with lead details.
// Protected by admin middleware.
export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const from = todayAU();
    const [bookings, routeOrders] = await Promise.all([
      listAppointmentsBetween(from, "9999-12-31", { strict: true }),
      getScheduleRouteOrders(from, "9999-12-31"),
    ]);
    const leadIds = [...new Set(bookings.map((entry) => entry.leadId))];
    const leads = new Map(await Promise.all(leadIds.map(async (id) => [id, await getSubmission(id)] as const)));

    // Enrich each booking with the lead's name, phone, and address.
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const lead = leads.get(b.leadId);
        const area = resolveArea(b.address || b.suburb);
        return {
          id: appointmentKey(b),
          leadId: b.leadId,
          type: b.type,
          date: b.date,
          time: b.time,
          durationMinutes: b.durationMinutes,
          scheduledMinutes: b.scheduledMinutes,
          endAt: b.endAt,
          zone: area.zone,
          suburb: b.suburb || null,
          reference: b.jobNo || `GX-ADM-${b.leadId.slice(-6)}`,
          createdAt: lead?.createdAt || "",
          customer: lead
            ? {
                name: lead.name || "",
                phone: lead.phone || "",
                email: lead.email || "",
                address: b.address || lead.address || "",
                status: lead.status || "",
              }
            : { name: b.name, phone: "", email: "", address: b.address || "", status: b.status || "" },
        };
      })
    );

    // Share the saved visit order with the calendar; unsaved days use time order.
    return NextResponse.json({ bookings: applyRouteOrders(enriched, routeOrders) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /api/admin/bookings failed:", err);
    return NextResponse.json({ error: "Failed to load bookings." }, { status: 500 });
  }
}
