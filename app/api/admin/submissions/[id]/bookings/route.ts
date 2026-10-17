import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSubmission, appendActivity, syncJobBookingWorkflow } from "@/lib/submissions";
import { createBooking } from "@/lib/bookings";
import { leadBookings } from "@/lib/leadBookings";
import { validBookingStatus } from "@/lib/bookingStatus";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Change one visit's status, leaving the shared lead/workflow/finance intact. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!body || !["inspection", "job"].includes(body.type) || typeof body.start !== "string" || !validBookingStatus(body.type, body.status)) {
    return NextResponse.json({ error: "Choose a valid booking and status." }, { status: 400 });
  }
  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (["Lost", "Cancelled"].includes(lead.status)) return NextResponse.json({ error: "Reopen this lead before changing its bookings." }, { status: 409 });
  const booking = leadBookings(lead).find(b => b.type === body.type && `${b.date}T${b.time}` === body.start);
  if (!booking) return NextResponse.json({ error: "This booking has changed. Refresh before editing." }, { status: 409 });
  const progress: { jobTotalDays?: number; jobDaysDone?: number } = {};
  for (const key of ["jobTotalDays", "jobDaysDone"] as const) {
    if (body[key] === undefined) continue;
    if (body.type !== "job" || !Number.isInteger(body[key]) || body[key] < 1 || body[key] > 14) {
      return NextResponse.json({ error: "Job days must be whole numbers between 1 and 14." }, { status: 400 });
    }
    progress[key] = body[key];
  }
  if ((progress.jobDaysDone ?? booking.jobDaysDone ?? 1) > (progress.jobTotalDays ?? booking.jobTotalDays ?? 1)) {
    return NextResponse.json({ error: "Completed days cannot exceed the job duration." }, { status: 400 });
  }
  if (booking.status !== body.status || Object.entries(progress).some(([key, value]) => booking[key as keyof typeof progress] !== value)) {
    const result = await createBooking({ ...booking, ...progress, status: body.status, leadId: id, zone: "flexible", reference: lead.jobNo || `GX-ADM-${id.slice(-6)}` },
      { staffOverride: true, retainPrevious: true, replaceStart: body.start, statusOnly: true });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.conflict ? 409 : 503 });
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    await appendActivity(id, { time: new Date().toISOString(), actor: session?.username || "staff", action: "Booking status changed",
      detail: `${body.type} ${body.start}: ${booking.status} → ${body.status}${Object.keys(progress).length ? ` (day ${progress.jobDaysDone ?? booking.jobDaysDone ?? 1} of ${progress.jobTotalDays ?? booking.jobTotalDays ?? 1})` : ""}` });
  }
  if (body.type === "job" && body.syncWorkflow === true) await syncJobBookingWorkflow(id);
  return NextResponse.json({ ok: true, item: await getSubmission(id) });
}
