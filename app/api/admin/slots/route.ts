import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listAppointmentsOnDate } from "@/lib/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Who holds which slot on a given day (inspections and jobs share one calendar).
// Used by the lead edit form so staff can see availability while scheduling.
export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  const appointments = await listAppointmentsOnDate(date);
  return NextResponse.json({ date, appointments }, { headers: { "Cache-Control": "no-store" } });
}
