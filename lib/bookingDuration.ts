import type { BookingRules, BookingType } from "./bookingRules";

/** Hour estimates may be a number, decimal, or range; reserve the upper bound. */
export function estimatedJobMinutes(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:[-–—]|to)?\s*(\d+(?:\.\d+)?)?\s*(?:h|hr|hrs|hour|hours)?\s*$/i.exec(value);
  if (!match) return undefined;
  const hours = Math.max(Number(match[1]), Number(match[2] || match[1]));
  return hours > 0 && hours <= 24 ? Math.ceil(hours * 60) : undefined;
}

export function appointmentDurationMinutes(
  appointment: { type: BookingType; durationMinutes?: number; scheduledMinutes?: number }, rules: BookingRules,
): number {
  if (Number.isInteger(appointment.scheduledMinutes) && appointment.scheduledMinutes! > 0) return appointment.scheduledMinutes!;
  // The booking window is the configured slot (normally one hour). Estimated
  // work hours and legacy durationMinutes do not reserve subsequent slots.
  return rules[appointment.type].slotMinutes;
}

export function overlapsSlot(appointment: { type: BookingType; time: string; durationMinutes?: number; scheduledMinutes?: number }, time: string, duration: number, rules: BookingRules): boolean {
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return minutes(appointment.time) < minutes(time) + duration && minutes(appointment.time) + appointmentDurationMinutes(appointment, rules) > minutes(time);
}

/** Saved appointments must never inherit a subsequently changed slot setting. */
export function savedBookingMinutes(booking: { scheduledMinutes?: number; durationMinutes?: number }): number {
  if (Number.isInteger(booking.scheduledMinutes) && booking.scheduledMinutes! > 0) return booking.scheduledMinutes!;
  if (Number.isInteger(booking.durationMinutes) && booking.durationMinutes! > 0) return booking.durationMinutes!;
  return 60; // Historical bookings without a saved window used one-hour slots.
}

export function savedLeadBookingMinutes(lead: {
  inspectionWorkSegments?: { scheduledMinutes: number }[];
  jobWorkSegments?: { scheduledMinutes: number }[];
}, type: BookingType): number {
  const segments = type === "inspection" ? lead.inspectionWorkSegments : lead.jobWorkSegments;
  return segments?.reduce((sum, segment) => sum + segment.scheduledMinutes, 0) || 60;
}
