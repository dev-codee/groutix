import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyRequestSession } from "@/lib/adminAuth";
import { validCoordinates } from "@/lib/customerTracking";
import { publishCustomerLocation } from "@/lib/customerTrackingServer";

export const runtime = "nodejs";

interface StaffLocationDoc {
  username: string;
  displayName: string;
  lat: number;
  lng: number;
  leadId?: string;
  leadName?: string;
  updatedAt: Date;
}

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { lat: number; lng: number; leadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { lat, lng, leadId } = body;
  if (!validCoordinates(lat, lng)) {
    return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }

  const db = await getDb();

  // Optionally look up the lead name for the manager view
  let leadName: string | undefined;
  if (leadId) {
    try {
      const { ObjectId } = await import("mongodb");
      const sub = await db.collection("submissions").findOne(
        { _id: new ObjectId(leadId) },
        { projection: { name: 1 } }
      );
      leadName = typeof sub?.name === "string" ? sub.name : undefined;
    } catch {
      // non-fatal
    }
  }

  const doc: StaffLocationDoc = {
    username: session.username,
    displayName: session.username, // username is the display name in this CRM
    lat,
    lng,
    updatedAt: new Date(),
    ...(leadId ? { leadId } : {}),
    ...(leadName ? { leadName } : {}),
  };

  await db.collection<StaffLocationDoc>("staff_locations").updateOne(
    { username: session.username },
    { $set: doc },
    { upsert: true }
  );

  await publishCustomerLocation(session.username, lat, lng);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();

  // Only return locations updated in the last 15 minutes
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const docs = await db
    .collection<StaffLocationDoc>("staff_locations")
    .find({ updatedAt: { $gt: cutoff } })
    .toArray();

  const locations = docs.map((d) => ({
    username: d.username,
    displayName: d.displayName || d.username,
    lat: d.lat,
    lng: d.lng,
    leadId: d.leadId || null,
    leadName: d.leadName || null,
    updatedAt: d.updatedAt,
    mapsUrl: `https://www.google.com/maps?q=${d.lat},${d.lng}`,
  }));

  return NextResponse.json({ locations });
}
