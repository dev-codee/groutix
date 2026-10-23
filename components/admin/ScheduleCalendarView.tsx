"use client";

import { BookingTimingEditor } from "@/components/admin/BookingTimingEditor";
import { DispatchBookingModal } from "@/components/admin/modals/DispatchBookingModal";
import { bookingEndForDuration, bookingSegments, type BookingSegment } from "@/lib/bookingSpan";
import { bookingLead, leadBookings } from "@/lib/leadBookings";
import { staffBookingRules, staffPlanningRules } from "@/lib/staffBookingRules";

import { useTechnicians } from "@/lib/useTechnicians";
import { bookingAvailability } from "@/lib/bookingCapacity";
import { appointmentDurationMinutes } from "@/lib/bookingDuration";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
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
import { EditBookingModal } from "@/components/admin/modals/EditBookingModal";
import { DispatchMap, type DispatchMapItem } from "@/components/admin/DispatchMap";
import { AutoPlanRouteButton } from "@/components/admin/AutoPlanRouteButton";
import { buildPlanningMapItems, type UnassignedPlanningLead } from "@/lib/unassignedLeads";
import { MAX_PLANNING_DAYS, addPlanningDate, colorPlanningMapItems, offsetPlanningDate, planningDateRanges, planningDayColor, shiftPlanningDates } from "@/lib/scheduleDays";
import { planScheduleDrop, suggestedPlanningTime, type ScheduleDragItem } from "@/lib/scheduleDrag";
import type { DayAppointment } from "@/lib/bookings";
import type { Lead } from "@/components/admin/types";
import { applyRouteOrders, appointmentKey, estimateRoute, optimizeRouteStops } from "@/lib/scheduleRoutes";
import { useBookingRules } from "@/lib/useBookingRules";
import { formatSlotRange } from "@/lib/scheduling";

// ─── Types ──────────────────────────────────────────────────────────────────

type JobType = "inspection" | "job";

