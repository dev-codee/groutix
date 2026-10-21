"use client";

import { Fragment, useMemo, useState } from "react";
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Eye, Loader2, MapPin, Pencil, Plus } from "lucide-react";
import type { Lead } from "./types";
import { leadBookings, type LeadBooking } from "@/lib/leadBookings";
import { bookingNeedsReminder } from "@/lib/bookingStatus";
import { dispatchLeadStage } from "@/lib/dispatchLeads";
import { DISPATCH_ZONES, dispatchLocation } from "@/lib/dispatchPlanner";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";

const button = "inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-600";
const PAGE_SIZE = 20;
const bookingKey = (lead: Lead, booking: LeadBooking) => `${lead.id}:${booking.type}:${booking.bookingId || `${booking.date}T${booking.time}`}`;

export function DispatchLeadQueue({ leads, loading, busy, radius, title = "Leads in selected zones", onBook, onEdit, onEditLead, onView, onShowRoute }: {
  leads: Lead[];
  loading: boolean;
  busy: boolean;
  radius: number;
  title?: string;
  onBook: (lead: Lead, type: "inspection" | "job") => void;
  onEdit: (lead: Lead, booking: LeadBooking) => void;
  onEditLead: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onShowRoute: (lead: Lead, booking: LeadBooking) => void;
}) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string[]>([]);
  const rows = useMemo(() => leads.map(lead => {
    const bookings = leadBookings(lead);
    const closed = ["Lost", "Cancelled"].includes(lead.status);
    const open = closed ? [] : bookings.filter(booking => bookingNeedsReminder(booking.status));
    const focus = open[0] || [...bookings].reverse().find(booking => booking.status !== "Cancelled") || bookings.at(-1);
    return { lead, bookings, open, closed, focus, location: dispatchLocation(lead.address, lead.city, radius) };
  }), [leads, radius]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const displayed = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" aria-busy={loading || busy}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
      <div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 text-[11px] text-slate-500">{leads.length} leads · All dates · {rows.filter(row => !row.closed && !row.open.length).length} without an open booking</p></div>
      <span className="text-[10px] text-slate-400">Edit an existing visit to reschedule it</span>
    </div>
    {loading ? <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading leads…</div>
      : !displayed.length ? <div className="p-10 text-center"><MapPin className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No leads match this zone and status</p><p className="mt-1 text-xs text-slate-400">Choose another zone or change the status filter above.</p></div>
      : <div className="overflow-x-auto"><table className="w-full min-w-[840px] table-fixed text-left text-xs" aria-label="Zone leads">
        <colgroup><col style={{ width: 160 }} /><col style={{ width: 140 }} /><col style={{ width: 142 }} /><col style={{ width: 220 }} /><col style={{ width: 178 }} /></colgroup>
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-3 py-3">Property / Zone</th><th className="px-3 py-3">Lead status</th><th className="px-3 py-3">Booking</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
        <tbody>{displayed.map(({ lead, bookings, open, closed, focus, location }) => {
          const zoneInfo = DISPATCH_ZONES.find(zone => zone.id === location.zone)!;
          const stage = dispatchLeadStage(lead.status);
          const color = stage?.id === "new" ? "bg-sky-50 text-sky-700" : stage?.id.startsWith("quote") ? "bg-violet-50 text-violet-700" : stage?.id === "job-booked" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
          return <Fragment key={lead.id}>
            <tr data-lead-id={lead.id} className="border-b border-slate-100 align-middle hover:bg-slate-50/50">
              <td className="px-4 py-3">
                <button className="font-semibold text-blue-700 hover:underline" aria-label={`View lead ${lead.id}`} disabled={busy} onClick={() => onView(lead)}>{lead.jobNo || lead.id.slice(-6).toUpperCase()}</button>
                <p className="mt-1 truncate font-semibold text-slate-800" title={lead.name}>{lead.name || "Name missing"}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400" title={lead.email || lead.phone}>{lead.phone || lead.email || "Contact details missing"}</p>
              </td>
              <td className="px-3 py-3"><p className="truncate text-[11px] text-slate-600" title={lead.address || lead.city}>{lead.address || lead.city || "Address missing"}</p><div className="mt-1.5 flex items-center gap-2"><span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ color: zoneInfo.color, backgroundColor: `${zoneInfo.color}10` }}>{location.zone === "unlocated" ? "Unlocated" : location.zone}</span>{location.baseKm !== null && <span className="text-[10px] text-slate-400">~{location.baseKm.toFixed(1)} km</span>}</div></td>
              <td className="px-3 py-3"><span className={`inline-block max-w-full rounded-md px-2 py-1 text-[10px] font-semibold ${color}`}>{stage?.label || lead.status}</span>{stage && lead.status !== stage.label && lead.status !== "New" && <p className="mt-1 text-[9px] text-slate-400">{lead.status}</p>}{closed && <p className="mt-1 text-[10px] text-amber-700">Reopen before booking</p>}</td>
              <td className="px-3 py-3">
                {focus ? <>
                  <p className="text-[11px] font-semibold text-slate-700">{focus.type === "job" ? "Job" : "Inspection"} · {formatApptTime(`${focus.date}T${focus.time}`)}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{formatApptDate(`${focus.date}T${focus.time}`)} · {(focus.type === "job" ? focus.technician : focus.assigned) || "Unassigned"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {!closed && focus.status !== "Cancelled" && <button className="text-[10px] font-semibold text-blue-600 hover:underline disabled:opacity-40" aria-label={`Edit ${bookingKey(lead, focus)}`} disabled={busy} onClick={() => onEdit(lead, focus)}>{bookingNeedsReminder(focus.status) ? "Reschedule" : "View / edit visit"}</button>}
                    {!closed && focus.status !== "Cancelled" && focus.status !== "Inspection Completed" && <button className="text-[10px] text-slate-400 hover:text-blue-600 disabled:opacity-40" aria-label={`Show route ${bookingKey(lead, focus)}`} disabled={busy} onClick={() => onShowRoute(lead, focus)}>Route</button>}
                    {bookings.length > 1 && <button className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-900" aria-label={`Toggle bookings for ${lead.id}`} aria-expanded={expanded.includes(lead.id)} onClick={() => setExpanded(ids => ids.includes(lead.id) ? ids.filter(id => id !== lead.id) : [...ids, lead.id])}>{bookings.length} visits<ChevronDown className="h-3 w-3" /></button>}
                  </div>
                </> : <p className="text-[11px] text-slate-400">Ready to book · no visits yet</p>}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1.5">
                  <button className={`${button} !border-blue-100 !bg-blue-50 !text-blue-700`} aria-label={`Book inspection for ${lead.id}`} title={open.some(booking => booking.type === "inspection") ? "Book another inspection" : "Book inspection"} disabled={busy || closed} onClick={() => onBook(lead, "inspection")}><Plus className="h-3 w-3" />Inspection</button>
                  <button className={`${button} !border-emerald-100 !bg-emerald-50 !text-emerald-700`} aria-label={`Book job for ${lead.id}`} title={open.some(booking => booking.type === "job") ? "Book another job" : "Book job"} disabled={busy || closed} onClick={() => onBook(lead, "job")}><Plus className="h-3 w-3" />Job</button>
                </div>
                <div className="mt-1.5 flex justify-end gap-3"><button className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label={`Edit lead ${lead.id}`} disabled={busy} onClick={() => onEditLead(lead)}><Pencil className="h-3 w-3" />Details</button><button className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label={`Open customer ${lead.id}`} disabled={busy} onClick={() => onView(lead)}><Eye className="h-3 w-3" />View</button></div>
              </td>
            </tr>
            {expanded.includes(lead.id) && <tr><td colSpan={5} className="border-b border-slate-200 bg-slate-50 p-4"><div className="grid gap-2 sm:grid-cols-2">{bookings.map(booking => <div key={bookingKey(lead, booking)} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
              <p className="font-semibold">{booking.type === "job" ? "Job" : "Inspection"} · {formatApptDate(`${booking.date}T${booking.time}`)} · {formatApptTime(`${booking.date}T${booking.time}`)}</p>
              <p className="mt-1 text-[10px] text-slate-500">{booking.status} · {(booking.type === "job" ? booking.technician : booking.assigned) || "Unassigned"}</p>
              {booking.endAt && <p className="mt-1 text-[10px] text-slate-400">Until {formatApptDate(booking.endAt)} · {formatApptTime(booking.endAt)}</p>}
              {!closed && booking.status !== "Cancelled" && <button className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 disabled:opacity-40" aria-label={`Edit ${bookingKey(lead, booking)}`} disabled={busy} onClick={() => onEdit(lead, booking)}><CalendarClock className="h-3 w-3" />Edit this visit</button>}
              {!closed && booking.status !== "Cancelled" && booking.status !== "Inspection Completed" && <button className="ml-3 mt-2 text-slate-500 disabled:opacity-40" aria-label={`Show route ${bookingKey(lead, booking)}`} disabled={busy} onClick={() => onShowRoute(lead, booking)}>Route</button>}
            </div>)}</div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>}
    {!loading && rows.length > 0 && <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500"><span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length} leads</span><div className="flex items-center gap-2"><button className={button} aria-label="Previous leads page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-3.5 w-3.5" /></button><span>{currentPage} / {pages}</span><button className={button} aria-label="Next leads page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-3.5 w-3.5" /></button></div></div>}
  </section>;
}
