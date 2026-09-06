// Central booking / slot-lock store. One appointment per (date,time) is enforced
// by a UNIQUE index, so two customers can never grab the same slot even under a
// race — the second insert fails with a duplicate-key error. Inspection and job
// bookings share the calendar (one crew), which is what keeps a day's route
// tight.

import { ObjectId, type Collection } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export interface BookingDoc {
  _id?: ObjectId;
  leadId: string;
  type: "inspection" | "job";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  zone: string;
  suburb?: string;
  reference: string;
  createdAt: Date;
}

let indexEnsured = false;

async function collection(): Promise<Collection<BookingDoc>> {
  const db = await getDb();
  const col = db.collection<BookingDoc>("bookings");
  if (!indexEnsured) {
    try {
      // The lock: at most one booking per calendar slot.
      await col.createIndex({ date: 1, time: 1 }, { unique: true });
      await col.createIndex({ leadId: 1, type: 1 });
      indexEnsured = true;
    } catch (err) {
      console.error("ensure bookings index failed (non-fatal):", err);
    }
  }
  return col;
}

/** Future bookings (today onward) — drives locked-slot and route-grouping maps. */
export async function listUpcomingBookings(): Promise<BookingDoc[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    return await col.find({ date: { $gte: todayStr } }).toArray();
  } catch (err) {
    console.error("listUpcomingBookings failed:", err);
    return [];
  }
}

export type CreateBookingResult =
  | { ok: true; reference: string }
  | { ok: false; conflict?: boolean; error: string };

/**
 * Atomically lock a slot. Returns { conflict:true } if the slot was already
 * taken. On success, any *previous* booking for this lead+type (a reschedule)
 * is released so the old slot frees up.
 */
export async function createBooking(
  input: Omit<BookingDoc, "_id" | "createdAt">
): Promise<CreateBookingResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const col = await collection();
    try {
      await col.insertOne({ ...input, createdAt: new Date() });
    } catch (err: unknown) {
      // Duplicate key on {date,time} = slot already booked.
      if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
        return { ok: false, conflict: true, error: "That time was just taken. Please pick another." };
      }
      throw err;
    }
    // Reschedule cleanup: drop any earlier slot this lead held for this type.
    await col.deleteMany({
      leadId: input.leadId,
      type: input.type,
      $or: [{ date: { $ne: input.date } }, { time: { $ne: input.time } }],
    });
    return { ok: true, reference: input.reference };
  } catch (err) {
    console.error("createBooking failed:", err);
    return { ok: false, error: "Could not lock the slot." };
  }
}
