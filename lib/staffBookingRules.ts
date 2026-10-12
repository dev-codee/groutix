import type { BookingRules } from "./bookingRules";

const cache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();

/** Dashboard scheduling is unrestricted by customer self-booking settings. */
export function staffBookingRules(rules: BookingRules): BookingRules & { staffScheduling: true } {
  const existing = cache.get(rules);
  if (existing) return existing;
  const days = Array.from({ length: 7 }, () => ({ open: true, start: "00:00", end: "24:00" }));
  const result: BookingRules & { staffScheduling: true } = { ...rules, staffScheduling: true, minDate: "", minNoticeDays: 0, horizonDays: 45, closedDates: [],
    inspection: { ...rules.inspection, days, changeovers: [] },
    job: { ...rules.job, days, changeovers: [] } };
  cache.set(rules, result);
  return result;
}

export function isStaffScheduling(rules: BookingRules): boolean {
  return "staffScheduling" in rules && rules.staffScheduling === true;
}
