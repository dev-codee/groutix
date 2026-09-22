import { NextRequest, NextResponse } from "next/server";
import { disconnectQbo } from "@/lib/quickbooks";
import { verifyRequestSession } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await disconnectQbo();
  return NextResponse.json({ ok: true });
}
