"use client";

import { useRef, useState } from "react";
import { ChevronDown, Search, Users } from "lucide-react";
import type { Lead } from "./types";
import type { BookingType } from "@/lib/bookingRules";

export function PlannerLeadPicker({ leads, currentLead, type, onSelect }: {
  leads: Lead[];
  currentLead: Partial<Lead>;
  type: BookingType;
  onSelect: (lead: Lead, type: BookingType) => void;
}) {
  const [search, setSearch] = useState("");
  const [bookingType, setBookingType] = useState(type);
  const dropdown = useRef<HTMLDetailsElement>(null);
  const query = search.trim().toLowerCase();
  const matches = leads.filter(lead => `${lead.name || ""} ${lead.address || ""} ${lead.city || ""} ${lead.phone || ""}`.toLowerCase().includes(query));
  const shown = [...matches].sort((a, b) => Number(b.id === currentLead.id) - Number(a.id === currentLead.id) || (a.name || "").localeCompare(b.name || "")).slice(0, 50);

  return <details ref={dropdown} className="relative ml-auto max-w-full" onToggle={event => {
    if (event.currentTarget.open) { setSearch(""); setBookingType(type); }
  }} onKeyDown={event => { if (event.key === "Escape" && dropdown.current) { event.stopPropagation(); dropdown.current.open = false; dropdown.current.querySelector("summary")?.focus(); } }}>
    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
      <Users className="h-4 w-4" />Change lead<ChevronDown className="h-3.5 w-3.5" />
    </summary>
    <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="space-y-2 border-b border-slate-100 p-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input aria-label="Search leads to plan" placeholder="Search name, address or phone" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 w-full text-xs outline-none" />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">Booking type
          <select aria-label="Planning booking type" value={bookingType} onChange={event => setBookingType(event.target.value as BookingType)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900">
            <option value="inspection">Inspection</option><option value="job">Job</option>
          </select>
        </label>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {shown.map(lead => <button key={lead.id} type="button" onClick={() => {
          if (dropdown.current) dropdown.current.open = false;
          onSelect(lead, bookingType);
        }} className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-blue-50 ${lead.id === currentLead.id ? "bg-blue-50" : ""}`}>
          <span className="block text-xs font-bold text-slate-900">{lead.name || "Customer"}{lead.id === currentLead.id && <span className="ml-2 text-[10px] text-blue-600">Current lead</span>}</span>
          <span className="block truncate text-[11px] text-slate-500">{lead.address || lead.city || "No address"}</span>
        </button>)}
        {!shown.length && <p className="p-4 text-center text-xs text-slate-500">No leads match your search.</p>}
      </div>
      {matches.length > shown.length && <p className="border-t border-slate-100 p-2 text-center text-[10px] text-slate-500">Showing 50 of {matches.length} leads. Search to narrow the list.</p>}
    </div>
  </details>;
}
