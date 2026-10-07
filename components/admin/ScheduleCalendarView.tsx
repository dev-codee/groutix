"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCcw,
  GripVertical,
  MoreVertical,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Repeat2,
  Trash2,
  CheckCircle2,
  Loader2,
  MapPin,
  Clock,
  Navigation,
  Route,
  Eye,
  CalendarClock,
  Save,
  AlertCircle,
  Search,
} from "lucide-react";
import { DispatchMap, type DispatchMapItem } from "@/components/admin/DispatchMap";
import { buildPlanningMapItems, type UnassignedPlanningLead } from "@/lib/unassignedLeads";
import type { DayAppointment } from "@/lib/bookings";
import type { Lead } from "@/components/admin/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type JobType = "inspection" | "job";

interface ScheduleEntry {
  id: string;           // booking/submission _id
  leadId: string;
  type: JobType;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:mm
  endTime?: string;     // HH:mm (derived)
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    status: string;
  } | null;
  zone: string;
  suburb: string | null;
  reference: string;
}

interface RescheduleModal {
  entry: ScheduleEntry;
  newDate: string;
  newTime: string;
  saving: boolean;
  error: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SLOT_DURATION = 60; // minutes per slot

// Number-circle colours per position
const STOP_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" }); // YYYY-MM-DD
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addMinutes(t: string, mins: number): string {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

function inputDateToday(): string {
  return todayStr();
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: JobType }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        type === "inspection"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      {type === "inspection" ? "Inspection" : "Job"}
    </span>
  );
}

