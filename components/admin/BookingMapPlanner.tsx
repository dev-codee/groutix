"use client";

import { bookingEndForDuration } from "@/lib/bookingSpan";
import { savedLeadBookingMinutes } from "@/lib/bookingDuration";
import { useBookingRules } from "@/lib/useBookingRules";
import { staffBookingRules } from "@/lib/staffBookingRules";
import { useRef, useState } from "react";
import type { Lead } from "./types";
import { BookingPlanner } from "./BookingPlanner";
import { EditBookingModal } from "./modals/EditBookingModal";
import { bookingLead, leadBookings, type LeadBooking } from "@/lib/leadBookings";

export type MapPlannerBooking = LeadBooking & {
  leadId: string;
  customer?: { name?: string; address?: string } | null;
};

export function BookingMapPlanner({ booking, leads, onClose, onSaved }: {
  booking: MapPlannerBooking;
  leads: Lead[];
  onClose: () => void;
  onSaved: (date: string, message: string) => void;
}) {
  const rules = staffBookingRules(useBookingRules());
  const picked = useRef(false);
  const [proposedStart, setProposedStart] = useState<string>();
  const customer = leads.find(lead => lead.id === booking.leadId)
    || { id: booking.leadId, name: booking.customer?.name, address: booking.customer?.address } as Lead;
  const visit = leadBookings(customer).find(visit => booking.bookingId
    ? visit.bookingId === booking.bookingId
    : visit.type === booking.type && visit.date === booking.date && visit.time === booking.time);
  const lead = bookingLead(customer, visit || booking);

  if (proposedStart) return <EditBookingModal lead={lead} type={booking.type}
    proposedStart={proposedStart}
    proposedEnd={bookingEndForDuration(booking.type, proposedStart, savedLeadBookingMinutes(lead, booking.type), rules)} onClose={onClose} onSaved={onSaved} />;

  return <BookingPlanner type={booking.type} lead={lead}
    value={booking.type === "job" ? lead.jobAt : lead.inspectionAt}
    onPick={value => { picked.current = true; setProposedStart(value); }}
    onClose={() => { if (!picked.current) onClose(); }} />;
}
