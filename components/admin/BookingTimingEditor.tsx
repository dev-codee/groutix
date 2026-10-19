"use client";

import type { BookingRules, BookingType } from "@/lib/bookingRules";
import { bookingEndForDuration, bookingEndForWorkingDays, bookingSegments, type BookingSegment } from "@/lib/bookingSpan";
import { formatApptDate, formatApptTime, formatSlotRange } from "@/lib/scheduling";

export function BookingTimingSummary({ type, start, end, rules }: { type: BookingType; start: string; end: string; rules: BookingRules }) {
  if (!start || !end) return null;
  let segments: BookingSegment[] = [], issue = "";
  try { segments = bookingSegments(type, start.slice(0, 16), end.slice(0, 16), rules); }
  catch (error) { issue = error instanceof Error ? error.message : "Choose valid working hours."; }
  if (issue) return <p role="alert" className="text-xs text-amber-700">{issue}</p>;
  const hours = segments.reduce((sum, segment) => sum + segment.scheduledMinutes, 0) / 60;
  return <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900 space-y-1.5">
    <p className="font-semibold">{segments.length} working day{segments.length === 1 ? "" : "s"} · {hours} working hour{hours === 1 ? "" : "s"}</p>
    <p>Finishes {formatApptDate(end)} at {formatApptTime(end)} · Melbourne time</p>
    {segments.length > 1 && <ul className="max-h-32 overflow-y-auto space-y-1">{segments.map(segment => <li key={segment.date}>{formatApptDate(segment.date)} · {formatSlotRange(segment.time, segment.scheduledMinutes)}</li>)}</ul>}
  </div>;
}

/** The same working-day, duration and finish controls in every booking form. */
export function BookingTimingEditor({ type, start, end, rules, onChange, disabled = false, minDate, showStart = true, required = true }: {
  type: BookingType; start: string; end?: string; rules: BookingRules;
  onChange: (start: string, end: string) => void; disabled?: boolean; minDate?: string; showStart?: boolean; required?: boolean;
}) {
  let finish = end?.slice(0, 16) || "", minutes = rules[type].slotMinutes, days = 1;
  let issue = "";
  try {
    if (start) {
      if (!finish) finish = bookingEndForDuration(type, start.slice(0, 16), minutes, rules);
      const segments = bookingSegments(type, start.slice(0, 16), finish, rules);
      minutes = segments.reduce((sum, segment) => sum + segment.scheduledMinutes, 0);
      days = segments.length;
    }
  } catch (error) { issue = error instanceof Error ? error.message : "Choose valid working hours."; }
  const input = "mt-1 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-50";
  const timingRequired = required || Boolean(start);
  const moveStart = (next: string) => {
    try { onChange(next, next.length === 16 ? bookingEndForDuration(type, next, minutes, rules) : ""); }
    catch { onChange(next, ""); }
  };
  const setDuration = (value: number, byDays: boolean) => {
    try { onChange(start, byDays ? bookingEndForWorkingDays(type, start.slice(0, 16), value, rules) : bookingEndForDuration(type, start.slice(0, 16), Math.round(value * 60), rules)); }
    catch { /* Invalid intermediate numeric input leaves the saved range intact. */ }
  };
  return <div className="space-y-3">
    {showStart && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>label]:min-w-0">
      <label className="text-xs font-semibold">Start date<input required={timingRequired} type="date" min={minDate} value={start.slice(0, 10)} disabled={disabled} onChange={event => moveStart(event.target.value ? `${event.target.value}T${start.slice(11, 16) || "09:00"}` : "")} className={input} /></label>
      <label className="text-xs font-semibold">Start time<input required={timingRequired} type="time" value={start.slice(11, 16)} disabled={disabled} onChange={event => moveStart(`${start.slice(0, 10)}T${event.target.value}`)} className={input} /></label>
    </div>}
    {start && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>label]:min-w-0">
        {type === "job" && <label className="text-xs font-semibold">Working days<input aria-label="Working days" type="number" min="1" max="45" step="1" value={days} disabled={disabled} onChange={event => setDuration(Number(event.target.value), true)} className={input} /></label>}
        <label className="text-xs font-semibold">Working hours<input aria-label="Working hours" type="number" min="0.25" step="0.25" value={minutes / 60} disabled={disabled} onChange={event => setDuration(Number(event.target.value), false)} className={input} /></label>
      </div>
      <label className="block text-xs font-semibold">Finish date and time<input required type="datetime-local" value={finish} min={start.slice(0, 16)} disabled={disabled} onChange={event => onChange(start, event.target.value)} className={input} /></label>
      <p className="text-[10px] text-slate-500">Working days include the start day. Nights and closed days are skipped; a partial first day counts only its remaining working hours.</p>
      {issue ? <p role="alert" className="text-xs text-amber-700">{issue}</p> : <BookingTimingSummary type={type} start={start} end={finish} rules={rules} />}
    </>}
  </div>;
}
