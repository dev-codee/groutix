import { estimatedJobMinutes } from "./bookingDuration";
// Inspection and job pools have independent capacity. Job capacity comes from the technician roster.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { todayAU } from "@/lib/scheduling";
import { bookingAvailability, assignedTechnicianId, type TechnicianAssignment } from "./bookingCapacity";
import { listTechnicians } from "./technicians";
import { getBookingRules } from "./bookingRulesServer";
import { withBookingCalendarLock } from "./bookingCalendarLock";
import { validScheduleDate } from "./scheduleRoutes";
import { randomUUID } from "node:crypto";

export interface BookingDoc extends TechnicianAssignment {
  _id?: ObjectId;
  leadId: string;
  type: "inspection" | "job";
  date: string; // YYYY-MM-DD
  durationMinutes?: number;
  time: string; // HH:mm
  zone: string;
  suburb?: string;
  reference: string;
  createdAt: Date;
  reservationId?: string;
}

let indexPromise: Promise<void> | null = null;

async function collection(): Promise<Collection<BookingDoc>> {
  const db = await getDb();
  const col = db.collection<BookingDoc>("bookings");
  if (!indexPromise) {
    indexPromise = (async () => {
      await col.createIndex({ date: 1, type: 1, time: 1, leadId: 1 }, { unique: true, name: "booking_identity" });
      await col.createIndex({ leadId: 1, type: 1 });
      // Upgrade the former single-crew lock. Keep all booking documents.
      const indexes = await col.listIndexes().toArray();
      for (const index of indexes) {
        if (index.unique && Object.keys(index.key).length === 2 && index.key.date === 1 && index.key.time === 1 && index.name) {
          try { await col.dropIndex(index.name); }
          catch (err) { if (!err || typeof err !== "object" || !("code" in err) || err.code !== 27) throw err; }
        }
      }
    })().catch((err) => { indexPromise = null; throw err; });
  }
  await indexPromise;
  return col;
}

/**
 * Future bookings (today onward).
 * Checks both the dedicated `bookings` collection and active `submissions` with
 * scheduled appointments to ensure staff-scheduled and customer bookings never collide.
 */
export async function listUpcomingBookings(options: { strict?: boolean } = {}): Promise<BookingDoc[]> {
  // Public booking pages and CRM slots read the same canonical appointments.
  // This also excludes cancelled/lost leads consistently and resolves legacy locks.
  const appointments = await listAppointmentsBetween(todayAU(), "9999-12-31", options);
  return appointments.map((appointment) => ({
    leadId: appointment.leadId, type: appointment.type, date: appointment.date, time: appointment.time,
    durationMinutes: appointment.durationMinutes, technicianId: appointment.technicianId,
    technician: appointment.technician, technicianUsername: appointment.technicianUsername,
    zone: appointment.zone || "flexible", suburb: appointment.suburb,
    reference: appointment.jobNo || `GX-SUB-${appointment.leadId.slice(-6)}`, createdAt: new Date(),
  }));
}

/** Compatibility helper for the website's inspection preflight. Errors fail closed. */
export async function isSlotTaken(date: string, time: string, excludeLeadId?: string, type: "inspection" | "job" = "inspection"): Promise<boolean> {
  const [appointments, technicians, rules] = await Promise.all([
    listAppointmentsBetween(date, date, { strict: true }), listTechnicians({ strict: true }), getBookingRules(),
  ]);
  return !bookingAvailability(appointments, { date, time, leadId: excludeLeadId || "", type }, rules, technicians).available;
}

export type CreateBookingResult =
  | { ok: true; reference: string; acquired?: boolean; reservationId?: string; previousBooking?: BookingDoc }
  | { ok: false; conflict?: boolean; error: string };

type BookingInput = Omit<BookingDoc, "_id" | "createdAt" | "reservationId">;

