import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb";
import { getBookingRules, saveBookingRules } from "@/lib/bookingRulesServer";
import { DEFAULT_BOOKING_RULES, sanitizeBookingRules, validateBookingRules } from "@/lib/bookingRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Any signed-in staff member can read the rules (date pickers, roster, dispatch).
export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await getBookingRules();
  return NextResponse.json(
    { rules, defaults: DEFAULT_BOOKING_RULES, mongo: isMongoConfigured() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Only managers can change them.
export async function PUT(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "manager" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured; booking rules can't be saved." }, { status: 500 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const rules = sanitizeBookingRules((body as { rules?: unknown })?.rules);
  const errors = validateBookingRules(rules);
  if (errors.length) return NextResponse.json({ error: errors.join(" "), errors }, { status: 400 });

  const saved = await saveBookingRules(rules, session.username);
  return NextResponse.json({ ok: true, rules: saved });
}
