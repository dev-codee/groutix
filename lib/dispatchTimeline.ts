import { appointmentDurationMinutes } from "./bookingDuration";
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

/** Resize in half-hour increments relative to the existing finish. */
export function dispatchResizeEndMinutes(deltaRatio: number, originalEnd: number, minimum: number, maximum: number): number {
  const end = originalEnd + Math.round(deltaRatio * 480 / 30) * 30;
  return Math.max(minimum, Math.min(maximum, end));
}

export function dispatchBookingIssue(candidate: CapacityAppointment, appointments: CapacityAppointment[], rules: BookingRules, technicians: BookingTechnician[]): string | null {
  const outside = candidate.scheduledMinutes ? null : explainOutsideRules(rules, candidate.type, `${candidate.date}T${candidate.time}`);
  if (outside) return outside;
  const hours = dayHours(rules, candidate.type, weekdayOf(candidate.date), candidate.date);
  if (toMinutes(candidate.time) + appointmentDurationMinutes(candidate, rules) > toMinutes(hours.end)) {
    return "The full appointment must finish within the opening hours. Choose an earlier start time.";
  }
  return bookingAvailability(appointments, candidate, rules, technicians).reason;
}
