import type { Lead } from "@/components/admin/types";
import type { TechnicianAssignment } from "./bookingCapacity";

export interface LeadBooking extends TechnicianAssignment {
  type: "inspection" | "job";
  date: string;
  time: string;
  endAt?: string;
  workSegments?: { date: string; time: string; scheduledMinutes: number }[];
  scheduledMinutes?: number;
}

/** Each calendar visit keeps the same lead identity and business records. */
export function bookingLead(lead: Lead, booking: LeadBooking): Lead {
  return { ...lead, ...(booking.type === "job" ? {
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
      ...(type === "job" ? { endAt: lead.jobEndAt, workSegments: lead.jobWorkSegments, technician: lead.technician, technicianId: lead.technicianId }
        : { endAt: lead.inspectionEndAt, workSegments: lead.inspectionWorkSegments, assigned: lead.assigned, inspectorId: lead.inspectorId }) });
  }
  return bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
