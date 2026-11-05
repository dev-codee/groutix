import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { APPLICATION_STATUSES, CAREER_ROLES } from "@/lib/careers";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "super_admin"].includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const query = req.nextUrl.searchParams;
  const page = Math.max(1, Math.min(100000, Math.floor(Number(query.get("page"))) || 1));
  const role = query.get("role"), status = query.get("status");
  const filter: Record<string, unknown> = {};
  if (role && Object.hasOwn(CAREER_ROLES, role)) filter.role = role;
  if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) filter.status = status;
  const search = (query.get("search") || "").trim().slice(0, 120);
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["fullName", "email", "phone", "suburb", "postcode"].map(key => ({ [key]: { $regex: escaped, $options: "i" } }));
  }
  try {
    const collection = (await getDb()).collection("careerApplications");
    const [applications, total, counts] = await Promise.all([
      collection.find(filter, { projection: { _id: 0, resumeData: 0 } }).sort({ createdAt: -1, id: -1 }).skip((page - 1) * 25).limit(25).toArray(),
      collection.countDocuments(filter),
      collection.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
    ]);
    return NextResponse.json({ applications, total, counts }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Could not load applications. Please try again." }, { status: 503 }); }
}
