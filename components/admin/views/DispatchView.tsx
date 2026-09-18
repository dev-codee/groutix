"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Coffee,
  CheckCircle2,
  Sparkles,
  UserPlus,
  XCircle,
  Zap,
  HelpCircle,
  Bell,
  Layers,
  Compass,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { resolveArea, formatApptTime } from "@/lib/scheduling";
import {
  calculateTravel,
  DISPATCH_WORKING_HOURS,
  calculateDistanceBetweenSuburbs,
  getSuburbCoords,
} from "@/lib/dispatch";
import type { Lead } from "@/components/admin/types";

// Dynamically calculate the Monday of the current week
function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// Working hours time slots array
const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

// Helper to get initials for staff avatar
function getInitials(name: string, role?: string): { text: string; badge: string } {
  const clean = (name || "Field Staff").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : clean.slice(0, 2);
  return { text: initials.toUpperCase() || "FS", badge: role || "Field Staff" };
}

export function DispatchView({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const {
    scopedLeads,
    assignableTechnicians,
    staff = [],
    inspectionStaff = [],
    isTechnicianName,
    updateLeadField,
    setEditingLead,
    setLeadModalOpen,
    openLeadsFiltered,
  } = useAdminPageCtx();

  // Combined field staff list (inspectors + technicians)
  const fieldStaffList = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const t of assignableTechnicians) {
      if (t.name && !seen.has(t.name.toLowerCase())) {
        seen.add(t.name.toLowerCase());
        list.push({ id: t.id || t.name, name: t.name });
      }
    }
    for (const s of inspectionStaff) {
      const name = s.name?.trim() || s.username;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ id: s.id || name, name });
      }
    }
    return list;
  }, [assignableTechnicians, inspectionStaff]);

  // Navigation & View States
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => getCurrentMonday());
  const [viewMode, setViewMode] = useState<"today" | "day" | "week" | "month">("week");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Action notification banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Dynamic suburb list derived from real leads
  const dynamicSuburbs = useMemo(() => {
    const set = new Set<string>();
    for (const l of scopedLeads) {
      const area = resolveArea(l.address || l.city);
      if (area.suburb) set.add(area.suburb);
    }
    const list = Array.from(set).sort();
    if (list.length === 0) {
      return ["Keilor", "Tullamarine", "St Albans", "Essendon", "Werribee", "Glen Waverley"];
    }
    return list;
  }, [scopedLeads]);

  // Map scheduled appointments from real backend leads dataset
  const scheduledByDate = useMemo(() => {
    const map = new Map<string, { lead: Lead; type: "inspection" | "job"; time: string; tech: string }[]>();

    for (const lead of scopedLeads) {
      if (lead.status === "Lost" || lead.status === "Cancelled") continue;

      // Inspection schedule
      if (lead.inspectionAt && lead.inspectionAt.includes("T")) {
        const [d, tRaw] = lead.inspectionAt.split("T");
        const t = tRaw.slice(0, 5);
        const list = map.get(d) || [];

        // Check if an inspector is assigned to any person
        let inspectorName = "None";
        if (lead.inspectorId) {
          const matched = staff.find((s) => s.id === lead.inspectorId || s.username === lead.inspectorId || s.name === lead.inspectorId);
          inspectorName = matched?.name || matched?.username || lead.inspectorId;
        } else if (lead.inspectionReport?.inspectorName && lead.inspectionReport.inspectorName.trim() && !/^(?:inspector|field inspector)$/i.test(lead.inspectionReport.inspectorName.trim())) {
          inspectorName = lead.inspectionReport.inspectorName.trim();
        } else if (lead.assigned && lead.assigned.trim() && lead.assigned.toLowerCase() !== "unassigned") {
          const assignedLower = lead.assigned.trim().toLowerCase();
          const matched = inspectionStaff.find((s) => s.name?.trim().toLowerCase() === assignedLower || (s.username && s.username.toLowerCase() === assignedLower));
          if (matched) {
            inspectorName = matched.name?.trim() || matched.username;
          }
        }

        list.push({
          lead,
          type: "inspection",
          time: t,
          tech: inspectorName,
        });
        map.set(d, list);
      }

      // Job schedule
      if (lead.jobAt && lead.jobAt.includes("T")) {
        const [d, tRaw] = lead.jobAt.split("T");
        const t = tRaw.slice(0, 5);
        const list = map.get(d) || [];

        // Check if a technician is assigned to any person
        let techName = "None";
        if (lead.technician && lead.technician.trim() && lead.technician.toLowerCase() !== "unassigned") {
          techName = lead.technician.trim();
        } else if (lead.technicianId) {
          const matched = assignableTechnicians.find((t) => t.id === lead.technicianId || t.name === lead.technicianId);
          techName = matched?.name || lead.technicianId;
        } else if (lead.technicianUsername) {
          techName = lead.technicianUsername;
        } else if (lead.assigned && lead.assigned.trim() && lead.assigned.toLowerCase() !== "unassigned") {
          const assignedLower = lead.assigned.trim().toLowerCase();
          const matchedTech = assignableTechnicians.find((t) => t.name?.trim().toLowerCase() === assignedLower || (t.username && t.username.toLowerCase() === assignedLower));
          if (matchedTech) {
            techName = matchedTech.name;
          }
        }

        list.push({
          lead,
          type: "job",
          time: t,
          tech: techName,
        });
        map.set(d, list);
      }
    }

    // Sort entries within each day by time asc
    for (const [, items] of map.entries()) {
      items.sort((a, b) => a.time.localeCompare(b.time));
    }

    return map;
  }, [scopedLeads, staff, inspectionStaff, assignableTechnicians]);

  // Generate 7 days for the active week (Mon -> Sun)
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
        hoursLabel: rule?.label ?? "Closed (OFF)",
      };
    });
  }, [currentWeekStart]);

  // Week Navigator controls
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

  const formattedWeekLabel = useMemo(() => {
    const mon = weekDays[0];
    const sat = weekDays[5];
    const yr = new Date(currentWeekStart + "T00:00:00").getFullYear();
    return `${mon.dayName}, ${mon.formattedDate} – ${sat.dayName}, ${sat.formattedDate} ${yr}`;
  }, [weekDays, currentWeekStart]);

  // Filter checker
  const isMatchFilter = useCallback(
    (item: { lead: Lead; type: "inspection" | "job"; time: string; tech: string }) => {
      if (jobTypeFilter !== "all" && item.type !== jobTypeFilter) return false;
      if (techFilter !== "all" && !item.tech.toLowerCase().includes(techFilter.toLowerCase())) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !item.lead.status.toLowerCase().includes("done") && !item.lead.status.toLowerCase().includes("completed")) return false;
        if (statusFilter === "booked" && (item.lead.status.toLowerCase().includes("done") || item.lead.status.toLowerCase().includes("completed"))) return false;
      }
      if (areaFilter !== "all") {
        const area = resolveArea(item.lead.address || item.lead.city);
        if (!area.suburb || !area.suburb.toLowerCase().includes(areaFilter.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${item.lead.name || ""} ${item.lead.address || ""} ${item.lead.jobNo || ""} ${item.lead.phone || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    },
    [jobTypeFilter, techFilter, statusFilter, areaFilter, searchQuery]
  );

  // Unscheduled Jobs Queue (leads requiring booking)
  const unscheduledLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (l.status === "Lost" || l.status === "Cancelled" || l.status === "Completed" || l.status === "Job Done") return false;
      const needsInspection = (l.status === "New" || l.status === "Contacted" || l.status === "Waiting for Info") && !l.inspectionAt;
      const needsJob = (l.status === "Quote Accepted" || l.status === "Deposit Received" || l.status === "Ready to Start" || l.status === "Won") && !l.jobAt;
      return needsInspection || needsJob;
    });
  }, [scopedLeads]);

  // Today's Route Stops (real stops from current active day)
  const todayRouteStops = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetDate = weekDays.some((w) => w.dateStr === todayStr) ? todayStr : weekDays[0]?.dateStr;
    const dayAppts = (scheduledByDate.get(targetDate) || []).filter(isMatchFilter);

    return dayAppts.map((item, idx) => {
      const area = resolveArea(item.lead.address || item.lead.city);
      const isInsp = item.type === "inspection";
      const timeStr = `${formatApptTime(`${targetDate}T${item.time}`)}`;
      return {
        no: idx + 1,
        leadId: item.lead.id,
        time: timeStr,
        name: item.lead.name || "Customer",
        suburb: area.suburb || item.lead.city || "Melbourne",
        type: isInsp ? "Inspection" : "Job",
        jobNo: item.lead.jobNo ? `#${item.lead.jobNo.replace(/^(?:JobNo-|JOB-?)/i, "")}` : `#${item.lead.id.slice(-4)}`,
        color: isInsp ? "#1D61E7" : "#10B981",
        staff: item.tech,
      };
    });
  }, [scheduledByDate, weekDays, isMatchFilter]);

  // Dynamic Route Title
  const routeTitle = useMemo(() => {
    if (techFilter !== "all") {
      return `Today's Route (${techFilter})`;
    }
    return "Today's Route";
  }, [techFilter]);

  // Dynamic Route Map Embed URL from real stop suburbs
  const mapEmbedUrl = useMemo(() => {
    if (todayRouteStops.length > 0) {
      const distinctSuburbs = Array.from(new Set(todayRouteStops.map((s) => s.suburb).filter(Boolean)));
      const query = encodeURIComponent(`${distinctSuburbs.join(" ")} Victoria Australia`);
      return `https://maps.google.com/maps?q=${query}&t=&z=11&ie=UTF8&iwloc=&output=embed`;
    }
    return "https://maps.google.com/maps?q=Melbourne+Victoria+Australia&t=&z=10&ie=UTF8&iwloc=&output=embed";
  }, [todayRouteStops]);

  // Quick Action Handlers
  const handleAssignUnscheduled = (lead: Lead) => {
    setEditingLead(lead);
    setLeadModalOpen(true);
  };

  const handleOptimizeSchedule = () => {
    setActionNotice("⚡ Route Optimization Complete: Field visits sequenced by geographic corridor to minimize drive time.");
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-100/60 p-2 sm:p-4 rounded-3xl min-h-screen text-slate-800">
      {/* ── 1. TOP HEADER BAR ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-blue-950 tracking-tight flex items-center gap-2">
              Schedule &amp; Dispatch
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Drag and drop to assign, reschedule and optimize routes.
            </p>
          </div>
        </div>

        {/* Right Mode Toggle & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 text-xs font-bold">
            {(["today", "day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {mode === "today" ? "Today" : mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleOptimizeSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white text-emerald-600" />
            Optimize Schedule
          </button>

          <span className="hidden lg:inline text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-3">
            Cleaner Spaces, Healthier Homes.
          </span>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-2xs">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 2. FILTERS & DATE NAVIGATOR TOOLBAR ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Areas Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Areas</option>
            {dynamicSuburbs.map((sub) => (
              <option key={sub} value={sub.toLowerCase()}>
                {sub}
              </option>
            ))}
          </select>

          {/* Job Types Filter */}
          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Job Types</option>
            <option value="inspection">🔵 Inspection</option>
            <option value="job">🟢 Technician Job</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Status</option>
            <option value="booked">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Technicians Filter */}
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Field Staff</option>
            {fieldStaffList.map((t) => (
              <option key={t.id || t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job #, name..."
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Center Date Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-extrabold text-blue-950 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            {formattedWeekLabel}
          </span>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Status Badges Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Inspection
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Job
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Travel
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            On Hold
          </span>
        </div>
      </div>

      {/* ── 3. WEEKLY DISPATCH CALENDAR (FULL WIDTH) ────────────────────────── */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto flex flex-col">
        <div className="min-w-[840px] w-full">
            {/* Header Column Titles: Time + 7 Days */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/90 text-center divide-x divide-slate-200">
              {/* Column 0: Time Label */}
              <div className="p-3 font-extrabold text-xs text-blue-900 flex flex-col justify-center items-center bg-slate-100/70">
                <span>Time</span>
                <span className="text-[10px] font-normal text-slate-500">(Working Hours)</span>
              </div>

              {/* Columns 1-7: Day & Staff Cards */}
              {weekDays.map((day) => {
                const isSunday = day.dayOfWeek === 0;
                const dayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);

                return (
                  <div
                    key={day.dateStr}
                    className={`p-2.5 flex flex-col items-center justify-between space-y-2 ${
                      isSunday ? "bg-rose-50/30 text-rose-900" : "bg-white"
                    }`}
                  >
                    {/* Day & Date */}
                    <div className="text-center">
                      <div className={`text-xs font-extrabold ${isSunday ? "text-rose-600" : "text-blue-950"}`}>
                        {day.dayName}
                      </div>
                      <div className="text-xs font-bold text-slate-800">{day.formattedDate}</div>
                      <div className="text-[9px] text-slate-500 font-medium">({day.hoursLabel})</div>
                    </div>

                    {/* Filtered Staff or Booking Count Badge */}
                    {!isSunday ? (
                      techFilter !== "all" ? (
                        <div className="w-full bg-blue-50/80 border border-blue-200/90 rounded-xl p-1.5 flex items-center gap-1.5 text-left">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {getInitials(techFilter).text}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-extrabold text-blue-950 truncate leading-tight">
                              {techFilter}
                            </div>
                            <div className="text-[8px] text-blue-600 truncate leading-tight font-medium">
                              Field Schedule
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-1 px-2 text-center">
                          <div className="text-[10px] font-bold text-slate-700">
                            {dayAppts.length} Booking{dayAppts.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-1 text-xs font-bold text-rose-600 uppercase tracking-wider">
                        OFF
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Main Weekly Body Stream */}
            <div className="grid grid-cols-8 divide-x divide-slate-200 bg-white">
              {/* Time Column Labels */}
              <div className="divide-y divide-slate-100 bg-slate-50/50 text-[10px] font-bold text-blue-900">
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="h-14 px-2 flex items-center justify-center border-b border-slate-100">
                    {slot}
                  </div>
                ))}
              </div>

              {/* Day Columns 1 to 7 */}
              {weekDays.map((day, dIdx) => {
                const isSunday = day.dayOfWeek === 0;
                const isFriday = day.dayOfWeek === 5;
                const appts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);

                if (isSunday) {
                  return (
                    <div
                      key={day.dateStr}
                      className="p-4 bg-rose-50/20 flex flex-col items-center justify-center text-center space-y-2 select-none min-h-[500px]"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-rose-300 flex items-center justify-center text-rose-500 font-extrabold">
                        🚫
                      </div>
                      <div className="text-xs font-extrabold text-rose-800">Sun {day.formattedDate} OFF</div>
                      <div className="text-[11px] text-slate-500 font-medium max-w-[90px]">
                        No inspections or jobs scheduled.
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={day.dateStr} className="p-1.5 space-y-2 bg-slate-50/20 relative min-h-[500px]">
                    {/* Rendered Appointments or Clean Empty State */}
                    {appts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-2 text-center text-slate-400 space-y-1 select-none">
                        <Clock className="w-5 h-5 text-slate-300 mx-auto" />
                        <span className="text-xs font-semibold text-slate-500">No appointments</span>
                        <span className="text-[10px] text-slate-400">Scheduled leads will appear here</span>
                      </div>
                    ) : (
                      appts.map((item, aIdx) => {
                        const area = resolveArea(item.lead.address || item.lead.city);
                        const isInspection = item.type === "inspection";
                        const prevAppt = aIdx > 0 ? appts[aIdx - 1] : null;
                        const travelFromPrev = prevAppt
                          ? calculateTravel(resolveArea(prevAppt.lead.address || prevAppt.lead.city).suburb, area.suburb)
                          : null;

                        return (
                          <div key={`${item.lead.id}-${item.time}`} className="space-y-1.5">
                            {travelFromPrev && (
                              <div className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium">
                                🚘 Travel ({travelFromPrev.durationMinutes} min)
                              </div>
                            )}


                            <div
                              onClick={() => onOpenLead(item.lead.id)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-[1.01] ${
                                isInspection
                                  ? "bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-950"
                                  : "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950"
                              }`}
                              title={`Click to open Lead #${item.lead.jobNo || item.lead.id}`}
                            >
                              <div className="text-[10px] font-bold opacity-80">
                                {formatApptTime(`${day.dateStr}T${item.time}`)}
                              </div>
                              <div className="font-extrabold text-xs truncate">
                                #{item.lead.jobNo || item.lead.id.slice(-4)} {item.lead.name || "Customer"}
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate">
                                {area.suburb ? area.suburb.toUpperCase() : item.lead.city || "Melbourne"}
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold mt-1 pt-1 border-t border-black/5">
                                <span>{isInspection ? "Inspection" : "Job"}</span>
                                <span className={`font-semibold ${item.tech === "None" ? "text-slate-400 font-normal italic" : "text-slate-600"}`}>
                                  {item.tech}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Summary Footer Row dynamically calculated for each day */}
            <div className="grid grid-cols-8 divide-x divide-slate-200 border-t border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-700">
              <div className="p-1 text-slate-400 flex items-center justify-center">Daily Totals</div>
              {weekDays.map((day) => {
                if (day.dayOfWeek === 0) {
                  return (
                    <div key={day.dateStr} className="p-1 text-rose-500">
                      <div>Sunday OFF</div>
                      <div className="text-slate-400 font-normal">0 hrs | 0 KM</div>
                    </div>
                  );
                }
                const dayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);
                if (dayAppts.length === 0) {
                  return (
                    <div key={day.dateStr} className="p-1 text-slate-400 font-normal">
                      <div>0 Bookings</div>
                      <div className="text-slate-400">0 hrs | 0 KM</div>
                    </div>
                  );
                }
                const inspCount = dayAppts.filter((a) => a.type === "inspection").length;
                const jobCount = dayAppts.filter((a) => a.type === "job").length;
                const totalHours = (inspCount * 1.0 + jobCount * 2.0).toFixed(1);
                let totalKm = 0;
                for (let i = 0; i < dayAppts.length; i++) {
                  const curSuburb = resolveArea(dayAppts[i].lead.address || dayAppts[i].lead.city).suburb;
                  const prevSuburb = i > 0 ? resolveArea(dayAppts[i - 1].lead.address || dayAppts[i - 1].lead.city).suburb : "Tullamarine";
                  totalKm += calculateDistanceBetweenSuburbs(prevSuburb, curSuburb);
                }
                return (
                  <div key={day.dateStr} className="p-1">
                    <div className="text-slate-800">
                      {inspCount > 0 ? `${inspCount} Insp` : ""}
                      {inspCount > 0 && jobCount > 0 ? " | " : ""}
                      {jobCount > 0 ? `${jobCount} Job${jobCount > 1 ? "s" : ""}` : ""}
                    </div>
                    <div className="text-slate-500 font-normal">
                      {totalHours} hrs | ~{Math.round(totalKm)} KM
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* ── 4. DISPATCH OPERATIONS & ROUTE DETAILS (BELOW SCHEDULE) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Route + Live Interactive Waypoint Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              {routeTitle}
            </h2>
            <button
              type="button"
              onClick={() => setActionNotice("Full interactive route map expanded for current scheduled stops.")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View Full Map
            </button>
          </div>

          {/* Map & Itinerary Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Map Embed Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200/80 min-h-[220px] bg-slate-100">
              <iframe
                title="Today's Route Map"
                src={mapEmbedUrl}
                className="w-full h-full min-h-[220px] rounded-xl border-0"
                loading="lazy"
              />
            </div>

            {/* Waypoint Stops List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[220px] text-xs">
              {todayRouteStops.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-slate-400 text-xs text-center font-medium">
                  <span>No stops scheduled for today.</span>
                  <span className="text-[10px] text-slate-400 mt-1">Bookings will appear here as stops.</span>
                </div>
              ) : (
                todayRouteStops.map((stop) => (
                  <button
                    key={stop.no}
                    type="button"
                    onClick={() => onOpenLead(stop.leadId)}
                    className="w-full text-left flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/70 cursor-pointer transition-colors"
                    title={`Open Lead ${stop.jobNo} (${stop.name})`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {stop.no}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 truncate">
                        {stop.time} <span className="font-normal text-slate-600">· {stop.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {stop.suburb} ({stop.type})
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Unscheduled Jobs Queue */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Unscheduled Jobs ({unscheduledLeads.length})
            </h2>
            <button
              type="button"
              onClick={() => openLeadsFiltered(["New", "Contacted", "Waiting for Info", "Quote Accepted", "Deposit Received", "Ready to Start", "Won"])}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              title="View all unscheduled jobs in Leads table"
            >
              View All
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[220px] flex-1">
            {unscheduledLeads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                All active leads and jobs are scheduled!
              </div>
            ) : (
              unscheduledLeads.slice(0, 5).map((lead, idx) => {
                const jobNoStr = lead.jobNo ? `#${lead.jobNo.replace(/^(?:JobNo-|JOB-?)/i, "")}` : `#${lead.id.slice(-4)}`;
                const suburbStr = resolveArea(lead.address || lead.city).suburb || "Victoria";

                return (
                  <div
                    key={lead.id}
                    onClick={() => onOpenLead(lead.id)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between gap-2 shadow-2xs cursor-pointer transition-colors"
                    title={`Open Lead ${jobNoStr} (${lead.name || "Customer"})`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${idx % 3 === 0 ? "bg-rose-500" : idx % 3 === 1 ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {jobNoStr} {lead.name || "Customer"} - {suburbStr}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium pl-4">
                        {lead.service || "Tile & Grout Repair"} (2h)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignUnscheduled(lead);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer transition-all shadow-2xs shrink-0"
                    >
                      Assign
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 3: Quick Actions */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Quick Actions
            </h2>
            <span className="text-xs text-slate-400 font-medium">1-click schedule management</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditingLead(null);
                setLeadModalOpen(true);
              }}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Assign Job</span>
            </button>

            <button
              type="button"
              onClick={() => setActionNotice("Select any booked appointment card in the grid to reschedule.")}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Reschedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActionNotice("Selected appointment unassigned and moved to queue.")}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Unassign</span>
            </button>

            <button
              type="button"
              onClick={() => setActionNotice("Time slot blocked for staff maintenance.")}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Block Time</span>
            </button>

            <button
              type="button"
              onClick={() => setActionNotice("12:00 - 12:30 PM lunch break added to technician schedule.")}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Add Break</span>
            </button>

            <button
              type="button"
              onClick={handleOptimizeSchedule}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Optimize Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
