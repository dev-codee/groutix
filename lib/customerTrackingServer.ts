import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { TRACKING_TTL_MS, TRACKING_FRESH_MS, validCoordinates, type CustomerTrackingView } from "@/lib/customerTracking";
import { siteBaseUrl } from "@/lib/bookingToken";

interface TrackingDoc {
  _id: string;
  leadId: string;
  username: string;
  status: "en_route" | "arrived" | "ended";
  startedAt: Date;
  expiresAt: Date;
  location?: { lat: number; lng: number; updatedAt: Date };
}

export async function startCustomerTracking(leadId: string, username: string, lat: number | null, lng: number | null): Promise<string> {
  const db = await getDb();
  const col = db.collection<TrackingDoc>("customer_tracking");
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // Only the current journey may expose this staff member's location.
  await col.updateMany({ status: "en_route", $or: [{ username }, { leadId }] }, { $set: { status: "ended" } });
  const now = new Date();
  const token = randomBytes(24).toString("base64url");
  await col.insertOne({
    _id: token, leadId, username, status: "en_route", startedAt: now,
    expiresAt: new Date(now.getTime() + TRACKING_TTL_MS),
    ...(validCoordinates(lat, lng) ? { location: { lat: lat!, lng: lng!, updatedAt: now } } : {}),
  });
  // This pointer also prevents two overlapping notification requests from
  // leaving two customers able to follow the same staff member.
  await db.collection("staff_locations").updateOne(
    { username }, { $set: { customerTrackingToken: token } }, { upsert: true }
  );
  return `${siteBaseUrl()}/track/${token}`;
}

export async function stopCustomerTracking(leadId: string): Promise<void> {
  const db = await getDb();
  await db.collection<TrackingDoc>("customer_tracking").updateMany(
    { leadId, status: "en_route" }, { $set: { status: "arrived" } }
  );
}

export async function publishCustomerLocation(username: string, lat: number, lng: number): Promise<void> {
  if (!validCoordinates(lat, lng)) return;
  const db = await getDb();
  const now = new Date();
  await db.collection<TrackingDoc>("customer_tracking").updateMany(
    { username, status: "en_route", expiresAt: { $gt: now } },
    { $set: { location: { lat, lng, updatedAt: now } } }
  );
}

export async function getCustomerTracking(token: string): Promise<CustomerTrackingView | null> {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const db = await getDb();
  const doc = await db.collection<TrackingDoc>("customer_tracking").findOne({ _id: token });
  if (!doc) return null;
  if (new Date(doc.expiresAt).getTime() <= Date.now()) return { status: "expired", location: null };
  if (doc.status !== "en_route") return { status: doc.status, location: null };
  const staff = await db.collection("staff_locations").findOne(
    { username: doc.username }, { projection: { customerTrackingToken: 1 } }
  );
  if (staff?.customerTrackingToken !== token) return { status: "ended", location: null };

  const lead = await db.collection("submissions").findOne(
    { _id: new ObjectId(doc.leadId) }, { projection: { status: 1, customerTrackingEndedAt: 1 } }
  );
  // Status is authoritative even when staff choose not to send an arrival notification.
  const endedAfterStart = lead?.customerTrackingEndedAt && new Date(lead.customerTrackingEndedAt).getTime() >= new Date(doc.startedAt).getTime();
  if (!lead || endedAfterStart || !["Inspection En Route", "Job En Route"].includes(lead.status)) {
    const arrived = lead && ["Inspection Arrived", "Job Arrived", "Inspection In Progress", "Job Started", "Job In Progress"].includes(lead.status);
    const status = arrived ? "arrived" : "ended";
    await db.collection<TrackingDoc>("customer_tracking").updateOne(
      { _id: token, status: "en_route" }, { $set: { status } }
    );
    return { status, location: null };
  }
  const location = doc.location;
  const age = location ? Date.now() - new Date(location.updatedAt).getTime() : Infinity;
  return {
    status: "en_route",
    location: location && age >= 0 && age <= TRACKING_FRESH_MS && validCoordinates(location.lat, location.lng)
      ? { lat: location.lat, lng: location.lng, updatedAt: new Date(location.updatedAt).toISOString() }
      : null,
  };
}
