import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb";
import { findUserByUsername } from "@/lib/users";
import {
  listConversation,
  sendTeamMessage,
  markConversationRead,
  unreadCountsFor,
} from "@/lib/teamMessages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Internal staff chat. Available to every authenticated role. The *sender* is
// always taken from the session cookie (never trusted from the request body),
// so a message can only be sent as the signed-in user.

export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ messages: [], unread: {} });

  const me = session.username;
  const other = (req.nextUrl.searchParams.get("with") || "").trim().toLowerCase();

  // No `with` → return the unread summary used to badge the team cards.
  if (!other) {
    const unread = await unreadCountsFor(me);
    return NextResponse.json({ unread });
  }

  const messages = await listConversation(me, other);
  // Opening a conversation clears its unread markers for the current user.
  await markConversationRead(me, other);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMongoConfigured())
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: { to?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const from = session.username;
  const to = (body.to || "").trim().toLowerCase();
  const text = (body.text || "").trim();
  if (!to || !text) {
    return NextResponse.json({ error: "Recipient and message are required." }, { status: 400 });
  }
  if (to === from) {
    return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
  }
  // Only allow messaging real staff accounts.
  const recipient = await findUserByUsername(to);
  if (!recipient) {
    return NextResponse.json({ error: "Unknown recipient." }, { status: 404 });
  }

  const message = await sendTeamMessage(from, to, text);
  if (!message) {
    return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  }
  return NextResponse.json({ message }, { status: 201 });
}
