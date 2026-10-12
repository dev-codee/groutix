import { closedDateInfo, dayHours, fromMinutes, toMinutes, weekdayOf, type BookingRules, type BookingType } from "./bookingRules";
import { addDaysYmd } from "./scheduling";

export interface BookingSegment { date: string; time: string; scheduledMinutes: number }
const validStamp = (value: string) => /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && new Date(`${value.slice(0, 10)}T12:00:00Z`).toISOString().slice(0, 10) === value.slice(0, 10);

/** Explicit bookings span working hours only; closed days and overnight hours are skipped. */
export function bookingSegments(type: BookingType, start: string, end: string, rules: BookingRules): BookingSegment[] {
  if (!validStamp(start) || !validStamp(end) || end <= start) throw new Error("End must be after the start, with valid dates and times.");
  const first = start.slice(0, 10), last = end.slice(0, 10);
  if ((Date.parse(last) - Date.parse(first)) / 86400000 > 44) throw new Error("A booking can span up to 45 calendar days.");
  if (type === "inspection" && first !== last) throw new Error("An inspection must start and finish on the same day.");
  const result: BookingSegment[] = [];
  for (let date = first; date <= last; date = addDaysYmd(date, 1)) {
    const hours = dayHours(rules, type, weekdayOf(date), date);
    const closed = !hours.open || !!closedDateInfo(rules, date) || !!(rules.minDate && date < rules.minDate);
    if (closed) {
      if (date === first || date === last) throw new Error(`${date} is closed. Choose a working day for the start and end.`);
      continue;
    }
    const from = date === first ? toMinutes(start.slice(11)) : toMinutes(hours.start);
    const to = date === last ? toMinutes(end.slice(11)) : toMinutes(hours.end);
    if (from < toMinutes(hours.start) || to > toMinutes(hours.end) || to <= from) throw new Error(`${date}: select a time within ${hours.start}–${hours.end}.`);
    result.push({ date, time: fromMinutes(from), scheduledMinutes: to - from });
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
    if (!hours.open || closedDateInfo(rules, date) || (rules.minDate && date < rules.minDate)) {
      if (!offset) throw new Error("Choose a working day for the start.");
      continue;
    }
    const from = offset ? toMinutes(hours.start) : toMinutes(start.slice(11));
    const available = toMinutes(hours.end) - from;
    if (from < toMinutes(hours.start) || available <= 0) throw new Error(`Start must be within ${hours.start}–${hours.end}.`);
    if (remaining <= available) return `${date}T${fromMinutes(from + remaining)}`;
    if (type === "inspection") throw new Error("The inspection must finish within this day's opening hours.");
    remaining -= available;
  }
  throw new Error("The duration exceeds 45 calendar days of working hours.");
}
