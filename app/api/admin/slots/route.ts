import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listAppointmentsBetween } from "@/lib/bookings";
import { getScheduleRouteOrders } from "@/lib/scheduleRoutesServer";
import { validScheduleDate } from "@/lib/scheduleRoutes";
import { listTechnicians } from "@/lib/technicians";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 45;

// Who holds which slot, and where (inspections and jobs share one calendar).
// Used by the lead edit form and booking planner so staff can see availability
// and nearby stops while scheduling.
//   ?date=YYYY-MM-DD            one day
//   ?from=YYYY-MM-DD&to=...     a range (max 45 days)
export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const from = q.get("date") || q.get("from") || "";
  const to = q.get("date") || q.get("to") || "";
  if (!validScheduleDate(from) || !validScheduleDate(to) || to < from) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (spanDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too long (max ${MAX_RANGE_DAYS} days).` }, { status: 400 });
  }
  try {
    const [appointments, routeOrders, roster] = await Promise.all([
      listAppointmentsBetween(from, to, { strict: true }), getScheduleRouteOrders(from, to), listTechnicians({ strict: true }),
    ]);
    const technicians = roster.map(({ id, name, username, active, workDays, dateOverrides, aliases }) => ({ id, name, username, active, workDays, dateOverrides, aliases }));
    return NextResponse.json({ from, to, appointments, routeOrders, technicians }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Load schedule failed:", err);
    return NextResponse.json({ error: "Could not load schedule." }, { status: 500 });
  }
}
