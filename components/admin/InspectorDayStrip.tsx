"use client";

import { useMemo } from "react";
import { Navigation, Phone, Clock, MapPin, CheckCircle2, CalendarDays, Route } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import {
  apptInstantMs,
  formatApptTime,
  melbourneYmd,
  resolveArea,
  zoneDayName,
  ZONE_COLOR,
  ZONE_SHORT,
} from "@/lib/scheduling";
import { useZoneRules } from "@/lib/useZoneRules";
import { calculateTravel } from "@/lib/dispatch";
import type { Lead } from "@/components/admin/types";

// The inspector's day, at the top of their board.
//
// The lead list underneath is a flat chronological list with no day boundary, so
// "what am I actually doing today, and in what order" took counting. This answers
// it directly: today's stops in time order, the zone they sit in, the drive
// between them, and one tap to navigate or call.

const DONE_STATUSES = ["Inspection Completed", "Quote Pending", "Quote Sent"];

function isDone(l: Lead): boolean {
  return DONE_STATUSES.includes(l.status) || l.inspectionReport?.status === "completed";
}

/** Melbourne calendar date of an appointment, independent of the viewer's timezone. */
function apptYmd(value: string | null | undefined): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value || "").trim());
  return m ? m[1] : null;
}

export function InspectorDayStrip() {
  const { scopedLeads, callCustomer } = useAdminPageCtx();
  const zoneRules = useZoneRules();
  const today = melbourneYmd();

  const stops = useMemo(
    () =>
      scopedLeads
        .filter((l) => apptYmd(l.inspectionAt) === today)
        .sort((a, b) => apptInstantMs(a.inspectionAt) - apptInstantMs(b.inspectionAt))
        .map((l) => ({ lead: l, area: resolveArea(l.address || l.city, zoneRules) })),
    [scopedLeads, today, zoneRules]
  );

  // Drive legs: base -> first stop, then stop to stop. Same straight-line model the
  // dispatch board uses, so the numbers agree with it.
  const legs = useMemo(
    () =>
      stops.map((s, i) =>
        calculateTravel(i === 0 ? "Tullamarine" : stops[i - 1].area.suburb, s.area.suburb)
      ),
    [stops]
  );

  const doneCount = stops.filter((s) => isDone(s.lead)).length;
  const totalKm = Math.round(legs.reduce((sum, t) => sum + t.distanceKm, 0));
  const next = stops.find((s) => !isDone(s.lead));

  // Which zones today's date belongs to, so an empty day still says something useful.
  const todayZones = useMemo(() => {
    const seen = new Set(stops.map((s) => s.area.zone));
    return [...seen];
  }, [stops]);

  if (stops.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today&apos;s run</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          No inspections booked for today. Upcoming ones are listed below in date order.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Summary */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today&apos;s run</h2>
        </div>
        <span className="text-xs font-semibold text-slate-600">
          {stops.length} {stops.length === 1 ? "inspection" : "inspections"}
          {doneCount > 0 && <span className="text-emerald-700"> · {doneCount} done</span>}
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Route className="w-3.5 h-3.5 text-slate-400" /> ~{totalKm} km of driving
        </span>
        {todayZones.map((z) => (
          <span
            key={z}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${ZONE_COLOR[z].bg} ${ZONE_COLOR[z].text}`}
            title={zoneDayName(z, zoneRules) ? `Routed on ${zoneDayName(z, zoneRules)}` : undefined}
          >
            {ZONE_SHORT[z]}
          </span>
        ))}
        {next && (
          <span className="ml-auto text-xs font-bold text-blue-700">
            Next: {formatApptTime(next.lead.inspectionAt)} · {next.lead.name || "Customer"}
          </span>
        )}
      </div>

      {/* Stops in route order */}
      <ol className="divide-y divide-slate-100">
        {stops.map((s, i) => {
          const l = s.lead;
          const done = isDone(l);
          const leg = legs[i];
          return (
            <li
              key={l.id}
              className={`px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 ${done ? "bg-slate-50/60" : ""}`}
            >
              <span className="flex items-center gap-1.5 shrink-0 w-24">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={`text-xs font-black ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {formatApptTime(l.inspectionAt)}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className={`block text-xs font-bold truncate ${done ? "text-slate-400" : "text-slate-800"}`}>
                  {l.name || "Unnamed customer"}
                </span>
                <span className="block text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  {l.address || l.city || "No address"}
                </span>
              </span>

              <span
                className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${ZONE_COLOR[s.area.zone].bg} ${ZONE_COLOR[s.area.zone].text}`}
              >
                {ZONE_SHORT[s.area.zone]}
              </span>

              <span className="shrink-0 text-[10px] text-slate-400 w-24 text-right" title={i === 0 ? "Drive from base" : "Drive from the previous stop"}>
                {i === 0 ? "from base" : "from prev"} · {leg.label}
              </span>

              <span className="flex items-center gap-1.5 shrink-0">
                <a
                  href={
                    l.address
                      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.address}, VIC, Australia`)}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!l.address}
                  onClick={(e) => {
                    if (!l.address) e.preventDefault();
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    l.address
                      ? "border-slate-200 hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                      : "border-slate-200/60 text-slate-300 cursor-not-allowed"
                  }`}
                  title={l.address ? "Directions" : "No address on this lead"}
                >
                  <Navigation className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => callCustomer(l)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-700 transition-colors cursor-pointer"
                  title="Call customer"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
