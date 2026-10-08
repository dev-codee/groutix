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
  appointment: { type: BookingType; durationMinutes?: number }, rules: BookingRules,
): number {
  const duration = appointment.durationMinutes;
  return appointment.type === "job" && typeof duration === "number" && Number.isFinite(duration) && duration > 0
    ? duration : rules[appointment.type].slotMinutes;
}

export function overlapsSlot(appointment: { type: BookingType; time: string; durationMinutes?: number }, time: string, duration: number, rules: BookingRules): boolean {
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return minutes(appointment.time) < minutes(time) + duration && minutes(appointment.time) + appointmentDurationMinutes(appointment, rules) > minutes(time);
}
