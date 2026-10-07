// Central booking / slot-lock store. One appointment per (date,time) is enforced
// by a UNIQUE index, so two customers can never grab the same slot even under a
// race — the second insert fails with a duplicate-key error. Inspection and job
// bookings share the calendar (one crew), which is what keeps a day's route
// tight.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { todayAU } from "@/lib/scheduling";

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
    // Use Australian Eastern Time for "today" so the booking window is correct
    // regardless of where the server is hosted (UTC vs AU).
    const todayStr = todayAU();

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
      .project({ _id: 1, inspectionAt: 1, jobAt: 1, address: 1, city: 1, name: 1, jobNo: 1 })
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
                reference: s.jobNo || `GX-SUB-${idStr.slice(-6)}`,
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

/**
 * Is a calendar slot already taken by anyone else?
 * Mirrors the two conflict checks inside createBooking (steps 1 & 2) so callers
 * can cheaply reject an already-booked slot BEFORE doing any other work. Pass the
 * current lead's id to `excludeLeadId` so re-confirming a slot you already own is
 * not treated as a conflict.
 */
export async function isSlotTaken(
  date: string,
  time: string,
  excludeLeadId?: string
): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const normalizedTime = time.slice(0, 5).padStart(5, "0");
    const normalizedDate = date.trim();

    // 1) Confirmed bookings in the atomic bookings collection.
    const col = await collection();
    const existing = await col.findOne({ date: normalizedDate, time: normalizedTime });
    if (existing) {
      // A slot the SAME lead already holds is not a conflict for that lead.
      if (excludeLeadId && existing.leadId === excludeLeadId) return false;
      return true;
    }

    // 2) Appointments recorded on active submissions (staff-scheduled etc.).
    const db = await getDb();
    const subCol = db.collection("submissions");
    const query: Record<string, unknown> = {
      status: { $nin: ["Lost", "Cancelled"] },
      $or: [
        { inspectionAt: { $regex: `^${normalizedDate}T${normalizedTime}` } },
        { jobAt: { $regex: `^${normalizedDate}T${normalizedTime}` } },
      ],
    };
    if (excludeLeadId && ObjectId.isValid(excludeLeadId)) {
      query._id = { $ne: new ObjectId(excludeLeadId) };
    }
    const conflictSub = await subCol.findOne(query);
    return !!conflictSub;
  } catch (err) {
    console.error("isSlotTaken failed:", err);
    return false;
  }
}

export type CreateBookingResult =
  | { ok: true; reference: string; acquired?: boolean }
  | { ok: false; conflict?: boolean; error: string };

/**
 * Atomically lock a slot.
 * - Prevents double-booking via MongoDB unique compound index { date, time }.
 * - Handles re-confirming existing slots gracefully without false conflict errors.
 * - Checks both bookings and submissions collections before acquiring lock.
 * - Automatically cleans up prior slots when rescheduling.
 */
export async function createBooking(
  input: Omit<BookingDoc, "_id" | "createdAt">,
  options: { retainPrevious?: boolean } = {},
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
        if (!options.retainPrevious) await col.deleteMany({
          leadId: input.leadId, type: input.type,
          $or: [{ date: { $ne: normalizedDate } }, { time: { $ne: normalizedTime } }],
        });
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

    const querySub: Record<string, unknown> = {
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
    if (!options.retainPrevious) await col.deleteMany({
      leadId: input.leadId,
      type: input.type,
      $or: [{ date: { $ne: normalizedDate } }, { time: { $ne: normalizedTime } }],
    });

    return { ok: true, reference: input.reference, acquired: true };
  } catch (err) {
    console.error("createBooking failed:", err);
    return { ok: false, error: "Could not lock the slot." };
  }
}

/** Release one attempted reservation without touching the lead's prior slots. */
export async function releaseBookingSlot(leadId: string, type: "inspection" | "job", date: string, time: string): Promise<void> {
  const col = await collection();
  await col.deleteOne({ leadId, type, date, time });
}

/** Release slots held by a lead (e.g. when lead is cancelled, lost, or appointment is cleared) */
export async function deleteBooking(leadId: string, type?: "inspection" | "job"): Promise<void> {
  if (!isMongoConfigured()) return;
  try {
    const col = await collection();
    const query: Filter<BookingDoc> = { leadId };
    if (type) query.type = type;
    await col.deleteMany(query);
  } catch (err) {
    console.error("deleteBooking failed:", err);
  }
}

