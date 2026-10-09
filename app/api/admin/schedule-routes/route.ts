import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listAppointmentsBetween } from "@/lib/bookings";
import { isMongoConfigured } from "@/lib/mongodb";
import { appointmentKey, validScheduleDate } from "@/lib/scheduleRoutes";
import { saveScheduleRouteOrders } from "@/lib/scheduleRoutesServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const routes = body?.routes;
  if (!Array.isArray(routes) || !routes.length || routes.length > 31 || routes.some((route) =>
    !route || !validScheduleDate(route.date) || !Array.isArray(route.order) || route.order.length > 200 ||
    route.order.some((id: unknown) => typeof id !== "string" || id.length > 200) || new Set(route.order).size !== route.order.length,
  ) || new Set(routes.map((route) => route.date)).size !== routes.length) {
    return NextResponse.json({ error: "Invalid route order." }, { status: 400 });
  }
  try {
    // Refuse a stale preview if a booking was added, moved, or removed meanwhile.
    const appointments = await Promise.all(routes.map((route) => listAppointmentsBetween(route.date, route.date, { strict: true })));
    for (let index = 0; index < routes.length; index++) {
      const current = new Set(appointments[index].map(appointmentKey));
      if (current.size !== routes[index].order.length || routes[index].order.some((id: string) => !current.has(id))) {
        return NextResponse.json({ error: "Bookings have changed. Refresh the calendar and review the route again." }, { status: 409 });
      }
    }
    await saveScheduleRouteOrders(routes, session.username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Save schedule routes failed:", err);
    return NextResponse.json({ error: "Could not save route order. Please try again." }, { status: 500 });
  }
}
