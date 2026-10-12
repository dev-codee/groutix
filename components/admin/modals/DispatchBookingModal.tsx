"use client";

import { staffBookingRules } from "@/lib/staffBookingRules";

import { useEffect, useRef, useState } from "react";
import { X, ArrowLeft, CalendarCheck, Loader2 } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import type { Lead } from "../types";
import { useBookingRules } from "@/lib/useBookingRules";
import { dispatchBookingIssue } from "@/lib/dispatchTimeline";
import { bookingEndForDuration, bookingSegments, type BookingSegment } from "@/lib/bookingSpan";
import { todayAU } from "@/lib/scheduling";

export function DispatchBookingModal({ date: initialDate, time: initialTime, onClose, onBooked }: {
  date: string; time: string; onClose: () => void; onBooked: (date: string, message: string) => void;
}) {
  const { scopedLeads, assignableTechnicians, inspectionStaff, upsertLead } = useAdminPageCtx();
  const rules = staffBookingRules(useBookingRules());
  const [type, setType] = useState<"inspection" | "job">("inspection");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [timingMode, setTimingMode] = useState<"duration" | "end">("duration");
  const [hours, setHours] = useState("1");
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState("");
  let endAt = "", timingError = "";
  let segments: BookingSegment[] = [];
  try {
    endAt = timingMode === "duration" ? bookingEndForDuration(type, `${date}T${time}`, Math.round(Number(hours) * 60), rules) : `${endDate}T${endTime}`;
    segments = bookingSegments(type, `${date}T${time}`, endAt, rules);
  } catch (error) { timingError = error instanceof Error ? error.message : "Choose valid start and end times."; }
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [service, setService] = useState("");
  const [assignee, setAssignee] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const savedLead = useRef<Lead | null>(null);
  const saving = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const choices = type === "job"
    ? assignableTechnicians.filter(t => t.active).map(t => ({ key: t.id, name: t.name }))
    : inspectionStaff.filter(t => t.active).map(t => ({ key: t.id, name: t.name }));
  const matches = scopedLeads.filter(l => `${l.name} ${l.email} ${l.phone} ${l.address}`.toLowerCase().includes(search.toLowerCase()));
  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus();
  }, []);

  async function checkAvailability() {
    if (timingError) throw new Error(timingError);
    const response = await fetch(`/api/admin/slots?from=${date}&to=${endAt.slice(0, 10)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check availability.");
    for (const segment of segments) {
    const issue = dispatchBookingIssue({ leadId: savedLead.current?.id || "new-dispatch-booking", type, ...segment,
      ...(type === "job" ? { technicianId: assignee, technician: choices.find(c => c.key === assignee)?.name } : { inspectorId: assignee, assigned: choices.find(c => c.key === assignee)?.name }) }, data.appointments, rules, assignableTechnicians);
    if (issue) throw new Error(`${segment.date}: ${issue}`);
    }
  }

  async function submit() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      if (date < todayAU()) throw new Error("Choose today or a future date.");
      if (mode === "existing" && !customerId) throw new Error("Select an existing customer, or choose New customer.");
      if (!customer.name.trim() || !customer.address.trim() || !service.trim() || !assignee) throw new Error("Enter the customer, property address, service and assigned specialist.");
      if (!customer.email.trim() && !customer.phone.trim()) throw new Error("Add an email address or phone number for the confirmation.");
      await checkAvailability();
      if (!review) { setReview(true); return; }
      // A repeat visit gets its own job record; previous customer history stays intact.
      // Keep this ID after a conflict so retrying never creates a second record.
      if (!savedLead.current) {
        const response = await fetch("/api/admin/submissions", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...customer, service, source: "Dispatch board" }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not create the booking record.");
        savedLead.current = data.item;
        upsertLead(data.item);
      }
      const lead = savedLead.current!;
      const specialist = choices.find(c => c.key === assignee)!;
      const updates: Partial<Lead> = { ...customer, service, status: type === "job" ? "Job Booked" : "Inspection Booked",
        ...(type === "job" ? { jobAt: `${date}T${time}`, jobEndAt: endAt, jobWorkSegments: segments, technicianId: assignee, technician: specialist.name }
          : { inspectionAt: `${date}T${time}`, inspectionEndAt: endAt, inspectionWorkSegments: segments, assigned: specialist.name, inspectorId: assignee }) };
      const response = await fetch(`/api/admin/submissions/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, bookingNotifications: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reserve this time.");
      upsertLead({ ...lead, ...updates });
      onBooked(date, `${type === "job" ? "Job" : "Inspection"} booked for ${customer.name}. ${data.notificationWarnings?.length ? data.notificationWarnings.join(" ") : "Email and SMS confirmations sent."}`);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Could not save. Please try again."}${savedLead.current ? " The customer record is saved; retry here to complete the booking." : ""}`);
    } finally { saving.current = false; setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dispatch-create-title"
      className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onKeyDown={event => {
        if (event.key === "Escape" && !busy) onClose();
        if (event.key === "Tab") {
          const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
          if (!nodes?.length) return;
          const first = nodes[0], last = nodes[nodes.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <div className="flex items-center justify-between border-b p-5">
        <div><h2 id="dispatch-create-title" className="font-bold text-lg">{review ? "Confirm booking" : "New booking"}</h2><p className="text-xs text-slate-500">{review ? "Review the details before booking and notifying the customer." : "Choose a time, customer and specialist. All times are Melbourne time."}</p></div>
        <button type="button" aria-label="Close booking" disabled={busy} onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <form onSubmit={event => { event.preventDefault(); void submit(); }}>
        <fieldset disabled={busy} className="p-5 space-y-4">
          {review ? <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-blue-50 p-4"><p className="font-bold capitalize">{type} · {date} at {time}</p><p>Ends {endAt.replace("T", " at ")} · {segments.reduce((total, segment) => total + segment.scheduledMinutes, 0) / 60} hours · Melbourne time</p></div>
            <ul className="max-h-36 overflow-y-auto text-xs text-slate-600">{segments.map(segment => <li key={segment.date}>{segment.date}: {segment.time} · {segment.scheduledMinutes / 60} hours</li>)}</ul>
            <p><strong>{customer.name}</strong><br />{customer.address}</p>
            <p>{service}<br />Assigned to <strong>{choices.find(c => c.key === assignee)?.name}</strong></p>
            <div className="rounded-xl border p-3 space-y-1"><p className="font-semibold">Customer confirmations</p><p>Email: {customer.email || "Not available — email will not be sent"}</p><p>SMS: {customer.phone || "Not available — SMS will not be sent"}</p></div>
            <p className="text-xs text-slate-500">Confirming creates a new booking record, reserves this time and sends confirmations through the configured email and SMS services. Existing bookings remain unchanged.</p>
          </div> : <>
            <div className="grid grid-cols-2 gap-3">{(["inspection", "job"] as const).map(value => <button key={value} type="button" aria-pressed={type === value} onClick={() => { setType(value); setAssignee(""); }} className={`rounded-xl border p-3 font-semibold capitalize ${type === value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200"}`}>{value}</button>)}</div>
            <div className="grid grid-cols-2 gap-3"><label className="text-sm">Date<input required type="date" min={todayAU()} value={date} onChange={e => setDate(e.target.value)} className={input} /></label><label className="text-sm">Start time<input required type="time" value={time} onChange={e => setTime(e.target.value)} className={input} /></label></div>
            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <label className="block text-sm">Set the finish by<select className={input} value={timingMode} onChange={e => setTimingMode(e.target.value as "duration" | "end")}><option value="duration">Duration (continuous hours)</option><option value="end">End date and time</option></select></label>
              {timingMode === "duration" ? <label className="block text-sm">Duration (hours)<input required type="number" min="0.25" step="0.25" value={hours} onChange={e => setHours(e.target.value)} className={input} /></label> : <div className="grid grid-cols-2 gap-3"><label className="text-sm">End date<input required type="date" min={date} value={endDate} onChange={e => setEndDate(e.target.value)} className={input} /></label><label className="text-sm">End time<input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={input} /></label></div>}
              <p className="text-xs text-slate-500">Staff can book any day or time, even when customer booking is closed. Duration runs continuously; multi-day bookings reserve the full period, including overnight (up to 45 calendar days).</p>
              {!timingError && <p className="text-sm font-semibold text-blue-700">Ends {endAt.replace("T", " at ")} · {segments.reduce((total, segment) => total + segment.scheduledMinutes, 0) / 60} hours</p>}
              {timingError && <p className="text-xs text-amber-700">{timingError}</p>}
            </div>
            <div className="flex gap-3">{(["existing", "new"] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setCustomerId(""); setCustomer({ name: "", email: "", phone: "", address: "" }); }} className={`text-sm rounded-lg px-3 py-2 ${mode === value ? "bg-slate-900 text-white" : "bg-slate-100"}`}>{value === "existing" ? "Existing customer" : "New customer"}</button>)}</div>
            {mode === "existing" && <div><label className="text-sm">Find customer<input className={input} placeholder="Search name, phone, email or address" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="text-sm">Customer<select required className={input} value={customerId} onChange={e => { const lead = scopedLeads.find(l => l.id === e.target.value); setCustomerId(e.target.value); if (lead) { setCustomer({ name: lead.name || "", email: lead.email || "", phone: lead.phone || "", address: lead.address || "" }); setService(lead.service || ""); } }}><option value="">Select a customer ({matches.length} matches)</option>{matches.map(l => <option key={l.id} value={l.id}>{l.name} · {l.address || l.phone} · {l.jobNo}</option>)}</select></label></div>}
            <div className="grid grid-cols-2 gap-3">{(["name", "email", "phone", "address"] as const).map(field => <label key={field} className={`text-sm capitalize ${field === "address" ? "col-span-2" : ""}`}>{field === "address" ? "Property address" : field}<input required={field === "name" || field === "address"} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} className={input} value={customer[field]} onChange={e => setCustomer({ ...customer, [field]: e.target.value })} /></label>)}</div>
            <label className="block text-sm">Service<input required className={input} value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Shower regrouting" /></label>
            <label className="block text-sm">{type === "job" ? "Technician" : "Inspector"}<select required className={input} value={assignee} onChange={e => setAssignee(e.target.value)}><option value="">Select a specialist</option>{choices.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}</select></label>
          </>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-between border-t pt-4"><button type="button" onClick={() => review ? setReview(false) : onClose()} className="flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" />{review ? "Edit details" : "Cancel"}</button><button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}{busy ? "Checking / saving…" : review ? "Confirm & notify customer" : "Review booking"}</button></div>
        </fieldset>
      </form>
    </div>
  </div>;
}
