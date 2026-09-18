"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Truck,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Navigation,
  Coffee,
  Calendar,
  Layers,
  Wrench,
  Check,
  Compass,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import {
  resolveArea,
  formatApptTime,
  MIN_BOOKING_DATE,
  ZONE_LABEL,
} from "@/lib/scheduling";
import {
  getTimelineSlots,
  calculateTravel,
  calculateDistanceBetweenSuburbs,
  DISPATCH_WORKING_HOURS,
  LUNCH_BREAK,
  suggestBestDispatchSlots,
  type DispatchSlot,
} from "@/lib/dispatch";
import type { Lead } from "@/components/admin/types";

// Base starting Monday (28 Sep 2026)
const DEFAULT_START_DATE = "2026-09-28";

const CORRIDOR_OPTIONS = [
  { value: "all", label: "All Corridors" },
  { value: "inner", label: "Inner 15km (Tullamarine HQ)" },
  { value: "mon_lower1", label: "Monday: Brunswick → St Kilda → Brighton" },
  { value: "tue_lower2", label: "Tuesday: Richmond → Hawthorn → Kew" },
  { value: "wed_lower3", label: "Wednesday: Ringwood → Croydon → Lilydale" },
  { value: "thu_northeast", label: "Thursday: Bundoora → Greensborough" },
  { value: "fri_north", label: "Friday: Craigieburn → Mickleham" },
  { value: "sat_melton", label: "Saturday: Melton → Sunbury → Caroline Springs" },
];

