import { isStaffScheduling } from "./staffBookingRules";
import { closedDateInfo, dayHours, fromMinutes, toMinutes, weekdayOf, type BookingRules, type BookingType } from "./bookingRules";
import { addDaysYmd } from "./scheduling";

export interface BookingSegment { date: string; time: string; scheduledMinutes: number; staffOverride?: true }
const validStamp = (value: string) => /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && new Date(`${value.slice(0, 10)}T12:00:00Z`).toISOString().slice(0, 10) === value.slice(0, 10);

/** Use working windows, allowing staff to explicitly extend the start/end beyond them. */
export function bookingSegments(type: BookingType, start: string, end: string, rules: BookingRules): BookingSegment[] {
  if (!validStamp(start) || !validStamp(end) || end <= start) throw new Error("End must be after the start, with valid dates and times.");
  const first = start.slice(0, 10), last = end.slice(0, 10);
  if ((Date.parse(last) - Date.parse(first)) / 86400000 > 44) throw new Error("A booking can span up to 45 calendar days.");
  if (!isStaffScheduling(rules) && type === "inspection" && first !== last) throw new Error("An inspection must start and finish on the same day.");
  const staff = isStaffScheduling(rules);
  const overnight = staff && last === addDaysYmd(first, 1)
    && end.slice(11) <= dayHours(rules, type, weekdayOf(last), last).start;
  const result: BookingSegment[] = [];
  for (let date = first; date <= last; date = addDaysYmd(date, 1)) {
    const hours = dayHours(rules, type, weekdayOf(date), date);
    const closed = !hours.open || !!closedDateInfo(rules, date) || !!(rules.minDate && date < rules.minDate);
    if (closed && !(staff && (date === first || date === last))) {
      if (date === first || date === last) throw new Error(`${date} is closed. Choose a working day for the start and end.`);
      continue;
    }
    const from = date === first ? toMinutes(start.slice(11))
      : staff && date === last && end.slice(11) <= hours.start ? 0 : toMinutes(hours.start);
    const to = date === last ? toMinutes(end.slice(11))
      : staff && date === first && (overnight || start.slice(11) >= hours.end) ? 1440 : toMinutes(hours.end);
    if (date === last && to === 0 && date !== first) continue;
    if (to <= from || (!staff && (from < toMinutes(hours.start) || to > toMinutes(hours.end)))) throw new Error(`${date}: select a time within ${hours.start}–${hours.end}.`);
    result.push({ date, time: fromMinutes(from), scheduledMinutes: to - from,
      ...(staff && (closed || from < toMinutes(hours.start) || to > toMinutes(hours.end)) ? { staffOverride: true as const } : {}) });
  }
  return result;
}

export function bookingEndForDuration(type: BookingType, start: string, minutes: number, rules: BookingRules): string {
  if (!validStamp(start) || !Number.isInteger(minutes) || minutes <= 0) throw new Error("Enter a positive duration in minutes.");
  const first = start.slice(0, 10);
  let remaining = minutes;
  for (let offset = 0; offset < 45; offset++) {
    const date = addDaysYmd(first, offset);
    const hours = dayHours(rules, type, weekdayOf(date), date);
    if ((!hours.open || closedDateInfo(rules, date) || (rules.minDate && date < rules.minDate)) && !(isStaffScheduling(rules) && !offset)) {
      if (!offset) throw new Error("Choose a working day for the start.");
      continue;
    }
    const from = offset ? toMinutes(hours.start) : toMinutes(start.slice(11));
    const available = (isStaffScheduling(rules) && !offset && from >= toMinutes(hours.end) ? 1440 : toMinutes(hours.end)) - from;
    if ((!isStaffScheduling(rules) && from < toMinutes(hours.start)) || available <= 0) throw new Error(`Start must be within ${hours.start}–${hours.end}.`);
    if (remaining <= available) return from + remaining === 1440 ? `${addDaysYmd(date, 1)}T00:00` : `${date}T${fromMinutes(from + remaining)}`;
    if (!isStaffScheduling(rules) && type === "inspection") throw new Error("The inspection must finish within this day's opening hours.");
    remaining -= available;
  }
  throw new Error("The duration exceeds 45 calendar days of working hours.");
}

/** Finish at closing time on the requested working day, including the start day. */
export function bookingEndForWorkingDays(type: BookingType, start: string, days: number, rules: BookingRules): string {
  if (!validStamp(start) || !Number.isInteger(days) || days < 1 || days > 45) throw new Error("Choose between 1 and 45 working days.");
  if (!isStaffScheduling(rules) && type === "inspection" && days > 1) throw new Error("An inspection must finish on the same day.");
  let remaining = days;
  for (let offset = 0; offset < 45; offset++) {
    const date = addDaysYmd(start.slice(0, 10), offset);
    const hours = dayHours(rules, type, weekdayOf(date), date);
    if ((!hours.open || closedDateInfo(rules, date)) && !(isStaffScheduling(rules) && !offset)) {
      if (!offset) throw new Error("Choose a working day for the start.");
      continue;
    }
    if (!isStaffScheduling(rules) && !offset && (start.slice(11) < hours.start || start.slice(11) >= hours.end)) throw new Error(`Start must be within ${hours.start}–${hours.end}.`);
    if (--remaining === 0) return !offset && start.slice(11) >= hours.end
      ? bookingEndForDuration(type, start, rules[type].slotMinutes, rules)
      : `${date}T${hours.end}`;
  }
  throw new Error("The duration exceeds 45 calendar days of working hours.");
}

/** Keep saved working windows; repair legacy continuous spans that included midnight. */
export function savedWorkSegments(type: BookingType, start: string, end: string | undefined, stored: BookingSegment[] | undefined, rules: BookingRules): BookingSegment[] | undefined {
  const legacyOvernight = end && end.slice(0, 10) !== start.slice(0, 10) && stored?.some(segment => !segment.staffOverride && (segment.time === "00:00" || toMinutes(segment.time) + segment.scheduledMinutes >= 1440));
  if (stored?.length && !legacyOvernight) return stored;
  if (!end) return stored;
  if (!legacyOvernight) return bookingSegments(type, start.slice(0, 16), end.slice(0, 16), rules);
  const result: BookingSegment[] = [];
  for (let date = start.slice(0, 10), count = 0; date <= end.slice(0, 10) && count < 45; date = addDaysYmd(date, 1), count++) {
    const hours = dayHours(rules, type, weekdayOf(date), date);
    if (!hours.open || closedDateInfo(rules, date)) continue;
    const from = Math.max(toMinutes(hours.start), date === start.slice(0, 10) ? toMinutes(start.slice(11, 16)) : 0);
    const to = Math.min(toMinutes(hours.end), date === end.slice(0, 10) ? toMinutes(end.slice(11, 16)) : 1440);
    if (to > from) result.push({ date, time: fromMinutes(from), scheduledMinutes: to - from });
  }
  return result;
}
