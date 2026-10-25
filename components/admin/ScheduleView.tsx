"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { RefreshCcw, Loader2, CalendarDays, ExternalLink, MapPin, Edit3, Search } from "lucide-react";

import { appointmentDurationMinutes } from "@/lib/bookingDuration";
import { formatSlotRange } from "@/lib/scheduling";
import { useBookingRules } from "@/lib/useBookingRules";
import { AutoPlanRouteButton } from "@/components/admin/AutoPlanRouteButton";
import { useTechnicians } from "@/lib/useTechnicians";
import { scheduleListDetails, scheduleDistanceLabel } from "@/lib/scheduleList";
import type { TechnicianAssignment } from "@/lib/bookingCapacity";
import { CopyableAddress } from "@/components/admin/CopyableAddress";
import { BookingMapPlanner } from "@/components/admin/BookingMapPlanner";
import { EditBookingModal } from "@/components/admin/modals/EditBookingModal";
import { bookingLead, leadBookings } from "@/lib/leadBookings";
import type { Lead } from "@/components/admin/types";

type BookingEntry = TechnicianAssignment & {
  id: string;
  bookingId?: string;
  leadId: string;
  type: "inspection" | "job";
  date: string;
  time: string;
  durationMinutes?: number;
  scheduledMinutes?: number;
  zone: string;
  suburb: string | null;
  reference: string;
  createdAt: string;
  customer: { name: string; phone: string; email: string; address: string; status: string } | null;
};

// Day-wise zones from lib/scheduling.ts, plus the legacy compass codes that older
// booking documents were stored with.
const ZONE_LABELS: Record<string, string> = {
  inner: "Daily Flex", flexible: "Greater Melb",
  mon_south_west: "South-West (Mon)", tue_south: "South (Tue)",
  wed_west: "West (Wed)", thu_north: "North (Thu)",
  fri_north_east: "North-East (Fri)", sat_east: "East (Sat)",
  sun_south_east: "South-East (Sun)",
  coastal: "Coastal (skip)", outside: "Outside area",
  N: "North", NE: "North-East", E: "East", SE: "South-East",
  S: "South", SW: "South-West", W: "West", NW: "North-West",
};

function fmtScheduleDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ScheduleView({
  onOpenLead,
  leads = [],
  onBookingsChanged,
}: {
  onOpenLead: (id: string, date?: string, action?: "view" | "reschedule", bookingId?: string) => void;
  leads?: Lead[];
  onBookingsChanged?: () => void;
}) {
  const rules = useBookingRules();
  const { technicians } = useTechnicians();
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "inspection" | "job">("all");
  const [editingBooking, setEditingBooking] = useState<BookingEntry | null>(null);
  const [plannerBooking, setPlannerBooking] = useState<BookingEntry | null>(null);
  const loadRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++loadRequest.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load bookings.");
      if (request !== loadRequest.current) return;
      setBookings(data.bookings || []);
    } catch (err) {
      if (request !== loadRequest.current) return;
      setError(err instanceof Error ? err.message : "Could not load bookings.");
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; };
  }, [load]);

  const listDetails = useMemo(() => scheduleListDetails(bookings, technicians), [bookings, technicians]);
  const filteredBookings = useMemo(() => bookings.filter((booking) =>
    (type === "all" || booking.type === type) &&
    `${booking.customer?.name || ""} ${booking.customer?.address || ""} ${booking.reference} ${booking.customer?.phone || ""} ${listDetails.get(booking.id)?.assignee || ""}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [bookings, type, search, listDetails]);

  const stopNumbers = useMemo(() => {
    const numbers = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const booking of bookings) {
      const number = (counts.get(booking.date) || 0) + 1;
      counts.set(booking.date, number);
      numbers.set(booking.id, number);
    }
    return numbers;
  }, [bookings]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookingEntry[]>();
    for (const b of filteredBookings) {
      const arr = map.get(b.date) || [];
      arr.push(b);
      map.set(b.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredBookings]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Upcoming Bookings{" "}
          {!loading && (
            <span className="text-slate-400 font-medium text-xs ml-1.5">({bookings.length})</span>
          )}
        </h2>
        <div className="flex items-center gap-3">
        <AutoPlanRouteButton disabled={loading} onSaved={() => { void load(); }} />
        <button
          onClick={load}
          disabled={loading}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 flex-1 min-w-[180px]"><Search className="w-4 h-4 text-slate-400" /><input aria-label="Search upcoming bookings" placeholder="Search customer, address or reference" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full text-xs outline-none" /></label>
        <select aria-label="Filter booking type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"><option value="all">All bookings</option><option value="inspection">Inspections</option><option value="job">Jobs</option></select>
      </div>
      <p className="text-[11px] text-slate-500">Visit order is shared with the calendar. Distances are suburb estimates from the assigned person’s previous customer that day, or Gowanbrae base for their first visit.</p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error} Use Refresh to try again.</p>}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading schedule…
        </div>
      ) : error && bookings.length === 0 ? null : filteredBookings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          {bookings.length ? "No bookings match these filters." : "No upcoming bookings. Bookings from customer self-service and admin scheduling will appear here."}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center justify-between gap-2.5 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">{fmtScheduleDate(date)}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-500 font-medium">
                    {entries.length} appointment{entries.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {entries[0] && (
                  <button
                    type="button"
                    onClick={() => onOpenLead(entries[0].leadId, date, "view", entries[0].id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" /> View Day Route Map
                  </button>
                )}
              </div>
              <div className="ml-2 border-l-2 border-blue-500/20 pl-4 space-y-2">
                {entries.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-all cursor-pointer group shadow-2xs"
                    onClick={() => onOpenLead(b.leadId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Stop {stopNumbers.get(b.id)}</span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {b.customer?.name || "Customer"}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 tabular-nums whitespace-nowrap">
                          {formatSlotRange(b.time, appointmentDurationMinutes(b, rules))}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            b.type === "inspection"
                              ? "bg-blue-50 text-blue-700 border-blue-200/60"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          }`}
                        >
                          {b.type === "inspection" ? "Inspection" : "Job"}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                        {b.customer?.address && (
                          <span className="text-[11px] min-w-0 max-w-full"><CopyableAddress address={b.customer.address} /></span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ZONE_LABELS[b.zone] || b.zone} · {b.reference}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-700">Assigned: {listDetails.get(b.id)?.assignee}</p>
                      <p className="text-[10px] text-slate-500">{scheduleDistanceLabel(listDetails.get(b.id)!)}</p>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBooking(b);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Change Booking / Reschedule"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Change Booking</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlannerBooking(b);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Plan on Map for this booking"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Plan on Map</span>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block text-slate-400">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {plannerBooking && <BookingMapPlanner key={plannerBooking.id} booking={plannerBooking} leads={leads}
        onClose={() => setPlannerBooking(null)}
        onSaved={() => { setPlannerBooking(null); void load(); onBookingsChanged?.(); }} />}
      {editingBooking && <EditBookingModal key={editingBooking.id}
        lead={(() => {
          const lead = leads.find(lead => lead.id === editingBooking.leadId)
            || { id: editingBooking.leadId, name: editingBooking.customer?.name, address: editingBooking.customer?.address } as Lead;
          const booking = leadBookings(lead).find(booking => editingBooking.bookingId
            ? booking.bookingId === editingBooking.bookingId
            : booking.type === editingBooking.type && booking.date === editingBooking.date && booking.time === editingBooking.time);
          return booking ? bookingLead(lead, booking) : lead;
        })()}
        type={editingBooking.type} initialDate={editingBooking.date} initialTime={editingBooking.time}
        onClose={() => setEditingBooking(null)}
        onSaved={() => { setEditingBooking(null); void load(); onBookingsChanged?.(); }} />}
    </div>
  );
}
