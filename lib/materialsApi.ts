import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb";
import { MaterialError } from "@/lib/materials";

export async function materialsApi(req: NextRequest, work: (actor: string) => Promise<unknown>) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (session.role !== "manager" && session.role !== "super_admin") return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    return NextResponse.json(await work(session.username), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MaterialError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: "This SKU already exists (including archived items). Choose a unique SKU or restore the existing item." }, { status: 409 });
    if ((error as { code?: number })?.code === 20) return NextResponse.json({ error: "Inventory writes require MongoDB Atlas or a replica set with transaction support." }, { status: 503 });
    console.error("Materials request failed", error);
    return NextResponse.json({ error: "Could not complete the materials request. Please try again." }, { status: 500 });
  }
}
