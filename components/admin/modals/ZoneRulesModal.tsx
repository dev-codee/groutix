"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Trash2, Plus, RotateCcw, AlertTriangle } from "lucide-react";
import {
  DEFAULT_ZONE_RULES,
  OUTER_ZONES,
  ZONE_COLOR,
  ZONE_DIRECTION,
  sanitizeZoneRules,
  validateZoneRules,
  zonesByWeekday,
  type OuterZone,
  type ZoneRules,
} from "@/lib/zoneRules";
import { WEEKDAY_NAMES } from "@/lib/bookingRules";
import { BASE_LOCATION, SUBURBS, distanceKm } from "@/lib/scheduling";
import { publishZoneRules } from "@/lib/useZoneRules";

// Manager editor for the Inspection Routing & Scheduling Plan: service radii, the
// weekday each zone runs on, coastal skips and per-suburb overrides. The compass
// sector boundaries stay in code — moving an individual suburb is both safer and
// easier to reason about than rotating a boundary (see lib/zoneRules.ts).

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const SUBURB_NAMES = SUBURBS.map((s) => s.name).sort();

export function ZoneRulesModal({ onClose }: { onClose: () => void }) {
  const [rules, setRules] = useState<ZoneRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [newCoastal, setNewCoastal] = useState("");
  const [newOverride, setNewOverride] = useState<{ suburb: string; zone: OuterZone }>({
    suburb: "",
    zone: "tue_south",
  });

  useEffect(() => {
    fetch("/api/admin/settings/zone-rules", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRules(sanitizeZoneRules(d.rules)))
      .catch(() => setError("Couldn't load zone rules."));
  }, []);

  if (!rules) {
    return (
      <Shell onClose={onClose}>
        <div className="flex items-center gap-2 text-xs text-slate-500 py-8 justify-center">
          {error ?? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Loading zone rules…
            </>
          )}
        </div>
      </Shell>
    );
  }

  const update = (next: ZoneRules) => {
    setRules(next);
    setSaved(false);
    setError(null);
  };

  const problems = validateZoneRules(rules);
  const dayMap = zonesByWeekday(rules);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/zone-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      const clean = sanitizeZoneRules(d.rules);
      setRules(clean);
      publishZoneRules(clean);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save zone rules.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell onClose={onClose}>
      {/* Day-wise master switch */}
      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
        <input
          type="checkbox"
          checked={rules.dayWiseEnabled}
          onChange={(e) => update({ ...rules, dayWiseEnabled: e.target.checked })}
          className="mt-0.5"
        />
        <span className="text-xs">
          <span className="font-bold text-slate-800">Day-wise zoning</span>
          <span className="block text-slate-500 mt-0.5">
            One direction per day, so the inspector never crosses Melbourne twice. Switch off once you have
            enough inspectors to cover several zones at once — every address inside the service area then
            becomes bookable on any open day.
          </span>
        </span>
      </label>

      {/* Radii */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label htmlFor="flex-km" className="font-bold text-slate-700 block mb-1">
            Daily-flex radius (km)
          </label>
          <input
            id="flex-km"
            type="number"
            min={0}
            max={200}
            step={0.5}
            value={rules.flexRadiusKm}
            onChange={(e) => update({ ...rules, flexRadiusKm: Number(e.target.value) })}
            className="w-full p-2 border border-slate-200 rounded-lg"
          />
          <p className="text-[10px] text-slate-400 mt-1">Inside this, any open day can be booked.</p>
        </div>
        <div>
          <label htmlFor="max-km" className="font-bold text-slate-700 block mb-1">
            Service-area radius (km)
          </label>
          <input
            id="max-km"
            type="number"
            min={1}
            max={500}
            step={1}
            value={rules.maxRadiusKm}
            onChange={(e) => update({ ...rules, maxRadiusKm: Number(e.target.value) })}
            className="w-full p-2 border border-slate-200 rounded-lg"
          />
          <p className="text-[10px] text-slate-400 mt-1">Beyond this, nothing is bookable online.</p>
        </div>
      </div>
      <RadiusPreview rules={rules} />

      {/* Zone → day */}
      {rules.dayWiseEnabled && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">
            Which day each zone runs{" "}
            <span className="font-normal text-slate-400">(one zone per day)</span>
          </p>
          <div className="space-y-1.5">
            {OUTER_ZONES.map((z) => {
              const clash = dayMap[rules.zoneDays[z]].length > 1;
              return (
                <div key={z} className="flex items-center gap-2 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ZONE_COLOR[z].dot}`} />
                  <span className="font-semibold text-slate-700 w-24 shrink-0">{ZONE_DIRECTION[z]}</span>
                  <select
                    value={rules.zoneDays[z]}
                    onChange={(e) =>
                      update({ ...rules, zoneDays: { ...rules.zoneDays, [z]: Number(e.target.value) } })
                    }
                    aria-label={`${ZONE_DIRECTION[z]} zone day`}
                    className={`p-1.5 border rounded-lg bg-white ${clash ? "border-red-400 text-red-700" : "border-slate-200"}`}
                  >
                    {DISPLAY_ORDER.map((wd) => (
                      <option key={wd} value={wd}>
                        {WEEKDAY_NAMES[wd]}
                      </option>
                    ))}
                  </select>
                  {clash && (
                    <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> clashes
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suburb overrides */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">
          Suburb overrides{" "}
          <span className="font-normal text-slate-400">
            (force a suburb into a zone, instead of its compass direction)
          </span>
        </p>
        <div className="space-y-1">
          {Object.entries(rules.suburbOverrides).length === 0 && (
            <p className="text-[11px] text-slate-400">None — every suburb uses its compass direction.</p>
          )}
          {Object.entries(rules.suburbOverrides)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, zone]) => (
              <div key={name} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 flex-1 truncate">{titleCase(name)}</span>
                <select
                  value={zone}
                  onChange={(e) =>
                    update({
                      ...rules,
                      suburbOverrides: { ...rules.suburbOverrides, [name]: e.target.value as OuterZone },
                    })
                  }
                  aria-label={`${name} zone`}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  {OUTER_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {ZONE_DIRECTION[z]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...rules.suburbOverrides };
                    delete next[name];
                    update({ ...rules, suburbOverrides: next });
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                  aria-label={`Remove ${name} override`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
        <div className="flex gap-2 text-xs">
          <input
            list="zone-suburbs"
            placeholder="Suburb"
            value={newOverride.suburb}
            onChange={(e) => setNewOverride({ ...newOverride, suburb: e.target.value })}
            className="flex-1 min-w-0 p-2 border border-slate-200 rounded-lg"
          />
          <datalist id="zone-suburbs">
            {SUBURB_NAMES.map((n) => (
              <option key={n} value={titleCase(n)} />
            ))}
          </datalist>
          <select
            value={newOverride.zone}
            onChange={(e) => setNewOverride({ ...newOverride, zone: e.target.value as OuterZone })}
            aria-label="Override zone"
            className="p-2 border border-slate-200 rounded-lg bg-white"
          >
            {OUTER_ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_DIRECTION[z]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!newOverride.suburb.trim()}
            onClick={() => {
              const key = newOverride.suburb.toLowerCase().trim().replace(/\s+/g, " ");
              if (!key) return;
              update({
                ...rules,
                suburbOverrides: { ...rules.suburbOverrides, [key]: newOverride.zone },
              });
              setNewOverride({ ...newOverride, suburb: "" });
            }}
            className="px-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Coastal skips */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">
          Skipped suburbs{" "}
          <span className="font-normal text-slate-400">
            (coastal / ocean — never offered online, at any distance)
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {rules.coastalExcluded.length === 0 && (
            <p className="text-[11px] text-slate-400">None — every suburb inside the radius is offered.</p>
          )}
          {rules.coastalExcluded.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
            >
              {titleCase(n)}
              <button
                type="button"
                onClick={() =>
                  update({ ...rules, coastalExcluded: rules.coastalExcluded.filter((x) => x !== n) })
                }
                className="text-slate-400 hover:text-red-600 cursor-pointer"
                aria-label={`Stop skipping ${n}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <input
            list="zone-suburbs"
            placeholder="Suburb to skip"
            value={newCoastal}
            onChange={(e) => setNewCoastal(e.target.value)}
            className="flex-1 min-w-0 p-2 border border-slate-200 rounded-lg"
          />
          <button
            type="button"
            disabled={!newCoastal.trim()}
            onClick={() => {
              const key = newCoastal.toLowerCase().trim().replace(/\s+/g, " ");
              if (!key || rules.coastalExcluded.includes(key)) return setNewCoastal("");
              update({ ...rules, coastalExcluded: [...rules.coastalExcluded, key].sort() });
              setNewCoastal("");
            }}
            className="px-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Skip
          </button>
        </div>
      </div>

      {(error || problems.length > 0) && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-0.5">
          {error ? <p>{error}</p> : problems.map((p) => <p key={p}>{p}</p>)}
        </div>
      )}
      {saved && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-semibold">
          Saved — booking pages, emails, slot pickers and dispatch now use these zones.
        </div>
      )}
      {rules.updatedAt && (
        <p className="text-[10px] text-slate-400">
          Last changed{" "}
          {new Date(rules.updatedAt).toLocaleString("en-AU", {
            timeZone: "Australia/Melbourne",
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {rules.updatedBy ? ` by ${rules.updatedBy}` : ""}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all zones to the original routing plan? (Not saved until you press Save.)")) {
              update({ ...DEFAULT_ZONE_RULES, updatedAt: rules.updatedAt, updatedBy: rules.updatedBy });
            }
          }}
          className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Defaults
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || problems.length > 0}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
      </div>
    </Shell>
  );
}

/** How many catalogued suburbs each radius change actually moves. */
function RadiusPreview({ rules }: { rules: ZoneRules }) {
  const counts = useMemo(() => {
    let inner = 0;
    let outer = 0;
    let outside = 0;
    for (const s of SUBURBS) {
      if (rules.coastalExcluded.includes(s.name)) continue;
      const km = distanceKm(BASE_LOCATION, s);
      if (km <= rules.flexRadiusKm) inner++;
      else if (km <= rules.maxRadiusKm) outer++;
      else outside++;
    }
    return { inner, outer, outside };
  }, [rules]);
  return (
    <p className="text-[11px] text-slate-500">
      <span className="font-semibold text-slate-600">Of {SUBURBS.length} known suburbs:</span>{" "}
      {counts.inner} any-day, {counts.outer} day-wise, {counts.outside} outside the area,{" "}
      {rules.coastalExcluded.length} skipped.
    </p>
  );
}

function Shell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 overflow-y-auto p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-2xl my-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Service Zones</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
