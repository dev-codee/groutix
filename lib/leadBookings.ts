import type { Lead } from "@/components/admin/types";
import type { TechnicianAssignment } from "./bookingCapacity";
import { resolveBookingStatus, type BookingStatus } from "./bookingStatus";

export interface LeadBooking extends TechnicianAssignment {
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

/** Each calendar visit keeps the same lead identity and business records. */
export function bookingLead(lead: Lead, booking: LeadBooking): Lead {
  return { ...lead, bookings: leadBookings(lead), ...(booking.type === "job" ? {
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
    if (!start || bookings.some(b => b.type === type && `${b.date}T${b.time}` === start.slice(0, 16))) continue;
    bookings.push({ type, date: start.slice(0, 10), time: start.slice(11, 16),
      ...(type === "job" ? { endAt: lead.jobEndAt, workSegments: lead.jobWorkSegments, technician: lead.technician, technicianId: lead.technicianId, technicianUsername: lead.technicianUsername }
        : { endAt: lead.inspectionEndAt, workSegments: lead.inspectionWorkSegments, assigned: lead.assigned, inspectorId: lead.inspectorId }) });
  }
  return bookings.map(booking => ({ ...booking,
    ...(booking.type === "job" && lead.jobAt?.slice(0, 16) === `${booking.date}T${booking.time}` ? {
      jobTotalDays: booking.jobTotalDays ?? lead.jobTotalDays,
      jobDaysDone: booking.jobDaysDone ?? lead.jobDaysDone,
    } : {}), status: resolveBookingStatus(booking.type, booking.status, lead.status,
    (booking.type === "job" ? lead.jobAt : lead.inspectionAt)?.slice(0, 16) === `${booking.date}T${booking.time}`),
  })).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** A technician works one visit at a time; the shared customer record retains its ID. */
export function jobBookingRows(lead: Lead): Lead[] {
  const visits = leadBookings(lead).filter(b => b.type === "job");
  if (!visits.length) return [lead];
  return visits.map(booking => ({
    ...bookingLead(lead, booking),
    assigned: lead.jobAt?.slice(0, 16) === `${booking.date}T${booking.time}` ? lead.assigned : undefined,
    activeBooking: { type: "job" as const, start: `${booking.date}T${booking.time}` },
    status: ["Lost", "Cancelled"].includes(lead.status) ? lead.status : booking.status!,
    jobTotalDays: booking.jobTotalDays,
    jobDaysDone: booking.jobDaysDone,
  }));
}

export function leadRowKey(lead: Lead): string {
  return lead.activeBooking ? `${lead.id}:${lead.activeBooking.type}:${lead.activeBooking.start}` : lead.id;
}

export function selectedJobBooking(lead: Lead): LeadBooking | undefined {
  const start = lead.activeBooking?.start || lead.jobAt?.slice(0, 16);
  return leadBookings(lead).find(b => b.type === "job" && `${b.date}T${b.time}` === start);
}
