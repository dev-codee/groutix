// Server-side persistence for the manager-editable booking rules
// (see lib/bookingRules.ts). Stored as a single document in the `settings`
// collection alongside the site settings.

import { getDb, isMongoConfigured } from "./mongodb";
import { DEFAULT_BOOKING_RULES, sanitizeBookingRules, type BookingRules } from "./bookingRules";

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
  await db.collection<{ _id: string }>("settings").updateOne({ _id: DOC_ID }, { $set: clean }, { upsert: true });
  return clean;
}
