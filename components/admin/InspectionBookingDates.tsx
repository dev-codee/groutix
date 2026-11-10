import type { Lead } from "./types";
import { bookingLead, canonicalLeadBookings, leadBookings } from "@/lib/leadBookings";
import { formatApptDate } from "@/lib/scheduling";
import { formatLeadBookingTime } from "@/lib/bookingPresentation";

/** Use the same saved visit records as Dispatch and Calendar, including additional inspections. */
export function InspectionBookingDates({ lead }: { lead: Lead }) {
  const canonical = canonicalLeadBookings(lead);
  const inspections = leadBookings(canonical).filter(booking => booking.type === "inspection" && booking.status !== "Cancelled"
    && (!lead.activeBooking || lead.activeBooking.type !== "inspection" || (lead.activeBooking.bookingId ? lead.activeBooking.bookingId === booking.bookingId : lead.activeBooking.start === `${booking.date}T${booking.time}`)));
  if (!inspections.length) return null;
  return <div className="space-y-1 text-[10px] font-medium text-slate-600">
    {inspections.map(booking => <div key={booking.bookingId || `${booking.date}T${booking.time}:${booking.inspectorId || booking.assigned || ""}`}>
      {formatApptDate(`${booking.date}T${booking.time}`)} · {formatLeadBookingTime(bookingLead(canonical, booking), "inspection")}{inspections.length > 1 && booking.assigned ? ` · ${booking.assigned}` : ""}
    </div>)}
  </div>;
}
