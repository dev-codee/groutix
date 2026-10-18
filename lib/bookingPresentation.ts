import { savedLeadBookingMinutes } from "./bookingDuration";
import { formatApptDate, formatApptTime, formatApptTimeRange } from "./scheduling";
import type { BookingType } from "./bookingRules";

/** A multi-day job is a date range and working total, never one overnight slot. */
export function formatLeadBookingTime(lead: {
  jobAt?: string; inspectionAt?: string; jobEndAt?: string; inspectionEndAt?: string;
  jobWorkSegments?: { date: string; time: string; scheduledMinutes: number }[];
  inspectionWorkSegments?: { date: string; time: string; scheduledMinutes: number }[];
}, type: BookingType): string {
  const start = type === "job" ? lead.jobAt : lead.inspectionAt;
  if (!start) return "";
  const end = type === "job" ? lead.jobEndAt : lead.inspectionEndAt;
  const segments = type === "job" ? lead.jobWorkSegments : lead.inspectionWorkSegments;
  const minutes = savedLeadBookingMinutes(lead, type);
  if (end && end.slice(0, 10) !== start.slice(0, 10)) {
    return `${formatApptTime(start)} – ${formatApptDate(end)} ${formatApptTime(end)} · ${segments?.length || 1} working days · ${minutes / 60} working hours`;
  }
  return formatApptTimeRange(start, minutes / 60);
}
