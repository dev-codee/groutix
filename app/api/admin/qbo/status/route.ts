import { NextRequest, NextResponse } from "next/server";
import { getQboStatus } from "@/lib/quickbooks";
import { verifyRequestSession } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getQboStatus();
  return NextResponse.json(status);
}
