import { bookingAvailability, type BookingTechnician, type CapacityAppointment } from "./bookingCapacity";
import { appointmentDurationMinutes } from "./bookingDuration";
import { dayHours, toMinutes, weekdayOf, type BookingRules } from "./bookingRules";
import type { DayOption } from "./scheduling";

/** The same full-interval capacity check as reservations, applied to every offered date. */
export function applyBookingCapacity(
  days: DayOption[], appointments: CapacityAppointment[],
  candidate: Omit<CapacityAppointment, "date" | "time">,
  rules: BookingRules, technicians: BookingTechnician[],
): DayOption[] {
  return days.map((day) => {
    const hours = dayHours(rules, candidate.type, weekdayOf(day.date), day.date);
    const slots = day.slots.map((slot) => {
      const availability = bookingAvailability(appointments, { ...candidate, date: day.date, time: slot.time }, rules, technicians);
      const fits = toMinutes(slot.time) + appointmentDurationMinutes(candidate, rules) <= toMinutes(hours.end);
      const booked = slot.booked || !availability.available || !fits;
      return { ...slot, booked, capacity: availability.capacity, remaining: booked ? 0 : availability.remaining,
        reason: !fits ? "The full job does not fit before closing." : availability.reason };
    });
    return { ...day, slots, times: slots.filter((slot) => !slot.booked).map((slot) => slot.time) };
  });
}
