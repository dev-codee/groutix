"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, MapPin, Star, AlertTriangle, Home, Navigation, RefreshCw } from "lucide-react";
import { DispatchMap, type DispatchMapItem } from "@/components/admin/DispatchMap";
import type { Lead } from "@/components/admin/types";
import type { DayAppointment } from "@/lib/bookings";
import { WEEKDAY_SHORT, formatHHmm, slotsForDate, type BookingType } from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { melbourneYmd, resolveArea, isZoneDate, zoneDayName, ZONE_COLOR, ZONE_SHORT } from "@/lib/scheduling";
import { useZoneRules } from "@/lib/useZoneRules";
import {
  distanceFromBase,
  driveMinutes,
  locate,
  nearestStop,
  scoreSlot,
  stopPoint,
  type Fit,
  type PlannerStop,
  type SlotFit,
} from "@/lib/routePlanning";

// Full-screen route-aware booking planner, opened from the lead edit form.
// Shows upcoming days ranked by how well this customer fits the route already
// booked that day, the chosen day's stops on a real driving-route map with the
// customer inserted, and for every free slot the extra driving it adds.
// Picking a slot only fills the form field — saving the lead is still what books
// it, so all the existing booking/notification logic stays in one place.

const HQ_ADDRESS = "82A Marigold Cres, Gowanbrae VIC 3043, Australia";
const MAX_DAYS = 28;