export function DispatchView({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const { scopedLeads, assignableTechnicians, updateLeadField } = useAdminPageCtx();

  // Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(DEFAULT_START_DATE);
  const [viewMode, setViewMode] = useState<"week" | "day" | "today">("week");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); // 0 = Mon, 6 = Sun
  const [activeTab, setActiveTab] = useState<"route" | "pending" | "actions">("pending");

  // Filter State
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<"all" | "inspection" | "job">("all");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slot recommendation state for pending lead
  const [recommendingLeadId, setRecommendingLeadId] = useState<string | null>(null);
  const [slotSuggestions, setSlotSuggestions] = useState<DispatchSlot[]>([]);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  // Generate array of 7 days for current week (Mon -> Sun)
  const weekDays = useMemo(() => {
    const start = new Date(currentWeekStart + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ...
      const rule = DISPATCH_WORKING_HOURS[dayOfWeek];
      return {
        dateStr: iso,
        dayOfWeek,
        dayName: d.toLocaleDateString("en-AU", { weekday: "short" }),
        formattedDate: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        isOpen: rule?.isOpen ?? true,
        hoursLabel: rule?.label ?? "Closed",
      };
    });
  }, [currentWeekStart]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d.toISOString().slice(0, 10));
  };

  const handleResetToDefault = () => {
    setCurrentWeekStart(DEFAULT_START_DATE);
    setSelectedDayIndex(0);
  };

  // Build scheduled appointments per date
  const scheduledByDate = useMemo(() => {
    const map = new Map<string, { lead: Lead; type: "inspection" | "job"; time: string; tech: string }[]>();

    for (const lead of scopedLeads) {
      if (lead.status === "Lost" || lead.status === "Cancelled") continue;

      // Check Inspection
      if (lead.inspectionAt && lead.inspectionAt.includes("T")) {
        const [d, tRaw] = lead.inspectionAt.split("T");
        const t = tRaw.slice(0, 5);
        const list = map.get(d) || [];
        list.push({
          lead,
          type: "inspection",
          time: t,
          tech: lead.assigned || "Rizwan",
        });
        map.set(d, list);
      }

      // Check Job
      if (lead.jobAt && lead.jobAt.includes("T")) {
        const [d, tRaw] = lead.jobAt.split("T");
        const t = tRaw.slice(0, 5);
        const list = map.get(d) || [];
        list.push({
          lead,
          type: "job",
          time: t,
          tech: lead.technician || lead.assigned || "Tech 1",
        });
        map.set(d, list);
      }
    }

    // Sort entries within each day by time asc
    for (const [key, items] of map.entries()) {
      items.sort((a, b) => a.time.localeCompare(b.time));
    }

    return map;
  }, [scopedLeads]);

  // Filtered appointments checker
  const isMatchFilter = useCallback(
    (item: { lead: Lead; type: "inspection" | "job"; time: string; tech: string }) => {
      if (selectedJobType !== "all" && item.type !== selectedJobType) return false;
      if (
        selectedTechnician !== "all" &&
        !item.tech.toLowerCase().includes(selectedTechnician.toLowerCase())
      ) {
        return false;
      }
      if (selectedStatus !== "all") {
        if (selectedStatus === "completed" && !item.lead.status.toLowerCase().includes("done")) {
          return false;
        }
        if (selectedStatus === "booked" && item.lead.status.toLowerCase().includes("done")) {
          return false;
        }
      }
      if (selectedCorridor !== "all") {
        const area = resolveArea(item.lead.address || item.lead.city);
        if (area.zone !== selectedCorridor && !(selectedCorridor === "inner" && area.inner)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.lead.name || ""} ${item.lead.address || ""} ${item.lead.jobNo || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    },
    [selectedJobType, selectedTechnician, selectedStatus, selectedCorridor, searchQuery]
  );

  // Unscheduled / Pending Leads Queue
  const pendingLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (l.status === "Lost" || l.status === "Cancelled" || l.status === "Completed") return false;
      const needsInspection =
        (l.status === "New" || l.status === "Contacted" || l.status === "Waiting for Info") &&
        !l.inspectionAt;
      const needsJob =
        (l.status === "Quote Accepted" ||
          l.status === "Deposit Received" ||
          l.status === "Ready to Start") &&
        !l.jobAt;
      return needsInspection || needsJob;
    });
  }, [scopedLeads]);

  // Handle smart slot recommendation
  const handleOpenSmartRecommend = (lead: Lead) => {
    setRecommendingLeadId(lead.id);
    const isJob = lead.status.includes("Accepted") || lead.status.includes("Deposit");
    const type: "inspection" | "job" = isJob ? "job" : "inspection";

    const suggestions = suggestBestDispatchSlots({
      lead,
      type,
      existingBookings: [],
      allLeads: scopedLeads,
      availableStaff: assignableTechnicians,
      maxSuggestions: 3,
    });
    setSlotSuggestions(suggestions);
    setActiveTab("pending");
  };

  // Lock suggested slot
  const handleLockSlot = async (lead: Lead, slot: DispatchSlot) => {
    setBookingInProgress(lead.id);
    try {
      const isJob = lead.status.includes("Accepted") || lead.status.includes("Deposit");
      const apptString = `${slot.date}T${slot.time}`;

      if (isJob) {
        await updateLeadField(lead.id, {
          jobAt: apptString,
          technician: slot.technician,
          technicianId: slot.technicianId,
          status: "Job Booked",
        });
      } else {
        await updateLeadField(lead.id, {
          inspectionAt: apptString,
          assigned: slot.technician,
          status: "Inspection Booked",
        });
      }

      setRecommendingLeadId(null);
      setSlotSuggestions([]);
    } catch (err) {
      console.error("Lock slot error:", err);
    } finally {
      setBookingInProgress(null);
    }
  };

  // Selected Day Details for Route Sequence Tab
  const selectedDayInfo = weekDays[selectedDayIndex] || weekDays[0];
  const selectedDayAppointments = useMemo(() => {
    const raw = scheduledByDate.get(selectedDayInfo.dateStr) || [];
    return raw.filter(isMatchFilter);
  }, [scheduledByDate, selectedDayInfo, isMatchFilter]);

  // Route calculation for the selected day
  const routeStops = useMemo(() => {
    let currentSuburb = "tullamarine";
    let cumulativeKm = 0;
    let cumulativeMins = 0;

    const stops = selectedDayAppointments.map((appt, idx) => {
      const area = resolveArea(appt.lead.address || appt.lead.city);
      const targetSuburb = area.suburb || "Inner Melb";
      const travel = calculateTravel(currentSuburb, targetSuburb);
      cumulativeKm += travel.distanceKm;
      cumulativeMins += travel.durationMinutes;
      currentSuburb = targetSuburb;

      return {
        stopNo: idx + 1,
        time: appt.time,
        type: appt.type,
        lead: appt.lead,
        suburb: targetSuburb,
        corridor: area.label,
        travelFromPrev: travel,
        technician: appt.tech,
      };
    });

    return {
      stops,
      totalStops: stops.length,
      totalKm: Math.round(cumulativeKm * 10) / 10,
      totalTravelMinutes: cumulativeMins,
    };
  }, [selectedDayAppointments]);

  return (
    <div className="space-y-4 pb-12">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-5 text-white shadow-md border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Groutix Smart Dispatch System
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-400" />
              Schedule &amp; Dispatch
            </h1>
            <p className="text-xs text-slate-300 font-normal mt-0.5 max-w-xl">
              Smart route optimization, corridor zoning, travel buffering, and technician assignment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Week Switcher */}
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/15">
              <button
                type="button"
                onClick={handlePrevWeek}
                title="Previous Week"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-white tabular-nums">
                {weekDays[0]?.formattedDate} – {weekDays[5]?.formattedDate} 2026
              </span>
              <button
                type="button"
                onClick={handleNextWeek}
                title="Next Week"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to 28 Sep 2026 */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              28 Sep 2026
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Toolbar ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
          {/* Corridor Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              {CORRIDOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Types (Inspections &amp; Jobs)</option>
              <option value="inspection">🔵 Inspections (Rizwan)</option>
              <option value="job">🟢 Jobs (Tech 1, Tech 2, Rizwan)</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Technicians</option>
              <option value="Rizwan">Rizwan (Inspector/Tech)</option>
              <option value="Tech 1">Tech 1</option>
              <option value="Tech 2">Tech 2</option>
              {assignableTechnicians
                .filter((t) => !["rizwan", "tech 1", "tech 2"].includes(t.name.toLowerCase()))
                .map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, client..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-blue-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
            Inspection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            Job
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-100" />
            Lunch Break
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200" />
            Travel
          </span>
        </div>
      </div>

      {/* ── Main Layout: Calendar Grid (Left) + Dispatch Assistant Panel (Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Weekly Dispatch Calendar Grid */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Day Headers Bar */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center divide-x divide-slate-200">
            {weekDays.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              const isSunday = day.dayOfWeek === 0;
              const dayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/90 border-b-2 border-b-blue-600"
                      : isSunday
                      ? "bg-slate-100/60 opacity-60"
                      : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? "text-blue-700" : isSunday ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-slate-800">{day.formattedDate}</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {day.hoursLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timeline View / Columns */}
          <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[560px] bg-slate-50/30">
            {weekDays.map((day, dIdx) => {
              const isSunday = day.dayOfWeek === 0;
              const isFriday = day.dayOfWeek === 5;
              const isSelected = selectedDayIndex === dIdx;
              const appts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);

              if (isSunday) {
                return (
                  <div
                    key={day.dateStr}
                    className="p-4 flex flex-col items-center justify-center text-center bg-slate-100/50 space-y-2 select-none"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-slate-200/80 flex items-center justify-center text-slate-400 font-bold">
                      OFF
                    </div>
                    <p className="text-xs font-bold text-slate-500">Sunday Closed</p>
                    <p className="text-[10px] text-slate-400">No appointments scheduled</p>
                  </div>
                );
              }

              return (
                <div
                  key={day.dateStr}
                  className={`p-2 space-y-2.5 transition-colors ${
                    isSelected ? "bg-blue-50/20" : ""
                  }`}
                >
                  {/* Working Hours Badge */}
                  <div className="text-[10px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 rounded-lg px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {day.hoursLabel}
                    </span>
                  </div>

                  {/* Appointments & Travel Stream */}
                  {appts.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs">
                      <CalendarDays className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
                      No bookings
                    </div>
                  ) : (
                    appts.map((item, aIdx) => {
                      const area = resolveArea(item.lead.address || item.lead.city);
                      const isInspection = item.type === "inspection";
                      const prevAppt = aIdx > 0 ? appts[aIdx - 1] : null;
                      const travelFromPrev = prevAppt
                        ? calculateTravel(
                            resolveArea(prevAppt.lead.address || prevAppt.lead.city).suburb,
                            area.suburb
                          )
                        : null;

                      // Check if lunch break falls before or after this appointment
                      const isAfterNoon = item.time >= "12:30";
                      const showBreakBefore =
                        isAfterNoon && (aIdx === 0 || (prevAppt && prevAppt.time < "12:00"));

                      return (
                        <div key={`${item.lead.id}-${item.time}`} className="space-y-2">
                          {/* Travel Indicator */}
                          {travelFromPrev && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/90 border border-slate-200/70 text-[10px] text-slate-600 font-medium">
                              <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">🚗 Travel: {travelFromPrev.label}</span>
                            </div>
                          )}

                          {/* Lunch Break Indicator if appropriate */}
                          {showBreakBefore && (
                            <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                              <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>12:00 – 12:30 PM (Break)</span>
                            </div>
                          )}

                          {/* Appointment Card */}
                          <div
                            onClick={() => onOpenLead(item.lead.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs group relative ${
                              isInspection
                                ? "bg-blue-50/70 hover:bg-blue-100/80 border-blue-200 text-blue-950"
                                : "bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  isInspection
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {isInspection ? "INS" : "JOB"}
                              </span>
                              <span className="text-[10px] font-bold tabular-nums text-slate-700 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/50">
                                {formatApptTime(`${day.dateStr}T${item.time}`)}
                              </span>
                            </div>

                            <div className="font-bold text-xs leading-tight line-clamp-1 group-hover:text-blue-600">
                              {item.lead.name || "Customer"}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {area.suburb ? area.suburb.toUpperCase() : item.lead.city || "Melbourne"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mt-2 pt-1.5 border-t border-slate-200/40">
                              <span className="truncate">👤 {item.tech}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200/60 font-mono">
                                {item.lead.jobNo || `GX-${item.lead.id.slice(-4)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Friday early finish hatch pattern */}
                  {isFriday && (
                    <div className="mt-4 p-2 rounded-xl bg-slate-100/60 border border-dashed border-slate-300 text-center text-[10px] text-slate-500">
                      🔒 3:00 PM Friday Close
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Route Summary Footers */}
          <div className="grid grid-cols-7 divide-x divide-slate-200 border-t border-slate-200 bg-white p-2 text-center text-[10px] font-semibold text-slate-600">
            {weekDays.map((day) => {
              if (day.dayOfWeek === 0) {
                return (
                  <div key={day.dateStr} className="p-1 text-slate-400">
                    Closed
                  </div>
                );
              }
              const appts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);
              const totalHours = appts.length * 1;
              const totalKm = appts.length * 14;

              return (
                <div key={day.dateStr} className="p-1">
                  <div className="font-bold text-slate-800">{appts.length} Stops</div>
                  <div className="text-[9px] text-slate-400 font-normal">
                    ~{totalHours}h work · ~{totalKm}km
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel: Route Map & Pending Dispatch Assistant ── */}
        <div className="xl:col-span-4 space-y-4">
          {/* Tab Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Pending Queue ({pendingLeads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("route")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "route"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Route Map ({routeStops.totalStops})
            </button>
          </div>

          {/* TAB 1: PENDING DISPATCH QUEUE */}
          {activeTab === "pending" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Pending Dispatch Queue
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Leads requiring smart slot assignment and technician booking.
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {pendingLeads.length} unscheduled
                </span>
              </div>

              {pendingLeads.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  All active leads have been dispatched and locked!
                </div>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {pendingLeads.map((lead) => {
                    const area = resolveArea(lead.address || lead.city);
                    const isJob =
                      lead.status.includes("Accepted") || lead.status.includes("Deposit");
                    const typeLabel = isJob ? "JOB DISPATCH" : "INSPECTION DISPATCH";
                    const isRecommending = recommendingLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isJob ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {typeLabel}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 mt-1">
                              {lead.name || "Customer Lead"}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenLead(lead.id)}
                            className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            View Lead
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.address || "Address pending"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-700">{area.label}</span>
                          </div>
                          {lead.service && (
                            <div className="flex items-center gap-1.5 text-slate-500 truncate">
                              <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.service}</span>
                            </div>
                          )}
                        </div>

                        {/* Recommendation Action / Suggestions */}
                        {isRecommending ? (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between text-[11px] font-bold text-blue-700">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Optimal Recommended Slots:
                              </span>
                              <button
                                type="button"
                                onClick={() => setRecommendingLeadId(null)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                Close
                              </button>
                            </div>

                            {slotSuggestions.length === 0 ? (
                              <p className="text-[11px] text-slate-500">
                                Scanning schedule... No vacant slots match this corridor right now.
                              </p>
                            ) : (
                              slotSuggestions.map((slot, sIdx) => (
                                <div
                                  key={`${slot.date}-${slot.time}-${slot.technician}`}
                                  className="p-2.5 rounded-lg bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                                        Slot {sIdx + 1}
                                      </span>
                                      <span className="text-xs font-extrabold text-blue-900">
                                        {slot.dayOfWeek}, {slot.date.slice(5)} @ {slot.time}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-0.5">
                                      👤 {slot.technician} · {slot.travelEstimate?.label}
                                    </p>
                                    <p className="text-[9px] text-emerald-700 font-medium">
                                      ✓ {slot.reasons[0]}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={bookingInProgress === lead.id}
                                    onClick={() => handleLockSlot(lead, slot)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer shrink-0"
                                  >
                                    {bookingInProgress === lead.id ? "Locking…" : "🔒 Lock Slot"}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSmartRecommend(lead)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Smart Slot Fit &amp; Assign
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUTE MAP & CORRIDOR SEQUENCE */}
          {activeTab === "route" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    {selectedDayInfo.dayName}, {selectedDayInfo.formattedDate} Route Sequence
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Optimal vehicle dispatch order from Tullamarine HQ.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-blue-600 tabular-nums">
                    ~{routeStops.totalKm} km
                  </div>
                  <div className="text-[10px] text-slate-400">Total Driving</div>
                </div>
              </div>

              {/* Sequence Timeline */}
              <div className="space-y-3 pt-2">
                {/* Starting Depot */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    HQ
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800">Tullamarine Dispatch Center</div>
                    <div className="text-[10px] text-slate-500">Depart 8:30 AM · Base Operations</div>
                  </div>
                </div>

                {routeStops.stops.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No stops scheduled for {selectedDayInfo.dayName}.
                  </div>
                ) : (
                  routeStops.stops.map((stop) => (
                    <div key={stop.stopNo} className="space-y-2">
                      {/* Driving connection line */}
                      <div className="ml-3.5 pl-4 border-l-2 border-dashed border-blue-400/40 text-[10px] text-slate-500 py-1 flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>🚗 Drive: {stop.travelFromPrev.label}</span>
                      </div>

                      {/* Stop Card */}
                      <div
                        onClick={() => onOpenLead(stop.lead.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white ${
                            stop.type === "inspection" ? "bg-blue-600" : "bg-emerald-600"
                          }`}
                        >
                          {stop.stopNo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {stop.lead.name || "Customer"}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 tabular-nums">
                              {formatApptTime(`${selectedDayInfo.dateStr}T${stop.time}`)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{stop.lead.address}</div>
                          <div className="flex items-center gap-2 text-[9px] font-medium text-slate-400 mt-1">
                            <span>Corridor: {stop.corridor}</span>
                            <span>·</span>
                            <span>👤 {stop.technician}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Return Depot */}
                {routeStops.stops.length > 0 && (
                  <>
                    <div className="ml-3.5 pl-4 border-l-2 border-dashed border-blue-400/40 text-[10px] text-slate-500 py-1 flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>🚗 Return to Tullamarine HQ (~18 min)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black text-xs">
                        HQ
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800">Tullamarine Operations Return</div>
                        <div className="text-[10px] text-slate-500">End of shift vehicle inspection</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