export interface DayAppointment {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: "inspection" | "job";
  leadId: string;
  name: string;
  jobNo?: string;
  address?: string;
  suburb?: string;
  status?: string;
  source: "online" | "staff"; // slot lock row vs. appointment recorded on the lead
}

/** Everything occupying the shared calendar on one date (see listAppointmentsBetween). */
export function listAppointmentsOnDate(date: string): Promise<DayAppointment[]> {
  return listAppointmentsBetween(date, date);
}

/**
 * Everything occupying the shared calendar between two dates (inclusive), with
 * customer details — for staff to see who holds which slot, and where, while
 * scheduling. Includes both slot-lock rows (online bookings) and appointments
 * recorded directly on leads, so a manual or double-booked entry is visible too.
 */
export async function listAppointmentsBetween(from: string, to: string, options: { strict?: boolean } = {}): Promise<DayAppointment[]> {
  const YMD = /^\d{4}-\d{2}-\d{2}$/;
  if (!isMongoConfigured() || !YMD.test(from) || !YMD.test(to) || to < from) return [];
  try {
    const col = await collection();
    const db = await getDb();
    const subCol = db.collection("submissions");
    // Naive "YYYY-MM-DDTHH:mm" strings sort lexically, so a string range works.
    const range = { $gte: `${from}T`, $lt: `${to}T~` };

    const [locks, subs] = await Promise.all([
      col.find({ date: { $gte: from, $lte: to } }).toArray(),
      subCol
        .find({
          status: { $nin: ["Lost", "Cancelled"] },
          $or: [{ inspectionAt: range }, { jobAt: range }],
        })
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1, inspectionAt: 1, jobAt: 1 })
        .toArray(),
    ]);

    const out: DayAppointment[] = [];
    const seen = new Set<string>(); // leadId|type|date|time
    const info = new Map<string, { name: string; jobNo?: string; address?: string; suburb?: string; status?: string }>();
    const describe = (s: Record<string, unknown>) => ({
      name: String(s.name || "Customer"),
      jobNo: typeof s.jobNo === "string" ? s.jobNo : undefined,
      address: typeof s.address === "string" && s.address ? s.address : undefined,
      suburb: typeof s.city === "string" && s.city ? s.city : undefined,
      status: typeof s.status === "string" ? s.status : undefined,
    });

    for (const s of subs) {
      const id = s._id.toString();
      info.set(id, describe(s));
      for (const type of ["inspection", "job"] as const) {
        const when = type === "inspection" ? s.inspectionAt : s.jobAt;
        if (typeof when !== "string" || !when.includes("T")) continue;
        const [date, tRaw] = when.split("T");
        if (date < from || date > to) continue;
        const time = tRaw.slice(0, 5).padStart(5, "0");
        seen.add(`${id}|${type}|${date}|${time}`);
        out.push({ date, time, type, leadId: id, ...info.get(id)!, source: "staff" });
      }
    }

    // Slot locks whose lead doesn't record that time (e.g. online bookings not
    // yet reflected on the lead) — fetch their details.
    const extra = locks.filter((b) => !seen.has(`${b.leadId}|${b.type}|${b.date}|${b.time.slice(0, 5).padStart(5, "0")}`));
    const missingIds = [...new Set(extra.map((b) => b.leadId))].filter((id) => !info.has(id) && ObjectId.isValid(id));
    if (missingIds.length) {
      const docs = await subCol
        .find({ _id: { $in: missingIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1 })
        .toArray();
      for (const d of docs) info.set(d._id.toString(), describe(d));
    }
    for (const b of extra) {
      const i = info.get(b.leadId);
      // Lock held by a lead that's since been lost/cancelled → no longer a real appointment.
      if (i?.status === "Lost" || i?.status === "Cancelled") continue;
      out.push({
        date: b.date,
        time: b.time.slice(0, 5).padStart(5, "0"),
        type: b.type,
        leadId: b.leadId,
        name: i?.name || "Customer",
        jobNo: i?.jobNo || b.reference,
        address: i?.address,
        suburb: i?.suburb || b.suburb,
        status: i?.status,
        source: "online",
      });
    }

    return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  } catch (err) {
    console.error("listAppointmentsBetween failed:", err);
    if (options.strict) throw err;
    return [];
  }
}