interface ScheduleEntry {
  bookingId?: string;
  bookingStart?: string;
  endAt?: string;
  workSegments?: BookingSegment[];
  id: string;           // booking/submission _id
  leadId: string;
  type: JobType;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:mm
  endTime?: string;     // HH:mm (derived)
  durationMinutes: number;
  scheduledMinutes?: number;
  technicianId?: string;
  technician?: string;
  technicianUsername?: string;
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

function StopCircle({ n, size = "md", color }: { n: number; type: JobType; size?: "sm" | "md"; color?: string }) {
  const bg = STOP_COLORS[n % STOP_COLORS.length];
  const sz = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <div style={color ? { backgroundColor: color } : undefined} className={`${bg} ${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
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
  onSave: (date: string, time: string, endAt?: string) => void;
}) {
  const [date, setDate] = useState(modal.newDate);
  const [time, setTime] = useState(modal.newTime);
  const rules = staffBookingRules(useBookingRules());
  const totalMinutes = modal.entry.workSegments?.reduce((sum, segment) => sum + segment.scheduledMinutes, 0) || modal.entry.durationMinutes;
  let initialEnd = "";
  try { initialEnd = bookingEndForDuration(modal.entry.type, `${date}T${time}`, totalMinutes, rules); } catch { /* Shown by the shared editor. */ }
  const [finish, setFinish] = useState("");
  const endAt = finish || initialEnd;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Reschedule booking" className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Reschedule Booking</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close reschedule form"
            disabled={modal.saving}
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
                    Currently: {fmtDate(modal.entry.date)} · {formatSlotRange(modal.entry.time, modal.entry.durationMinutes)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <BookingTimingEditor type={modal.entry.type} start={`${date}T${time}`} end={endAt} rules={rules} disabled={modal.saving} minDate={inputDateToday()}
            onChange={(start, end) => { setDate(start.slice(0, 10)); setTime(start.slice(11, 16)); setFinish(end); }} />
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
            disabled={modal.saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(date, time, endAt)}
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

function AddBookingDialog({ leads, initialDate, initialBooking, initialTime, onBeforeSave, onClose, onSaved }: {
  leads: Lead[];
  initialDate: string;
  initialBooking?: { leadId: string; type: JobType };
  initialTime?: string;
  onBeforeSave: () => boolean;
  onClose: () => void;
  onSaved: (date: string) => void;
}) {
  const selected = leads.find(lead => lead.id === initialBooking?.leadId);
  return <DispatchBookingModal date={initialDate} time={initialTime ?? "09:00"} staffName={initialBooking?.type === "job" ? selected?.technician : selected?.assigned} initialType={initialBooking?.type || "inspection"}
    initialLeadId={initialBooking?.leadId} onBeforeSave={onBeforeSave} onClose={onClose} onBooked={date => onSaved(date)} />;
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
  onUpdateRoute,
  hasChanges,
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
  onUpdateRoute: () => void;
  hasChanges: boolean;
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
            <span>{formatSlotRange(entry.time, entry.durationMinutes)}</span>
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
        <button onClick={onUpdateRoute} disabled={!hasChanges} className="disabled:opacity-40 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm">
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
  onReorder,
  onEdit,
}: {
  entries: ScheduleEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dateStr: string;
  onReorder: (from: number, to: number) => void;
  onEdit: (entry: ScheduleEntry) => void;
}) {
  const dragFrom = useRef<number | null>(null);
  return (
    <div className="bg-white border-t border-slate-200/80 px-3 py-2">
      <div className="flex items-center gap-2 mb-2.5">
        <Route className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[11px] font-bold text-slate-700">
          Route Timeline – Drag & Drop to Reorder
        </span>
        <span className="text-[10px] text-slate-400">({fmtDate(dateStr)})</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 min-h-[56px]">
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2 shrink-0">
            <div role="button" tabIndex={0}
              onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(e.id); } }}
              draggable
              onDragStart={() => { dragFrom.current = i; }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragFrom.current !== null) onReorder(dragFrom.current, i); dragFrom.current = null; }}
              onDragEnd={() => { dragFrom.current = null; }}
              onClick={() => onSelect(e.id)}
              className={`flex flex-col items-center justify-between p-2 rounded-lg border min-w-[120px] transition-all cursor-pointer ${
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
                <button type="button" aria-label={`Edit booking for ${e.customer?.name || "Customer"}`} onClick={event => { event.stopPropagation(); onEdit(e); }} className="ml-auto shrink-0 rounded p-1 hover:bg-slate-200"><MoreVertical className="w-3 h-3 text-slate-400" /></button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 self-start pl-0.5">
                {formatSlotRange(e.time, e.durationMinutes)}
              </span>
            </div>

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

// ─── Summary Footer ───────────────────────────────────────────────────────────

function RouteSummaryFooter({
  entries,
  originalEntries,
  hasChanges,
  onPreviewSave,
}: {
  entries: ScheduleEntry[];
  originalEntries: ScheduleEntry[];
  hasChanges: boolean;
  onPreviewSave: () => void;
}) {
  const estimate = estimateRoute(entries);
  const original = estimateRoute(originalEntries);
  const km = estimate.km;
  const diff = Math.round((km - original.km) * 10) / 10;
  const travelMin = estimate.minutes;
  const tDiff = travelMin - original.minutes;
  const h = Math.floor(travelMin / 60);
  const m = travelMin % 60;
  const travelStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white border-t border-slate-200/80 flex-wrap">
      <div className="flex items-center gap-2 text-xs text-slate-700">
        <Navigation className="w-4 h-4 text-blue-500" />
        <span className="font-semibold">{hasChanges ? "Unsaved Route Changes" : "Saved Route Summary"}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
        <span>Est. Round Trip: <b className="text-slate-900">{km} km</b></span>
        {diff !== 0 && (
          <span className={`font-semibold ${diff < 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ({diff > 0 ? "+" : ""}{diff} km)
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        <span>Est. Travel Time: <b className="text-slate-900">{travelStr}</b></span>
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

      {estimate.missing > 0 && <span className="text-[10px] text-amber-700">{estimate.missing} stops have no known suburb; estimates exclude them.</span>}
      <span className="text-[10px] text-slate-500">Includes return to base · suburb estimates</span>
      <button
        onClick={onPreviewSave}
        disabled={!hasChanges}
        className="disabled:opacity-40 ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Preview & Save Changes
      </button>
    </div>
  );
}

// ─── Map Panel (OpenStreetMap via DispatchMap) ────────────────────────────

function RouteMapPanel({
  mapItems,
  mapTypeFilter,
  onMapTypeFilterChange,
  selectedLeadId,
  selectedItemId,
  onSelectItem,
  onSelectLead,
}: {
  mapItems: DispatchMapItem[];
  mapTypeFilter: "all" | JobType;
  onMapTypeFilterChange: (type: "all" | JobType) => void;
  selectedLeadId: string | null;
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
  onSelectLead: (id: string) => void;
}) {
  return (
    <div className="relative flex flex-col bg-slate-100 overflow-hidden h-full w-full">
      <DispatchMap
        items={mapItems}
        hqAddress="82A Marigold Cres, Gowanbrae VIC 3043, Australia"
        selectedLeadId={selectedLeadId}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        onSelectLead={onSelectLead}
      >
        <div role="group" aria-label="Show on map" className="absolute bottom-7 left-3 right-3 z-10 flex w-fit max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-md">
          {(["all", "inspection", "job"] as const).map(type => <button key={type} type="button"
            aria-pressed={mapTypeFilter === type} onClick={() => onMapTypeFilterChange(type)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${mapTypeFilter === type
              ? type === "inspection" ? "bg-blue-600 text-white" : type === "job" ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"}`}>
            {type !== "all" && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${mapTypeFilter === type ? "bg-white" : type === "inspection" ? "bg-blue-600" : "bg-emerald-600"}`} />}
            {type === "all" ? "Both" : type === "inspection" ? "Inspections" : "Jobs"}
          </button>)}
        </div>
      </DispatchMap>
    </div>
  );
}

// ─── Job List Panel ───────────────────────────────────────────────────────────

function JobListPanel({
  entries,
  selectedId,
  onSelect,
  onDragStart,
  onDragEnd,
  onDropBooking,
  onReschedule,
  onRemove,
  onAddBooking,
  dateStr,
  color,
  disabled,
}: {
  entries: ScheduleEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDragStart: (event: React.DragEvent, item: ScheduleDragItem) => void;
  onDragEnd: () => void;
  onDropBooking: (event: React.DragEvent, date: string, targetId?: string) => void;
  onReschedule: (entry: ScheduleEntry) => void;
  onRemove: (entry: ScheduleEntry) => void;
  onAddBooking: () => void;
  dateStr: string;
  color: string;
  disabled: boolean;
}) {

  return (
    <div className="flex flex-col bg-white w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
        <div>
          <p className="text-[11px] font-bold text-slate-900">Jobs for {fmtDate(dateStr)}</p>
        </div>
        <button
          onClick={onAddBooking}
          disabled={disabled}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Booking
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 px-4">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No bookings for this day
          </div>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry.id}
              draggable={!disabled}
              onDragStart={(event) => onDragStart(event, { kind: "booking", id: entry.id })}
              onDrop={(event) => onDropBooking(event, dateStr, entry.id)}
              onDragEnd={onDragEnd}
              onClick={() => onSelect(selectedId === entry.id ? null : entry.id)}
              className={`group flex items-start gap-2.5 px-2.5 py-2 transition-all cursor-pointer relative ${
                selectedId === entry.id
                  ? "bg-amber-50 border-l-2 border-amber-400"
                  : "hover:bg-slate-50 border-l-2 border-transparent"
              }`}
            >
              {/* Drag handle */}
              <button
                aria-label={`Drag ${entry.customer?.name || "booking"} to another day or reorder`}
                className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Stop number */}
              <StopCircle n={i} type={entry.type} color={entry.type === "job" ? "#059669" : "#2563EB"} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                  <p className="text-xs font-semibold text-slate-900">{entry.customer?.name || "Customer"}</p>
                  <span className="text-[10px] font-bold text-blue-600 tabular-nums whitespace-nowrap">
                    {formatSlotRange(entry.time, entry.durationMinutes)}
                  </span>
                </div>
                <span className="text-rose-500 text-[9px] font-bold hidden group-hover:inline-flex items-center gap-0.5">
                  Drag to another day or reorder
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TypeBadge type={entry.type} />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{entry.customer?.address}</p>
              </div>

              <button type="button" aria-label={`Edit booking for ${entry.customer?.name || "Customer"}`}
                disabled={disabled} onClick={event => { event.stopPropagation(); onReschedule(entry); }}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScheduleCalendarView({
  header,
  onOpenLead,
  leads = [],
  onBookingsChanged,
  onBookingRequestHandled,
  initialBooking,
  unassignedLeads = [],
}: {
  header?: ReactNode;
  onOpenLead: (id: string) => void;
  leads?: Lead[];
  onBookingsChanged?: () => void;
  onBookingRequestHandled?: () => void;
  initialBooking?: { leadId: string; type: JobType; date?: string };
  unassignedLeads?: UnassignedPlanningLead[];
}) {
  const [visibleDates, setVisibleDates] = useState(() => [initialBooking?.date || todayStr()]);
  const currentDate = visibleDates[0];
  const endDate = visibleDates[visibleDates.length - 1];
  const dayCount = visibleDates.length;
  const setCurrentDate = (date: string) => changeVisibleDates(shiftPlanningDates(visibleDates, date));
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<ScheduleEntry[]>([]);
  const hasChanges = entries.some((entry, index) => entry.id !== originalEntries[index]?.id) || entries.length !== originalEntries.length;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [routeSaving, setRouteSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [removingEntry, setRemovingEntry] = useState<ScheduleEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const configuredRules = useBookingRules();
  const rules = staffBookingRules(configuredRules);
  const planningRules = staffPlanningRules(configuredRules);
  const { technicians } = useTechnicians();
  const suggestTime = (type: JobType, date: string, preferred?: string, leadId?: string) => {
    const lead = leads.find((lead) => lead.id === leadId);
    const entry = entries.find((entry) => entry.leadId === leadId && entry.type === type);
    return suggestedPlanningTime(planningRules, type, date, entries, preferred, technicians, {
      leadId, durationMinutes: appointmentDurationMinutes({ type }, rules),
      technicianId: entry?.technicianId || lead?.technicianId,
      technician: entry?.technician || lead?.technician, technicianUsername: entry?.technicianUsername || lead?.technicianUsername,
    });
  };
  const [editBookingEntry, setEditBookingEntry] = useState<ScheduleEntry | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<RescheduleModal | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [bookingTime, setBookingTime] = useState<string | undefined>();
  const [selectedPlanningLeadId, setSelectedPlanningLeadId] = useState<string | null>(initialBooking?.leadId || null);
  const [planningFilter, setPlanningFilter] = useState<"all" | JobType>("all");
  const [planningSearch, setPlanningSearch] = useState("");
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [showUnassignedOnMap, setShowUnassignedOnMap] = useState(true);
  const [mapTypeFilter, setMapTypeFilter] = useState<"all" | JobType>("all");
  const dragItem = useRef<ScheduleDragItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<{ fromId: string; toId: string } | null>(null);
  const [bookingPreset, setBookingPreset] = useState(initialBooking);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadRequest = useRef(0);
  const [mapDate, setMapDate] = useState<string | null>(null);
  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string, ok: boolean) => setToast({ msg, ok });
  const discardChanges = () => !hasChanges || window.confirm("Discard unsaved route changes?");
  const changeVisibleDates = (dates: string[]) => {
    if (!routeSaving && discardChanges()) setVisibleDates(dates);
  };
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  // Load the selected range, including past dates, from the shared calendar.
  const load = useCallback(async () => {
    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    setEntries([]);
    setOriginalEntries([]);
    setSelectedId(null);
    try {
      const responses = await Promise.all(planningDateRanges(visibleDates).map(async ({ from, to }) => {
        const res = await fetch(`/api/admin/slots?from=${from}&to=${to}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load schedule.");
        return { appointments: data.appointments as DayAppointment[], routeOrders: data.routeOrders || {} };
      }));
      if (request !== loadRequest.current) return;
      const orders = Object.assign({}, ...responses.map((response) => response.routeOrders));
      const bookings: ScheduleEntry[] = responses.flatMap((response) => response.appointments).filter((entry) => visibleDates.includes(entry.date)).map((entry) => ({
        id: appointmentKey(entry),
        bookingId: entry.bookingId,
        bookingStart: entry.bookingStart,
        endAt: entry.endAt,
        workSegments: entry.workSegments,
        leadId: entry.leadId,
        type: entry.type,
        date: entry.date,
        time: entry.time,
        durationMinutes: appointmentDurationMinutes(entry, rules),
        scheduledMinutes: entry.scheduledMinutes,
        technicianId: entry.technicianId, technician: entry.technician, technicianUsername: entry.technicianUsername,
        customer: { name: entry.name, address: entry.address || "", phone: "", email: "", status: entry.status || "" },
        zone: "flexible",
        suburb: entry.suburb || null,
        reference: entry.jobNo || "",
      }));
      const ordered = applyRouteOrders(bookings, orders);
      setEntries(ordered);
      setOriginalEntries(ordered);
    } catch (err) {
      if (request !== loadRequest.current) return;
      setLoadError(err instanceof Error ? err.message : "Could not load schedule.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  }, [visibleDates, rules]);

  useEffect(() => {
    let active = true;
    // Defer the fetch so a discarded render cannot start a stale request.
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; loadRequest.current += 1; };
  }, [load]);

  const selectedPlanningLead = showUnassigned ? unassignedLeads.find(({ lead }) => lead.id === selectedPlanningLeadId) || null : null;
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

  const activeMapDate = mapDate && visibleDates.includes(mapDate) ? mapDate : currentDate;
  const mapEntries = useMemo(() => entries.filter((entry) => entry.date === activeMapDate), [entries, activeMapDate]);
  const selectBooking = (id: string | null) => {
    setSelectedId(id);
    setSelectedPlanningLeadId(null);
    const entry = entries.find((booking) => booking.id === id);
    if (entry) setMapDate(entry.date);
  };

  // Map items: convert ScheduleEntry[] → DispatchMapItem[] using leads lookup
  const bookedMapItems = useMemo<DispatchMapItem[]>(() =>
    entries
      .map((e) => {
        const lead = leads.find((l) => l.id === e.leadId);
        const mapLead = lead || { id: e.leadId, status: e.customer?.status || "", createdAt: "", name: e.customer?.name, address: e.customer?.address };
        return { lead: mapLead, type: e.type, time: e.time, date: e.date, appointmentId: e.id } as DispatchMapItem;
      })
      .filter((x): x is DispatchMapItem => x !== null),
  [entries, leads]);
  const mapItems = useMemo(() => buildPlanningMapItems(colorPlanningMapItems(bookedMapItems, visibleDates), showUnassigned && showUnassignedOnMap ? unassignedLeads : [])
    .filter(item => mapTypeFilter === "all" || item.type === mapTypeFilter),
  [bookedMapItems, visibleDates, unassignedLeads, showUnassigned, showUnassignedOnMap, mapTypeFilter]);
  const bookPlanningLead = () => {
    if (!selectedPlanningLead) return;
    if (!discardChanges()) return;
    setBookingPreset({ leadId: selectedPlanningLead.lead.id, type: selectedPlanningLead.type });
    setBookingTime(suggestTime(selectedPlanningLead.type, activeMapDate, undefined, selectedPlanningLead.lead.id));
    setBookingDate(activeMapDate);
  };

  // Navigation
  const prevDay = () => setCurrentDate(offsetPlanningDate(currentDate, -dayCount));
  const nextDay = () => setCurrentDate(offsetPlanningDate(currentDate, dayCount));
  const goToday = () => setCurrentDate(todayStr());

  // Reorder entries (drag & drop)
  const handleReorder = (from: number, to: number) => {
    if (routeSaving || loading || from === to || !entries[from] || !entries[to] || entries[from].date !== entries[to].date) return;
    setPendingReorder({ fromId: entries[from].id, toId: entries[to].id });
  };
  const confirmReorder = () => {
    if (!pendingReorder || routeSaving || loading) return;
    setEntries((prev) => {
      const from = prev.findIndex((entry) => entry.id === pendingReorder.fromId);
      const to = prev.findIndex((entry) => entry.id === pendingReorder.toId);
      if (from < 0 || to < 0 || prev[from].date !== prev[to].date) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setPendingReorder(null);
  };

  const startDrag = (event: React.DragEvent, item: ScheduleDragItem) => {
    if (loading || routeSaving) { event.preventDefault(); return; }
    dragItem.current = item;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.kind === "booking" ? item.id : item.leadId);
    setDragging(true);
  };
  const endDrag = () => {
    dragItem.current = null;
    setDragging(false);
    setDropDate(null);
  };
  const dropBooking = (event: React.DragEvent, date: string, targetId?: string) => {
    if (!dragItem.current) return;
    event.preventDefault();
    event.stopPropagation();
    const item = dragItem.current;
    endDrag();
    if (loading || loadError || routeSaving) return;
    const proposal = planScheduleDrop(item, date, entries, targetId);
    if (!proposal) return;
    if (proposal.kind === "reorder") { handleReorder(proposal.from, proposal.to); return; }
    setMapDate(date);
    if (proposal.kind === "reschedule") {
      const entry = entries.find((entry) => entry.id === proposal.entry.id)!;
      setRescheduleModal({ entry, newDate: date, newTime: suggestTime(entry.type, date, entry.time, entry.leadId), saving: false, error: "" });
    } else {
      if (!unassignedLeads.some(({ lead, type }) => lead.id === proposal.leadId && type === proposal.type)) return;
      setBookingPreset({ leadId: proposal.leadId, type: proposal.type });
      setBookingTime(suggestTime(proposal.type, date, undefined, proposal.leadId));
      setBookingDate(date);
    }
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

  const saveReschedule = async (newDate: string, newTime: string, newEndAt?: string) => {
    if (!rescheduleModal || rescheduleModal.saving || routeSaving) return;
    if (!newDate || !newTime) return;
    if (!discardChanges()) return;
    setRescheduleModal((m) => m ? { ...m, saving: true, error: "" } : m);
    try {
      const lead = leads.find(lead => lead.id === rescheduleModal.entry.leadId);
      const visit = lead && leadBookings(lead).find(b => rescheduleModal.entry.bookingId ? b.bookingId === rescheduleModal.entry.bookingId : b.type === rescheduleModal.entry.type && `${b.date}T${b.time}` === `${rescheduleModal.entry.date}T${rescheduleModal.entry.time}`);
      const total = rescheduleModal.entry.workSegments?.reduce((sum, segment) => sum + segment.scheduledMinutes, 0) || rescheduleModal.entry.durationMinutes;
      const finish = newEndAt || bookingEndForDuration(rescheduleModal.entry.type, `${newDate}T${newTime}`, total, rules);
      const segments = bookingSegments(rescheduleModal.entry.type, `${newDate}T${newTime}`, finish, rules);
      const response = await fetch(`/api/admin/slots?from=${newDate}&to=${finish.slice(0, 10)}`, { cache: "no-store" });
      const available = await response.json();
      if (!response.ok) throw new Error(available.error || "Could not check availability.");
      for (const segment of segments) {
        const candidate = lead && visit ? bookingLead(lead, visit) : lead;
        const result = bookingAvailability(available.appointments, { ...candidate, ...segment, leadId: rescheduleModal.entry.leadId, type: rescheduleModal.entry.type, bookingId: rescheduleModal.entry.bookingId }, rules, available.technicians || technicians);
        if (!result.available && !window.confirm(`${result.reason || "The assigned person is already booked."}\n\nReschedule anyway?`)) {
          setRescheduleModal(m => m ? { ...m, saving: false } : m);
          return;
        }
      }
      const res = await fetch(`/api/admin/submissions/${rescheduleModal.entry.leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [rescheduleModal.entry.type === "inspection" ? "inspectionAt" : "jobAt"]: `${newDate}T${newTime}:00`,
          [rescheduleModal.entry.type === "inspection" ? "inspectionEndAt" : "jobEndAt"]: finish,
          bookingId: rescheduleModal.entry.bookingId,
          bookingOriginalStart: rescheduleModal.entry.bookingStart || `${rescheduleModal.entry.date}T${rescheduleModal.entry.time}`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to reschedule");
      showToast("Booking rescheduled successfully!", true);
      setRescheduleModal(null);
      void load();
      onBookingsChanged?.();
    } catch (err) {
      setRescheduleModal((m) => m ? { ...m, saving: false, error: err instanceof Error ? err.message : "Could not reschedule. Please try again." } : m);
    }
  };

  // Route planning changes visit order without changing customer appointments.
  const optimizeRoute = () => {
    if (loading || routeSaving) return;
    const optimized = optimizeRouteStops(entries);
    const changed = optimized.some((entry, index) => entry.id !== entries[index]?.id);
    setEntries(optimized);
    showToast(changed ? "Suggested driving order ready. Review and save the changes." : "No shorter route found for the known suburbs.", true);
  };

  const previewSave = () => {
    if (!hasChanges || routeSaving) return;
    setSaveError("");
    setPreviewOpen(true);
  };
  const saveRoute = async () => {
    if (routeSaving) return;
    setRouteSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/admin/schedule-routes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: visibleDates.filter((date) => {
          const current = entries.filter((entry) => entry.date === date).map((entry) => entry.id);
          const original = originalEntries.filter((entry) => entry.date === date).map((entry) => entry.id);
          return current.join("|") !== original.join("|");
        }).map((date) => ({ date, order: entries.filter((entry) => entry.date === date).map((entry) => entry.id) })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save route order.");
      setOriginalEntries(entries);
      setPreviewOpen(false);
      showToast("Route order saved.", true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save route order.");
    } finally { setRouteSaving(false); }
  };
  const openRemove = (entry: ScheduleEntry) => {
    setRemoveError("");
    setRemovingEntry(entry);
  };
  const removeFromRoute = async () => {
    if (!removingEntry || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      const response = await fetch(`/api/admin/submissions/${removingEntry.leadId}/bookings`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: removingEntry.type, bookingId: removingEntry.bookingId, start: removingEntry.bookingStart || `${removingEntry.date}T${removingEntry.time}`, status: "Cancelled" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove booking.");
      // Remove only the selected visit, including all its daily segments.
      const keep = (entry: ScheduleEntry) => removingEntry.bookingId ? entry.bookingId !== removingEntry.bookingId : entry.id !== removingEntry.id;
      setEntries((prev) => prev.filter(keep));
      setOriginalEntries((prev) => prev.filter(keep));
      setSelectedId(null);
      setRemovingEntry(null);
      showToast("Booking removed and its time released.", true);
      onBookingsChanged?.();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Could not remove booking.");
    } finally { setRemoving(false); }
  };

  return (
    <div className="relative isolate flex flex-col h-full overflow-y-auto bg-slate-50">
      <div className="sticky top-0 z-30 shrink-0 bg-white shadow-sm" data-testid="schedule-toolbar">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-3 py-2 flex items-center gap-1.5 flex-wrap shrink-0">
        {header}
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
          <button type="button" onClick={() => setDatePickerOpen((open) => !open)} aria-expanded={datePickerOpen} aria-label="Choose schedule date" className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-blue-50">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">
              {new Date(`${currentDate}T00:00:00`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>

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

        <button type="button" disabled={dayCount >= MAX_PLANNING_DAYS || loading || routeSaving} onClick={() => changeVisibleDates(addPlanningDate(visibleDates, offsetPlanningDate(endDate, 1)))} title={`Show ${fmtDate(offsetPlanningDate(endDate, 1))}`} className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40 cursor-pointer"><Plus className="w-3.5 h-3.5" />Add next day</button>

        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Today
        </button>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <AutoPlanRouteButton disabled={loading || routeSaving || !!loadError} onBeforePlan={discardChanges} onSaved={(date) => {
            if (visibleDates.length === 1 && currentDate === date) void load();
            else setVisibleDates([date]);
            setMapDate(date);
            onBookingsChanged?.();
            showToast("Today’s round trip saved, including the return to base.", true);
          }} />
          <button type="button" aria-pressed={showUnassigned} onClick={() => { setShowUnassigned((show) => !show); setSelectedPlanningLeadId(null); }} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            {showUnassigned ? "Hide" : "Show"} unassigned leads ({unassignedLeads.length})
          </button>
          {/* Optimize Route */}
          <button
            onClick={optimizeRoute}
            disabled={loading || routeSaving || !!loadError || entries.length < 2}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Route className="w-3.5 h-3.5" />
            Optimize shown days
          </button>

          {/* Refresh */}
          <button
            onClick={() => { if (discardChanges()) void load(); }}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-1 shrink-0">
        {visibleDates.map((date, dayIndex) => <div key={date} className="inline-flex items-center rounded-lg border bg-white" style={{ borderColor: planningDayColor(dayIndex) }}>
          <button type="button" onClick={() => setMapDate(date)} aria-pressed={activeMapDate === date} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold cursor-pointer" style={{ color: planningDayColor(dayIndex), backgroundColor: activeMapDate === date ? `color-mix(in srgb, ${planningDayColor(dayIndex)} 10%, white)` : undefined }}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planningDayColor(dayIndex) }} />{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</button>
          {dayCount > 1 && <button type="button" aria-label={`Remove ${date} from view`} onClick={() => changeVisibleDates(visibleDates.filter((day) => day !== date))} className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>}
        </div>)}
        <span className="ml-auto text-[10px] text-slate-500">{dayCount} {dayCount === 1 ? "day" : "days"} shown</span>
        {showUnassigned && <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer"><input type="checkbox" checked={showUnassignedOnMap} onChange={(event) => setShowUnassignedOnMap(event.target.checked)} />Show unassigned on map</label>}
      </div>
      </div>

      {loadError && <div role="alert" className="mx-3 mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{loadError} Use Refresh to try again.</div>}

      {/* ── Main Body ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 items-start px-3 pt-2 gap-2.5 shrink-0 ${showUnassigned ? "xl:grid-cols-[220px_minmax(280px,340px)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]"}`}>

        {showUnassigned && <div className="max-h-[280px] xl:max-h-none xl:h-[clamp(300px,calc(100dvh-330px),680px)] min-w-0 rounded-xl border border-amber-200 bg-white flex flex-col overflow-hidden">
          <div className="shrink-0 border-b border-amber-100 bg-amber-50 p-2 space-y-1.5">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Unassigned leads</h3><span className="text-xs font-bold text-amber-700">{unassignedLeads.length}</span></div>
            <div className="flex gap-1">
              {(["all", "inspection", "job"] as const).map((type) => <button key={type} type="button" onClick={() => setPlanningFilter(type)} aria-pressed={planningFilter === type} className={`rounded-lg px-2 py-1 text-[10px] font-semibold cursor-pointer ${planningFilter === type ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}>{type === "all" ? "All" : type === "inspection" ? "Inspections" : "Jobs"}</button>)}
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"><Search className="w-3.5 h-3.5 text-slate-400" /><input aria-label="Search unassigned leads" placeholder="Search name or address" value={planningSearch} onChange={(event) => setPlanningSearch(event.target.value)} className="min-w-0 w-full text-xs outline-none" /></label>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
            {visiblePlanningLeads.map(({ lead, type }) => <button key={`${lead.id}:${type}`} type="button" draggable={!loading && !routeSaving} onDragStart={(event) => startDrag(event, { kind: "unassigned", leadId: lead.id, type })} onDragEnd={endDrag} onClick={() => selectPlanningLead(lead.id)} aria-pressed={selectedPlanningLeadId === lead.id} className={`w-full text-left rounded-lg border p-2 space-y-0.5 cursor-pointer ${selectedPlanningLeadId === lead.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-900 truncate">{lead.name || "Customer"}</span><TypeBadge type={type} /></div>
              <p className="text-[10px] font-semibold text-slate-500">{lead.status}</p>
              <p className="text-[11px] text-slate-600">{lead.address || lead.city || "Address needed to show on map"}</p>
              <p className="flex items-center gap-1 text-[10px] text-slate-400"><GripVertical className="w-3 h-3" />Drag into a day to book</p>
              {selectedPlanningLeadId === lead.id && <p className="text-[10px] font-bold text-violet-700">Selected for planning</p>}
            </button>)}
            {!visiblePlanningLeads.length && <p className="p-4 text-center text-xs text-slate-400">No unassigned leads match these filters.</p>}
          </div>
        </div>}
        {/* Days remain in one vertical list while the map stays visible. */}
        <div data-testid="schedule-day-stack" className="min-w-0 h-[clamp(300px,calc(100dvh-330px),680px)] overflow-y-auto space-y-3 pr-1 pb-2" onDragOver={(event) => {
          if (!dragItem.current) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientY < bounds.top + 60) event.currentTarget.scrollTop -= 16;
          else if (event.clientY > bounds.bottom - 60) event.currentTarget.scrollTop += 16;
        }}>
          <p className="text-[11px] text-slate-500 px-1">Drag a lead into a day to book, or move a booking to another day. Review and confirm before saving.</p>
          {visibleDates.map((date, dayIndex) => {
            const dayEntries = entries.filter((entry) => entry.date === date);
            return (
              <div key={date} data-schedule-date={date} onDragOver={(event) => {
                if (!dragItem.current || loading || routeSaving) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropDate(date);
              }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDate(null); }} onDrop={(event) => dropBooking(event, date)} className={`rounded-xl shadow-xs border bg-white transition-shadow ${dropDate === date ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"}`}>

                <div className="px-3 py-2 border-b bg-white shrink-0" style={{ borderTop: `4px solid ${planningDayColor(dayIndex)}` }}>
                  <p className="text-xs font-bold" style={{ color: planningDayColor(dayIndex) }}>{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long" })}</p>
                  <p className="text-[10px] mt-0.5 text-slate-600">{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · {dayEntries.length} bookings</p>
                  <button type="button" onClick={() => setMapDate(date)} className="text-[10px] font-semibold text-blue-600 mt-1 cursor-pointer">{activeMapDate === date ? "Booking day selected" : "Use for new booking"}</button>
                </div>
                {loading ? <div className="flex-1 flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div> : <JobListPanel
                  entries={dayEntries}
                  selectedId={selectedId}
                  onSelect={selectBooking}
                  onDragStart={startDrag}
                  onDragEnd={endDrag}
                  onDropBooking={dropBooking}
                  color={planningDayColor(dayIndex)}
                  disabled={routeSaving || !!loadError}
                  onReschedule={entry => { if (discardChanges()) setEditBookingEntry(entry); }}
                  onRemove={openRemove}
                  onAddBooking={() => { setBookingPreset(selectedPlanningLead ? { leadId: selectedPlanningLead.lead.id, type: selectedPlanningLead.type } : undefined); setBookingTime(suggestTime(selectedPlanningLead?.type || "inspection", date, undefined, selectedPlanningLead?.lead.id)); setBookingDate(date); }}
                  dateStr={date}
                />}
                {!loading && <div className={`m-2 rounded-lg border border-dashed p-2 text-center text-[11px] ${dragging ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"}`}>{"Drop a lead or booking here · Confirm date and time before saving"}</div>}
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="min-w-0 h-[clamp(300px,calc(100dvh-330px),680px)] rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col">
          {selectedPlanningLead && <div className="shrink-0 border-b border-violet-200 bg-violet-50 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-violet-700">Selected for {selectedPlanningLead.type === "inspection" ? "inspection" : "job"}</p><p className="text-sm font-bold text-slate-900">{selectedPlanningLead.lead.name || "Customer"}</p></div><button type="button" onClick={() => setSelectedPlanningLeadId(null)} aria-label="Clear selected lead" className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button></div>
            <p className="text-xs text-slate-600">{selectedPlanningLead.lead.address || selectedPlanningLead.lead.city || "Add an address to place this lead on the map."}</p>
            <p className="text-[11px] text-slate-600">Plan for {fmtDate(activeMapDate)}. Select a date to compare existing bookings.</p>
            <div className="flex gap-2"><button type="button" onClick={bookPlanningLead} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 cursor-pointer">Book this lead</button><button type="button" onClick={() => onOpenLead(selectedPlanningLead.lead.id)} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">View details</button></div>
          </div>}
          <div className="flex shrink-0 flex-wrap gap-3 border-b border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-600">
            {mapTypeFilter !== "job" && <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Inspections</span>}
            {mapTypeFilter !== "inspection" && <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Jobs</span>}
            <span className="font-semibold">All {dayCount} selected {dayCount === 1 ? "day" : "days"} on map</span>
            {visibleDates.map((date, index) => <span key={date} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planningDayColor(index) }} />{new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>)}
            {showUnassigned && showUnassignedOnMap && <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-slate-400" />Unassigned</span>}
          </div>
          <div className="flex-1 min-h-0">
          <RouteMapPanel
            mapItems={mapItems}
            mapTypeFilter={mapTypeFilter}
            onMapTypeFilterChange={setMapTypeFilter}
            selectedLeadId={selectedPlanningLead?.lead.id || selectedEntry?.leadId || null}
            selectedItemId={selectedPlanningLead ? null : selectedId}
            onSelectItem={selectBooking}
            onSelectLead={(id) => {
              if (showUnassigned && showUnassignedOnMap && unassignedLeads.some(({ lead }) => lead.id === id)) selectPlanningLead(id);
              else selectBooking(entries.find((entry) => entry.leadId === id)?.id || null);
            }}
          />
          </div>
        </div>

        {/* Selected booking sidebar */}
        {selectedEntry && (
          <div className="col-span-full rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col bg-white">
            <SelectedBookingSidebar
              entry={selectedEntry}
              index={entries.filter((entry) => entry.date === selectedEntry.date).findIndex((entry) => entry.id === selectedId)}
              total={entries.filter((entry) => entry.date === selectedEntry.date).length}
              onClose={() => setSelectedId(null)}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onMoveToAnotherDay={() => openReschedule(selectedEntry)}
              onRemoveFromRoute={() => openRemove(selectedEntry)}
              onUpdateRoute={previewSave}
              hasChanges={hasChanges}
              onViewDetails={() => onOpenLead(selectedEntry.leadId)}
            />
          </div>
        )}
      </div>

      {/* ── Route Timeline ─────────────────────────────────────────────────── */}
      <div className="shrink-0 mx-3 mt-2 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <RouteTimeline
          entries={mapEntries}
          selectedId={selectedId}
          onSelect={selectBooking}
          dateStr={activeMapDate}
          onEdit={entry => { if (discardChanges()) setEditBookingEntry(entry); }}
          onReorder={(from, to) => handleReorder(entries.indexOf(mapEntries[from]), entries.indexOf(mapEntries[to]))}
        />
      </div>

      {/* ── Footer Summary ─────────────────────────────────────────────────── */}
      <div className="shrink-0 mx-3 mb-2 mt-2 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <RouteSummaryFooter
          entries={entries}
          originalEntries={originalEntries}
          hasChanges={hasChanges}
          onPreviewSave={previewSave}
        />
      </div>

      {bookingDate && <AddBookingDialog leads={leads} initialDate={bookingDate} initialBooking={bookingPreset} initialTime={bookingTime} onBeforeSave={() => !routeSaving && discardChanges()} onClose={() => { setBookingDate(null); onBookingRequestHandled?.(); }} onSaved={(date) => {
        setBookingDate(null);
        setSelectedPlanningLeadId(null);
        onBookingRequestHandled?.();
        showToast("Booking saved successfully!", true);
        setMapDate(date);
        if (visibleDates.includes(date)) void load();
        else setCurrentDate(date);
        onBookingsChanged?.();
      }} />}

      {pendingReorder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="reorder-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <h3 id="reorder-title" className="text-sm font-bold text-slate-900">Confirm stop order</h3>
          <p className="mt-3 text-xs text-slate-600">Move <strong>{entries.find((entry) => entry.id === pendingReorder.fromId)?.customer?.name || "this booking"}</strong> to stop {entries.filter((entry) => entry.date === entries.find((stop) => stop.id === pendingReorder.toId)?.date).findIndex((entry) => entry.id === pendingReorder.toId) + 1}?</p>
          <p className="mt-2 text-xs text-slate-500">Booking times stay the same. Review and save the route to keep the new driving order.</p>
          <div className="mt-4 flex justify-end gap-2"><button type="button" autoFocus onClick={() => setPendingReorder(null)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Cancel</button><button type="button" onClick={confirmReorder} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer">Confirm order</button></div>
        </div>
      </div>}

      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="route-preview-title" className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b p-4"><h3 id="route-preview-title" className="text-sm font-bold text-slate-900">Review route changes</h3><button type="button" aria-label="Close route preview" disabled={routeSaving} onClick={() => setPreviewOpen(false)} className="p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button></div>
          <div className="p-4 space-y-3 overflow-y-auto text-xs">
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">This saves the planned driving order. Customer booking times stay as shown. Reschedule individual bookings if the driving order requires different times.</p>
            {visibleDates.map((date) => <div key={date}><p className="font-bold text-slate-800 mb-2">{fmtDate(date)}</p><ol className="space-y-1.5">{entries.filter((entry) => entry.date === date).map((entry, index) => <li key={entry.id} className="rounded-lg bg-slate-50 p-2 text-slate-700">{index + 1}. {entry.customer?.name || "Customer"} · {formatSlotRange(entry.time, entry.durationMinutes)}<span className="block text-slate-500 mt-1">{entry.customer?.address || "No address"}</span></li>)}</ol></div>)}
            {saveError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-700">{saveError}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t p-4"><button type="button" disabled={routeSaving} onClick={() => setPreviewOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Back</button><button type="button" disabled={routeSaving} onClick={() => void saveRoute()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer">{routeSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{routeSaving ? "Saving…" : "Save Route Order"}</button></div>
        </div>
      </div>}
      {removingEntry && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="remove-booking-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
          <h3 id="remove-booking-title" className="text-sm font-bold text-slate-900">Remove booking?</h3>
          <p className="text-xs text-slate-600">Remove the {removingEntry.type} for {removingEntry.customer?.name || "this customer"} on {fmtDate(removingEntry.date)} at {formatSlotRange(removingEntry.time, removingEntry.durationMinutes)}? This clears the appointment and releases its time for another customer.</p>
          {removeError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{removeError}</p>}
          <div className="flex justify-end gap-2"><button type="button" disabled={removing} onClick={() => setRemovingEntry(null)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer">Keep Booking</button><button type="button" disabled={removing} onClick={() => void removeFromRoute()} className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer">{removing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{removing ? "Removing…" : "Remove Booking"}</button></div>
        </div>
      </div>}

      {editBookingEntry && <EditBookingModal key={editBookingEntry.id}
        lead={(() => {
          const lead = leads.find(lead => lead.id === editBookingEntry.leadId) || { id: editBookingEntry.leadId, name: editBookingEntry.customer?.name, address: editBookingEntry.customer?.address } as Lead;
          const booking = leadBookings(lead).find(b => editBookingEntry.bookingId ? b.bookingId === editBookingEntry.bookingId : b.type === editBookingEntry.type && `${b.date}T${b.time}` === `${editBookingEntry.date}T${editBookingEntry.time}`);
          return booking ? bookingLead(lead, booking) : lead;
        })()}
        type={editBookingEntry.type} initialDate={editBookingEntry.date} initialTime={editBookingEntry.time}
        onClose={() => setEditBookingEntry(null)}
        onSaved={(date, message) => { setEditBookingEntry(null); showToast(message, true); void load(); onBookingsChanged?.(); }} />}

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
