import { randomUUID } from "node:crypto";
import { getDb } from "./mongodb";
import type { BookingType } from "./bookingRules";

interface CalendarLock { _id: string; owner: string; expiresAt: Date }

/** Serialize capacity checks + reservations across server instances per day across both appointment types. */
export async function withBookingCalendarLock<T>(date: string, _type: BookingType, action: () => Promise<T>): Promise<T> {
  const db = await getDb();
  const locks = db.collection<CalendarLock>("bookingCalendarLocks");
  const key = `calendar:${date}`;
  const owner = randomUUID();
  const deadline = Date.now() + 10_000;
  while (true) {
    try {
      await locks.updateOne({ _id: key, expiresAt: { $lte: new Date() } }, {
        $set: { owner, expiresAt: new Date(Date.now() + 120_000) },
      }, { upsert: true });
      break;
    } catch (err) {
      if (!err || typeof err !== "object" || !("code" in err) || err.code !== 11000) throw err;
      if (Date.now() >= deadline) throw new Error("The booking calendar is busy. Please try again.");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  try { return await action(); }
  finally { await locks.deleteOne({ _id: key, owner }); }
}
