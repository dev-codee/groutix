// Server-side persistence for the manager-editable booking rules
// (see lib/bookingRules.ts). Stored as a single document in the `settings`
// collection alongside the site settings.

import { getDb, isMongoConfigured } from "./mongodb";
import { DEFAULT_BOOKING_RULES, sanitizeBookingRules, type BookingRules } from "./bookingRules";
import { bookingSegments } from "./bookingSpan";
import { savedBookingMinutes } from "./bookingDuration";

const DOC_ID = "booking_rules";

/** Current booking rules, falling back to the defaults if unset or unreachable. */
export async function getBookingRules(): Promise<BookingRules> {
  if (!isMongoConfigured()) return DEFAULT_BOOKING_RULES;
  try {
    const db = await getDb();
    const doc = await db.collection<{ _id: string }>("settings").findOne({ _id: DOC_ID });
    return doc ? sanitizeBookingRules(doc) : DEFAULT_BOOKING_RULES;
  } catch (err) {
    console.error("getBookingRules failed, using defaults:", err);
    return DEFAULT_BOOKING_RULES;
  }
}

export async function saveBookingRules(rules: BookingRules, updatedBy: string): Promise<BookingRules> {
  const clean = sanitizeBookingRules({ ...rules, updatedAt: new Date().toISOString(), updatedBy });
  const db = await getDb();
  // Freeze legacy appointments before replacing the settings they previously used.
  // Prefer the duration recorded by the reservation over the current slot length.
  const previous = await getBookingRules();
  const leads = await db.collection("submissions").find({ $or: [{ inspectionAt: { $type: "string", $ne: "" } }, { jobAt: { $type: "string", $ne: "" } }] }).toArray();
  const locks = await db.collection("bookings").find({}).toArray();
  const patches = [];
  for (const lead of leads) {
    for (const type of ["inspection", "job"] as const) {
      const start = lead[type === "inspection" ? "inspectionAt" : "jobAt"];
      const end = lead[type === "inspection" ? "inspectionEndAt" : "jobEndAt"];
      const field = type === "inspection" ? "inspectionWorkSegments" : "jobWorkSegments";
      if (typeof start !== "string" || !start.includes("T") || lead[field]?.length) continue;
      const date = start.slice(0, 10), time = start.slice(11, 16);
      const lock = locks.find(lock => lock.leadId === lead._id.toString() && lock.type === type && lock.date === date && lock.time?.slice(0, 5) === time);
      const segments = lock?.workSegments?.length ? lock.workSegments : end
        ? bookingSegments(type, start.slice(0, 16), end, previous)
        : [{ date, time, scheduledMinutes: lock ? savedBookingMinutes({ scheduledMinutes: lock.scheduledMinutes, durationMinutes: lock.durationMinutes }) : previous[type].slotMinutes }];
      patches.push({ updateOne: { filter: { _id: lead._id, [type === "inspection" ? "inspectionAt" : "jobAt"]: start, [field]: lead[field] ?? { $exists: false } }, update: { $set: { [field]: segments } } } });
    }
  }
  if (patches.length) await db.collection("submissions").bulkWrite(patches);
  // Locks without a lead appointment must retain their windows too.
  await db.collection("bookings").updateMany({ scheduledMinutes: { $exists: false } }, [
    { $set: { scheduledMinutes: { $ifNull: ["$durationMinutes", 60] } } },
  ]);
  await db.collection<{ _id: string }>("settings").updateOne({ _id: DOC_ID }, { $set: clean }, { upsert: true });
  return clean;
}
