"use client";

import { Search } from "lucide-react";
import { DISPATCH_LEAD_FILTERS } from "@/lib/dispatchLeads";
import { defaultPlannerFilters, validPlannerDates, type PlannerFilters } from "@/lib/bookingPlannerFilters";

const field = "min-h-10 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case text-slate-700 focus:outline-2 focus:outline-blue-500";
const label = "flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500";

export function BookingPlannerFilters({ value, onChange, staff, count }: {
  value: PlannerFilters;
  onChange: (value: PlannerFilters) => void;
  staff: string[];
  count: number;
}) {
  const set = <K extends keyof PlannerFilters>(key: K, next: PlannerFilters[K]) => onChange({ ...value, [key]: next });
  return <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
    <div className="flex flex-wrap items-end gap-3">
      <label className={label}>Lead status<select aria-label="Planner lead status" className={field} value={value.stage} onChange={e => set("stage", e.target.value as PlannerFilters["stage"])}>
        <option value="active">All active leads</option><option value="all">All leads</option>
        {DISPATCH_LEAD_FILTERS.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
      </select></label>
      <label className={label}>Visit type<select aria-label="Planner visit type" className={field} value={value.visitType} onChange={e => set("visitType", e.target.value as PlannerFilters["visitType"])}>
        <option value="all">All visits</option><option value="inspection">Inspection</option><option value="job">Job</option>
      </select></label>
      <label className={label}>Staff<select aria-label="Planner staff" className={`${field} max-w-48`} value={value.staff} onChange={e => set("staff", e.target.value)}>
        <option value="all">All staff</option><option value="unassigned">Unassigned</option>
        {staff.map(name => <option key={name.toLowerCase()} value={name.toLowerCase()}>{name}</option>)}
      </select></label>
      <label className={label}>Booking dates<select aria-label="Planner booking dates" className={field} value={value.dateMode} onChange={e => set("dateMode", e.target.value as PlannerFilters["dateMode"])}>
        <option value="all">Any date</option><option value="range">Selected dates</option>
      </select></label>
      {value.dateMode === "range" && <>
        <label className={label}>From<input aria-label="Planner from date" type="date" className={field} value={value.from} onChange={e => set("from", e.target.value)} /></label>
        <label className={label}>To<input aria-label="Planner to date" type="date" min={value.from} className={field} value={value.to} onChange={e => set("to", e.target.value)} /></label>
      </>}
      <label className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search planner leads" type="search" className={`${field} w-full pl-9`} placeholder="Name, address, reference or phone" value={value.query} onChange={e => set("query", e.target.value)} /></label>
      <label className="flex min-h-10 items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" className="accent-blue-600" checked={value.includeUnbooked} onChange={e => set("includeUnbooked", e.target.checked)} />Include unbooked</label>
      <button type="button" className={`${field} cursor-pointer hover:bg-slate-100`} onClick={() => onChange(defaultPlannerFilters())}>Reset filters</button>
    </div>
    <p className="mt-2 text-[10px] text-slate-500">{count} matching leads · Filters apply to Change lead and visible booked stops. Availability and route-fit scores account for all bookings. The current customer stays on the map.</p>
    {!validPlannerDates(value) && <p role="alert" className="mt-1 text-xs text-amber-700">Choose a valid booking date range.</p>}
  </div>;
}
