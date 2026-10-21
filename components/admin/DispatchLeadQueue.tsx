"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Eye, Loader2, MapPin, Pencil, Plus, Search } from "lucide-react";
import type { Lead } from "./types";
import { leadBookings, type LeadBooking } from "@/lib/leadBookings";
import { bookingNeedsReminder } from "@/lib/bookingStatus";
import { STAGES } from "@/lib/pipeline";
import { DISPATCH_ZONES, dispatchLocation } from "@/lib/dispatchPlanner";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";

const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-2 focus:outline-blue-500";
const button = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-600";
const PAGE_SIZE = 20;

export function DispatchLeadQueue({ leads, loading, busy, radius, onBook, onEdit, onEditLead, onView, onShowRoute }: {
  leads: Lead[];
  loading: boolean;
  busy: boolean;
  radius: number;
  onBook: (lead: Lead, type: "inspection" | "job") => void;
  onEdit: (lead: Lead, booking: LeadBooking) => void;
  onEditLead: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onShowRoute: (lead: Lead, booking: LeadBooking) => void;
}) {
  const [status, setStatus] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [zone, setZone] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string[]>([]);
  const rows = useMemo(() => leads.map(lead => {
    const bookings = leadBookings(lead);
    const closed = ["Lost", "Cancelled"].includes(lead.status);
    const open = closed ? [] : bookings.filter(booking => bookingNeedsReminder(booking.status));
    return { lead, bookings, open, closed, location: dispatchLocation(lead.address, lead.city, radius) };
  }), [leads, radius]);
  const statuses = [...STAGES.map(stage => ({ key: stage.key, label: stage.label })),
    ...[...new Set(leads.map(lead => lead.status))].filter(key => !STAGES.some(stage => stage.key === key)).sort().map(key => ({ key, label: key }))];
  const matches = useMemo(() => rows.filter(row =>
    (status === "all" || row.lead.status === status)
    && (zone === "all" || row.location.zone === zone)
    && (bookingFilter === "all" || (bookingFilter === "unbooked" ? !row.open.length : row.open.some(booking => booking.type === bookingFilter)))
    && [row.lead.id, row.lead.name, row.lead.jobNo, row.lead.email, row.lead.phone, row.lead.address, row.lead.city, row.lead.service, row.lead.assigned, row.lead.technician]
      .some(value => value?.toLowerCase().includes(search.trim().toLowerCase()))), [rows, status, zone, bookingFilter, search]);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const displayed = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const reset = () => { setStatus("all"); setBookingFilter("all"); setZone("all"); setSearch(""); setPage(1); };

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" aria-busy={loading || busy}>
    <div className="border-b border-slate-100 p-4">
      <h3 className="text-sm font-bold text-slate-900">Leads & bookings</h3>
      <p className="mt-1 text-xs text-slate-500">Find customers at any CRM stage, including leads with no appointment. This list covers all dates.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-44 flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Lead status
          <select aria-label="Filter leads by status" className={field} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All lead statuses ({leads.length})</option>
            {statuses.map(stage => <option key={stage.key} value={stage.key}>{stage.label} ({leads.filter(lead => lead.status === stage.key).length})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Bookings
          <select aria-label="Filter leads by bookings" className={field} value={bookingFilter} onChange={event => { setBookingFilter(event.target.value); setPage(1); }}>
            <option value="all">All leads</option><option value="unbooked">No open bookings</option><option value="inspection">Open inspection bookings</option><option value="job">Open job bookings</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase text-slate-500">Property zone
          <select aria-label="Filter leads by zone" className={field} value={zone} onChange={event => { setZone(event.target.value); setPage(1); }}>
            <option value="all">All zones</option>{DISPATCH_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.id === "unlocated" ? "Unlocated" : `${zone.id} · ${zone.name}`}</option>)}
          </select>
        </label>
        <label className="relative min-w-52 flex-1"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input type="search" aria-label="Search leads to book" placeholder="Search name, reference, phone, email or address" className={`${field} w-full pl-8`} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <button className={button} onClick={reset}>Reset lead filters</button>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{matches.length} matching leads · {rows.filter(row => !row.closed && !row.open.length).length} active leads without an open booking. Use Edit on an existing visit to reschedule it; booking another visit keeps the existing bookings.</p>
    </div>
    {loading ? <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading leads…</div>
      : !displayed.length ? <div className="p-10 text-center"><p className="text-sm font-semibold text-slate-700">No leads match these filters</p><button className={`${button} mt-3`} onClick={reset}>Show all leads</button></div>
      : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Customer / Lead</th><th className="p-3">Lead status</th><th className="p-3">Property</th><th className="p-3">Existing bookings</th><th className="p-3 text-right">Booking actions</th></tr></thead>
        <tbody>{displayed.map(({ lead, bookings, open, closed, location }) => {
          const visible = [...bookings].sort((a, b) => Number(bookingNeedsReminder(b.status)) - Number(bookingNeedsReminder(a.status)) || `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
          const zoneInfo = DISPATCH_ZONES.find(zone => zone.id === location.zone)!;
          return <tr key={lead.id} data-lead-id={lead.id} className="border-t border-slate-100 align-top hover:bg-slate-50/50">
            <td className="p-3"><p className="font-bold text-blue-700">{lead.jobNo || lead.id.slice(-6).toUpperCase()}</p><p className="mt-1 font-semibold text-slate-900">{lead.name || "Name missing"}</p>{lead.phone && <p className="mt-1 text-[11px] text-slate-500">{lead.phone}</p>}{lead.email && <p className="mt-1 break-all text-[11px] text-slate-500">{lead.email}</p>}{lead.service && <p className="mt-1 max-w-48 text-[11px] text-slate-500">{lead.service}</p>}</td>
            <td className="p-3"><span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">{STAGES.find(stage => stage.key === lead.status)?.label || lead.status}</span>{closed && <p className="mt-2 max-w-36 text-[10px] text-amber-700">Reopen this lead before booking another visit.</p>}</td>
            <td className="p-3"><p className="max-w-56 text-slate-700">{lead.address || lead.city || "Address missing"}</p><span className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold" style={{ color: zoneInfo.color, backgroundColor: `${zoneInfo.color}10` }}><MapPin className="h-3 w-3" />{location.zone === "unlocated" ? "Unlocated" : `${location.zone} · ${zoneInfo.name}`}</span>{location.baseKm !== null && <p className="mt-1 text-[10px] text-slate-500">~{location.baseKm.toFixed(1)} km from base</p>}</td>
            <td className="min-w-72 p-3">{!bookings.length ? <p className="text-[11px] text-slate-500">No inspection or job bookings yet.</p> : <div className="space-y-2">{(expanded.includes(lead.id) ? visible : visible.slice(0, 3)).map(booking => {
              const key = `${lead.id}:${booking.type}:${booking.bookingId || `${booking.date}T${booking.time}`}`;
              const inactive = booking.status === "Cancelled";
              return <div key={key} className={`rounded-lg border p-2 ${inactive ? "border-slate-100 bg-slate-50 text-slate-400" : "border-slate-200 bg-white"}`}>
                <p className="font-semibold">{booking.type === "job" ? "Job" : "Inspection"} · {formatApptDate(`${booking.date}T${booking.time}`)} · {formatApptTime(`${booking.date}T${booking.time}`)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{booking.status} · {(booking.type === "job" ? booking.technician : booking.assigned) || "Unassigned"}</p>
                {booking.endAt && <p className="mt-1 text-[10px] text-slate-500">Until {formatApptDate(booking.endAt)} · {formatApptTime(booking.endAt)}</p>}
                {!inactive && !closed && <div className="mt-2 flex gap-3"><button className="text-[10px] font-semibold text-blue-600 hover:underline disabled:opacity-40" aria-label={`Edit ${key}`} disabled={busy} onClick={() => onEdit(lead, booking)}>Edit / reschedule</button><button className="text-[10px] font-semibold text-slate-500 hover:underline disabled:opacity-40" aria-label={`Show route ${key}`} disabled={busy} onClick={() => onShowRoute(lead, booking)}>Show in route planner</button></div>}
              </div>;
            })}{bookings.length > 3 && <button className="text-[11px] font-semibold text-blue-600" onClick={() => setExpanded(ids => ids.includes(lead.id) ? ids.filter(id => id !== lead.id) : [...ids, lead.id])}>{expanded.includes(lead.id) ? "Show fewer bookings" : `Show all ${bookings.length} bookings`}</button>}</div>}</td>
            <td className="p-3"><div className="flex flex-col items-end gap-2"><button className={`${button} !border-blue-600 !bg-blue-600 !text-white`} aria-label={`Book inspection for ${lead.id}`} disabled={busy || closed} onClick={() => onBook(lead, "inspection")}><Plus className="h-3.5 w-3.5" />{open.some(booking => booking.type === "inspection") ? "Book another inspection" : "Book inspection"}</button><button className={`${button} !border-emerald-600 !text-emerald-700`} aria-label={`Book job for ${lead.id}`} disabled={busy || closed} onClick={() => onBook(lead, "job")}><CalendarClock className="h-3.5 w-3.5" />{open.some(booking => booking.type === "job") ? "Book another job" : "Book job"}</button><button className={button} aria-label={`Edit lead ${lead.id}`} disabled={busy} onClick={() => onEditLead(lead)}><Pencil className="h-3.5 w-3.5" />Edit lead details</button><button className={button} aria-label={`View lead ${lead.id}`} disabled={busy} onClick={() => onView(lead)}><Eye className="h-3.5 w-3.5" />View customer</button></div></td>
          </tr>;
        })}</tbody>
      </table></div>}
    {!loading && matches.length > 0 && <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, matches.length)} of {matches.length} leads</span><div className="flex items-center gap-2"><button className={button} aria-label="Previous leads page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-3.5 w-3.5" /></button><span>Page {currentPage} of {pages}</span><button className={button} aria-label="Next leads page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-3.5 w-3.5" /></button></div></div>}
  </section>;
}