function StopCircle({ n, size = "md" }: { n: number; type: JobType; size?: "sm" | "md" }) {
  const bg = STOP_COLORS[n % STOP_COLORS.length];
  const sz = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <div className={`${bg} ${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {n + 1}
    </div>
  );
}

function ScheduleDatePicker({ value, onChange, onClose }: {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(`${value.slice(0, 7)}-01`);
  const firstDay = new Date(`${month}T00:00:00`);
  const start = offsetDate(month, -((firstDay.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => offsetDate(start, index));
  const moveMonth = (offset: number) => {
    const date = new Date(`${month}T00:00:00`);
    date.setMonth(date.getMonth() + offset);
    setMonth(date.toLocaleDateString("en-CA"));
  };

  return (
    <div role="dialog" aria-label="Choose schedule date" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} className="absolute left-0 top-full mt-2 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
        <input type="month" aria-label="Calendar month" value={month.slice(0, 7)} onChange={(event) => { if (event.target.value) setMonth(`${event.target.value}-01`); }} className="min-w-0 text-xs font-semibold text-slate-900" />
        <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => <span key={day} className="py-1 text-[10px] font-bold text-slate-400">{day}</span>)}
        {days.map((date) => <button key={date} type="button" aria-label={fmtDate(date)} aria-pressed={date === value} onClick={() => onChange(date)} className={`rounded-lg py-2 text-xs cursor-pointer ${date === value ? "bg-blue-600 text-white font-bold" : date.slice(0, 7) !== month.slice(0, 7) ? "text-slate-300 hover:bg-slate-50" : isToday(date) ? "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100" : "text-slate-700 hover:bg-slate-100"}`}>
          {Number(date.slice(-2))}
        </button>)}
      </div>
      <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
        <button type="button" onClick={() => onChange(todayStr())} className="text-xs font-semibold text-blue-600 cursor-pointer">Today</button>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 cursor-pointer">Close</button>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ────────────────────────────────────────────────────────

function RescheduleDialog({
  modal,
  onClose,
  onSave,
}: {
  modal: RescheduleModal;
  onClose: () => void;
  onSave: (date: string, time: string) => void;
}) {
  const [date, setDate] = useState(modal.newDate);
  const [time, setTime] = useState(modal.newTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Reschedule Booking</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer info */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3">
            <div className="flex items-start gap-3">
              <StopCircle n={0} type={modal.entry.type} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{modal.entry.customer?.name || "Customer"}</p>
                <p className="text-[11px] text-slate-500 truncate">{modal.entry.customer?.address}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <TypeBadge type={modal.entry.type} />
                  <span className="text-[10px] text-slate-400">
                    Currently: {fmtDate(modal.entry.date)} · {fmtTime(modal.entry.time)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">New Date</label>
              <input
                type="date"
                value={date}
                min={inputDateToday()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">New Time</label>
              <input
                type="time"
                value={time}
                step="1800"
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {modal.error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {modal.error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(date, time)}
            disabled={modal.saving || !date || !time}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {modal.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {modal.saving ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBookingDialog({ leads, initialDate, initialBooking, onClose, onSaved }: {
  leads: Lead[];
  initialDate: string;
  initialBooking?: { leadId: string; type: JobType };
  onClose: () => void;
  onSaved: (date: string) => void;
}) {
  const [leadId, setLeadId] = useState(initialBooking?.leadId || "");
  const [type, setType] = useState<JobType>(initialBooking?.type || "inspection");
  const [date, setDate] = useState(initialDate < todayStr() ? todayStr() : initialDate);
  const [time, setTime] = useState(() => {
    const lead = leads.find((entry) => entry.id === initialBooking?.leadId);
    const appointment = initialBooking?.type === "job" ? lead?.jobAt : lead?.inspectionAt;
    return appointment?.split("T")[1]?.slice(0, 5) || "09:00";
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const availableLeads = leads.filter((lead) => !["Lost", "Cancelled"].includes(lead.status));
  const selectedLead = leads.find((lead) => lead.id === leadId);
  const existing = type === "inspection" ? selectedLead?.inspectionAt : selectedLead?.jobAt;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const slotsResponse = await fetch(`/api/admin/slots?date=${date}`, { cache: "no-store" });
      const slots = await slotsResponse.json();
      if (!slotsResponse.ok) throw new Error(slots.error || "Could not check availability.");
      if ((slots.appointments as DayAppointment[]).some((entry) => entry.time === time && (entry.leadId !== leadId || entry.type !== type))) {
        throw new Error("This time is already booked. Please choose another time.");
      }
      const response = await fetch(`/api/admin/submissions/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type === "inspection" ? "inspectionAt" : "jobAt"]: `${date}T${time}:00` }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save booking.");
      onSaved(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="add-booking-title" className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="add-booking-title" className="text-sm font-bold text-slate-900">Add Booking</h3>
          <button type="button" aria-label="Close booking form" onClick={onClose} disabled={saving} className="p-1.5 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <label className="block font-semibold">Customer
            <select required value={leadId} onChange={(event) => setLeadId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 bg-white">
              <option value="">Select a CRM customer</option>
              {availableLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name || "Customer"} — {lead.address || lead.jobNo || lead.id}</option>)}
            </select>
          </label>
          {!availableLeads.length && <p>No active customers available. Add a customer in the CRM first.</p>}
          <label className="block font-semibold">Booking type
            <select value={type} onChange={(event) => setType(event.target.value as JobType)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 bg-white">
              <option value="inspection">Inspection</option><option value="job">Job</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block font-semibold">Date<input required type="date" min={todayStr()} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label>
            <label className="block font-semibold">Time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5" /></label>
          </div>
          {existing && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">This customer already has this booking type scheduled. Saving will reschedule it and may notify the customer.</p>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Cancel</button>
          <button disabled={saving || !leadId} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? "Saving…" : "Save Booking"}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Selected Booking Sidebar ─────────────────────────────────────────────────

function SelectedBookingSidebar({
  entry,
  index,
  total,
  onClose,
  onMoveUp,
  onMoveDown,
  onMoveToAnotherDay,
  onRemoveFromRoute,
  onViewDetails,
}: {
  entry: ScheduleEntry;
  index: number;
  total: number;
  onClose: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToAnotherDay: () => void;
  onRemoveFromRoute: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="bg-white w-full h-full min-h-0 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <span className="text-xs font-bold text-slate-900">Selected Booking ({index + 1})</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Booking info */}
      <div className="p-4 space-y-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <StopCircle n={index} type={entry.type} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-slate-900 truncate">{entry.customer?.name || "Customer"}</p>
              <TypeBadge type={entry.type} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{fmtDate(entry.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{fmtTime(entry.time)} – {fmtTime(addMinutes(entry.time, SLOT_DURATION))}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{entry.customer?.address || "No address"}</span>
          </div>
        </div>

        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </button>
      </div>

      {/* Quick actions */}
      <div className="p-4 space-y-2 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
            Move Up
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
            Move Down
          </button>
        </div>

        <button
          onClick={onMoveToAnotherDay}
          className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
          Move to Another Day
        </button>

        <button
          onClick={onRemoveFromRoute}
          className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove from Route
        </button>
      </div>

      {/* Update route button */}
      <div className="p-4">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm">
          <Route className="w-4 h-4" />
          Update Route
        </button>
      </div>
    </div>
  );
}

// ─── Route Timeline ───────────────────────────────────────────────────────────

function RouteTimeline({
  entries,
  selectedId,
  onSelect,
  dateStr,
}: {
  entries: ScheduleEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dateStr: string;
}) {
  return (
    <div className="bg-white border-t border-slate-200/80 px-4 py-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Route className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[11px] font-bold text-slate-700">
          Route Timeline – Drag & Drop to Reorder
        </span>
        <span className="text-[10px] text-slate-400">({fmtDate(dateStr)})</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 min-h-[72px]">
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelect(e.id)}
              className={`flex flex-col items-center justify-between p-2.5 rounded-xl border min-w-[120px] transition-all cursor-pointer ${
                selectedId === e.id
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <StopCircle n={i} type={e.type} size="sm" />
                <span className="text-[11px] font-semibold text-slate-900 truncate leading-tight">
                  {e.customer?.name?.split(" ")[0] || "Customer"}
                </span>
                <MoreVertical className="w-3 h-3 text-slate-400 ml-auto shrink-0" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 self-start pl-0.5">
                {fmtTime(e.time)} – {fmtTime(addMinutes(e.time, SLOT_DURATION))}
              </span>
            </button>

            {i < entries.length - 1 && (
              <div className="flex items-center text-slate-300">
                <div className="w-6 h-px bg-slate-200" />
                <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 py-2">
            No bookings for this day
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function DayStatsBar({ entries }: { entries: ScheduleEntry[]; isUpdated: boolean }) {
  const jobs = entries.length;
  // Estimate 30km per booking and 20 min travel + 60 min service
  const totalKm = jobs * 13;
  const totalTravel = jobs > 0 ? Math.round((jobs - 1) * 20) : 0;
  const h = Math.floor(totalTravel / 60);
  const m = totalTravel % 60;
  const travelStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const stats = [
    { icon: CalendarDays, value: jobs, label: "Bookings", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Navigation, value: `${totalKm} km`, label: "Est. Distance", color: "text-sky-600", bg: "bg-sky-50" },
    { icon: Clock, value: travelStr, label: "Travel Time", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: MapPin, value: "Melbourne Metro", label: "Service Area", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {stats.map((s) => (
        <div key={s.label} className={`flex items-center gap-3 ${s.bg} rounded-xl px-4 py-3 border border-slate-200/60`}>
          <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
          <div>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Summary Footer ───────────────────────────────────────────────────────────

function RouteSummaryFooter({
  entries,
  originalCount,
  onPreviewSave,
}: {
  entries: ScheduleEntry[];
  originalCount: number;
  onPreviewSave: () => void;
}) {
  const km = entries.length * 13;
  const origKm = originalCount * 13;
  const diff = km - origKm;
  const travelMin = entries.length > 0 ? (entries.length - 1) * 20 : 0;
  const origTravel = originalCount > 0 ? (originalCount - 1) * 20 : 0;
  const tDiff = travelMin - origTravel;
  const h = Math.floor(travelMin / 60);
  const m = travelMin % 60;
  const travelStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-white border-t border-slate-200/80 flex-wrap">
      <div className="flex items-center gap-2 text-xs text-slate-700">
        <Navigation className="w-4 h-4 text-blue-500" />
        <span className="font-semibold">Updated Route Summary (After Reorder)</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
        <span>Total Distance: <b className="text-slate-900">{km} km</b></span>
        {diff !== 0 && (
          <span className={`font-semibold ${diff < 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ({diff > 0 ? "+" : ""}{diff} km)
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        <span>Travel Time: <b className="text-slate-900">{travelStr}</b></span>
        {tDiff !== 0 && (
          <span className={`font-semibold ${tDiff < 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ({tDiff > 0 ? "+" : ""}{tDiff}m)
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <MapPin className="w-3.5 h-3.5 text-violet-400" />
        <span>Jobs: <b className="text-slate-900">{entries.length}</b></span>
      </div>

      <button
        onClick={onPreviewSave}
        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Preview & Save Changes
      </button>
    </div>
  );
}

// ─── Map Panel (real Google Maps via DispatchMap) ────────────────────────────

function RouteMapPanel({
  mapItems,
  selectedLeadId,
  onSelectLead,
}: {
  mapItems: DispatchMapItem[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
}) {
  return (
    <div className="relative flex flex-col bg-slate-100 overflow-hidden h-full w-full">
      <DispatchMap
        items={mapItems}
        hqAddress="82A Marigold Cres, Gowanbrae VIC 3043, Australia"
        selectedLeadId={selectedLeadId}
        onSelectLead={onSelectLead}
      />
    </div>
  );
}

// ─── Job List Panel ───────────────────────────────────────────────────────────

function JobListPanel({
  entries,
  selectedId,
  onSelect,
  onReorder,
  onReschedule,
  onAddBooking,
  dateStr,
}: {
  entries: ScheduleEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (from: number, to: number) => void;
  onReschedule: (entry: ScheduleEntry) => void;
  onAddBooking: () => void;
  dateStr: string;
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const handleDragStart = (i: number) => {
    dragFrom.current = i;
    setDragging(i);
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    dragOver.current = i;
    setDropTarget(i);
  };
  const handleDrop = () => {
    if (dragFrom.current !== null && dragOver.current !== null && dragFrom.current !== dragOver.current) {
      onReorder(dragFrom.current, dragOver.current);
    }
    dragFrom.current = null;
    dragOver.current = null;
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <div className="flex flex-col bg-white h-full min-h-0 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
        <div>
          <p className="text-[11px] font-bold text-slate-900">Jobs for {fmtDate(dateStr)}</p>
        </div>
        <button
          onClick={onAddBooking}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Booking
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 px-4">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No bookings for this day
          </div>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={handleDrop}
              onDragEnd={() => { setDragging(null); setDropTarget(null); }}
              onClick={() => onSelect(selectedId === entry.id ? null : entry.id)}
              className={`group flex items-start gap-2.5 px-3 py-3 transition-all cursor-pointer relative ${
                selectedId === entry.id
                  ? "bg-amber-50 border-l-2 border-amber-400"
                  : dropTarget === i
                  ? "bg-blue-50 border-l-2 border-blue-400"
                  : dragging === i
                  ? "opacity-40"
                  : "hover:bg-slate-50 border-l-2 border-transparent"
              }`}
            >
              {/* Drag handle */}
              <button
                className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Stop number */}
              <StopCircle n={i} type={entry.type} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-blue-600 tabular-nums">
                    {fmtTime(entry.time)} – {fmtTime(addMinutes(entry.time, SLOT_DURATION))}
                  </span>
                  <span className="text-rose-500 text-[9px] font-bold hidden group-hover:inline-flex items-center gap-0.5">
                    ← drag to reorder
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{entry.customer?.name || "Customer"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TypeBadge type={entry.type} />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{entry.customer?.address}</p>
              </div>

              {/* Kebab menu */}
              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === entry.id ? null : entry.id); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {menuOpen === entry.id && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setMenuOpen(null); onReschedule(entry); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Repeat2 className="w-3.5 h-3.5 text-blue-500" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => { setMenuOpen(null); onSelect(entry.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Quick View
                    </button>
                    <div className="h-px bg-slate-100 mx-2 my-1" />
                    <button
                      onClick={() => { setMenuOpen(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScheduleCalendarView({
  onOpenLead,
  leads = [],
  onBookingsChanged,
  onBookingRequestHandled,
  initialBooking,
  unassignedLeads = [],
}: {
  onOpenLead: (id: string) => void;
  leads?: Lead[];
  onBookingsChanged?: () => void;
  onBookingRequestHandled?: () => void;
  initialBooking?: { leadId: string; type: JobType; date?: string };
  unassignedLeads?: UnassignedPlanningLead[];
}) {
  const [currentDate, setCurrentDate] = useState(initialBooking?.date || todayStr);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<ScheduleEntry[]>([]);
  const [rescheduleModal, setRescheduleModal] = useState<RescheduleModal | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<"1day" | "3day" | "week">("1day");

  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [selectedPlanningLeadId, setSelectedPlanningLeadId] = useState<string | null>(initialBooking?.leadId || null);
  const [planningFilter, setPlanningFilter] = useState<"all" | JobType>("all");
  const [planningSearch, setPlanningSearch] = useState("");
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [bookingPreset, setBookingPreset] = useState(initialBooking);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadRequest = useRef(0);
  const [mapDate, setMapDate] = useState<string | null>(null);
  const dayCount = viewMode === "week" ? 7 : viewMode === "3day" ? 3 : 1;
  const endDate = offsetDate(currentDate, dayCount - 1);
  const visibleDates = Array.from({ length: dayCount }, (_, index) => offsetDate(currentDate, index));

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string, ok: boolean) => setToast({ msg, ok });

  // Load the selected range, including past dates, from the shared calendar.
  const load = useCallback(async () => {
    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    setEntries([]);
    setOriginalEntries([]);
    setSelectedId(null);
    try {
      const res = await fetch(`/api/admin/slots?from=${currentDate}&to=${endDate}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load schedule.");
      if (request !== loadRequest.current) return;
      const bookings: ScheduleEntry[] = (data.appointments as DayAppointment[]).map((entry) => ({
        id: `${entry.leadId}:${entry.type}:${entry.date}:${entry.time}`,
        leadId: entry.leadId,
        type: entry.type,
        date: entry.date,
        time: entry.time,
        customer: { name: entry.name, address: entry.address || "", phone: "", email: "", status: entry.status || "" },
        zone: "flexible",
        suburb: entry.suburb || null,
        reference: entry.jobNo || "",
      }));
      setEntries(bookings);
      setOriginalEntries(bookings);
    } catch (err) {
      if (request !== loadRequest.current) return;
      setLoadError(err instanceof Error ? err.message : "Could not load schedule.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  }, [currentDate, endDate]);

  useEffect(() => {
    let active = true;
    // Defer the fetch so a discarded render cannot start a stale request.
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; loadRequest.current += 1; };
  }, [load]);

  const selectedPlanningLead = unassignedLeads.find(({ lead }) => lead.id === selectedPlanningLeadId) || null;
  const visiblePlanningLeads = unassignedLeads.filter(({ lead, type }) =>
    (planningFilter === "all" || type === planningFilter) &&
    `${lead.name || ""} ${lead.address || ""} ${lead.city || ""} ${lead.jobNo || ""}`.toLowerCase().includes(planningSearch.trim().toLowerCase()),
  ).sort((a, b) => Number(b.lead.id === selectedPlanningLeadId) - Number(a.lead.id === selectedPlanningLeadId));

  const selectPlanningLead = (id: string) => {
    setSelectedPlanningLeadId(id);
    setSelectedId(null);
    setShowUnassigned(true);
    setPlanningFilter("all");
    setPlanningSearch("");
  };

  // Selected entry
  const selectedEntry = useMemo(() => entries.find((e) => e.id === selectedId) || null, [entries, selectedId]);
  const selectedIndex = useMemo(() => entries.findIndex((e) => e.id === selectedId), [entries, selectedId]);

  const activeMapDate = mapDate && mapDate >= currentDate && mapDate <= endDate ? mapDate : currentDate;
  const mapEntries = useMemo(() => entries.filter((entry) => entry.date === activeMapDate), [entries, activeMapDate]);
  const selectBooking = (id: string | null) => {
    setSelectedId(id);
    setSelectedPlanningLeadId(null);
    const entry = entries.find((booking) => booking.id === id);
    if (entry) setMapDate(entry.date);
  };

  // Map items: convert ScheduleEntry[] → DispatchMapItem[] using leads lookup
  const bookedMapItems = useMemo<DispatchMapItem[]>(() =>
    mapEntries
      .map((e) => {
        const lead = leads.find((l) => l.id === e.leadId);
        const mapLead = lead || { id: e.leadId, status: e.customer?.status || "", createdAt: "", name: e.customer?.name, address: e.customer?.address };
        return { lead: mapLead, type: e.type, time: e.time } as DispatchMapItem;
      })
      .filter((x): x is DispatchMapItem => x !== null),
  [mapEntries, leads]);
  const mapItems = useMemo(() => buildPlanningMapItems(bookedMapItems, showUnassigned ? unassignedLeads : []), [bookedMapItems, unassignedLeads, showUnassigned]);
  const bookPlanningLead = () => {
    if (!selectedPlanningLead) return;
    setBookingPreset({ leadId: selectedPlanningLead.lead.id, type: selectedPlanningLead.type });
    setBookingDate(activeMapDate);
  };

  // Navigation
  const prevDay = () => setCurrentDate((d) => offsetDate(d, -dayCount));
  const nextDay = () => setCurrentDate((d) => offsetDate(d, dayCount));
  const goToday = () => setCurrentDate(todayStr());

  // Reorder entries (drag & drop)
  const handleReorder = (from: number, to: number) => {
    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // Move entry up/down
  const moveUp = () => {
    if (selectedIndex <= 0 || entries[selectedIndex - 1].date !== selectedEntry?.date) return;
    handleReorder(selectedIndex, selectedIndex - 1);
  };
  const moveDown = () => {
    if (selectedIndex === entries.length - 1 || entries[selectedIndex + 1]?.date !== selectedEntry?.date) return;
    handleReorder(selectedIndex, selectedIndex + 1);
  };

  // Reschedule
  const openReschedule = (entry: ScheduleEntry) => {
    setRescheduleModal({ entry, newDate: entry.date, newTime: entry.time, saving: false, error: "" });
  };

  const saveReschedule = async (newDate: string, newTime: string) => {
    if (!rescheduleModal) return;
    setRescheduleModal((m) => m ? { ...m, saving: true, error: "" } : m);
    try {
      const res = await fetch(`/api/admin/submissions/${rescheduleModal.entry.leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [rescheduleModal.entry.type === "inspection" ? "inspectionAt" : "jobAt"]: `${newDate}T${newTime}:00`,
        }),
      });
      if (!res.ok) throw new Error("Failed to reschedule");
      showToast("Booking rescheduled successfully!", true);
      setRescheduleModal(null);
      void load();
      onBookingsChanged?.();
    } catch {
      setRescheduleModal((m) => m ? { ...m, saving: false, error: "Could not reschedule. Please try again." } : m);
    }
  };

  // Optimize route (dummy: sort by address stub)
  const optimizeRoute = () => {
    showToast("Route optimized!", true);
  };

  // Preview & save changes (just shows a toast for now)
  const previewSave = () => {
    showToast("Route order saved!", true);
    setOriginalEntries(entries);
  };

  // Remove from route (just removes from local list; real implementation would update DB)
  const removeFromRoute = () => {
    if (!selectedId) return;
    setEntries((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    showToast("Removed from today's route.", false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-5 py-3 flex items-center gap-3 flex-wrap shrink-0">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevDay}
            aria-label="Previous date range"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative">
          <button type="button" onClick={() => setDatePickerOpen((open) => !open)} aria-expanded={datePickerOpen} aria-label="Choose schedule date" className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-blue-50">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {fmtDate(currentDate)}
            </span>
            {isToday(currentDate) && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">Today</span>
            )}
          </button>
          {datePickerOpen && <ScheduleDatePicker value={currentDate} onChange={(date) => { setCurrentDate(date); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
          </div>

          <button
            onClick={nextDay}
            aria-label="Next date range"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Today
        </button>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* View selector */}
          <select
            aria-label="Calendar view"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "1day" | "3day" | "week")}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="1day">1 Day (Single Day View)</option>
            <option value="3day">3 Day View</option>
            <option value="week">Week View</option>
          </select>

          <button type="button" aria-pressed={showUnassigned} onClick={() => { setShowUnassigned((show) => !show); setSelectedPlanningLeadId(null); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            {showUnassigned ? "Hide" : "Show"} unassigned ({unassignedLeads.length})
          </button>
          {/* Optimize Route */}
          <button
            onClick={optimizeRoute}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Route className="w-3.5 h-3.5" />
            Optimize Route
          </button>

          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="mx-5 mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{loadError} Use Refresh to try again.</div>}
      {dayCount > 1 && <div className="px-5 pt-3 text-xs font-semibold text-slate-600">{dayCount === 3 ? "3-day planning" : "Week planning"} · {fmtDate(currentDate)} – {fmtDate(endDate)} · {entries.length} bookings</div>}

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 shrink-0">
        <DayStatsBar entries={entries} isUpdated={false} />
      </div>

      {/* ── Main Body ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-1 ${selectedPlanningLead ? "min-h-[480px]" : "min-h-[360px]"} px-5 pb-0 gap-4 overflow-x-auto`}>
        {showUnassigned && <div className="w-[260px] shrink-0 min-h-0 rounded-xl border border-amber-200 bg-white flex flex-col overflow-hidden">
          <div className="shrink-0 border-b border-amber-100 bg-amber-50 p-3 space-y-2">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Unassigned leads</h3><span className="text-xs font-bold text-amber-700">{unassignedLeads.length}</span></div>
            <div className="flex gap-1">
              {(["all", "inspection", "job"] as const).map((type) => <button key={type} type="button" onClick={() => setPlanningFilter(type)} aria-pressed={planningFilter === type} className={`rounded-lg px-2 py-1 text-[10px] font-semibold cursor-pointer ${planningFilter === type ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}>{type === "all" ? "All" : type === "inspection" ? "Inspections" : "Jobs"}</button>)}
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"><Search className="w-3.5 h-3.5 text-slate-400" /><input aria-label="Search unassigned leads" placeholder="Search name or address" value={planningSearch} onChange={(event) => setPlanningSearch(event.target.value)} className="min-w-0 w-full text-xs outline-none" /></label>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
            {visiblePlanningLeads.map(({ lead, type }) => <button key={lead.id} type="button" onClick={() => selectPlanningLead(lead.id)} aria-pressed={selectedPlanningLeadId === lead.id} className={`w-full text-left rounded-xl border p-3 space-y-1 cursor-pointer ${selectedPlanningLeadId === lead.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-900 truncate">{lead.name || "Customer"}</span><TypeBadge type={type} /></div>
              <p className="text-[10px] font-semibold text-slate-500">{lead.status}</p>
              <p className="text-[11px] text-slate-600">{lead.address || lead.city || "Address needed to show on map"}</p>
              {selectedPlanningLeadId === lead.id && <p className="text-[10px] font-bold text-violet-700">Selected for planning</p>}
            </button>)}
            {!visiblePlanningLeads.length && <p className="p-4 text-center text-xs text-slate-400">No unassigned leads match these filters.</p>}
          </div>
        </div>}
        {/* Each visible day has its own booking column. */}
        <div className={`${dayCount === 1 ? "w-[260px] shrink-0" : showUnassigned ? "w-[40%] min-w-[280px] shrink-0" : "w-[60%] min-w-[280px] shrink-0"} flex min-h-0 overflow-x-auto gap-3 pb-1`}>
          {visibleDates.map((date, dayIndex) => {
            const dayEntries = entries.filter((entry) => entry.date === date);
            return (
              <div key={date} className={`${dayCount === 1 ? "w-full" : dayCount === 3 ? "min-w-[180px] flex-1" : "min-w-[230px] flex-1"} rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col min-h-0 bg-white`}>
                {dayCount > 1 && <div className={`px-4 py-3 border-b ${dayIndex % 3 === 0 ? "bg-blue-50 text-blue-800 border-blue-100" : dayIndex % 3 === 1 ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-orange-50 text-orange-800 border-orange-100"}`}>
                  <p className="text-sm font-bold">{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long" })}</p>
                  <p className="text-xs mt-1">{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · {dayEntries.length} bookings</p>
                </div>}
                {loading ? <div className="flex-1 flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div> : <JobListPanel
                  entries={dayEntries}
                  selectedId={selectedId}
                  onSelect={selectBooking}
                  onReorder={(from, to) => handleReorder(entries.indexOf(dayEntries[from]), entries.indexOf(dayEntries[to]))}
                  onReschedule={openReschedule}
                  onAddBooking={() => { setBookingPreset(undefined); setBookingDate(date); }}
                  dateStr={date}
                />}
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="flex-1 min-w-[280px] min-h-0 rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col">
          {selectedPlanningLead && <div className="shrink-0 border-b border-violet-200 bg-violet-50 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-violet-700">Selected for {selectedPlanningLead.type === "inspection" ? "inspection" : "job"}</p><p className="text-sm font-bold text-slate-900">{selectedPlanningLead.lead.name || "Customer"}</p></div><button type="button" onClick={() => setSelectedPlanningLeadId(null)} aria-label="Clear selected lead" className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button></div>
            <p className="text-xs text-slate-600">{selectedPlanningLead.lead.address || selectedPlanningLead.lead.city || "Add an address to place this lead on the map."}</p>
            <p className="text-[11px] text-slate-600">Plan for {fmtDate(activeMapDate)}. Select a date to compare existing bookings.</p>
            <div className="flex gap-2"><button type="button" onClick={bookPlanningLead} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 cursor-pointer">Book this lead</button><button type="button" onClick={() => onOpenLead(selectedPlanningLead.lead.id)} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">View details</button></div>
          </div>}
          <div className="flex shrink-0 flex-wrap gap-3 border-b border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-600"><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Unassigned</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Booked inspection</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Booked job</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-600" />Selected</span></div>
          {dayCount > 1 && <div className="flex shrink-0 items-center gap-2 overflow-x-auto bg-white p-2 border-b border-slate-200">
            {visibleDates.map((date) => <button key={date} onClick={() => { setMapDate(date); setSelectedId(null); }} aria-pressed={activeMapDate === date} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer ${activeMapDate === date ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50"}`}>
              {new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
            </button>)}
          </div>}
          <div className="flex-1 min-h-0">
          <RouteMapPanel
            mapItems={mapItems}
            selectedLeadId={selectedPlanningLead?.lead.id || selectedEntry?.leadId || null}
            onSelectLead={(id) => {
              if (showUnassigned && unassignedLeads.some(({ lead }) => lead.id === id)) selectPlanningLead(id);
              else selectBooking(mapEntries.find((entry) => entry.leadId === id)?.id || null);
            }}
          />
          </div>
        </div>

        {/* Selected booking sidebar */}
        {selectedEntry && (
          <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 h-full min-h-0 flex flex-col w-72 shrink-0 bg-white">
            <SelectedBookingSidebar
              entry={selectedEntry}
              index={entries.filter((entry) => entry.date === selectedEntry.date).findIndex((entry) => entry.id === selectedId)}
              total={entries.filter((entry) => entry.date === selectedEntry.date).length}
              onClose={() => setSelectedId(null)}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onMoveToAnotherDay={() => openReschedule(selectedEntry)}
              onRemoveFromRoute={removeFromRoute}
              onViewDetails={() => onOpenLead(selectedEntry.leadId)}
            />
          </div>
        )}
      </div>

      {/* ── Route Timeline ─────────────────────────────────────────────────── */}
      <div className="shrink-0 mx-5 mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <RouteTimeline
          entries={mapEntries}
          selectedId={selectedId}
          onSelect={selectBooking}
          dateStr={activeMapDate}
        />
      </div>

      {/* ── Footer Summary ─────────────────────────────────────────────────── */}
      <div className="shrink-0 mx-5 mb-4 mt-2 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <RouteSummaryFooter
          entries={entries}
          originalCount={originalEntries.length}
          onPreviewSave={previewSave}
        />
      </div>

      {bookingDate && <AddBookingDialog leads={leads} initialDate={bookingDate} initialBooking={bookingPreset} onClose={() => { setBookingDate(null); onBookingRequestHandled?.(); }} onSaved={(date) => {
        setBookingDate(null);
        onBookingRequestHandled?.();
        showToast("Booking saved successfully!", true);
        setMapDate(date);
        if (date >= currentDate && date <= endDate) void load();
        else setCurrentDate(date);
        onBookingsChanged?.();
      }} />}

      {/* ── Reschedule Modal ───────────────────────────────────────────────── */}
      {rescheduleModal && (
        <RescheduleDialog
          modal={rescheduleModal}
          onClose={() => { if (!rescheduleModal.saving) setRescheduleModal(null); }}
          onSave={saveReschedule}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all ${
            toast.ok
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-slate-800 text-white border-slate-700"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