/** Capacity is checked and reserved under a shared per-day/pool database lock. */
export async function createBooking(input: BookingInput, options: { retainPrevious?: boolean } = {}): Promise<CreateBookingResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  const date = input.date.trim();
  const time = input.time.slice(0, 5);
  if (!validScheduleDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: "Invalid appointment date or time." };
  try {
    const col = await collection();
    return await withBookingCalendarLock(date, input.type, async () => {
      const [appointments, technicians, rules] = await Promise.all([
        listAppointmentsBetween(date, date, { strict: true }), listTechnicians({ strict: true }), getBookingRules(),
      ]);
      const existing = await col.findOne({ leadId: input.leadId, type: input.type, date, time });
      const db = await getDb();
      const lead = ObjectId.isValid(input.leadId) ? await db.collection("submissions").findOne({ _id: new ObjectId(input.leadId) }) : null;
      const assignment: TechnicianAssignment = input.type === "job" ? {
        technicianId: input.technicianId !== undefined ? input.technicianId : lead?.technicianId,
        technician: input.technician !== undefined ? input.technician : lead?.technician,
        technicianUsername: input.technicianUsername !== undefined ? input.technicianUsername : lead?.technicianUsername,
      } : {};
      const durationMinutes = input.type === "job" ? (input.durationMinutes === 0 ? rules.job.slotMinutes : input.durationMinutes ?? estimatedJobMinutes(lead?.inspectionReport?.estimatedTime) ?? rules.job.slotMinutes) : rules.inspection.slotMinutes;
      const availability = bookingAvailability(appointments, { ...input, ...assignment, durationMinutes, date, time }, rules, technicians);
      if (!availability.available) return { ok: false as const, conflict: true, error: availability.reason! };
      const reservationId = randomUUID();
      const document: BookingDoc = { ...input, ...assignment, durationMinutes, technicianId: input.type === "job" ? assignedTechnicianId(assignment, technicians) : undefined,
        date, time, reservationId, createdAt: existing?.createdAt || new Date() };
      if (existing) await col.updateOne({ _id: existing._id }, { $set: document });
      else await col.insertOne(document);
      if (!options.retainPrevious) await col.deleteMany({
        leadId: input.leadId, type: input.type,
        $or: [{ date: { $ne: date } }, { time: { $ne: time } }],
      });
      return { ok: true as const, reference: existing?.reference || input.reference, acquired: !existing, reservationId, previousBooking: existing || undefined };
    });
  } catch (err) {
    console.error("createBooking failed:", err);
    return { ok: false, error: "Could not reserve booking capacity. Please try again." };
  }
}

/** Release one attempted reservation without touching the lead's prior slots. */
export async function releaseBookingSlot(leadId: string, type: "inspection" | "job", date: string, time: string, reservation?: { reservationId?: string; previousBooking?: BookingDoc }): Promise<void> {
  const col = await collection();
  const filter: Filter<BookingDoc> = { leadId, type, date, time };
  if (reservation?.reservationId) filter.reservationId = reservation.reservationId;
  if (reservation?.previousBooking) await col.replaceOne(filter, reservation.previousBooking);
  else await col.deleteOne(filter);
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

export interface DayAppointment extends TechnicianAssignment {
  date: string; // YYYY-MM-DD
  durationMinutes?: number;
  time: string; // HH:mm
  type: "inspection" | "job";
  leadId: string;
  name: string;
  jobNo?: string;
  address?: string;
  suburb?: string;
  status?: string;
  zone?: string;
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
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1, inspectionAt: 1, jobAt: 1, technicianId: 1, technician: 1, technicianUsername: 1, "inspectionReport.estimatedTime": 1 })
        .toArray(),
    ]);

    const out: DayAppointment[] = [];
    const seen = new Set<string>(); // leadId|type|date|time
    const info = new Map<string, { name: string; jobNo?: string; address?: string; suburb?: string; status?: string; technicianId?: string; technician?: string; technicianUsername?: string; durationMinutes?: number }>();
    const describe = (s: Record<string, unknown>) => ({
      durationMinutes: estimatedJobMinutes((s.inspectionReport as { estimatedTime?: string } | undefined)?.estimatedTime),
      name: String(s.name || "Customer"),
      jobNo: typeof s.jobNo === "string" ? s.jobNo : undefined,
      address: typeof s.address === "string" && s.address ? s.address : undefined,
      suburb: typeof s.city === "string" && s.city ? s.city : undefined,
      status: typeof s.status === "string" ? s.status : undefined,
      technicianId: typeof s.technicianId === "string" ? s.technicianId : undefined,
      technician: typeof s.technician === "string" ? s.technician : undefined,
      technicianUsername: typeof s.technicianUsername === "string" ? s.technicianUsername : undefined,
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
        const lock = locks.find((booking) => booking.leadId === id && booking.type === type && booking.date === date && booking.time.slice(0, 5) === time);
        out.push({ date, time, type, leadId: id, ...info.get(id)!, durationMinutes: info.get(id)?.durationMinutes ?? lock?.durationMinutes, ...(lock ? { technicianId: lock.technicianId, technician: lock.technician, technicianUsername: lock.technicianUsername } : {}), zone: lock?.zone || "flexible", source: "staff" });
      }
    }

    // Slot locks whose lead doesn't record that time (e.g. online bookings not
    // yet reflected on the lead) — fetch their details.
    const extra = locks.filter((b) => !seen.has(`${b.leadId}|${b.type}|${b.date}|${b.time.slice(0, 5).padStart(5, "0")}`));
    const missingIds = [...new Set(extra.map((b) => b.leadId))].filter((id) => !info.has(id) && ObjectId.isValid(id));
    if (missingIds.length) {
      const docs = await subCol
        .find({ _id: { $in: missingIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1, technicianId: 1, technician: 1, technicianUsername: 1, "inspectionReport.estimatedTime": 1 })
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
        technicianId: b.technicianId || i?.technicianId,
        technician: b.technician || i?.technician,
        technicianUsername: b.technicianUsername || i?.technicianUsername,
        durationMinutes: i?.durationMinutes ?? b.durationMinutes,
        zone: b.zone,
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
