"use client";

import { useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import type { TechnicianJSON } from "@/lib/technicians";
import { publishTechnicianChanges, useTechnicians } from "@/lib/useTechnicians";
import { techniciansOnDate } from "@/lib/bookingCapacity";
import { addDaysYmd, todayAU } from "@/lib/scheduling";
import { useBookingRules } from "@/lib/useBookingRules";
import { WEEKDAY_SHORT, slotsForDate } from "@/lib/bookingRules";

const DAYS = [1, 2, 3, 4, 5, 6, 0];
const button = "rounded-lg border px-2 py-1 text-xs font-semibold cursor-pointer disabled:opacity-50";

export function TechnicianAvailabilityEditor({ technician }: { technician: TechnicianJSON }) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState(technician.workDays ?? DAYS);
  const [active, setActive] = useState(technician.active);
  const [overrides, setOverrides] = useState(technician.dateOverrides || {});
  const [date, setDate] = useState("");
  const [exceptionAvailable, setExceptionAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const effective = technician.workDays ?? DAYS;
  const startEditing = () => {
    setDays(effective); setActive(technician.active); setOverrides(technician.dateOverrides || {});
    setError(""); setEditing(true);
  };
  const save = async () => {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/technicians/${technician.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, workDays: days.length === 7 ? null : days, dateOverrides: overrides }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save availability.");
      await publishTechnicianChanges();
      setEditing(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save availability."); }
    finally { setSaving(false); }
  };
  if (!editing) return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {DAYS.map((day) => <span key={day} className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${technician.active && effective.includes(day) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>{WEEKDAY_SHORT[day]}</span>)}
      </div>
      <p className="text-[10px] text-slate-500">{technician.active ? (effective.length ? `${effective.length} working days per week` : "No regular shifts") : "Unavailable for new jobs"}{Object.keys(technician.dateOverrides || {}).length ? ` · ${Object.keys(technician.dateOverrides!).length} date exceptions` : ""}</p>
      <button type="button" onClick={startEditing} className={`${button} border-blue-200 text-blue-700`}>Edit availability</button>
    </div>
  );
  return (
    <div className="space-y-3 pt-1">
      <label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={saving} />Available for job bookings</label>
      <div className="flex flex-wrap gap-1">
        {DAYS.map((day) => <button key={day} type="button" aria-pressed={days.includes(day)} disabled={saving} onClick={() => setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])} className={`${button} ${days.includes(day) ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500"}`}>{WEEKDAY_SHORT[day]}</button>)}
        <button type="button" disabled={saving} onClick={() => setDays(DAYS)} className={`${button} border-slate-200`}>All days</button>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-slate-500">Date exceptions override the weekly schedule.</p>
        <div className="flex flex-wrap items-center gap-1">
          <input type="date" aria-label="Exception date" value={date} disabled={saving} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs" />
          <select aria-label="Availability on exception date" value={String(exceptionAvailable)} disabled={saving} onChange={(event) => setExceptionAvailable(event.target.value === "true")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs"><option value="false">Day off</option><option value="true">Extra shift</option></select>
          <button type="button" disabled={!date || saving} onClick={() => { setOverrides((current) => ({ ...current, [date]: exceptionAvailable })); setDate(""); }} className={button}><Plus className="h-3 w-3" /></button>
        </div>
        {Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b)).map(([value, available]) => <div key={value} className="flex items-center justify-between text-xs text-slate-600"><span>{value} · {available ? "Extra shift" : "Day off"}</span><button type="button" aria-label={`Remove exception ${value}`} disabled={saving} onClick={() => setOverrides((current) => { const next = { ...current }; delete next[value]; return next; })}><X className="h-3 w-3" /></button></div>)}
      </div>
      <p className="text-[10px] text-slate-500">Existing jobs stay booked. If a technician takes a day off, reassign their jobs.</p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2"><button type="button" onClick={save} disabled={saving} className={`${button} inline-flex gap-1 items-center bg-blue-600 border-blue-600 text-white`}>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Save availability</button><button type="button" disabled={saving} onClick={() => setEditing(false)} className={`${button} border-slate-200`}>Cancel</button></div>
    </div>
  );
}

export function TechnicianCapacitySummary() {
  const { technicians, loading, error } = useTechnicians();
  const [from, setFrom] = useState(todayAU());
  const rules = useBookingRules();
  return <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
    <div className="flex flex-wrap justify-between items-center gap-2"><h3 className="text-sm font-bold text-slate-900">Job capacity by day</h3><input type="date" aria-label="Capacity week starting" value={from} onChange={(event) => { if (event.target.value) setFrom(event.target.value); }} className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs" /></div>
    <p className="text-xs text-slate-600">Each available technician can take one job at a time. Booked hours reduce availability; inspection capacity uses Inspection Hours.</p>
    {loading ? <p className="text-xs">Loading roster…</p> : error ? <p role="alert" className="text-xs text-red-600">{error}</p> : <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">{DAYS.map((_, index) => { const date = addDaysYmd(from, index); const available = slotsForDate(rules, "job", date).length ? techniciansOnDate(technicians, date) : []; return <div key={date} title={available.map((tech) => tech.name).join(", ") || "No technicians working"} className="rounded-lg border border-blue-100 bg-white p-2 text-center"><p className="text-[10px] text-slate-500">{date}</p><p className="text-lg font-bold text-blue-700">{available.length}</p><p className="text-[10px] text-slate-500">available technicians</p></div>; })}</div>}
  </div>;
}

export function TechnicianAvailabilityPanel() {
  const { technicians, loading, error } = useTechnicians();
  return <div className="space-y-4"><TechnicianCapacitySummary />{loading ? <p className="text-xs text-slate-500">Loading technicians…</p> : error ? <p role="alert" className="text-xs text-red-600">{error}</p> : technicians.length === 0 ? <p className="text-xs text-slate-500">Add a technician in the Technician Roster to open job bookings.</p> : technicians.map((technician) => <div key={technician.id} className="rounded-xl border border-slate-200 p-4 space-y-2"><h3 className="font-semibold text-sm text-slate-900">{technician.name}</h3><TechnicianAvailabilityEditor technician={technician} /></div>)}</div>;
}
