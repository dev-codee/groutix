import type { BookingRules } from "./bookingRules";

const cache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();
const planningCache = new WeakMap<BookingRules, BookingRules & { staffScheduling: true }>();

/** Staff slot suggestions use the daily 9 AM–5 PM working window. */
export function staffPlanningRules(rules: BookingRules): BookingRules & { staffScheduling: true } {
  const existing = planningCache.get(rules);
  if (existing) return existing;
  const staffRules = staffBookingRules(rules);
  const days = Array.from({ length: 7 }, () => ({ open: true, start: "09:00", end: "17:00" }));
  const result = {
    ...staffRules,
    inspection: { ...staffRules.inspection, days },
    job: { ...staffRules.job, days },
  };
  planningCache.set(rules, result);
  return result;
}

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
