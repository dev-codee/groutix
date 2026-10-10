import { addDaysYmd } from "./scheduling";
import { bookingAvailability, type CapacityAppointment, type BookingTechnician } from "./bookingCapacity";
import { dayHours, explainOutsideRules, toMinutes, weekdayOf, type BookingRules } from "./bookingRules";

export function dispatchDates(date: string, mode: "Day" | "Week"): string[] {
  return Array.from({ length: mode === "Week" ? 7 : 1 }, (_, index) => addDaysYmd(date, index));
}

/** Snap the grabbed point to the track while keeping the complete booking visible. */
export function dispatchDropMinutes(ratio: number, start: number, end: number, duration: number, grabOffset = 0): number {
  const proposed = Math.round((start + ratio * (end - start) - grabOffset) / 15) * 15;
  return Math.max(start, Math.min(end - duration, proposed));
}

export function dispatchBookingIssue(candidate: CapacityAppointment, appointments: CapacityAppointment[], rules: BookingRules, technicians: BookingTechnician[]): string | null {
  const outside = explainOutsideRules(rules, candidate.type, `${candidate.date}T${candidate.time}`);
  if (outside) return outside;
  const hours = dayHours(rules, candidate.type, weekdayOf(candidate.date), candidate.date);
  if (toMinutes(candidate.time) + (candidate.durationMinutes ?? rules[candidate.type].slotMinutes) > toMinutes(hours.end)) {
    return "The full appointment must finish within the opening hours. Choose an earlier start time.";
  }
  return bookingAvailability(appointments, candidate, rules, technicians).reason;
}
