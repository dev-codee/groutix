import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { listUsers } from "@/lib/users";

export const runtime = "nodejs";

// Lightweight staff directory available to ANY authenticated role (not just
// managers) so assignee dropdowns and the team panel are fully dynamic — no
// hardcoded names. Returns names/roles only, never credentials.
export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await listUsers();
  const staff = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    active: u.active,
  }));
  return NextResponse.json({ staff });
}
