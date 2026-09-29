"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, RefreshCw } from "lucide-react";
import {
  WEEKDAY_NAMES,
  closedDateInfo,
  dayHours,
  formatHHmm,
  slotsForWeekday,
  weekdayOf,
  type BookingType,
} from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { melbourneYmd } from "@/lib/scheduling";

// Staff-facing availability board for one appointment field in the lead form.
// Inspections and jobs share ONE calendar (see lib/bookings.ts), so every
// appointment on the day is shown, whatever its type.

import type { DayAppointment } from "@/lib/bookings";
export type { DayAppointment };

// Short-lived per-date cache so both boards (inspection + job) and the conflict
// check share one request, without showing stale data after a save.
const CACHE_MS = 20_000;
const cache = new Map<string, Promise<DayAppointment[]>>();
const cachedAt = new Map<string, number>();
function fetchDay(date: string, fresh = false): Promise<DayAppointment[]> {
  if (fresh || !cache.has(date) || Date.now() - (cachedAt.get(date) || 0) > CACHE_MS) {
    cachedAt.set(date, Date.now());
    const p = fetch(`/api/admin/slots?date=${date}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => (d.appointments || []) as DayAppointment[])
      .catch((err) => {
        cache.delete(date);
        throw err;
      });
    cache.set(date, p);
  }
  return cache.get(date)!;
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

function nowMelbourneHHmm(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Melbourne",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function describe(a: DayAppointment, leadId?: string): string {
  const who = a.leadId === leadId ? "This customer" : a.name;
  const ref = a.jobNo ? ` #${a.jobNo.replace(/^(?:JobNo-|JOB-?)/i, "")}` : "";
  return `${who}${ref} — ${a.type === "inspection" ? "Inspection" : "Job"}${a.suburb ? `, ${a.suburb}` : ""}`;
}

/** Another lead already holding `value`'s date+time on the shared calendar, if any. */
export function useSlotConflict(value: string | undefined, leadId: string | undefined) {
  // Result is tagged with the slot it was computed for, so a stale answer for a
  // previous value is never shown.
  const [result, setResult] = useState<{ key: string; conflict: DayAppointment | null } | null>(null);
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value || "");
  const date = m?.[1];
  const time = m?.[2];
  const key = date && time ? `${date}T${time}|${leadId || ""}` : "";
  useEffect(() => {
    if (!date || !time) return;
    let alive = true;
    fetchDay(date)
      .then((appts) => {
        if (alive) setResult({ key, conflict: appts.find((a) => a.time === time && a.leadId !== leadId) ?? null });
      })
      .catch(() => alive && setResult({ key, conflict: null }));
    return () => {
      alive = false;
    };
  }, [key, date, time, leadId]);
  const conflict = key && result?.key === key ? result.conflict : null;
  return conflict ? { ...conflict, label: describe(conflict, leadId) } : null;
}

export function SlotBoard({
  type,
  value,
  leadId,
  onPick,
}: {
  type: BookingType;
  value: string | undefined;
  leadId?: string;
  onPick: (value: string) => void;
}) {
  const rules = useBookingRules();
  const today = melbourneYmd();
  const valueDate = /^(\d{4}-\d{2}-\d{2})/.exec(value || "")?.[1];
  const valueTime = /T(\d{2}:\d{2})/.exec(value || "")?.[1];
  const firstDay = rules.minDate && rules.minDate > today ? rules.minDate : addDays(today, 1);

  const [day, setDay] = useState<string>(valueDate || firstDay);
  // Follow the field when staff type a different date into it.
  const [trackedValueDate, setTrackedValueDate] = useState(valueDate);
  if (valueDate !== trackedValueDate) {
    setTrackedValueDate(valueDate);
    if (valueDate) setDay(valueDate);
  }

  // Loaded data is tagged with its day + refresh tick; anything else means "loading".
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; appts: DayAppointment[] | null; error: boolean } | null>(null);
  const loadKey = `${day}#${tick}`;
  useEffect(() => {
    let alive = true;
    fetchDay(day, tick > 0)
      .then((a) => alive && setLoaded({ key: loadKey, appts: a, error: false }))
      .catch(() => alive && setLoaded({ key: loadKey, appts: null, error: true }));
    return () => {
      alive = false;
    };
  }, [day, tick, loadKey]);
  const current = loaded?.key === loadKey ? loaded : null;
  const appts = current?.appts ?? null;
  const error = !!current?.error;

  const wd = weekdayOf(day);
  const hours = dayHours(rules, type, wd);
  const closed = closedDateInfo(rules, day);
  const beforeMin = !!rules.minDate && day < rules.minDate;
  const gridTimes = slotsForWeekday(rules, type, wd);
  const nowHHmm = nowMelbourneHHmm();

  const byTime = useMemo(() => {
    const map = new Map<string, DayAppointment[]>();
    for (const a of appts || []) map.set(a.time, [...(map.get(a.time) || []), a]);
    return map;
  }, [appts]);
  const offGrid = (appts || []).filter((a) => !gridTimes.includes(a.time));
  const freeCount = gridTimes.filter((t) => !(byTime.get(t) || []).some((a) => a.leadId !== leadId)).length;

  let dayNote: string;
  if (closed) dayNote = `Closed${closed.label ? ` — ${closed.label}` : ""}`;
  else if (beforeMin) dayNote = `Before earliest booking date (${rules.minDate})`;
  else if (!hours.open) dayNote = `${type === "inspection" ? "Inspections" : "Jobs"} not offered on ${WEEKDAY_NAMES[wd]}s`;
  else dayNote = `${formatHHmm(hours.start)} – ${formatHHmm(hours.end)} · ${freeCount} of ${gridTimes.length} free`;
  const outsideRules = !!closed || beforeMin || !hours.open;

  return (
    <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
      {/* Day navigation */}
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setDay(addDays(day, -1))} className="p-1 rounded-lg hover:bg-white text-slate-500 cursor-pointer" aria-label="Previous day">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input
          type="date"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          className="p-1 border border-slate-200 rounded-lg bg-white text-[11px]"
          aria-label="Day to view"
        />
        <button type="button" onClick={() => setDay(addDays(day, 1))} className="p-1 rounded-lg hover:bg-white text-slate-500 cursor-pointer" aria-label="Next day">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="font-bold text-slate-700 text-[11px]">{WEEKDAY_NAMES[wd]}</span>
        <button type="button" onClick={() => setTick((n) => n + 1)} className="ml-auto p-1 rounded-lg hover:bg-white text-slate-400 cursor-pointer" aria-label="Refresh" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className={`text-[10px] font-semibold ${outsideRules ? "text-amber-700" : "text-slate-500"}`}>{dayNote}</p>

      {error ? (
        <p className="text-[11px] text-red-600">Couldn&apos;t load bookings for this day.</p>
      ) : appts === null ? (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading bookings…</div>
      ) : (
        <>
          {gridTimes.length > 0 && !closed && !beforeMin && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {gridTimes.map((t) => {
                const holders = byTime.get(t) || [];
                const other = holders.find((a) => a.leadId !== leadId);
                const own = holders.find((a) => a.leadId === leadId);
                const selected = day === valueDate && t === valueTime;
                const past = day < today || (day === today && t <= nowHHmm);
                const base = "rounded-lg border px-2 py-1.5 text-left text-[10px] leading-tight transition-colors";
                if (other) {
                  return (
                    <div key={t} title={holders.map((a) => describe(a, leadId)).join("\n")} className={`${base} ${selected ? "border-red-500 ring-2 ring-red-300" : "border-red-200"} bg-red-50 text-red-700 cursor-not-allowed`}>
                      <div className="font-bold">{formatHHmm(t)} · Booked</div>
                      <div className="truncate">{other.name}{other.type === "job" ? " (Job)" : " (Insp.)"}</div>
                    </div>
                  );
                }
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={past}
                    onClick={() => onPick(`${day}T${t}`)}
                    title={own ? `Currently saved for this customer (${own.type})` : "Free — click to use this time"}
                    className={`${base} ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : own
                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        : past
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    }`}
                  >
                    <div className="font-bold">{formatHHmm(t)}</div>
                    <div>{selected ? "Selected" : own ? `Saved (${own.type === "job" ? "job" : "insp."})` : past ? "Past" : "Free"}</div>
                  </button>
                );
              })}
            </div>
          )}

          {offGrid.length > 0 && (
            <div className="text-[10px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-500">{gridTimes.length ? "Also booked outside the standard slots:" : "Booked this day:"}</p>
              {offGrid.map((a) => (
                <p key={`${a.leadId}-${a.type}-${a.time}`}>
                  <span className="font-semibold">{formatHHmm(a.time)}</span> — {describe(a, leadId)}
                </p>
              ))}
            </div>
          )}
          {appts.length === 0 && (gridTimes.length === 0 || closed || beforeMin) && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Nothing booked this day.</p>
          )}
        </>
      )}
      <p className="text-[9px] text-slate-400">Inspections and jobs share one calendar — a booked slot is taken for both.</p>
    </div>
  );
}
