import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { createUser, listUsers } from "@/lib/users";
import type { Role } from "@/lib/roles";

export const runtime = "nodejs";

// Middleware already restricts /api/admin/users to managers; we re-check here so
// the guarantee doesn't depend solely on the edge layer.
async function requireManager(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  return session?.role === "manager" ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireManager(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!(await requireManager(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { username?: string; name?: string; password?: string; role?: Role };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await createUser({
    username: body.username || "",
    name: body.name || "",
    password: body.password || "",
    role: (body.role || "intake") as Role,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ user: result.user }, { status: 201 });
}
