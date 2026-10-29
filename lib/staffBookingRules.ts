import type { BookingRules } from "./bookingRules";

const cache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();
const planningCache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();

/** Staff can plan on every day; customer closures and date limits do not apply. */
export function staffPlanningRules(rules: BookingRules): BookingRules & { staffScheduling: true } {
  const existing = planningCache.get(rules);
  if (existing) return existing;
  // Retain familiar time ranges and durations as suggestions, but open every
  // weekday, including dates covered by a customer-only schedule changeover.
  const openDays = (type: BookingRules["job"]): BookingRules["job"] => ({
    ...type,
    days: type.days.map(day => ({ ...day, open: true })),
    changeovers: type.changeovers?.map(change => ({
      ...change, days: change.days.map(day => ({ ...day, open: true })),
    })),
  });
  const result = {
    ...staffBookingRules(rules),
    inspection: openDays(rules.inspection),
    job: openDays(rules.job),
    closedDates: [],
  };
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
