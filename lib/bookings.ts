import { explainOutsideRules } from "./bookingRules";
import { staffBookingRules } from "./staffBookingRules";
import { bookingSegments, type BookingSegment } from "./bookingSpan";
import { appointmentDurationMinutes, savedBookingMinutes } from "./bookingDuration";
// Assigned staff cannot overlap across inspections and jobs.

import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { todayAU } from "@/lib/scheduling";
import { bookingAvailability, assignedTechnicianId, type TechnicianAssignment } from "./bookingCapacity";
import { listTechnicians } from "./technicians";
import { getBookingRules } from "./bookingRulesServer";
import { withBookingCalendarLock } from "./bookingCalendarLock";
import { validScheduleDate } from "./scheduleRoutes";
import { randomUUID } from "node:crypto";
import { resolveBookingStatus, type BookingStatus } from "./bookingStatus";

export interface BookingDoc extends TechnicianAssignment {
  status?: BookingStatus;
  _id?: ObjectId;
  leadId: string;
  type: "inspection" | "job";
  date: string; // YYYY-MM-DD
  durationMinutes?: number;
  scheduledMinutes?: number;
  endAt?: string;
  workSegments?: BookingSegment[];
  time: string; // HH:mm
  zone: string;
  suburb?: string;
  reference: string;
  createdAt: Date;
  reminderSent?: boolean;
  reminder1hSent?: boolean;
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
    durationMinutes: appointment.durationMinutes, scheduledMinutes: appointment.scheduledMinutes, technicianId: appointment.technicianId,
    technician: appointment.technician, technicianUsername: appointment.technicianUsername,
    inspectorId: appointment.inspectorId, assigned: appointment.assigned, inspectorUsername: appointment.inspectorUsername,
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
export async function createBooking(input: BookingInput, options: { retainPrevious?: boolean; staffOverride?: boolean; append?: boolean; replaceStart?: string; statusOnly?: boolean } = {}): Promise<CreateBookingResult> {
  if (!isMongoConfigured()) return { ok: false, error: "Database not configured." };
  const date = input.date.trim();
  const time = input.time.slice(0, 5);
  if (!validScheduleDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: "Invalid appointment date or time." };
  try {
    const col = await collection();
    const settings = await getBookingRules();
    if (!options.staffOverride) {
      const outside = explainOutsideRules(settings, input.type, `${date}T${time}`);
      if (outside) return { ok: false, conflict: true, error: outside };
    }
    const spanRules = options.staffOverride ? staffBookingRules(settings) : settings;
    const segments = input.endAt ? bookingSegments(input.type, `${date}T${time}`, input.endAt, spanRules) : [{ date, time, scheduledMinutes: appointmentDurationMinutes(input, spanRules) }];
    // Acquire every occupied date in chronological order before checking or writing.
    const locked = async <T,>(index: number, action: () => Promise<T>): Promise<T> => index === segments.length ? action() : withBookingCalendarLock(segments[index].date, input.type, () => locked(index + 1, action));
    return await locked(0, async () => {
      const [appointments, technicians, customerRules] = await Promise.all([
        listAppointmentsBetween(date, segments[segments.length - 1].date, { strict: true }), listTechnicians({ strict: true }), getBookingRules(),
      ]);
      const rules = options.staffOverride ? staffBookingRules(customerRules) : customerRules;
      const existing = await col.findOne({ leadId: input.leadId, type: input.type, date, time });
      if (options.append && existing) return { ok: false as const, conflict: true, error: "This lead already has a booking at this start time. Edit that visit or choose another start time." };
      const db = await getDb();
      const lead = ObjectId.isValid(input.leadId) ? await db.collection("submissions").findOne({ _id: new ObjectId(input.leadId) }) : null;
      if (options.statusOnly) {
        if (!existing && (input.type === "job" ? lead?.jobAt : lead?.inspectionAt)?.slice(0, 16) !== `${date}T${time}`) {
          return { ok: false as const, conflict: true, error: "This booking has changed. Refresh before editing." };
        }
        const fields = ["endAt", "scheduledMinutes", "technicianId", "technician", "technicianUsername", "inspectorId", "assigned", "inspectorUsername"] as const;
        if (existing && fields.some(key => (existing[key] || "") !== (input[key] || ""))) {
          return { ok: false as const, conflict: true, error: "This booking has changed. Refresh before editing." };
        }
      }
      const assignment: TechnicianAssignment = input.type === "job" ? {
        technicianId: input.technicianId !== undefined ? input.technicianId : lead?.technicianId,
        technician: input.technician !== undefined ? input.technician : lead?.technician,
        technicianUsername: input.technicianUsername !== undefined ? input.technicianUsername : lead?.technicianUsername,
      } : { inspectorId: input.inspectorId ?? lead?.inspectorId, assigned: input.assigned ?? lead?.assigned, inspectorUsername: input.inspectorUsername ?? lead?.inspectorUsername };
      const durationMinutes = appointmentDurationMinutes(input, rules);
      // Exclude only the visit being edited. Sibling visits still reserve staff.
      const replacedStart = options.append ? undefined : options.replaceStart ?? (input.type === "job" ? lead?.jobAt : lead?.inspectionAt)?.slice(0, 16);
      if (existing && replacedStart && replacedStart !== `${date}T${time}`) {
        return { ok: false as const, conflict: true, error: "Another visit for this lead already starts at that time. Choose another start time." };
      }
      const replaced = replacedStart ? await col.findOne({ leadId: input.leadId, type: input.type, date: replacedStart.slice(0, 10), time: replacedStart.slice(11, 16) }) : null;
      const previousSegments = replaced?.workSegments || (replacedStart ? [{ date: replacedStart.slice(0, 10), time: replacedStart.slice(11, 16) }] : []);
      const competing = appointments.filter(a => !(a.leadId === input.leadId && a.type === input.type &&
        ((!options.append && previousSegments.some(segment => segment.date === a.date && segment.time === a.time)) ||
          (existing && a.date === date && a.time === time))));
      for (const segment of segments) {
        // Status changes retain the reserved window. Reopening a cancelled
        // visit must acquire capacity again before it becomes active.
        if (input.status === "Cancelled" || options.statusOnly && existing?.status !== "Cancelled") continue;
        const availability = bookingAvailability(competing, { ...input, leadId: "__new_reservation__", ...assignment, ...segment }, rules, technicians);
        if (!availability.available) return { ok: false as const, conflict: true, error: `${segment.date}: ${availability.reason!}` };
      }
      if (options.statusOnly && existing) {
        await col.updateOne({ _id: existing._id }, { $set: { status: input.status } });
        return { ok: true as const, reference: existing.reference };
      }
      const reservationId = randomUUID();
      const status = resolveBookingStatus(input.type, input.status ?? replaced?.status ?? existing?.status,
        lead?.status, !options.append && replacedStart === (input.type === "job" ? lead?.jobAt : lead?.inspectionAt)?.slice(0, 16));
      const document: BookingDoc = { ...(options.statusOnly ? existing : {}), ...input, ...assignment, status, workSegments: segments, scheduledMinutes: segments[0].scheduledMinutes, durationMinutes, technicianId: input.type === "job" ? assignedTechnicianId(assignment, technicians) : undefined,
        date, time, reservationId, createdAt: existing?.createdAt || new Date() };
      if (existing) await col.updateOne({ _id: existing._id }, { $set: document });
      else await col.insertOne(document);
      if (!options.retainPrevious && replacedStart && replacedStart !== `${date}T${time}`) await col.deleteOne({
        leadId: input.leadId, type: input.type, date: replacedStart.slice(0, 10), time: replacedStart.slice(11, 16),
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
  scheduledMinutes?: number;
  endAt?: string;
  workSegments?: BookingSegment[];
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

    const [locks, subs, rules] = await Promise.all([
      col.find({ $or: [{ date: { $gte: from, $lte: to } }, { date: { $lt: from }, endAt: { $gte: `${from}T` } }] }).toArray(),
      subCol
        .find({
          status: { $nin: ["Lost", "Cancelled"] },
          $or: [{ inspectionAt: range }, { jobAt: range }, { inspectionAt: { $lt: `${from}T` }, inspectionEndAt: { $gte: `${from}T` } }, { jobAt: { $lt: `${from}T` }, jobEndAt: { $gte: `${from}T` } }],
        })
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1, inspectionAt: 1, jobAt: 1, inspectionEndAt: 1, jobEndAt: 1, inspectionWorkSegments: 1, jobWorkSegments: 1, technicianId: 1, technician: 1, technicianUsername: 1, inspectorId: 1, assigned: 1, inspectorUsername: 1, "inspectionReport.estimatedTime": 1 })
        .toArray(),
      getBookingRules(),
    ]);

    const out: DayAppointment[] = [];
    const seen = new Set<string>(); // leadId|type|date|time
    const info = new Map<string, { name: string; jobNo?: string; address?: string; suburb?: string; status?: string; technicianId?: string; technician?: string; technicianUsername?: string; durationMinutes?: number; inspectorId?: string; assigned?: string; inspectorUsername?: string }>();
    const describe = (s: Record<string, unknown>) => ({
      inspectorId: typeof s.inspectorId === "string" ? s.inspectorId : undefined,
      assigned: typeof s.assigned === "string" ? s.assigned : undefined,
      inspectorUsername: typeof s.inspectorUsername === "string" ? s.inspectorUsername : undefined,
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

        const time = tRaw.slice(0, 5).padStart(5, "0");
        seen.add(`${id}|${type}|${date}|${time}`);
        const lock = locks.find((booking) => booking.leadId === id && booking.type === type && booking.date === date && booking.time.slice(0, 5) === time);
        if (lock?.status === "Cancelled") continue;
        const savedEnd = type === "job" ? s.jobEndAt : s.inspectionEndAt;
        const endAt = lock?.endAt && (!savedEnd || lock.endAt > savedEnd) ? lock.endAt : savedEnd;
        const storedSegments = endAt === lock?.endAt && lock?.workSegments?.length ? lock.workSegments : type === "job" ? s.jobWorkSegments : s.inspectionWorkSegments;
        const segments = storedSegments?.length ? storedSegments : endAt ? bookingSegments(type, `${date}T${time}`, endAt, rules) : [{ date, time, scheduledMinutes: savedBookingMinutes(lock || {}) }];
        for (const segment of segments) {
          if (segment.date < from || segment.date > to) continue;
          out.push({ ...segment, endAt, type, leadId: id, ...info.get(id)!, status: resolveBookingStatus(type, lock?.status, s.status, true), durationMinutes: appointmentDurationMinutes({ type, ...segment }, rules), ...(lock ? { inspectorId: lock.inspectorId ?? s.inspectorId, assigned: lock.assigned ?? s.assigned, inspectorUsername: lock.inspectorUsername ?? s.inspectorUsername, technicianId: lock.technicianId, technician: lock.technician, technicianUsername: lock.technicianUsername } : {}), zone: lock?.zone || "flexible", source: "staff" });
        }
      }
    }

    // Slot locks whose lead doesn't record that time (e.g. online bookings not
    // yet reflected on the lead) — fetch their details.
    const extra = locks.filter((b) => !seen.has(`${b.leadId}|${b.type}|${b.date}|${b.time.slice(0, 5).padStart(5, "0")}`));
    const missingIds = [...new Set(extra.map((b) => b.leadId))].filter((id) => !info.has(id) && ObjectId.isValid(id));
    if (missingIds.length) {
      const docs = await subCol
        .find({ _id: { $in: missingIds.map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, jobNo: 1, address: 1, city: 1, status: 1, technicianId: 1, technician: 1, technicianUsername: 1, inspectorId: 1, assigned: 1, inspectorUsername: 1, "inspectionReport.estimatedTime": 1 })
        .toArray();
      for (const d of docs) info.set(d._id.toString(), describe(d));
    }
    for (const b of extra) {
      if (b.status === "Cancelled") continue;
      const i = info.get(b.leadId);
      // Lock held by a lead that's since been lost/cancelled → no longer a real appointment.
      if (i?.status === "Lost" || i?.status === "Cancelled") continue;
      const segments = b.workSegments?.length ? b.workSegments : b.endAt ? bookingSegments(b.type, `${b.date}T${b.time.slice(0, 5)}`, b.endAt, rules) : [{ date: b.date, time: b.time.slice(0, 5), scheduledMinutes: savedBookingMinutes(b) }];
      for (const segment of segments) {
        if (segment.date < from || segment.date > to) continue;
      out.push({
        type: b.type,
        leadId: b.leadId,
        name: i?.name || "Customer",
        jobNo: i?.jobNo || b.reference,
        address: i?.address,
        suburb: i?.suburb || b.suburb,
        status: resolveBookingStatus(b.type, b.status),
        inspectorId: b.inspectorId ?? i?.inspectorId, assigned: b.assigned ?? i?.assigned, inspectorUsername: b.inspectorUsername ?? i?.inspectorUsername,
        technicianId: b.technicianId || i?.technicianId,
        technician: b.technician || i?.technician,
        technicianUsername: b.technicianUsername || i?.technicianUsername,
        ...segment, endAt: b.endAt,
        durationMinutes: appointmentDurationMinutes({ ...b, ...segment }, rules),
        zone: b.zone,
        source: "online",
      });
      }
    }

    return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  } catch (err) {
    console.error("listAppointmentsBetween failed:", err);
    if (options.strict) throw err;
    return [];
  }
}
