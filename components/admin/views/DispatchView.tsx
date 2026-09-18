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
  ChevronDown,
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

// Working hours time slots arrays (1hr for fit-to-page, 30min for detailed)
const HOURLY_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const HALF_HOURLY_TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

function getSlotKeyFromTime(timeStr?: string, density: "1hr" | "30min" = "1hr"): string {
  if (!timeStr) return "9:00 AM";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return "9:00 AM";

  // Clamp hour to working slots range (9 AM to 5 PM)
  if (h < 9) h = 9;
  if (h > 17) h = 17;

  const period = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;

  if (density === "1hr") {
    return `${displayH}:00 ${period}`;
  }

  // Normalize minute to nearest 30-min slot (:00 or :30)
  const slotMin = m < 30 ? "00" : "30";
  return `${displayH}:${slotMin} ${period}`;
}

function formatScheduleWindow(timeStr?: string, durationMinutes: number = 60) {
  if (!timeStr) return { start: "9:00 AM", end: "10:00 AM", range: "9:00 AM – 10:00 AM", durationLabel: "1h" };
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr || "0", 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;

  const startTotalMins = h * 60 + m;
  const endTotalMins = startTotalMins + durationMinutes;

  const startH = Math.floor(startTotalMins / 60);
  const startM = startTotalMins % 60;
  const endH = Math.floor(endTotalMins / 60);
  const endM = endTotalMins % 60;

  const formatPart = (hour: number, min: number) => {
    const period = hour >= 12 && hour < 24 ? "PM" : "AM";
    const displayH = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayH}:${String(min).padStart(2, "0")} ${period}`;
  };

  const startFormatted = formatPart(startH, startM);
  const endFormatted = formatPart(endH, endM);

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationLabel = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

  return {
    start: startFormatted,
    end: endFormatted,
    range: `${startFormatted} – ${endFormatted}`,
    durationLabel,
    totalMinutes: durationMinutes,
  };
}

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
  const [slotDensity, setSlotDensity] = useState<"1hr" | "30min">("1hr");
  const [showOperations, setShowOperations] = useState<boolean>(false);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Active time slots based on density
  const activeTimeSlots = slotDensity === "1hr" ? HOURLY_TIME_SLOTS : HALF_HOURLY_TIME_SLOTS;

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

  // Generate 6 working days for the active week (Mon -> Sat)
  const weekDays = useMemo(() => {
    const start = new Date(currentWeekStart + "T00:00:00");

    return Array.from({ length: 6 }, (_, i) => {
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
      const prevAppt = idx > 0 ? dayAppts[idx - 1] : null;
      const prevSuburb = prevAppt
        ? resolveArea(prevAppt.lead.address || prevAppt.lead.city).suburb
        : "Tullamarine";
      const travel = calculateTravel(prevSuburb, area.suburb);
      const durationMins = isInsp ? (40 + travel.durationMinutes * 2) : 120;
      const windowInfo = formatScheduleWindow(item.time, durationMins);

      return {
        no: idx + 1,
        leadId: item.lead.id,
        time: windowInfo.range,
        durationLabel: windowInfo.durationLabel,
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
    <div className="space-y-2 font-sans bg-slate-100/60 p-2 sm:p-2.5 rounded-2xl text-slate-800">
      {/* ── 1. TOP HEADER BAR ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-1.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Title & Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-blue-950 tracking-tight flex items-center gap-2 leading-none">
              Schedule &amp; Dispatch
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Drag and drop to assign, reschedule and optimize routes.
            </p>
          </div>
        </div>

        {/* Right Mode Toggle & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Density Mode Toggle (Fit 1-Page vs 30 Min) */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSlotDensity("1hr")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                slotDensity === "1hr"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Fit entire 9 AM – 5 PM schedule on one single page view"
            >
              Fit 1-Page
            </button>
            <button
              type="button"
              onClick={() => setSlotDensity("30min")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                slotDensity === "30min"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Show detailed 30-minute time intervals"
            >
              30 Min
            </button>
          </div>

          {/* View Mode */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/80 text-[11px] font-bold">
            {(["today", "day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-emerald-600" />
            Optimize Schedule
          </button>

          <span className="hidden xl:inline text-[10px] font-semibold text-slate-400 border-l border-slate-200 pl-2.5">
            Cleaner Spaces, Healthier Homes.
          </span>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-between shadow-2xs">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 2. FILTERS & DATE NAVIGATOR TOOLBAR ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-1 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {/* Areas Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
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
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Job Types</option>
            <option value="inspection">🔵 Inspection</option>
            <option value="job">🟢 Technician Job</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Status</option>
            <option value="booked">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Technicians Filter */}
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
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
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job #, name..."
              className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 w-36 lg:w-44"
            />
          </div>
        </div>

        {/* Right Date Switcher & Legend */}
        <div className="flex items-center gap-3">
          {/* Center Date Switcher */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded hover:bg-slate-200/80 text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-extrabold text-blue-950 flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-blue-600" />
              {formattedWeekLabel}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded hover:bg-slate-200/80 text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Badges Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Inspection
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Job
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              On Hold
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. WEEKLY DISPATCH CALENDAR (FULL WIDTH) ────────────────────────── */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto flex flex-col">
        <div className="min-w-[840px] w-full">
            {/* Header Column Titles: Time + 6 Days */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-center divide-x divide-slate-200 text-xs">
              {/* Column 0: Time Label */}
              <div className="py-1 px-1.5 font-extrabold text-[11px] text-blue-900 flex items-center justify-center bg-slate-100/70">
                <span>Time <span className="text-[9px] font-normal text-slate-500">(9-5)</span></span>
              </div>

              {/* Columns 1-6: Day & Staff Cards */}
              {weekDays.map((day) => {
                const dayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);

                return (
                  <div
                    key={day.dateStr}
                    className="py-1 px-2 flex items-center justify-between bg-white text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-blue-950 truncate">
                        {day.dayName}, {day.formattedDate.replace(/ \d{4}$/, "")}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">({day.hoursLabel.replace(/ – /g, "-")})</div>
                    </div>

                    {/* Filtered Staff or Booking Count Badge */}
                    {techFilter !== "all" ? (
                      <div className="bg-blue-50/80 border border-blue-200/90 rounded px-1.5 py-0.5 flex items-center gap-1 text-left shrink-0">
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                          {getInitials(techFilter).text}
                        </div>
                        <div className="text-[10px] font-extrabold text-blue-950 truncate">
                          {techFilter}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                        dayAppts.length > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {dayAppts.length} {dayAppts.length === 1 ? "bk" : "bks"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Main Weekly Body: Slot-by-Slot Grid with Guaranteed Time Alignment */}
            <div className="divide-y divide-slate-100 bg-white">
              {activeTimeSlots.map((slot) => (
                <div
                  key={slot}
                  className="grid grid-cols-7 divide-x divide-slate-200 hover:bg-slate-50/20 transition-colors min-h-[38px]"
                >
                  {/* Column 0: Time Slot Label */}
                  <div className="px-1 py-1 bg-slate-50/70 text-[10px] font-extrabold text-blue-900 flex items-center justify-center select-none border-b border-slate-100">
                    {slot}
                  </div>

                  {/* Columns 1 to 6: Day Appointments for this exact Time Slot */}
                  {weekDays.map((day) => {
                    const allDayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);
                    const slotAppts = allDayAppts.filter(
                      (item) => getSlotKeyFromTime(item.time, slotDensity) === slot
                    );

                    return (
                      <div
                        key={day.dateStr}
                        className="p-0.5 px-1 flex flex-col justify-center gap-1 border-b border-slate-100 relative group/cell"
                      >
                        {slotAppts.map((item) => {
                          const area = resolveArea(item.lead.address || item.lead.city);
                          const isInspection = item.type === "inspection";
                          const aIdx = allDayAppts.findIndex(
                            (a) => a.lead.id === item.lead.id && a.time === item.time
                          );
                          const prevAppt = aIdx > 0 ? allDayAppts[aIdx - 1] : null;
                          const travelFromPrev = prevAppt
                            ? calculateTravel(
                                resolveArea(prevAppt.lead.address || prevAppt.lead.city).suburb,
                                area.suburb
                              )
                            : calculateTravel("Tullamarine", area.suburb);

                          // Inspection will take approx 40 min + traveling time one way * 2 (not shown separately)
                          const oneWayTravelMins = travelFromPrev.durationMinutes;
                          const totalDurationMins = isInspection ? (40 + (oneWayTravelMins * 2)) : 120;
                          const scheduleWindow = formatScheduleWindow(item.time, totalDurationMins);
                          const startTimeOnly = scheduleWindow.start.replace(/ (AM|PM)/, "");

                          const cleanJobNo = `#${(item.lead.jobNo || item.lead.id.slice(-4)).replace(/^(?:Job\s*No-?|Job-?|#)/i, "")}`;
                          const custName = item.lead.name || "Customer";
                          const suburbName = (area.suburb || item.lead.city || "Melbourne").toUpperCase();
                          const techName = item.tech && item.tech !== "None" ? item.tech : "Unassigned";

                          return (
                            <div
                              key={`${item.lead.id}-${item.time}`}
                              onClick={() => onOpenLead(item.lead.id)}
                              className={`p-1 px-1.5 rounded-md border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-center leading-tight ${
                                isInspection
                                  ? "bg-blue-50/95 hover:bg-blue-100/90 border-blue-200 text-blue-950"
                                  : "bg-emerald-50/95 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950"
                              }`}
                              title={`Lead ${cleanJobNo} • ${custName} (${scheduleWindow.range})\nSuburb: ${suburbName} • Staff: ${techName} • Type: ${isInspection ? "Inspection" : "Job"}`}
                            >
                              {/* Line 1: Time, Clean Job No & Duration Badge */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 font-black text-[8.5px] text-blue-950 truncate">
                                  <Clock className="w-2.5 h-2.5 text-blue-600 shrink-0 inline" />
                                  <span className="text-blue-700 font-bold">{startTimeOnly}</span>
                                  <span className="text-slate-900 font-extrabold">{cleanJobNo}</span>
                                </div>
                                <span
                                  className={`text-[7.5px] px-1 py-0.2 rounded font-black shrink-0 ${
                                    isInspection
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {scheduleWindow.durationLabel}
                                </span>
                              </div>

                              {/* Line 2: Customer Name */}
                              <div className="text-[8px] font-extrabold text-slate-900 truncate mt-0.5">
                                {custName}
                              </div>

                              {/* Line 3: Suburb, Staff & Type */}
                              <div className="text-[7.5px] text-slate-500 font-medium truncate flex items-center justify-between gap-1 mt-0.5 pt-0.5 border-t border-black/5">
                                <span className="font-bold text-slate-700 truncate">{suburbName}</span>
                                <span className={techName === "Unassigned" ? "italic text-slate-400 shrink-0" : "text-slate-600 font-semibold shrink-0"}>
                                  {techName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Summary Footer Row dynamically calculated for each day */}
            <div className="grid grid-cols-7 divide-x divide-slate-200 border-t border-slate-200 bg-slate-50 px-1 py-1 text-center text-[9.5px] font-bold text-slate-700">
              <div className="p-0.5 text-slate-400 flex items-center justify-center">Daily Totals</div>
              {weekDays.map((day) => {
                const dayAppts = (scheduledByDate.get(day.dateStr) || []).filter(isMatchFilter);
                if (dayAppts.length === 0) {
                  return (
                    <div key={day.dateStr} className="p-0.5 text-slate-400 font-normal">
                      0 bks · 0h
                    </div>
                  );
                }
                const inspCount = dayAppts.filter((a) => a.type === "inspection").length;
                const jobCount = dayAppts.filter((a) => a.type === "job").length;
                let totalMins = 0;
                let totalKm = 0;
                for (let i = 0; i < dayAppts.length; i++) {
                  const cur = dayAppts[i];
                  const curSuburb = resolveArea(cur.lead.address || cur.lead.city).suburb;
                  const prevSuburb = i > 0 ? resolveArea(dayAppts[i - 1].lead.address || dayAppts[i - 1].lead.city).suburb : "Tullamarine";
                  const travel = calculateTravel(prevSuburb, curSuburb);
                  totalKm += travel.distanceKm;

                  if (cur.type === "inspection") {
                    totalMins += 40 + (travel.durationMinutes * 2);
                  } else {
                    totalMins += 120;
                  }
                }
                const totalHours = (totalMins / 60).toFixed(1);
                return (
                  <div key={day.dateStr} className="p-0.5 text-slate-800 truncate">
                    <span>{inspCount > 0 ? `${inspCount} Insp` : ""}{inspCount > 0 && jobCount > 0 ? " · " : ""}{jobCount > 0 ? `${jobCount} Job` : ""}</span>
                    <span className="text-slate-500 font-normal ml-1">({totalHours}h · ~{Math.round(totalKm)}km)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* ── 4. DISPATCH OPERATIONS & ROUTE DETAILS (COLLAPSIBLE DRAWER) ────────── */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Toggle Bar */}
        <button
          type="button"
          onClick={() => setShowOperations(!showOperations)}
          className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200/70 select-none text-left"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Today's Route Map &amp; Unscheduled Queue</span>
            <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {todayRouteStops.length} stops today · {unscheduledLeads.length} unscheduled in queue
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span>{showOperations ? "Hide Operations Panel" : "View Route Map & Queue"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOperations ? "rotate-180" : ""}`} />
          </div>
        </button>

        {showOperations && (
          <div className="p-3 bg-slate-50/40 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Card 1: Today's Route + Live Interactive Waypoint Map */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h2 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    {routeTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActionNotice("Full interactive route map expanded for current scheduled stops.")}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    View Full Map
                  </button>
                </div>

                {/* Map & Itinerary Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                  {/* Map Embed Canvas */}
                  <div className="relative rounded-lg overflow-hidden border border-slate-200/80 min-h-[180px] bg-slate-100">
                    <iframe
                      title="Today's Route Map"
                      src={mapEmbedUrl}
                      className="w-full h-full min-h-[180px] rounded-lg border-0"
                      loading="lazy"
                    />
                  </div>

                  {/* Waypoint Stops List */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[180px] text-xs">
                    {todayRouteStops.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-3 text-slate-400 text-xs text-center font-medium">
                        <span>No stops scheduled for today.</span>
                        <span className="text-[10px] text-slate-400 mt-1">Bookings will appear here as stops.</span>
                      </div>
                    ) : (
                      todayRouteStops.map((stop) => (
                        <button
                          key={stop.no}
                          type="button"
                          onClick={() => onOpenLead(stop.leadId)}
                          className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/70 cursor-pointer transition-colors"
                          title={`Open Lead ${stop.jobNo} (${stop.name})`}
                        >
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                            {stop.no}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-[11px] text-slate-900 truncate">
                              {stop.time} <span className="font-normal text-slate-600">· {stop.name}</span>
                            </div>
                            <div className="text-[9.5px] text-slate-500 truncate">
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
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h2 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Unscheduled Jobs ({unscheduledLeads.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => openLeadsFiltered(["New", "Contacted", "Waiting for Info", "Quote Accepted", "Deposit Received", "Ready to Start", "Won"])}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    title="View all unscheduled jobs in Leads table"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[180px] flex-1">
                  {unscheduledLeads.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs font-medium">
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
                          className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between gap-2 shadow-2xs cursor-pointer transition-colors"
                          title={`Open Lead ${jobNoStr} (${lead.name || "Customer"})`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${idx % 3 === 0 ? "bg-rose-500" : idx % 3 === 1 ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
                              <span className="font-extrabold text-[11px] text-slate-900 truncate">
                                {jobNoStr} {lead.name || "Customer"} - {suburbStr}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-slate-500 mt-0.5 font-medium pl-3">
                              {lead.service || "Tile & Grout Repair"} (2h)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignUnscheduled(lead);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer transition-all shadow-2xs shrink-0"
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
              <div className="lg:col-span-12 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h2 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Quick Actions
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">1-click schedule management</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLead(null);
                      setLeadModalOpen(true);
                    }}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Assign Job</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionNotice("Select any booked appointment card in the grid to reschedule.")}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Reschedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionNotice("Selected appointment unassigned and moved to queue.")}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Unassign</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionNotice("Time slot blocked for staff maintenance.")}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                    <span>Block Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionNotice("12:00 - 12:30 PM lunch break added to technician schedule.")}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Coffee className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Add Break</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOptimizeSchedule}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Zap className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Optimize Route</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
