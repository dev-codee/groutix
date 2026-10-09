"use client";

import { useMemo, useState } from "react";
import { Search, Settings, Info, AlertTriangle, Ban } from "lucide-react";
import {
  BASE_LOCATION,
  SUBURBS,
  distanceKm,
  resolveArea,
  zoneForSuburb,
  zoneLabel,
  zoneDayName,
  zonesByWeekday,
  OUTER_ZONES,
  ZONE_COLOR,
  ZONE_DIRECTION,
  type OuterZone,
} from "@/lib/scheduling";
import { WEEKDAY_NAMES } from "@/lib/bookingRules";
import { useZoneRules } from "@/lib/useZoneRules";

// Read-only overview of the Inspection Routing & Scheduling Plan as it is actually
// configured: which direction we cover on which day, which suburbs fall in each
// zone, what we skip, and — the part staff use most — an address lookup that
// answers "what day can I offer this customer?".

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function ZonesView({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const rules = useZoneRules();
  const [lookup, setLookup] = useState("");
  const [openZone, setOpenZone] = useState<OuterZone | null>(null);

  // Every catalogued suburb, classified exactly as a customer's address would be.
  const classified = useMemo(
    () =>
      SUBURBS.map((s) => {
        const km = distanceKm(BASE_LOCATION, s);
        const coastal = rules.coastalExcluded.includes(s.name);
        const zone = coastal
          ? ("coastal" as const)
          : km > rules.maxRadiusKm
          ? ("outside" as const)
          : km <= rules.flexRadiusKm
          ? ("inner" as const)
          : zoneForSuburb(s.name, rules) ?? s.outerZone;
        return { ...s, km, zone, overridden: !!rules.suburbOverrides[s.name] };
      }).sort((a, b) => a.km - b.km),
    [rules]
  );

  const byZone = useMemo(() => {
    const m = new Map<string, typeof classified>();
    for (const s of classified) m.set(s.zone, [...(m.get(s.zone) || []), s]);
    return m;
  }, [classified]);

  const dayMap = useMemo(() => zonesByWeekday(rules), [rules]);
  const area = lookup.trim().length >= 3 ? resolveArea(lookup, rules) : null;
  const areaDay = area ? zoneDayName(area.zone, rules) : null;

  const innerCount = byZone.get("inner")?.length ?? 0;
  const coastalCount = byZone.get("coastal")?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black text-slate-900">Service Zones</h1>
          <p className="text-xs text-slate-500">
            One inspector · {rules.maxRadiusKm} km service area · {rules.flexRadiusKm} km daily flex
            {rules.dayWiseEnabled ? " + day-wise zones" : " · day-wise zoning OFF"}
          </p>
        </div>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" /> Edit zones
          </button>
        )}
      </div>

      {!rules.dayWiseEnabled && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>
            Day-wise zoning is switched off, so every address inside {rules.maxRadiusKm} km can be booked on any
            open day. The zones below still describe each area, but they aren&apos;t limiting availability.
          </span>
        </div>
      )}

      {/* Address lookup — the "what day can I offer?" tool */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Check an address
          </p>
          <p className="text-[11px] text-slate-500">
            Type a customer&apos;s suburb or address to see the day they&apos;re routed on.
          </p>
        </div>
        <input
          value={lookup}
          onChange={(e) => setLookup(e.target.value)}
          placeholder="e.g. 12 Smith St, Ringwood VIC 3134"
          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
        />
        {area && (
          <div className={`rounded-xl border border-slate-200 p-3 ${ZONE_COLOR[area.zone].bg}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${ZONE_COLOR[area.zone].dot}`} />
              <span className={`text-sm font-black ${ZONE_COLOR[area.zone].text}`}>
                {area.suburb ? titleCase(area.suburb) : "Unknown suburb"}
              </span>
              <span className="text-xs text-slate-500">
                {area.distanceKm != null ? `${Math.round(area.distanceKm)} km from base` : "not matched"}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1.5 font-semibold">{area.label}</p>
            <p className="text-[11px] text-slate-600 mt-1">
              {!area.serviced
                ? area.zone === "coastal"
                  ? "Skipped — coastal / ocean area. No online booking; arrange directly if you want to take it."
                  : "Outside the service area. No online booking."
                : areaDay
                ? `Online booking offers ${areaDay} only. Staff can override from the lead form.`
                : "Online booking offers any open day."}
            </p>
          </div>
        )}
      </div>

      {/* The week at a glance */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100">
          <p className="text-xs font-black text-slate-800">The week</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
            const zones = dayMap[wd] ?? [];
            return (
              <div key={wd} className="p-3 min-w-0">
                <p className="text-[11px] font-black text-slate-800">{WEEKDAY_NAMES[wd]}</p>
                {zones.length === 0 ? (
                  <p className="text-[10px] text-slate-400 mt-1">Daily-flex only</p>
                ) : (
                  zones.map((z) => (
                    <div key={z} className="mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${ZONE_COLOR[z].bg} ${ZONE_COLOR[z].text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ZONE_COLOR[z].dot}`} />
                        {ZONE_DIRECTION[z]}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {byZone.get(z)?.length ?? 0} suburbs
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
          Every day also covers the {rules.flexRadiusKm} km daily-flex circle ({innerCount} suburbs).
        </p>
      </div>

      {/* Zone detail */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-black text-slate-800">Zones</p>
          <p className="text-[10px] text-slate-400">Click a zone to list its suburbs</p>
        </div>
        <div className="divide-y divide-slate-100">
          {/* Daily flex first — it's the one that applies every day */}
          <ZoneRow
            zone="inner"
            title={`Daily Flex (0 – ${rules.flexRadiusKm} km)`}
            sub="Bookable on any open day"
            count={innerCount}
            open={openZone === null ? false : false}
            onToggle={() => setOpenZone(null)}
            suburbs={byZone.get("inner") ?? []}
            expandable={false}
          />
          {OUTER_ZONES.map((z) => (
            <ZoneRow
              key={z}
              zone={z}
              title={`${ZONE_DIRECTION[z]} (${rules.flexRadiusKm} – ${rules.maxRadiusKm} km)`}
              sub={zoneLabel(z, rules).split("—")[1]?.trim() || "Any open day"}
              count={byZone.get(z)?.length ?? 0}
              open={openZone === z}
              onToggle={() => setOpenZone(openZone === z ? null : z)}
              suburbs={byZone.get(z) ?? []}
              expandable
            />
          ))}
        </div>
      </div>

      {/* Skipped areas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Ban className="w-3.5 h-3.5 text-slate-400" /> Skipped — coastal / ocean ({coastalCount})
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Never offered online, at any distance. Inland neighbours like Altona, Hampton and Brighton East stay
          bookable.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {rules.coastalExcluded.map((n) => (
            <span key={n} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
              {titleCase(n)}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Zones are measured as a straight line from base ({BASE_LOCATION.lat.toFixed(4)},{" "}
        {BASE_LOCATION.lng.toFixed(4)}) and assigned by compass direction. Day-wise zoning limits what customers
        see online; staff can always override from the lead form.
      </p>
    </div>
  );
}

function ZoneRow({
  zone,
  title,
  sub,
  count,
  open,
  onToggle,
  suburbs,
  expandable,
}: {
  zone: OuterZone | "inner";
  title: string;
  sub: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  suburbs: { name: string; km: number; overridden: boolean }[];
  expandable: boolean;
}) {
  const c = ZONE_COLOR[zone];
  return (
    <div>
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left ${expandable ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"}`}
      >
        <span className={`w-3 h-3 rounded-full shrink-0 ${c.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-800 truncate">{title}</p>
          <p className="text-[10px] text-slate-500 truncate">{sub}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${c.bg} ${c.text}`}>
          {count} suburbs
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {suburbs.length === 0 && <p className="text-[11px] text-slate-400">No suburbs in this zone.</p>}
          {suburbs.map((s) => (
            <span
              key={s.name}
              title={`${Math.round(s.km)} km from base${s.overridden ? " · manually assigned" : ""}`}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                s.overridden ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {titleCase(s.name)}
              <span className="font-normal text-slate-400"> {Math.round(s.km)}km</span>
              {s.overridden && <span className="ml-0.5" aria-label="manually assigned">*</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
