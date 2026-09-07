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
      // The lock: at most one booking per calendar slot across inspection & job.
      await col.createIndex({ date: 1, time: 1 }, { unique: true });
      await col.createIndex({ leadId: 1, type: 1 });
      indexEnsured = true;
    } catch (err) {
      console.error("ensure bookings index failed (non-fatal):", err);
    }
  }
  return col;
}

/**
 * Future bookings (today onward).
 * Checks both the dedicated `bookings` collection and active `submissions` with
 * scheduled appointments to ensure staff-scheduled and customer bookings never collide.
 */
export async function listUpcomingBookings(): Promise<BookingDoc[]> {
  if (!isMongoConfigured()) return [];
  try {
    const col = await collection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 1) All confirmed bookings from the atomic bookings collection
    const bookings = await col.find({ date: { $gte: todayStr } }).toArray();
    const bookedMap = new Map<string, BookingDoc>();
    for (const b of bookings) {
      const normalizedTime = b.time.slice(0, 5).padStart(5, "0");
      bookedMap.set(`${b.date}T${normalizedTime}`, { ...b, time: normalizedTime });
    }

    // 2) Also include any upcoming appointments recorded on active submissions
    //    so manual CRM staff bookings immediately lock the slot online!
    const db = await getDb();
    const subCol = db.collection("submissions");
    const activeSubs = await subCol
      .find({
        status: { $nin: ["Lost", "Cancelled"] },
        $or: [
          { inspectionAt: { $gte: todayStr } },
          { jobAt: { $gte: todayStr } },
        ],
      })
      .project({ _id: 1, inspectionAt: 1, jobAt: 1, address: 1, city: 1, name: 1 })
      .toArray();

    for (const s of activeSubs) {
      const idStr = s._id.toString();
      for (const [type, when] of [["inspection", s.inspectionAt], ["job", s.jobAt]] as const) {
        if (typeof when === "string" && when.includes("T")) {
          const [d, tRaw] = when.split("T");
          if (d >= todayStr) {
            const t = tRaw.slice(0, 5).padStart(5, "0");
            const key = `${d}T${t}`;
            if (!bookedMap.has(key)) {
              bookedMap.set(key, {
                leadId: idStr,
                type,
                date: d,
                time: t,
                zone: "flexible",
                reference: `GX-SUB-${idStr.slice(-6)}`,
                createdAt: new Date(),
              });
            }
          }
        }
      }
    }

    return Array.from(bookedMap.values());
  } catch (err) {
    console.error("listUpcomingBookings failed:", err);
    return [];
  }
}

export type CreateBookingResult =
  | { ok: true; reference: string }
  | { ok: false; conflict?: boolean; error: string };

/**
 * Atomically lock a slot.
 * - Prevents double-booking via MongoDB unique compound index { date, time }.
 * - Handles re-confirming existing slots gracefully without false conflict errors.
 * - Checks both bookings and submissions collections before acquiring lock.
 * - Automatically cleans up prior slots when rescheduling.
 */
export async function createBooking(
  input: Omit<BookingDoc, "_id" | "createdAt">
): Promise<CreateBookingResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  try {
    const col = await collection();
    const normalizedTime = input.time.slice(0, 5).padStart(5, "0");
    const normalizedDate = input.date.trim();

    // 1. Check if this exact slot is already occupied in bookings collection
    const existingBooking = await col.findOne({ date: normalizedDate, time: normalizedTime });
    if (existingBooking) {
      // If THIS lead already owns this exact slot, re-confirming is safe (not a conflict!)
      if (existingBooking.leadId === input.leadId && existingBooking.type === input.type) {
        return { ok: true, reference: existingBooking.reference || input.reference };
      }
      return { ok: false, conflict: true, error: "That time was just taken. Please pick another." };
    }

    // 2. Also check if another submission in MongoDB has this appointment scheduled
    const db = await getDb();
    const subCol = db.collection("submissions");
    let leadObjId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(input.leadId)) leadObjId = new ObjectId(input.leadId);
    } catch {}

    const querySub: Record<string, any> = {
      status: { $nin: ["Lost", "Cancelled"] },
      $or: [
        { inspectionAt: { $regex: `^${normalizedDate}T${normalizedTime}` } },
        { jobAt: { $regex: `^${normalizedDate}T${normalizedTime}` } },
      ],
    };
    if (leadObjId) {
      querySub._id = { $ne: leadObjId };
    }
    const conflictSub = await subCol.findOne(querySub);
    if (conflictSub) {
      return { ok: false, conflict: true, error: "That time was just taken. Please pick another." };
    }

    // 3. Atomically lock the slot (unique index on {date,time} stops any race condition)
    try {
      await col.insertOne({
        ...input,
        date: normalizedDate,
        time: normalizedTime,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      // Duplicate key on {date,time} = another concurrent user just locked it
      if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
        return { ok: false, conflict: true, error: "That time was just taken. Please pick another." };
      }
      throw err;
    }

    // 4. Reschedule cleanup: drop any earlier slot this lead held for this appointment type
    await col.deleteMany({
      leadId: input.leadId,
      type: input.type,
      $or: [{ date: { $ne: normalizedDate } }, { time: { $ne: normalizedTime } }],
    });

    return { ok: true, reference: input.reference };
  } catch (err) {
    console.error("createBooking failed:", err);
    return { ok: false, error: "Could not lock the slot." };
  }
}

/** Release slots held by a lead (e.g. when lead is cancelled, lost, or appointment is cleared) */
export async function deleteBooking(leadId: string, type?: "inspection" | "job"): Promise<void> {
  if (!isMongoConfigured()) return;
  try {
    const col = await collection();
    const query: Record<string, any> = { leadId };
    if (type) query.type = type;
    await col.deleteMany(query);
  } catch (err) {
    console.error("deleteBooking failed:", err);
  }
}
