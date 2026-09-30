// Booking rules — the single source of truth for WHEN inspections and jobs can be
// booked (open days, daily hours, slot length, earliest date, horizon, closures).
//
// Managers edit these from the admin dashboard (Settings → Booking Hours); they are
// stored in MongoDB (see lib/bookingRulesServer.ts) and every part of the site —
// customer booking pages, the quote form, confirmation emails, admin date pickers,
// the roster and the dispatch timeline — derives its slots from here.
//
// This file is dependency-free so it can be imported by server routes AND client
// components. The defaults reproduce the behaviour that used to be hard-coded.

export type BookingType = "inspection" | "job";

export interface DayHours {
  open: boolean;
  start: string; // "HH:mm" — first appointment start
  end: string; // "HH:mm" — appointments must finish by this time
}

/**
 * A scheduled change to the open days/hours, applied to `from` and every date
 * after it. Lets managers announce a future change (e.g. "inspections open every
 * day from 7 Oct") without it taking effect on dates already being booked.
 */
export interface DayChangeover {
  /** Inclusive YYYY-MM-DD — these hours apply from this date onwards. */
  from: string;
  /** Indexed by weekday: 0 = Sunday … 6 = Saturday. */
  days: DayHours[];
  label?: string;
}

export interface TypeRules {
  /** Base open days/hours, used for every date before the first changeover. */
  days: DayHours[];
  /** Length of one bookable slot, in minutes. */
  slotMinutes: number;
  /** Future changeovers, sorted ascending by `from`; the latest match wins. */
  changeovers?: DayChangeover[];
}

export interface ClosedDate {
  date: string; // YYYY-MM-DD
  label?: string;
}

