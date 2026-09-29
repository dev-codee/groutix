import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listAppointmentsBetween } from "@/lib/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
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
  if (!YMD.test(from) || !YMD.test(to) || to < from) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (spanDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too long (max ${MAX_RANGE_DAYS} days).` }, { status: 400 });
  }
  const appointments = await listAppointmentsBetween(from, to);
  return NextResponse.json({ from, to, appointments }, { headers: { "Cache-Control": "no-store" } });
}
