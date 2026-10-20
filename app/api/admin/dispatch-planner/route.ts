import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { canView } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { listAppointmentsBetween } from "@/lib/bookings";
import { appointmentKey, validScheduleDate } from "@/lib/scheduleRoutes";
import { validDispatchPlan, type DispatchPlan } from "@/lib/dispatchPlanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
interface PlanDoc extends DispatchPlan { _id: string; updatedAt: Date; updatedBy: string }
async function authorized(req: NextRequest) {
  const session = await verifyRequestSession(req);
  return session && canView(session.role, "dispatch-planner") ? session : null;
}
export async function GET(req: NextRequest) {
  if (!await authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const from = req.nextUrl.searchParams.get("from"), to = req.nextUrl.searchParams.get("to");
  if (!validScheduleDate(from) || !validScheduleDate(to) || to < from || (Date.parse(to) - Date.parse(from)) / 86400000 > 30) {
    return NextResponse.json({ error: "Choose a valid date range of up to 31 days." }, { status: 400 });
  }
  try {
    const db = await getDb();
    const [appointments, docs] = await Promise.all([
      listAppointmentsBetween(from, to, { strict: true }),
      db.collection<PlanDoc>("dispatchPlans").find({ _id: { $gte: from, $lte: to } }).toArray(),
    ]);
    const plans = Object.fromEntries(docs.map(doc => [doc._id, { revision: doc.revision, order: doc.order, zones: doc.zones, groups: doc.groups }]));
    return NextResponse.json({ appointments, plans }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Load dispatch planner failed", error);
    return NextResponse.json({ error: "Could not load dispatch bookings. Please retry." }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  const session = await authorized(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !validScheduleDate(body.date) || !validDispatchPlan(body.plan) || !Array.isArray(body.snapshot)
    || body.snapshot.length > 500 || body.snapshot.some((id: unknown) => typeof id !== "string" || id.length > 250)
    || new Set(body.snapshot).size !== body.snapshot.length) {
    return NextResponse.json({ error: "Invalid dispatch plan." }, { status: 400 });
  }
  try {
    const current = new Set((await listAppointmentsBetween(body.date, body.date, { strict: true })).map(appointmentKey));
    const keys = [...body.plan.order, ...Object.keys(body.plan.zones), ...Object.keys(body.plan.groups)];
    if (current.size !== body.snapshot.length || body.snapshot.some((id: string) => !current.has(id)) || keys.some(id => !current.has(id))) {
      return NextResponse.json({ error: "Bookings changed while you were planning. Reload bookings and review your plan before saving." }, { status: 409 });
    }
    const db = await getDb();
    const plan: DispatchPlan = { revision: body.plan.revision + 1, order: body.plan.order, zones: body.plan.zones, groups: body.plan.groups };
    const result = await db.collection<PlanDoc>("dispatchPlans").updateOne({ _id: body.date, revision: body.plan.revision },
      { $set: { ...plan, updatedAt: new Date(), updatedBy: session.username } }, { upsert: body.plan.revision === 0 });
    if (!result.matchedCount && !result.upsertedCount) return NextResponse.json({ error: "Another dispatcher updated this plan. Reload to get their changes." }, { status: 409 });
    return NextResponse.json({ plan });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ error: "Another dispatcher updated this plan. Reload to get their changes." }, { status: 409 });
    console.error("Save dispatch planner failed", error);
    return NextResponse.json({ error: "Could not save the dispatch plan. Your unsaved changes are still available." }, { status: 500 });
  }
}
