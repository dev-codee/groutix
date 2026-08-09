import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getDashboardStats } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const daysRaw = Number(req.nextUrl.searchParams.get("days"));
  const days = [7, 14, 30, 90].includes(daysRaw) ? daysRaw : 30;
  try {
    const stats = await getDashboardStats(days);
    return NextResponse.json({ stats, days });
  } catch (err) {
    console.error("admin/stats failed:", err);
    return NextResponse.json({ error: "Could not load analytics." }, { status: 500 });
  }
}