export interface BookingRules {
  inspection: TypeRules;
  job: TypeRules;
  /** Earliest bookable date (YYYY-MM-DD), or "" for no floor. */
  minDate: string;
  /** How many days ahead customers may book. */
  horizonDays: number;
  /** Minimum days of notice (1 = tomorrow is the earliest bookable day). */
  minNoticeDays: number;
  /** Public holidays / shutdowns — nothing is bookable on these dates. */
  closedDates: ClosedDate[];
  updatedAt?: string;
  updatedBy?: string;
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const std = (open: boolean): DayHours => ({ open, start: "09:00", end: "17:00" });

export const DEFAULT_BOOKING_RULES: BookingRules = {
  // Inspections: weekends only, 9 AM – 5 PM, opening every day from 7 Oct 2026.
  inspection: {
    slotMinutes: 60,
    days: [std(true), std(false), std(false), std(false), std(false), std(false), std(true)],
    changeovers: [{ from: "2026-10-07", days: Array.from({ length: 7 }, () => std(true)), label: "Open every day" }],
  },
  // Jobs: every day, 9 AM – 5 PM except Friday 10 AM – 3 PM.
  job: {
    slotMinutes: 60,
    days: [std(true), std(true), std(true), std(true), std(true), { open: true, start: "10:00", end: "15:00" }, std(true)],
  },
  minDate: "2026-09-28",
  horizonDays: 35,
  minNoticeDays: 1,
  closedDates: [],
};

// ── Time helpers ─────────────────────────────────────────────────────────────

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fromMinutes(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** "13:30" → "1:30 PM" */
export function formatHHmm(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Weekday (0–6) of a YYYY-MM-DD calendar date, independent of the runtime timezone. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

// ── Rule queries ─────────────────────────────────────────────────────────────

/**
 * The open days/hours in force on a calendar date, honouring scheduled
 * changeovers. Without a date, the base (pre-changeover) days are returned.
 */
export function daysInForce(rules: BookingRules, type: BookingType, date?: string): DayHours[] {
  const t = rules[type];
  if (!date || !t.changeovers?.length) return t.days;
  let days = t.days;
  for (const c of t.changeovers) {
    if (date >= c.from) days = c.days;
    else break; // changeovers are sorted ascending
  }
  return days;
}

/** The next changeover taking effect after `date`, if any. */
export function nextChangeover(rules: BookingRules, type: BookingType, date: string): DayChangeover | undefined {
  return rules[type].changeovers?.find((c) => c.from > date);
}

export function dayHours(rules: BookingRules, type: BookingType, weekday: number, date?: string): DayHours {
  return daysInForce(rules, type, date)[weekday] ?? { open: false, start: "09:00", end: "17:00" };
}

/** Appointment start times ("HH:mm") offered on a weekday; [] when closed. */
export function slotsForWeekday(rules: BookingRules, type: BookingType, weekday: number, date?: string): string[] {
  const d = dayHours(rules, type, weekday, date);
  if (!d.open) return [];
  const len = rules[type].slotMinutes;
  const out: string[] = [];
  for (let t = toMinutes(d.start); t + len <= toMinutes(d.end); t += len) out.push(fromMinutes(t));
  return out;
}

export function closedDateInfo(rules: BookingRules, date: string): ClosedDate | undefined {
  return rules.closedDates.find((c) => c.date === date);
}

/** Start times offered on a specific calendar date (honours closures and the min date). */
export function slotsForDate(rules: BookingRules, type: BookingType, date: string): string[] {
  if (!YMD_RE.test(date)) return [];
  if (rules.minDate && date < rules.minDate) return [];
  if (closedDateInfo(rules, date)) return [];
  return slotsForWeekday(rules, type, weekdayOf(date), date);
}

/**
 * Why a date/time is outside the configured booking rules, or null if it fits.
 * Used by admin date pickers to warn staff (they may still override).
 */
export function explainOutsideRules(rules: BookingRules, type: BookingType, value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(value || "");
  if (!m) return null;
  const [, date, time] = m;
  const label = type === "inspection" ? "Inspections" : "Jobs";
  if (rules.minDate && date < rules.minDate) return `${label} can't be booked before ${rules.minDate}.`;
  const closed = closedDateInfo(rules, date);
  if (closed) return `${date} is marked closed${closed.label ? ` (${closed.label})` : ""}.`;
  const wd = weekdayOf(date);
  const d = dayHours(rules, type, wd, date);
  if (!d.open) return `${label} are not offered on ${WEEKDAY_NAMES[wd]}s${changeoverHint(rules, type, wd, date)}.`;
  const start = toMinutes(time);
  if (start < toMinutes(d.start) || start + rules[type].slotMinutes > toMinutes(d.end)) {
    return `${WEEKDAY_NAMES[wd]} ${type} hours are ${formatHHmm(d.start)} – ${formatHHmm(d.end)}.`;
  }
  return null;
}

/** " (opens from 2026-10-07)" when a changeover later opens this weekday. */
function changeoverHint(rules: BookingRules, type: BookingType, weekday: number, date: string): string {
  const next = (rules[type].changeovers || []).find((c) => c.from > date && c.days[weekday]?.open);
  return next ? ` (opens from ${next.from})` : "";
}

/** "Saturday & Sunday" / "Monday, Wednesday & Friday" / "every day" */
export function openDaysSummary(rules: BookingRules, type: BookingType, date?: string): string {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const open = order.filter((wd) => dayHours(rules, type, wd, date).open).map((wd) => WEEKDAY_NAMES[wd]);
  if (open.length === 7) return "every day";
  if (open.length === 0) return "no days";
  if (open.length === 1) return open[0];
  return `${open.slice(0, -1).join(", ")} & ${open[open.length - 1]}`;
}

/** Earliest open start and latest close across the given types (for timeline grids). */
export function hoursEnvelope(
  rules: BookingRules,
  types: BookingType[] = ["inspection", "job"]
): { start: number; end: number } {
  let start = Infinity;
  let end = -Infinity;
  for (const t of types) {
    const allDays = [...rules[t].days, ...(rules[t].changeovers || []).flatMap((c) => c.days)];
    for (const d of allDays) {
      if (!d.open) continue;
      start = Math.min(start, toMinutes(d.start));
      end = Math.max(end, toMinutes(d.end));
    }
  }
  if (!Number.isFinite(start)) return { start: 9 * 60, end: 17 * 60 };
  return { start, end };
}

// ── Validation ───────────────────────────────────────────────────────────────

function sanitizeDays(input: unknown, fallback: DayHours[]): DayHours[] {
  return fallback.map((fb, i) => {
    const d = (Array.isArray(input) ? input[i] : undefined) as Partial<DayHours> | undefined;
    if (!d || typeof d !== "object") return { ...fb };
    const start = typeof d.start === "string" && HHMM_RE.test(d.start) ? d.start : fb.start;
    const end = typeof d.end === "string" && HHMM_RE.test(d.end) ? d.end : fb.end;
    return { open: Boolean(d.open), start, end };
  });
}

function sanitizeType(input: unknown, fallback: TypeRules): TypeRules {
  const src = (input && typeof input === "object" ? input : {}) as Partial<TypeRules>;
  const slot = Number(src.slotMinutes);
  const slotMinutes = [15, 30, 45, 60, 90, 120, 180, 240].includes(slot) ? slot : fallback.slotMinutes;
  const days = sanitizeDays(src.days, fallback.days);
  // Changeovers: valid dates only, deduplicated, sorted so the latest match wins.
  const changeovers = (Array.isArray(src.changeovers) ? src.changeovers : [])
    .filter((c): c is DayChangeover => !!c && typeof c === "object" && YMD_RE.test(String((c as DayChangeover).from)))
    .map((c) => ({
      from: c.from,
      days: sanitizeDays(c.days, days),
      label: typeof c.label === "string" && c.label.trim() ? c.label.trim().slice(0, 80) : undefined,
    }))
    .filter((c, i, arr) => arr.findIndex((x) => x.from === c.from) === i)
    .sort((a, b) => a.from.localeCompare(b.from));
  return changeovers.length ? { slotMinutes, days, changeovers } : { slotMinutes, days };
}

/**
 * Coerce untrusted input (DB document or API body) into a complete, valid rules
 * object, filling gaps from the defaults. Never throws.
 */
export function sanitizeBookingRules(input: unknown): BookingRules {
  const src = (input && typeof input === "object" ? input : {}) as Partial<BookingRules>;
  const D = DEFAULT_BOOKING_RULES;
  const int = (v: unknown, min: number, max: number, fb: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= min && n <= max ? n : fb;
  };
  const closedDates = Array.isArray(src.closedDates)
    ? src.closedDates
        .filter((c): c is ClosedDate => !!c && typeof c === "object" && YMD_RE.test(String((c as ClosedDate).date)))
        .map((c) => ({ date: c.date, label: typeof c.label === "string" ? c.label.slice(0, 80) : undefined }))
        .filter((c, i, arr) => arr.findIndex((x) => x.date === c.date) === i)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  return {
    inspection: sanitizeType(src.inspection, D.inspection),
    job: sanitizeType(src.job, D.job),
    minDate: typeof src.minDate === "string" && (src.minDate === "" || YMD_RE.test(src.minDate)) ? src.minDate : D.minDate,
    horizonDays: int(src.horizonDays, 1, 365, D.horizonDays),
    minNoticeDays: int(src.minNoticeDays, 0, 60, D.minNoticeDays),
    closedDates,
    updatedAt: typeof src.updatedAt === "string" ? src.updatedAt : undefined,
    updatedBy: typeof src.updatedBy === "string" ? src.updatedBy : undefined,
  };
}

/** Human-readable problems with a rules object (empty = OK to save). */
export function validateBookingRules(rules: BookingRules): string[] {
  const errors: string[] = [];
  for (const type of ["inspection", "job"] as BookingType[]) {
    const label = type === "inspection" ? "Inspection" : "Job";
    const slotLen = rules[type].slotMinutes;
    const check = (days: DayHours[], scope: string) =>
      days.forEach((d, wd) => {
        if (!d.open) return;
        if (toMinutes(d.end) <= toMinutes(d.start)) {
          errors.push(`${label}${scope} ${WEEKDAY_NAMES[wd]}: closing time must be after opening time.`);
        } else if (toMinutes(d.start) + slotLen > toMinutes(d.end)) {
          errors.push(`${label}${scope} ${WEEKDAY_NAMES[wd]}: hours are shorter than one ${slotLen}-minute slot.`);
        }
      });
    check(rules[type].days, "");
    for (const c of rules[type].changeovers || []) check(c.days, ` (from ${c.from})`);
  }
  if (rules.minNoticeDays > rules.horizonDays) errors.push("Minimum notice can't be longer than the booking window.");
  return errors;
}
