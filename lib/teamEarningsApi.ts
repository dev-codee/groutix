import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb";
import { EarningsError } from "./teamEarnings";

export async function teamEarningsApi(req: NextRequest, work: (actor: string) => Promise<unknown>) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (session.role !== "manager" && session.role !== "super_admin") return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try { return NextResponse.json(await work(session.username), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    if (error instanceof EarningsError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: "This request conflicts with an existing record. Refresh and review the latest history." }, { status: 409 });
    if ((error as { code?: number })?.code === 20) return NextResponse.json({ error: "Earnings require MongoDB Atlas or a replica set with transaction support." }, { status: 503 });
    console.error("Team earnings request failed", error);
    return NextResponse.json({ error: "Could not complete the earnings request. Refresh and try again." }, { status: 500 });
  }
}
