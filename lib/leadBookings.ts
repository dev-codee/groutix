import type { Lead } from "@/components/admin/types";
import type { TechnicianAssignment } from "./bookingCapacity";
import type { Role } from "./roles";
import { resolveBookingStatus, type BookingStatus } from "./bookingStatus";

export interface LeadBooking extends TechnicianAssignment {
  bookingId?: string;
  status?: BookingStatus;
  jobTotalDays?: number;
  jobDaysDone?: number;
  type: "inspection" | "job";
  date: string;
  time: string;
  endAt?: string;
  workSegments?: { date: string; time: string; scheduledMinutes: number }[];
  scheduledMinutes?: number;
}

/** The lead's summary belongs to the visit matching both time and assignee. */
export function isPrimaryBooking(lead: Lead, booking: LeadBooking): boolean {
  const identity = booking.type === "job" ? lead.primaryJobBookingId : lead.primaryInspectionBookingId;
  if (identity && booking.bookingId) return identity === booking.bookingId;
  const start = booking.type === "job" ? lead.jobAt : lead.inspectionAt;
  if (start?.slice(0, 16) !== `${booking.date}T${booking.time}`) return false;
  const fields = booking.type === "job" ? ["technicianId", "technicianUsername", "technician"] as const : ["inspectorId", "inspectorUsername", "assigned"] as const;
  const comparable = fields.find(field => booking[field] && lead[field]);
  if (!comparable || booking[comparable]?.trim().toLowerCase() === lead[comparable]?.trim().toLowerCase()) return true;
  // A unique reservation at the summary time is still the primary visit when
  // the summary's staff fields are stale. Same-time siblings remain distinct.
  const sameStart = (lead.bookings || []).filter(item => item.type === booking.type && `${item.date}T${item.time}` === start?.slice(0, 16));
  return sameStart.length === 1 && (booking.bookingId ? sameStart[0].bookingId === booking.bookingId : sameStart[0].date === booking.date && sameStart[0].time === booking.time);

}

/** Read the summary from its stable primary booking identity in every lead view. */
export function canonicalLeadBookings<T extends Lead>(lead: T): T {
  let result = { ...lead };
  for (const type of ["inspection", "job"] as const) {
    const booking = lead.bookings?.find(item => item.type === type && isPrimaryBooking(lead, item));
    if (!booking) continue;
    result = { ...result, ...(type === "inspection" ? {
      inspectionAt: `${booking.date}T${booking.time}`, inspectionEndAt: booking.endAt ?? lead.inspectionEndAt, inspectionWorkSegments: booking.workSegments ?? lead.inspectionWorkSegments,
      assigned: booking.assigned ?? lead.assigned, inspectorId: booking.inspectorId ?? lead.inspectorId, inspectorUsername: booking.inspectorUsername ?? lead.inspectorUsername,
    } : {
      jobAt: `${booking.date}T${booking.time}`, jobEndAt: booking.endAt ?? lead.jobEndAt, jobWorkSegments: booking.workSegments ?? lead.jobWorkSegments,
      technician: booking.technician ?? lead.technician, technicianId: booking.technicianId ?? lead.technicianId, technicianUsername: booking.technicianUsername ?? lead.technicianUsername,
    }) };
  }
  return result;
}

/** Each calendar visit keeps the same lead identity and business records. */
export function bookingLead(lead: Lead, booking: LeadBooking): Lead {
  return { ...lead, activeBooking: { type: booking.type, start: `${booking.date}T${booking.time}`, bookingId: booking.bookingId }, bookings: leadBookings(lead), ...(booking.type === "job" ? {
    jobAt: `${booking.date}T${booking.time}`, jobEndAt: booking.endAt,
    jobWorkSegments: booking.workSegments, technician: booking.technician,
    technicianId: booking.technicianId, technicianUsername: booking.technicianUsername,
  } : {
    inspectionAt: `${booking.date}T${booking.time}`, inspectionEndAt: booking.endAt,
    inspectionWorkSegments: booking.workSegments, assigned: booking.assigned,
    inspectorId: booking.inspectorId, inspectorUsername: booking.inspectorUsername,
  }) };
}

