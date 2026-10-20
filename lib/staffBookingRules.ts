import type { BookingRules } from "./bookingRules";

const cache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();
const planningCache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();

/** Suggestions follow configured booking hours; staff can still book manually. */
export function staffPlanningRules(rules: BookingRules): BookingRules & { staffScheduling: true } {
  const existing = planningCache.get(rules);
  if (existing) return existing;
  const result = { ...rules, staffScheduling: true as const };
  planningCache.set(rules, result);
  return result;
}

/** Keep working windows for duration planning; CRM saves may override scheduling rules. */
export function staffBookingRules(rules: BookingRules): BookingRules & { staffScheduling: true } {
  const existing = cache.get(rules);
  if (existing) return existing;
  const result: BookingRules & { staffScheduling: true } = {
    ...rules, staffScheduling: true, minDate: "", minNoticeDays: 0, horizonDays: 45,
  };
  cache.set(rules, result);
  return result;
}

export function isStaffScheduling(rules: BookingRules): boolean {
  return "staffScheduling" in rules && rules.staffScheduling === true;
}
