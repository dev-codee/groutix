import type { Lead } from "@/components/admin/types";
import { leadBookings, bookingLead } from "./leadBookings";

/** Today/tomorrow cards represent visits, including their own cancellation/progress. */
export function dashboardVisits(leads: Lead[]): Lead[] {
  return leads.filter(lead => !["Cancelled", "Lost", "Closed", "No Response"].includes(lead.status)).flatMap(lead =>
    leadBookings(lead).filter(booking => booking.status !== "Cancelled").map(booking => ({
      ...bookingLead(lead, booking),
      inspectionAt: booking.type === "inspection" ? `${booking.date}T${booking.time}` : undefined,
      jobAt: booking.type === "job" ? `${booking.date}T${booking.time}` : undefined,
    })));
}

export function dashboardVisitDone(lead: Lead): boolean {
  if (["Cancelled", "Lost", "Closed", "No Response"].includes(lead.status)) return false;
  return lead.activeBooking?.type === "job" ? lead.status === "Job Done" || lead.status === "Completed"
    : lead.status === "Inspection Completed" || lead.inspectionReport?.status === "completed";
}
