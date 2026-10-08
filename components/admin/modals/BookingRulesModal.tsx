"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Trash2, Plus, RotateCcw } from "lucide-react";
import {
  DEFAULT_BOOKING_RULES,
  WEEKDAY_NAMES,
  formatHHmm,
  WEEKDAY_SHORT,
  openDaysSummary,
  sanitizeBookingRules,
  slotsForWeekday,
  validateBookingRules,
  type BookingRules,
  type BookingType,
  type DayChangeover,
  type DayHours,
} from "@/lib/bookingRules";
import { TechnicianAvailabilityPanel } from "@/components/admin/TechnicianAvailabilityEditor";
import { publishBookingRules } from "@/lib/useBookingRules";

// Monday-first display order (rules are stored Sunday = 0).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SLOT_OPTIONS = [30, 45, 60, 90, 120, 180, 240];

export function BookingRulesModal({ onClose }: { onClose: () => void }) {
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [tab, setTab] = useState<BookingType | "technicians">("inspection");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [newClosed, setNewClosed] = useState({ date: "", label: "" });
  const [newChangeFrom, setNewChangeFrom] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/booking-rules", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRules(sanitizeBookingRules(d.rules)))
      .catch(() => setError("Couldn't load booking rules."));
  }, []);

  if (tab === "technicians") return (
    <Shell onClose={onClose}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setTab("inspection")} className="px-3 py-2 rounded-lg border text-xs font-bold">Inspection Hours</button>
        <button type="button" onClick={() => setTab("job")} className="px-3 py-2 rounded-lg border text-xs font-bold">Job Hours</button>
        <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">Technician Availability</span>
      </div>
      <TechnicianAvailabilityPanel />
    </Shell>
  );

  if (!rules) {
    return (
      <Shell onClose={onClose}>
        <div className="flex items-center gap-2 text-xs text-slate-500 py-8 justify-center">
          {error ?? (<><Loader2 className="w-4 h-4 animate-spin" /> Loading booking rules…</>)}
        </div>
      </Shell>
    );
  }

  const update = (next: BookingRules) => {
    setRules(next);
    setSaved(false);
    setError(null);
  };
  const setDay = (wd: number, patch: Partial<DayHours>) => {
    const days = rules[tab].days.map((d, i) => (i === wd ? { ...d, ...patch } : d));
    update({ ...rules, [tab]: { ...rules[tab], days } });
  };
  const applyToAllOpen = (wd: number) => {
    const src = rules[tab].days[wd];
    const days = rules[tab].days.map((d) => (d.open ? { ...d, start: src.start, end: src.end } : d));
    update({ ...rules, [tab]: { ...rules[tab], days } });
  };
  const changeovers = rules[tab].changeovers ?? [];
  const setChangeovers = (next: DayChangeover[]) =>
    update(sanitizeBookingRules({ ...rules, [tab]: { ...rules[tab], changeovers: next } }));
  const setChangeDay = (from: string, wd: number, patch: Partial<DayHours>) =>
    setChangeovers(changeovers.map((c) => (c.from === from ? { ...c, days: c.days.map((d, i) => (i === wd ? { ...d, ...patch } : d)) } : c)));

  const problems = validateBookingRules(rules);

  const save = async () => {
    if (problems.length) {
      setError(problems.join(" "));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/booking-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      const next = sanitizeBookingRules(data.rules);
      setRules(next);
      publishBookingRules(next);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = tab === "inspection" ? "Inspections" : "Jobs";

  return (
    <Shell onClose={onClose}>
      <p className="text-xs text-slate-500 leading-relaxed">
        Controls which days and times customers can book online, what the booking emails show, and the hours used by the
        roster and dispatch board. Existing appointments are not moved.
      </p>

      {/* Type tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
        {(["inspection", "job"] as BookingType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${tab === t ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t === "inspection" ? "Inspection Hours" : "Job Hours"}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setTab("technicians")} className="w-full py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer">Edit Technician Availability & Job Capacity</button>

      {/* Slot length */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <label htmlFor="slot-len" className="font-bold text-slate-700">{typeLabel}: slot length</label>
        <select
          id="slot-len"
          value={rules[tab].slotMinutes}
          onChange={(e) => update({ ...rules, [tab]: { ...rules[tab], slotMinutes: Number(e.target.value) } })}
          className="p-2 border border-slate-200 rounded-lg bg-white"
        >
          {SLOT_OPTIONS.map((m) => (
            <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}</option>
          ))}
        </select>
      </div>

      {/* Weekly hours */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
        {DISPLAY_ORDER.map((wd) => {
          const d = rules[tab].days[wd];
          const count = slotsForWeekday(rules, tab, wd).length;
          return (
            <div key={wd} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <label className="flex items-center gap-2 w-28 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={d.open} onChange={(e) => setDay(wd, { open: e.target.checked })} className="accent-blue-600" />
                {WEEKDAY_NAMES[wd]}
              </label>
              {d.open ? (
                <>
                  <input type="time" step={900} value={d.start} onChange={(e) => e.target.value && setDay(wd, { start: e.target.value })} className="p-1.5 border border-slate-200 rounded-lg" aria-label={`${WEEKDAY_NAMES[wd]} opens`} />
                  <span className="text-slate-400">to</span>
                  <input type="time" step={900} value={d.end} onChange={(e) => e.target.value && setDay(wd, { end: e.target.value })} className="p-1.5 border border-slate-200 rounded-lg" aria-label={`${WEEKDAY_NAMES[wd]} closes`} />
                  <span className={`ml-auto text-[10px] font-semibold ${count ? "text-slate-400" : "text-red-600"}`}>
                    {count} slot{count === 1 ? "" : "s"}
                  </span>
                  <button type="button" onClick={() => applyToAllOpen(wd)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer" title="Copy these hours to every open day">
                    Copy to all
                  </button>
                </>
              ) : (
                <span className="text-slate-400 italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>
      <SlotPreview rules={rules} type={tab} />

      {/* Scheduled changes — open/close days from a future date without touching
          dates customers are already booking. */}
      <div className="text-xs space-y-2">
        <p className="font-bold text-slate-700">
          Scheduled changes{" "}
          <span className="font-normal text-slate-400">
            (different days from a future date — the hours above apply until then)
          </span>
        </p>
        {changeovers.map((c) => (
          <div key={c.from} className="border border-blue-200 bg-blue-50/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">From</span>
              <input
                type="date"
                value={c.from}
                onChange={(e) =>
                  e.target.value && setChangeovers(changeovers.map((x) => (x.from === c.from ? { ...x, from: e.target.value } : x)))
                }
                className="p-1.5 border border-slate-200 rounded-lg bg-white"
                aria-label="Change takes effect from"
              />
              <span className="text-slate-500 truncate">
                {openDaysSummary({ ...rules, [tab]: { ...rules[tab], days: c.days } }, tab)}
              </span>
              <button
                type="button"
                onClick={() => setChangeovers(changeovers.filter((x) => x.from !== c.from))}
                className="ml-auto p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                aria-label={`Remove change from ${c.from}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISPLAY_ORDER.map((wd) => {
                const d = c.days[wd];
                return (
                  <div key={wd} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={d.open} onChange={(e) => setChangeDay(c.from, wd, { open: e.target.checked })} className="accent-blue-600" />
                      {WEEKDAY_SHORT[wd]}
                    </label>
                    {d.open && (
                      <>
                        <input type="time" step={900} value={d.start} onChange={(e) => e.target.value && setChangeDay(c.from, wd, { start: e.target.value })} className="p-0.5 border border-slate-200 rounded" aria-label={`${WEEKDAY_NAMES[wd]} opens from ${c.from}`} />
                        <span className="text-slate-400">–</span>
                        <input type="time" step={900} value={d.end} onChange={(e) => e.target.value && setChangeDay(c.from, wd, { end: e.target.value })} className="p-0.5 border border-slate-200 rounded" aria-label={`${WEEKDAY_NAMES[wd]} closes from ${c.from}`} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <input type="date" value={newChangeFrom} onChange={(e) => setNewChangeFrom(e.target.value)} className="p-2 border border-slate-200 rounded-lg" aria-label="New change takes effect from" />
          <button
            type="button"
            disabled={!newChangeFrom || changeovers.some((c) => c.from === newChangeFrom)}
            onClick={() => {
              const base = changeovers.length ? changeovers[changeovers.length - 1].days : rules[tab].days;
              setChangeovers([...changeovers, { from: newChangeFrom, days: base.map((d) => ({ ...d })) }]);
              setNewChangeFrom("");
            }}
            className="px-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add change
          </button>
        </div>
      </div>

      {/* Booking window (applies to both types) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Earliest bookable date</label>
          <div className="flex gap-1">
            <input type="date" value={rules.minDate} onChange={(e) => update({ ...rules, minDate: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
            {rules.minDate && (
              <button type="button" onClick={() => update({ ...rules, minDate: "" })} className="px-2 text-slate-400 hover:text-slate-600 cursor-pointer" title="No earliest date">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Minimum notice (days)</label>
          <input type="number" min={0} max={60} value={rules.minNoticeDays} onChange={(e) => update({ ...rules, minNoticeDays: Number(e.target.value) })} className="w-full p-2 border border-slate-200 rounded-lg" />
          <p className="text-[10px] text-slate-400 mt-0.5">0 = same day, 1 = from tomorrow</p>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Book up to (days ahead)</label>
          <input type="number" min={1} max={365} value={rules.horizonDays} onChange={(e) => update({ ...rules, horizonDays: Number(e.target.value) })} className="w-full p-2 border border-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Closed dates */}
      <div className="text-xs space-y-2">
        <p className="font-bold text-slate-700">Closed dates <span className="font-normal text-slate-400">(holidays, shutdowns — no inspections or jobs)</span></p>
        {rules.closedDates.length > 0 && (
          <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100">
            {rules.closedDates.map((c) => (
              <li key={c.date} className="flex items-center gap-2 px-3 py-1.5">
                <span className="font-semibold text-slate-700">{c.date}</span>
                <span className="text-slate-500 truncate">{c.label}</span>
                <button
                  type="button"
                  onClick={() => update({ ...rules, closedDates: rules.closedDates.filter((x) => x.date !== c.date) })}
                  className="ml-auto p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  aria-label={`Remove ${c.date}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input type="date" value={newClosed.date} onChange={(e) => setNewClosed({ ...newClosed, date: e.target.value })} className="p-2 border border-slate-200 rounded-lg" />
          <input type="text" placeholder="Reason (optional)" maxLength={80} value={newClosed.label} onChange={(e) => setNewClosed({ ...newClosed, label: e.target.value })} className="flex-1 min-w-0 p-2 border border-slate-200 rounded-lg" />
          <button
            type="button"
            disabled={!newClosed.date}
            onClick={() => {
              update(sanitizeBookingRules({ ...rules, closedDates: [...rules.closedDates, { date: newClosed.date, label: newClosed.label.trim() || undefined }] }));
              setNewClosed({ date: "", label: "" });
            }}
            className="px-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
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
          Saved — booking pages, emails, roster and dispatch now use these hours.
        </div>
      )}
      {rules.updatedAt && (
        <p className="text-[10px] text-slate-400">
          Last changed {new Date(rules.updatedAt).toLocaleString("en-AU", { timeZone: "Australia/Melbourne", dateStyle: "medium", timeStyle: "short" })}
          {rules.updatedBy ? ` by ${rules.updatedBy}` : ""}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all booking hours to the original defaults? (Not saved until you press Save.)")) {
              update({ ...DEFAULT_BOOKING_RULES, updatedAt: rules.updatedAt, updatedBy: rules.updatedBy });
            }
          }}
          className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Defaults
        </button>
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 cursor-pointer">
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

function SlotPreview({ rules, type }: { rules: BookingRules; type: BookingType }) {
  const firstOpen = DISPLAY_ORDER.find((wd) => rules[type].days[wd].open);
  if (firstOpen == null) {
    return <p className="text-[11px] text-amber-700 font-semibold">No days open — customers won&apos;t be able to book {type === "inspection" ? "inspections" : "jobs"} online.</p>;
  }
  const slots = slotsForWeekday(rules, type, firstOpen);
  return (
    <p className="text-[11px] text-slate-500">
      <span className="font-semibold text-slate-600">{WEEKDAY_NAMES[firstOpen]} slots customers will see:</span>{" "}
      {slots.length ? slots.map(formatHHmm).join(", ") : "none"}
    </p>
  );
}

function Shell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 overflow-y-auto p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-2xl my-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Booking Hours</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
