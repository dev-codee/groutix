import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyRequestSession } from "@/lib/adminAuth";
import { canView } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { dispatchBase, dispatchLocation, DISPATCH_BASE_ADDRESS, travelLeg } from "@/lib/dispatchPlanner";
import { drivingLeg } from "@/lib/dispatchRoadDistances";
import type { TravelMatrix } from "@/lib/dispatchDayRoute";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session || !canView(session.role, "dispatch-planner")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids) || body.ids.length < 2 || body.ids.length > 16 || new Set(body.ids).size !== body.ids.length
    || body.ids.some((id: unknown) => typeof id !== "string" || !ObjectId.isValid(id))) return NextResponse.json({ error: "Select between 2 and 16 unique leads." }, { status: 400 });
  try {
    const ids: string[] = body.ids;
    const docs = await (await getDb()).collection("submissions").find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).project({ address: 1, city: 1 }).toArray();
    if (docs.length !== ids.length) return NextResponse.json({ error: "A lead was removed. Refresh your selection." }, { status: 409 });
    const ordered = ids.map(id => docs.find(doc => String(doc._id) === id)!);
    const addresses = [DISPATCH_BASE_ADDRESS, ...ordered.map(doc => String(doc.address || "").trim())];
    const points = [dispatchBase, ...ordered.map(doc => dispatchLocation(doc.address, doc.city, 15).point)];
    const matrix: (Awaited<ReturnType<typeof drivingLeg>>[])[] = addresses.map(() => addresses.map(() => null));
    const pairs = addresses.flatMap((_, from) => addresses.map((_, to) => ({ from, to }))).filter(pair => pair.from !== pair.to);
    let cursor = 0;
    const deadline = Date.now() + 12_000;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (cursor < pairs.length && Date.now() < deadline) {
        const { from, to } = pairs[cursor++];
        matrix[from][to] = await drivingLeg(addresses[from], addresses[to]);
      }
    }));
    const estimated = pairs.some(({ from, to }) => !matrix[from][to]);
    // Keep the entire optimization on one comparable distance model.
    if (estimated && points.some(point => !point)) return NextResponse.json({ error: "Some addresses could not be located. Correct them before planning this route." }, { status: 422 });
    const travel: TravelMatrix = matrix.map((row, from) => row.map((leg, to) => from === to ? { km: 0, minutes: 0 } : estimated ? travelLeg(points[from], points[to])! : leg!));
    return NextResponse.json({ matrix: travel, estimated }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Could not calculate this route. Please try again." }, { status: 500 }); }
}
