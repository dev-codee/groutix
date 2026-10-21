import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyRequestSession } from "@/lib/adminAuth";
import { canView } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { DISPATCH_BASE_ADDRESS, emptyDispatchPlan, validDispatchPlan, type DispatchPlan } from "@/lib/dispatchPlanner";
import { drivingLeg, roadDistanceNotice } from "@/lib/dispatchRoadDistances";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
interface WorkspaceDoc extends DispatchPlan { _id: string; updatedAt: Date; updatedBy: string }
async function authorized(req: NextRequest) {
  const session = await verifyRequestSession(req);
  return session && canView(session.role, "dispatch-planner") ? session : null;
}
export async function GET(req: NextRequest) {
  if (!await authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const doc = await (await getDb()).collection<WorkspaceDoc>("dispatchWorkspaces").findOne({ _id: "primary" });
    const plan = doc ? { revision: doc.revision, order: doc.order, zones: doc.zones, groups: doc.groups } : emptyDispatchPlan();
    return NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Could not load the shared dispatch order." }, { status: 500 }); }
}
export async function PUT(req: NextRequest) {
  const session = await authorized(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!validDispatchPlan(body?.plan)) return NextResponse.json({ error: "Invalid dispatch order." }, { status: 400 });
  const ids = [...new Set([...body.plan.order, ...Object.keys(body.plan.zones), ...Object.keys(body.plan.groups)])];
  if (ids.some(id => !ObjectId.isValid(id))) return NextResponse.json({ error: "Invalid lead selection." }, { status: 400 });
  try {
    const db = await getDb();
    const found = await db.collection("submissions").countDocuments({ _id: { $in: ids.map(id => new ObjectId(id)) } });
    if (found !== ids.length) return NextResponse.json({ error: "Some leads have been removed. Reload before saving." }, { status: 409 });
    const plan: DispatchPlan = { revision: body.plan.revision + 1, order: body.plan.order, zones: body.plan.zones, groups: body.plan.groups };
    // Saves planning order only. Never alter bookings or send customer messages.
    const result = await db.collection<WorkspaceDoc>("dispatchWorkspaces").updateOne({ _id: "primary", revision: body.plan.revision },
      { $set: { ...plan, updatedAt: new Date(), updatedBy: session.username } }, { upsert: body.plan.revision === 0 });
    if (!result.matchedCount && !result.upsertedCount) return NextResponse.json({ error: "Another dispatcher saved a newer order. Discard your draft and reload before applying changes." }, { status: 409 });
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error && typeof error === "object" && "code" in error && error.code === 11000 ? "Another dispatcher saved a newer order. Discard your draft and reload." : "Could not save the dispatch order." }, { status: error && typeof error === "object" && "code" in error && error.code === 11000 ? 409 : 500 });
  }
}
/** Read-only road lookup for the supplied ordered leads, including a batch boundary. */
export async function POST(req: NextRequest) {
  if (!await authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids) || !body.ids.length || body.ids.length > 40 || new Set(body.ids).size !== body.ids.length
    || body.ids.some((id: unknown) => typeof id !== "string" || !ObjectId.isValid(id))
    || (body.previousId != null && (typeof body.previousId !== "string" || !ObjectId.isValid(body.previousId) || body.ids.includes(body.previousId)))) return NextResponse.json({ error: "Choose up to 40 unique leads." }, { status: 400 });
  try {
    const ids: string[] = body.ids;
    const wanted = body.previousId ? [...ids, body.previousId] : ids;
    const docs = await (await getDb()).collection("submissions").find({ _id: { $in: wanted.map(id => new ObjectId(id)) } }).project({ address: 1, city: 1 }).toArray();
    const addresses = new Map(docs.map(doc => [String(doc._id), String(doc.address || "").trim() || String(doc.city || "").trim()]));
    const streetAddresses = new Map(docs.map(doc => [String(doc._id), String(doc.address || "").trim()]));
    if (addresses.size !== wanted.length) return NextResponse.json({ error: "A lead was removed. Refresh the dispatch list." }, { status: 409 });
    const measurements: unknown[] = new Array(ids.length);
    let cursor = 0;
    // Bounded concurrency and directional cache avoid refetching unchanged legs on drag.
    await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => {
      while (cursor < ids.length) {
        const index = cursor++, id = ids[index], previousId: string | null = index ? ids[index - 1] : body.previousId || null;
        const address = addresses.get(id)!, previousAddress = previousId ? addresses.get(previousId)! : "";
        const destination = streetAddresses.get(id)!;
        const origin = previousId ? streetAddresses.get(previousId)! : DISPATCH_BASE_ADDRESS;
        const [fromBase, fromPrevious, returnToBase] = await Promise.all([
          drivingLeg(DISPATCH_BASE_ADDRESS, destination), drivingLeg(origin, destination),
          index === ids.length - 1 && body.lastBatch === true ? drivingLeg(destination, DISPATCH_BASE_ADDRESS) : Promise.resolve(null),
        ]);
        measurements[index] = { id, address, previousId, previousAddress, fromBase, fromPrevious, returnToBase };
      }
    }));
    return NextResponse.json({ measurements, distanceNotice: roadDistanceNotice() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Road distances could not be checked." }, { status: 500 }); }
}
