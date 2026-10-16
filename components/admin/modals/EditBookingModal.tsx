"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import type { Lead } from "@/components/admin/types";
import { useBookingRules } from "@/lib/useBookingRules";
import { staffBookingRules } from "@/lib/staffBookingRules";
import { bookingEndForDuration, bookingSegments } from "@/lib/bookingSpan";
import { todayAU } from "@/lib/scheduling";
import { savedLeadBookingMinutes } from "@/lib/bookingDuration";
import { dispatchBookingIssue } from "@/lib/dispatchTimeline";
import { leadBookings } from "@/lib/leadBookings";
import { BookingStatusControl } from "../BookingStatusControl";

export function EditBookingModal({ lead, type, initialDate, initialTime, onClose, onSaved }: {
  lead: Lead;
  type: "inspection" | "job";
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onSaved: (date: string, message: string) => void;
}) {
  const { assignableTechnicians, inspectionStaff, upsertLead } = useAdminPageCtx();
  const rules = staffBookingRules(useBookingRules());
  const originalStart = (type === "job" ? lead.jobAt : lead.inspectionAt)?.slice(0, 16) || `${initialDate || todayAU()}T${initialTime || "09:00"}`;
  const originalEnd = (type === "job" ? lead.jobEndAt : lead.inspectionEndAt)?.slice(0, 16)
    || bookingEndForDuration(type, originalStart, savedLeadBookingMinutes(lead, type), rules);
  const selectedBooking = leadBookings(lead).find(b => b.type === type && `${b.date}T${b.time}` === originalStart);
  const [date, setDate] = useState(originalStart.slice(0, 10));
  const [time, setTime] = useState(originalStart.slice(11, 16));
  const [endAt, setEndAt] = useState(originalEnd);
  const [assignee, setAssignee] = useState((type === "job" ? lead.technician : lead.assigned) || "");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const choices = (type === "job" ? assignableTechnicians : inspectionStaff).filter(person => person.active);
  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50";
  const format = (value: string) => new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus();
  }, []);

  async function submit() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const person = choices.find(person => person.name === assignee);
      if (!person) throw new Error("Select an active assigned person.");
      const startAt = `${date}T${time}`;
      const segments = bookingSegments(type, startAt, endAt, rules);
      const response = await fetch(`/api/admin/slots?from=${date}&to=${endAt.slice(0, 10)}`, { cache: "no-store" });
      const availability = await response.json();
      if (!response.ok) throw new Error(availability.error || "Could not check availability.");
      const originalSegments = (type === "job" ? lead.jobWorkSegments : lead.inspectionWorkSegments)
        || bookingSegments(type, originalStart, originalEnd, rules);
      const competing = availability.appointments.filter((appointment: { leadId: string; type: string; date: string; time: string }) =>
        !(appointment.leadId === lead.id && appointment.type === type && originalSegments.some(segment => segment.date === appointment.date && segment.time === appointment.time)));
      for (const segment of segments) {
        const issue = dispatchBookingIssue({ leadId: "__edited_visit__", type, ...segment,
          ...(type === "job" ? { technicianId: person.id, technician: person.name } : { inspectorId: person.id, assigned: person.name }) },
          competing, rules, assignableTechnicians);
        if (issue) throw new Error(`${segment.date}: ${issue}`);
      }
      if (!review) { setReview(true); return; }
      const updates: Partial<Lead> = type === "job"
        ? { jobAt: startAt, jobEndAt: endAt, jobWorkSegments: segments, technician: person.name, technicianId: person.id,
          technicianUsername: assignableTechnicians.find(tech => tech.id === person.id)?.username || "" }
        : { inspectionAt: startAt, inspectionEndAt: endAt, inspectionWorkSegments: segments, assigned: person.name, inspectorId: person.id };
      if (!(type === "job" ? lead.jobAt : lead.inspectionAt)) updates.status = type === "job" ? "Job Booked" : "Inspection Booked";
      const savedResponse = await fetch(`/api/admin/submissions/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, bookingOriginalStart: originalStart, bookingNotifications: true }) });
      const saved = await savedResponse.json();
      if (!savedResponse.ok) throw new Error(saved.error || "Could not save booking changes.");
      upsertLead(saved.item || { ...lead, ...updates });
      onSaved(date, `Updated ${lead.name || "Customer"}'s ${type} booking. ${(saved.notificationWarnings || []).join(" ")}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save booking changes."); }
    finally { saving.current = false; setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onKeyDown={event => { if (event.key === "Escape" && !busy) onClose(); }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="edit-booking-title" className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" /><h2 id="edit-booking-title" className="text-sm font-bold">{review ? "Confirm booking changes" : "Change Booking"}</h2></div>
          <button type="button" aria-label="Close booking editor" disabled={busy} onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        {selectedBooking && <div className="px-5 pt-4"><BookingStatusControl leadId={lead.id} booking={selectedBooking} disabled={busy} /></div>}
        <form onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-4 p-5">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-bold">{lead.name || "Customer"}</p><p className="text-xs text-slate-500">{lead.address || lead.city}</p><p className={`mt-1 text-xs font-bold ${type === "job" ? "text-emerald-700" : "text-blue-700"}`}>{type === "job" ? "Job" : "Inspection"} · All times are Melbourne time</p></div>
          {review ? <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p><strong>Start:</strong> {format(`${date}T${time}`)}</p><p><strong>End:</strong> {format(endAt)}</p><p><strong>Assigned to:</strong> {assignee}</p>
            <p className="pt-2 text-xs text-slate-600">Confirm to save these changes and send the customer a booking update by email/SMS through the configured services.</p>
          </div> : <>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold">Start date<input type="date" required value={date} disabled={busy} onChange={event => setDate(event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold">Start time<input type="time" required value={time} disabled={busy} onChange={event => setTime(event.target.value)} className={inputClass} /></label>
            </div>
            <label className="block text-xs font-semibold">End date and time<input type="datetime-local" required value={endAt} disabled={busy} onChange={event => setEndAt(event.target.value)} className={inputClass} /></label>
            <label className="block text-xs font-semibold">Assigned person<select required value={assignee} disabled={busy} onChange={event => setAssignee(event.target.value)} className={inputClass}>
              <option value="" disabled>Select person</option>{assignee && !choices.some(person => person.name === assignee) && <option value={assignee} disabled>{assignee} (inactive)</option>}
              {choices.map(person => <option key={person.id} value={person.name}>{person.name}</option>)}
            </select></label>
          </>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" disabled={busy} onClick={() => review ? setReview(false) : onClose()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">{review ? "Back" : "Cancel"}</button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{busy ? "Checking…" : review ? "Confirm & Save" : "Review changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
