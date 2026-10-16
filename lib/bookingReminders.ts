import type { SubmissionJSON } from "./submissions";
import type { BookingDoc } from "./bookings";
import { bookingNeedsReminder, resolveBookingStatus } from "./bookingStatus";

/** One reminder candidate per visit, including additional visits on the same lead. */
export function bookingReminderCandidates(leads: SubmissionJSON[], bookings: BookingDoc[]): SubmissionJSON[] {
  return leads.flatMap(lead => {
    const visits = bookings.filter(b => b.leadId === lead.id);
    const result: SubmissionJSON[] = [];
    for (const type of ["inspection", "job"] as const) {
      const at = type === "job" ? lead.jobAt : lead.inspectionAt;
      const matching = visits.filter(b => b.type === type);
      for (const booking of matching) {
        const start = `${booking.date}T${booking.time}`;
        const isPrimary = at?.slice(0, 16) === start;
        if (!bookingNeedsReminder(resolveBookingStatus(type, booking.status, lead.status, isPrimary))) continue;
        result.push({ ...lead, inspectionAt: undefined, jobAt: undefined, [type === "job" ? "jobAt" : "inspectionAt"]: start,
          [type === "job" ? "jobReminderSent" : "inspectionReminderSent"]: booking.reminderSent ?? (isPrimary ? lead[type === "job" ? "jobReminderSent" : "inspectionReminderSent"] : false),
          [type === "job" ? "jobReminder1hSent" : "inspectionReminder1hSent"]: booking.reminder1hSent ?? (isPrimary ? lead[type === "job" ? "jobReminder1hSent" : "inspectionReminder1hSent"] : false),
        });
      }
      if (at && !matching.some(b => `${b.date}T${b.time}` === at.slice(0, 16))) {
        result.push({ ...lead, inspectionAt: undefined, jobAt: undefined, [type === "job" ? "jobAt" : "inspectionAt"]: at });
      }
    }
    return result;
  });
}