export function leadBookings(lead: Lead): LeadBooking[] {
  const bookings = [...(lead.bookings || [])];
  for (const type of ["inspection", "job"] as const) {
    const start = type === "job" ? lead.jobAt : lead.inspectionAt;
    if (!start || bookings.some(b => b.type === type && isPrimaryBooking(lead, b))) continue;
    bookings.push({ type, date: start.slice(0, 10), time: start.slice(11, 16),
      ...(type === "job" ? { endAt: lead.jobEndAt, workSegments: lead.jobWorkSegments, technician: lead.technician, technicianId: lead.technicianId, technicianUsername: lead.technicianUsername }
        : { endAt: lead.inspectionEndAt, workSegments: lead.inspectionWorkSegments, assigned: lead.assigned, inspectorId: lead.inspectorId }) });
  }
  return bookings.map(booking => ({ ...booking,
    ...(booking.type === "job" && isPrimaryBooking(lead, booking) ? {
      jobTotalDays: booking.jobTotalDays ?? lead.jobTotalDays,
      jobDaysDone: booking.jobDaysDone ?? lead.jobDaysDone,
    } : {}), status: resolveBookingStatus(booking.type, booking.status, lead.status,
    isPrimaryBooking(lead, booking)),
  })).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Cancelled records leave every role's lists; field queues also exclude cancelled visits. */
export function visibleInRole(lead: Lead, role: Role): boolean {
  if (lead.status === "Cancelled") return false;
  const type = role === "technician" ? "job" : role === "inspection" || role === "field" ? "inspection" : undefined;
  if (!type) return true;
  const visits = leadBookings(lead).filter(booking => booking.type === type);
  return !visits.length || visits.some(booking => booking.status !== "Cancelled");
}

/** Cancelled visit history must not hide the remaining job's controls. */
export function activeJobBookings(lead: Lead): LeadBooking[] {
  return leadBookings(lead).filter(booking => booking.type === "job" && booking.status !== "Cancelled");
}

/** A technician works one visit at a time; the shared customer record retains its ID. */
export function jobBookingRows(lead: Lead): Lead[] {
  if (lead.status === "Cancelled") return [];
  const visits = leadBookings(lead).filter(b => b.type === "job");
  if (!visits.length) return [lead];
  return visits.filter(booking => booking.status !== "Cancelled").map(booking => ({
    ...bookingLead(lead, booking),
    assigned: isPrimaryBooking(lead, booking) ? lead.assigned : undefined,
    activeBooking: { type: "job" as const, start: `${booking.date}T${booking.time}`, bookingId: booking.bookingId },
    status: ["Lost", "Cancelled", "Completed"].includes(lead.status) ? lead.status : booking.status!,
    jobTotalDays: booking.jobTotalDays,
    jobDaysDone: booking.jobDaysDone,
  }));
}

export function leadRowKey(lead: Lead): string {
  return lead.activeBooking ? `${lead.id}:${lead.activeBooking.type}:${lead.activeBooking.bookingId || lead.activeBooking.start}` : lead.id;
}

export function selectedJobBooking(lead: Lead): LeadBooking | undefined {
  const start = lead.activeBooking?.start || lead.jobAt?.slice(0, 16);
  const jobs = leadBookings(lead).filter(booking => booking.type === "job");
  if (lead.activeBooking) return jobs.find(booking => lead.activeBooking!.bookingId
    ? booking.bookingId === lead.activeBooking!.bookingId : `${booking.date}T${booking.time}` === start);
  const active = activeJobBookings(lead);
  // A cancelled primary can remain in the history after its replacement is
  // booked. The main card must act on the remaining live visit, not reopen it.
  if (active.length === 1) return active[0];
  return active.find(booking => isPrimaryBooking(lead, booking))
    || (active.length === 0 ? jobs.find(booking => isPrimaryBooking(lead, booking)) || jobs[0] : undefined);
}