const FIT_STYLE: Record<Fit, { label: string; chip: string; dot: string }> = {
  best: { label: "Best fit", chip: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  good: { label: "Good", chip: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  far: { label: "Far from route", chip: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  empty: { label: "Open day", chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
};

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

function dayLabel(date: string): { wd: string; dm: string } {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return {
    wd: WEEKDAY_SHORT[dt.getUTCDay()],
    dm: dt.toLocaleDateString("en-AU", { timeZone: "UTC", day: "numeric", month: "short" }),
  };
}

function nowMelbourneHHmm(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Australia/Melbourne", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}

interface DaySummary {
  date: string;
  stops: PlannerStop[];
  free: string[];
  best: SlotFit | null;
  nearest: { stop: PlannerStop; km: number } | null;
  /** Outside this customer's day-wise zone day — bookable, but off-route. */
  offZone: boolean;
}

export function BookingPlanner({
  type,
  lead,
  value,
  onPick,
  onClose,
}: {
  type: BookingType;
  lead: Partial<Lead>;
  value: string | undefined;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const rules = useBookingRules();
  const zoneRules = useZoneRules();
  const today = melbourneYmd();
  const firstDay = useMemo(() => {
    const byNotice = addDays(today, Math.max(rules.minNoticeDays, 0));
    return rules.minDate && rules.minDate > byNotice ? rules.minDate : byNotice;
  }, [today, rules.minDate, rules.minNoticeDays]);
  const lastDay = addDays(today, Math.min(rules.horizonDays, MAX_DAYS));

  const target = useMemo(() => locate(lead.address) ?? locate(lead.city), [lead.address, lead.city]);
  const customerLabel = target?.label || lead.city || "Unknown suburb";

  // Day-wise zoning for this address. Staff may still book off-zone (Key Rule 10
  // allows a manual override) — we surface it rather than block it.
  const area = useMemo(
    () => resolveArea(lead.address || lead.city, zoneRules),
    [lead.address, lead.city, zoneRules]
  );
  const zoneDay = zoneDayName(area.zone, zoneRules);
  const zoneStyle = ZONE_COLOR[area.zone];

  // ── Load every appointment in the window (one request) ──
  const [tick, setTick] = useState(0);
  const loadKey = `${firstDay}|${lastDay}|${tick}`;
  const [loaded, setLoaded] = useState<{ key: string; appts: DayAppointment[] | null; error: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/slots?from=${firstDay}&to=${lastDay}`, { cache: "no-store" })
      .then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || `HTTP ${r.status}`)))))
      .then((d) => alive && setLoaded({ key: loadKey, appts: d.appointments || [], error: null }))
      .catch((e) => alive && setLoaded({ key: loadKey, appts: null, error: e instanceof Error ? e.message : "Failed to load." }));
    return () => {
      alive = false;
    };
  }, [firstDay, lastDay, loadKey]);
  const current = loaded?.key === loadKey ? loaded : null;
  const appts = current?.appts ?? null;

  // ── Build per-day summaries ──
  const days: DaySummary[] = useMemo(() => {
    if (!appts || lastDay < firstDay) return [];
    const nowHHmm = nowMelbourneHHmm();
    const out: DaySummary[] = [];
    for (let d = firstDay; d <= lastDay; d = addDays(d, 1)) {
      const grid = slotsForDate(rules, type, d);
      if (!grid.length) continue;
      // This lead's own appointment of the same type is being rescheduled → not an obstacle.
      const dayAppts = appts.filter((a) => a.date === d && !(a.leadId === lead.id && a.type === type));
      const taken = new Set(dayAppts.filter((a) => a.type === type).map((a) => a.time));
      const free = grid.filter((t) => !taken.has(t) && !(d === today && t <= nowHHmm));
      const stops: PlannerStop[] = dayAppts.map((a) => ({
        time: a.time, type: a.type, leadId: a.leadId, name: a.name, address: a.address, suburb: a.suburb,
      }));
      let best: SlotFit | null = null;
      if (target) {
        for (const t of free) {
          const f = scoreSlot(target, t, stops, rules, type);
          // Prefer slots that are reachable in time, then the smallest detour.
          const better = !best || (f.tight !== best.tight ? !f.tight : f.detourKm < best.detourKm);
          if (better) best = f;
        }
      }
      out.push({
        date: d,
        stops,
        free,
        best,
        nearest: target ? nearestStop(target, stops) : null,
        offZone: !isZoneDate(area.zone, d, zoneRules),
      });
    }
    return out;
  }, [appts, firstDay, lastDay, rules, type, lead.id, target, today, area.zone, zoneRules]);

  // Top 3 days by route fit (days with existing nearby stops beat empty days).
  const topDays = useMemo(() => {
    const rank = (s: DaySummary) => {
      if (!s.free.length || !s.best) return Infinity;
      const base = s.best.fit === "empty" ? 1000 + s.best.detourKm : s.best.detourKm + (s.best.tight ? 50 : 0);
      // An off-zone day means a special trip across Melbourne — never a top pick
      // while any on-zone day is available.
      return s.offZone ? base + 10000 : base;
    };
    return new Set(
      [...days].filter((s) => rank(s) < Infinity).sort((a, b) => rank(a) - rank(b)).slice(0, 3).map((s) => s.date)
    );
  }, [days]);

  // ── Selection ──
  const valueDate = /^(\d{4}-\d{2}-\d{2})/.exec(value || "")?.[1];
  const valueTime = /T(\d{2}:\d{2})/.exec(value || "")?.[1];
  const [chosenDay, setChosenDay] = useState<string | null>(valueDate ?? null);
  const selectedDay = days.find((d) => d.date === chosenDay) ?? days.find((d) => topDays.has(d.date)) ?? days[0];
  const [chosenTime, setChosenTime] = useState<string | null>(valueTime ?? null);
  const selectedTime = selectedDay && chosenTime && selectedDay.free.includes(chosenTime) ? chosenTime : null;

  const timeline = useMemo(() => {
    if (!selectedDay) return [];
    const rows: ({ kind: "stop"; stop: PlannerStop } | { kind: "free"; time: string; fit: SlotFit | null })[] = [
      ...selectedDay.stops.map((stop) => ({ kind: "stop" as const, stop })),
      ...selectedDay.free.map((time) => ({ kind: "free" as const, time, fit: target ? scoreSlot(target, time, selectedDay.stops, rules, type) : null })),
    ];
    return rows.sort((a, b) => (a.kind === "stop" ? a.stop.time : a.time).localeCompare(b.kind === "stop" ? b.stop.time : b.time));
  }, [selectedDay, target, rules]);

  const mapItems: DispatchMapItem[] = useMemo(() => {
    if (!selectedDay) return [];
    const asLead = (id: string, name: string, address?: string, suburb?: string) =>
      ({ id, name, address: address || suburb || "", city: suburb || "" }) as unknown as Lead;
    const items: DispatchMapItem[] = selectedDay.stops
      .filter((s) => s.address || s.suburb)
      .map((s) => ({ lead: asLead(s.leadId, s.name, s.address, s.suburb), type: s.type, time: s.time }));
    // Always show the customer's address marker — even before a slot is picked.
    // If a slot is selected, use that time so the marker lands in timeline order;
    // otherwise use an empty string (the map/route-builder ignores it gracefully).
    if (lead.address || lead.city) {
      items.push({
        lead: asLead(lead.id || "new-lead", lead.name || "This customer", lead.address, lead.city),
        type,
        time: selectedTime ?? "",
        proposed: true,
      });
    }
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDay, selectedTime, lead.id, lead.name, lead.address, lead.city, type]);

  const typeLabel = type === "inspection" ? "Inspection" : "Job";
  const fromBase = target ? distanceFromBase(target) : null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-stretch justify-center p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900">Plan {typeLabel.toLowerCase()} — {lead.name || "Customer"}</h2>
            <p className="text-slate-500 flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {lead.address || lead.city || "No address"}
              {fromBase != null && <span className="text-slate-400">· {fromBase} km ({driveMinutes(fromBase)} min) from base</span>}
            </p>
          </div>
          <button type="button" onClick={() => setTick((n) => n + 1)} className="ml-auto p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" title="Refresh bookings" aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Close planner">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`mx-4 mt-3 p-2.5 rounded-xl border flex flex-wrap items-center gap-x-2 gap-y-1 ${zoneStyle.bg} border-slate-200`}>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${zoneStyle.dot}`} />
          <span className={`font-black ${zoneStyle.text}`}>{ZONE_SHORT[area.zone]}</span>
          {area.distanceKm != null && <span className="text-slate-500">· {Math.round(area.distanceKm)} km from base</span>}
          <span className="text-slate-600">
            {zoneDay
              ? <>· routed on <span className="font-bold">{zoneDay}</span></>
              : area.inner
              ? "· inside the daily-flex circle — any open day"
              : area.serviced
              ? "· any open day"
              : "· outside the service area"}
          </span>
          {zoneDay && <span className="text-slate-400 ml-auto">Other days are still bookable as a manual override.</span>}
        </div>

        {!target && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Couldn&apos;t match this address to a known suburb, so route fit can&apos;t be scored. Add the suburb to the address — slots and bookings are still shown.
          </div>
        )}

        {current?.error ? (
          <div className="p-6 text-red-600">Couldn&apos;t load bookings: {current.error}</div>
        ) : !appts ? (
          <div className="p-10 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading bookings…</div>
        ) : days.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No bookable {typeLabel.toLowerCase()} days in the next {MAX_DAYS} days. Check Settings → Booking Hours.</div>
        ) : (
          <>
            {/* Day strip */}
            <div className="px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => {
                  const { wd, dm } = dayLabel(d.date);
                  const active = d.date === selectedDay?.date;
                  const fit = d.best?.fit;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => { setChosenDay(d.date); setChosenTime(null); }}
                      className={`shrink-0 w-32 text-left rounded-xl border px-2.5 py-2 transition-colors cursor-pointer ${
                        active ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                      } ${d.free.length ? "" : "opacity-50"}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-black text-slate-900">{wd} {dm}</span>
                        {topDays.has(d.date) && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 ml-auto" aria-label="Top pick" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{d.free.length} free · {d.stops.length} booked</div>
                      {d.offZone && (
                        <div className="mt-0.5 text-[10px] font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Off-zone
                        </div>
                      )}
                      {fit && d.free.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${FIT_STYLE[fit].dot}`} />
                          {fit === "empty" ? "No stops yet" : `+${d.best!.detourKm} km detour`}
                        </div>
                      )}
                      {d.nearest && (
                        <div className="text-[10px] text-slate-400 truncate">Nearest: {stopPoint(d.nearest.stop)?.label} {d.nearest.km} km</div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 pb-2 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> Top picks: days where this customer adds the least extra driving to the route already booked.
              </p>
            </div>

            {/* Body: timeline + map */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row border-t border-slate-100">
              <div className="lg:w-[400px] shrink-0 overflow-y-auto p-3 space-y-1.5 max-h-[45vh] lg:max-h-none">
                {selectedDay?.offZone && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                    <span>
                      This day is outside {customerLabel}&apos;s zone{zoneDay ? <> — we normally route there on <span className="font-bold">{zoneDay}</span></> : null}.
                      Booking it means a special trip. You can still do it if the customer needs this day.
                    </span>
                  </div>
                )}
                {timeline.length === 0 && <p className="text-slate-400 p-2">Nothing on this day.</p>}
                {timeline.map((row) => {
                  if (row.kind === "stop") {
                    const p = stopPoint(row.stop);
                    const km = target && p ? nearestStop(target, [row.stop])?.km : null;
                    return (
                      <div key={`s-${row.stop.leadId}-${row.stop.type}-${row.stop.time}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="font-bold text-slate-700 w-16 shrink-0">{formatHHmm(row.stop.time)}</span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${row.stop.type === "inspection" ? "bg-red-500" : "bg-blue-500"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 truncate">{row.stop.name} <span className="font-normal text-slate-400">({row.stop.type === "inspection" ? "Inspection" : "Job"})</span></div>
                          <div className="text-[10px] text-slate-500 truncate">{p?.label || row.stop.suburb || row.stop.address || "Location unknown"}</div>
                        </div>
                        {km != null && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{km} km away</span>}
                      </div>
                    );
                  }
                  const f = row.fit;
                  const active = row.time === selectedTime;
                  return (
                    <div
                      key={`f-${row.time}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setChosenTime(row.time)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setChosenTime(row.time)}
                      className={`rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                        active ? "border-green-600 ring-2 ring-green-200 bg-green-50" : "border-dashed border-emerald-300 hover:bg-emerald-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-800 w-16 shrink-0">{formatHHmm(row.time)}</span>
                        <span className="text-emerald-700 font-semibold">Free</span>
                        {f && <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${FIT_STYLE[f.fit].chip}`}>{FIT_STYLE[f.fit].label}</span>}
                      </div>
                      {f && (
                        <div className="mt-1 pl-[72px] text-[10px] text-slate-600 space-y-0.5">
                          <div className="flex items-center gap-1">
                            {f.prev.label === "Base" ? <Home className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
                            {f.prev.minutes} min ({f.prev.km} km) from {f.prev.name ? `${f.prev.name}, ${f.prev.label}` : "base"}
                          </div>
                          {f.fit !== "empty" && <div>Adds ~{f.detourKm} km to the route{f.next ? ` (next: ${f.next.label})` : ""}</div>}
                          {f.tight && (
                            <div className="text-amber-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Tight — not enough driving time between the neighbouring visits
                            </div>
                          )}
                        </div>
                      )}
                      {active && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onPick(`${selectedDay!.date}T${row.time}`); onClose(); }}
                          className="mt-2 w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold cursor-pointer"
                        >
                          Use {dayLabel(selectedDay!.date).wd} {dayLabel(selectedDay!.date).dm}, {formatHHmm(row.time)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 min-h-[320px] relative flex flex-col">
                <DispatchMap items={mapItems} hqAddress={HQ_ADDRESS} selectedLeadId={null} onSelectLead={() => {}}>
                  <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-sm flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Home className="w-3 h-3 text-slate-700" />Base</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Inspection</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Job</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />This customer</span>
                  </div>
                </DispatchMap>
                {!selectedTime && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 border border-slate-200 rounded-full px-3 py-1 shadow-sm text-[11px] font-semibold text-slate-600">
                    Pick a free slot to see this customer placed in the route
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
