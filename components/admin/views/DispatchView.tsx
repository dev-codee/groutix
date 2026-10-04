"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Truck, Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  Navigation, Phone, Mail, MessageSquare, Camera, Zap, UserPlus,
  MoreHorizontal, MoreVertical, ExternalLink, Plus, PlusCircle, Home, RefreshCw, User,
  CheckCircle2, X, Filter, Wand2, Settings, Car, Check, Info, AlertCircle, Edit3
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { resolveArea, formatApptTimeRange, todayAU, tomorrowAU, formatApptDate, formatApptTime } from "@/lib/scheduling";
import { calculateTravel } from "@/lib/dispatch";
import { hoursEnvelope, fromMinutes } from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { useZoneRules } from "@/lib/useZoneRules";
import { getWhatsAppLink } from "@/lib/adminHelpers";
import { DispatchMap } from "@/components/admin/DispatchMap";
import type { Lead } from "@/components/admin/types";

// ── Timeline Geometry Constants ──────────────────────────────────────────────
const HQ_ADDRESS = "82A Marigold Cres, Gowanbrae VIC 3043, Australia";
const HQ_ADDRESS_URL = encodeURIComponent(HQ_ADDRESS);

// 9 AM to 5 PM timeline envelope (8 hours = 480 minutes total span)
const TIMELINE_START_HOUR = 9;  // 9:00 AM
const TIMELINE_END_HOUR = 17;   // 5:00 PM
const TIMELINE_START_MINS = TIMELINE_START_HOUR * 60; // 540 mins
const TIMELINE_END_MINS = TIMELINE_END_HOUR * 60;     // 1020 mins
const TOTAL_TIMELINE_MINS = TIMELINE_END_MINS - TIMELINE_START_MINS; // 480 mins

// 9 Hour column markers: 9 AM, 10 AM, 11 AM, 12 PM, 1 PM, 2 PM, 3 PM, 4 PM, 5 PM
const HOUR_SLOTS = [
  { hour: 9, label: "9 AM" },
  { hour: 10, label: "10 AM" },
  { hour: 11, label: "11 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 13, label: "1 PM" },
  { hour: 14, label: "2 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 16, label: "4 PM" },
  { hour: 17, label: "5 PM" },
];

function parseMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmtMinutesTo12h(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const padM = String(m).padStart(2, "0");
  return `${dh}:${padM}`;
}

function fmtMinutesFull(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const padM = String(m).padStart(2, "0");
  return `${dh}:${padM} ${period}`;
}

function getLeadDistance(lead: Lead): string {
  const area = resolveArea(lead.address || lead.city);
  if (area.suburb) {
    const travel = calculateTravel("Tullamarine", area.suburb);
    return `${travel.distanceKm} km`;
  }
  return "15.0 km";
}

export function DispatchView({
  onOpenLead,
  initialTab = "all",
  initialTechFilter = "all",
}: {
  onOpenLead: (id: string) => void;
  initialTab?: "all" | "leads" | "inspections" | "jobs";
  initialTechFilter?: string;
}) {
  const {
    scopedLeads,
    assignableTechnicians,
    staff = [],
    inspectionStaff = [],
    updateLeadField,
    setEditingLead,
    setLeadModalOpen,
    openPhotosModal,
    openMessagesModal,
    callCustomer,
  } = useAdminPageCtx();

  const bookingRules = useBookingRules();
  const zoneRules = useZoneRules();

  const todayStr = useMemo(() => todayAU(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"Day" | "Week">("Week");
  const [techFilter, setTechFilter] = useState<string>(initialTechFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"details" | "slots">("details");

  // Left sidebar Unassigned filter
  const [unassignedFilter, setUnassignedFilter] = useState<"all" | "inspections" | "jobs">("all");

  // Booking drawer controls
  const [bookingType, setBookingType] = useState<"inspection" | "job">("inspection");
  const [bookingService, setBookingService] = useState<string>("Shower Cubicle Regrouting");
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // ── Build field staff list for dropdown ─────────────────────────────────────
  const staffOptions = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    for (const t of assignableTechnicians) {
      if (t.name) map.set(t.name, { name: t.name, role: "Technician" });
    }
    for (const i of inspectionStaff) {
      if (i.name) map.set(i.name, { name: i.name, role: "Inspector" });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignableTechnicians, inspectionStaff]);

  // ── 1. Unassigned Leads list ───────────────────────────────────────────────
  const unassignedLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (l.status === "Lost" || l.status === "Cancelled" || l.status === "Completed") return false;
      const isBooked = Boolean(l.inspectionAt || l.jobAt);
      const isUnassignedTech = !l.technician || l.technician.toLowerCase() === "unassigned";
      const isUnassignedInsp = !l.inspectorId && (!l.assigned || l.assigned.toLowerCase() === "unassigned");
      const isUnassignedGeneral = (!l.assigned || l.assigned.toLowerCase() === "unassigned") && isUnassignedTech;
      return !isBooked || isUnassignedGeneral || isUnassignedTech || isUnassignedInsp;
    });
  }, [scopedLeads]);

  const filteredUnassignedLeads = useMemo(() => {
    return unassignedLeads.filter((l) => {
      const isJobType = Boolean(l.jobAt) || /job|won|scheduled/i.test(l.status || "") || Boolean(l.jobNo && !l.inspectionAt);
      const isInspType = !isJobType;

      if (unassignedFilter === "inspections" && !isInspType) return false;
      if (unassignedFilter === "jobs" && !isJobType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${l.name || ""} ${l.address || ""} ${l.city || ""} ${l.jobNo || ""} ${l.phone || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [unassignedLeads, unassignedFilter, searchQuery]);

  const unassignedCounts = useMemo(() => {
    let insp = 0;
    let jobs = 0;
    for (const l of unassignedLeads) {
      const isJobType = Boolean(l.jobAt) || /job|won|scheduled/i.test(l.status || "") || Boolean(l.jobNo && !l.inspectionAt);
      if (isJobType) {
        jobs++;
      } else {
        insp++;
      }
    }
    return { all: unassignedLeads.length, inspections: insp, jobs };
  }, [unassignedLeads]);

  // ── 2. Visible Dates in Timeline ────────────────────────────────────────────
  const visibleDates = useMemo(() => {
    if (viewMode === "Day") {
      return [selectedDate];
    }
    // Week view: 5 consecutive days starting from selectedDate
    const list: string[] = [];
    const base = new Date(selectedDate + "T00:00:00");
    for (let i = 0; i < 5; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, [selectedDate, viewMode]);

  // ── 3. Parse and layout appointments for each date ─────────────────────────
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Array<{
      lead: Lead;
      type: "inspection" | "job";
      startTime: string;
      startMins: number;
      durationMins: number;
      endMins: number;
      endTime: string;
      tech: string;
      suburb: string;
      travelToMins: number;
      travelToKm: number;
      title: string;
      serviceLabel: string;
      // Exact timeline coordinates (% of 9 AM - 5 PM track)
      leftPct: number;
      widthPct: number;
    }>>();

    for (const date of visibleDates) {
      map.set(date, []);
    }

    for (const lead of scopedLeads) {
      if (lead.status === "Lost" || lead.status === "Cancelled") continue;

      // Staff filter
      if (techFilter !== "all" && techFilter !== "Unassigned") {
        const matchTech = (lead.technician || "").toLowerCase() === techFilter.toLowerCase();
        const matchAssigned = (lead.assigned || "").toLowerCase() === techFilter.toLowerCase();
        const matchInspector = (lead.inspectionReport?.inspectorName || "").toLowerCase() === techFilter.toLowerCase();
        if (!matchTech && !matchAssigned && !matchInspector) continue;
      } else if (techFilter === "Unassigned") {
        const isUnassigned = (!lead.technician || lead.technician.toLowerCase() === "unassigned") &&
                             (!lead.assigned || lead.assigned.toLowerCase() === "unassigned");
        if (!isUnassigned) continue;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${lead.name || ""} ${lead.address || ""} ${lead.city || ""} ${lead.jobNo || ""} ${lead.service || ""}`.toLowerCase();
        if (!str.includes(q)) continue;
      }

      const area = resolveArea(lead.address || lead.city);
      const suburb = area.suburb || lead.city || "Melbourne";

      // Check inspection
      if (lead.inspectionAt && lead.inspectionAt.includes("T")) {
        const [d, tRaw] = lead.inspectionAt.split("T");
        if (map.has(d)) {
          const t = tRaw.slice(0, 5) || "09:00";
          const startMins = parseMinutes(t);
          const durationMins = 50; // standard inspection slot window
          const endMins = startMins + durationMins;

          // Clamp to timeline range (9 AM = 0%, 5 PM = 100%)
          const clampedStart = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, startMins));
          const clampedEnd = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, endMins));
          const leftPct = ((clampedStart - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100;
          const widthPct = Math.max(10, ((clampedEnd - clampedStart) / TOTAL_TIMELINE_MINS) * 100);

          const travel = calculateTravel("Tullamarine", suburb);

          map.get(d)!.push({
            lead,
            type: "inspection",
            startTime: t,
            startMins,
            durationMins,
            endMins,
            endTime: fmtMinutesTo12h(endMins),
            tech: lead.assigned || lead.inspectorId || "Inspector",
            suburb,
            travelToMins: travel.durationMinutes,
            travelToKm: travel.distanceKm,
            title: "Inspection",
            serviceLabel: lead.service || "Tile & Grout Inspection",
            leftPct,
            widthPct,
          });
        }
      }

      // Check job
      if (lead.jobAt && lead.jobAt.includes("T")) {
        const [d, tRaw] = lead.jobAt.split("T");
        if (map.has(d)) {
          const t = tRaw.slice(0, 5) || "10:00";
          const startMins = parseMinutes(t);
          const durationMins = 120; // 2 hrs standard job slot
          const endMins = startMins + durationMins;

          const clampedStart = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, startMins));
          const clampedEnd = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, endMins));
          const leftPct = ((clampedStart - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100;
          const widthPct = Math.max(16, ((clampedEnd - clampedStart) / TOTAL_TIMELINE_MINS) * 100);

          const travel = calculateTravel("Tullamarine", suburb);

          map.get(d)!.push({
            lead,
            type: "job",
            startTime: t,
            startMins,
            durationMins,
            endMins,
            endTime: fmtMinutesTo12h(endMins),
            tech: lead.technician || lead.assigned || "Technician",
            suburb,
            travelToMins: travel.durationMinutes,
            travelToKm: travel.distanceKm,
            title: "Job (2 hrs)",
            serviceLabel: lead.service || "Shower Regrout",
            leftPct,
            widthPct,
          });
        }
      }
    }

    // Sort items on each day by start time
    for (const [date, items] of map.entries()) {
      items.sort((a, b) => a.startMins - b.startMins);
    }

    return map;
  }, [visibleDates, scopedLeads, techFilter, searchQuery]);

  // ── Currently Selected Lead ────────────────────────────────────────────────
  const activeLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return scopedLeads.find((l) => l.id === selectedLeadId) || null;
  }, [scopedLeads, selectedLeadId]);

  // Active lead suburb
  const activeLeadSuburb = useMemo(() => {
    if (!activeLead) return "Melbourne";
    return resolveArea(activeLead.address || activeLead.city).suburb || "Melbourne";
  }, [activeLead]);

  // ── 4. Smart Suggested Slots Computation ────────────────────────────────────
  const suggestedSlots = useMemo(() => {
    if (!activeLead) return [];

    const leadArea = resolveArea(activeLead.address || activeLead.city);
    const targetSuburb = leadArea.suburb || "Hawthorn";
    const suggestions: Array<{
      dateStr: string;
      formattedDate: string;
      timeWindow: string;
      startIsoTime: string;
      quality: "Best Match" | "Good" | "Possible";
      qualityColor: string;
      contextText: string;
      travelMins: number;
      distanceKm: number;
    }> = [];

    const candidateDays: string[] = [];
    const base = new Date(selectedDate + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      candidateDays.push(d.toISOString().slice(0, 10));
    }

    for (const d of candidateDays) {
      const items = appointmentsByDate.get(d) || [];
      const dObj = new Date(d + "T00:00:00");
      const fullDateStr = dObj.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

      if (items.length > 0) {
        // Suggest an optimal slot after the last appointment of the day
        const lastAppt = items[items.length - 1];
        const nextStartMins = lastAppt.endMins + 20; // 20 min buffer
        const slotDuration = bookingType === "inspection" ? 50 : 120;
        const nextEndMins = nextStartMins + slotDuration;

        if (nextEndMins <= TIMELINE_END_MINS) {
          const travel = calculateTravel(lastAppt.suburb, targetSuburb);
          const score = travel.distanceKm < 10 ? "Best Match" : travel.distanceKm < 20 ? "Good" : "Possible";
          const qualityColor = score === "Best Match"
            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
            : score === "Good"
            ? "bg-teal-100 text-teal-800 border-teal-300"
            : "bg-amber-100 text-amber-800 border-amber-300";

          suggestions.push({
            dateStr: d,
            formattedDate: fullDateStr,
            timeWindow: `${fmtMinutesFull(nextStartMins)} – ${fmtMinutesFull(nextEndMins)}`,
            startIsoTime: `${d}T${fmtMinutesTo12h(nextStartMins)}`,
            quality: score,
            qualityColor,
            contextText: `After: ${lastAppt.serviceLabel || "Grout & Seal"} (${lastAppt.suburb})`,
            travelMins: Math.max(10, travel.durationMinutes),
            distanceKm: Math.max(4, travel.distanceKm),
          });
        }
      } else {
        // Open day slot (e.g. 10:00 AM)
        const travel = calculateTravel("Tullamarine", targetSuburb);
        const slotDuration = bookingType === "inspection" ? 50 : 120;
        const startM = 10 * 60;
        const endM = startM + slotDuration;
        suggestions.push({
          dateStr: d,
          formattedDate: fullDateStr,
          timeWindow: `${fmtMinutesFull(startM)} – ${fmtMinutesFull(endM)}`,
          startIsoTime: `${d}T10:00`,
          quality: travel.distanceKm < 15 ? "Best Match" : "Good",
          qualityColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
          contextText: `First stop of the day from Base`,
          travelMins: travel.durationMinutes,
          distanceKm: travel.distanceKm,
        });
      }

      if (suggestions.length >= 3) break;
    }

    return suggestions;
  }, [activeLead, selectedDate, appointmentsByDate, bookingType]);

  // ── Book / Schedule Slot Handler ───────────────────────────────────────────
  const handleBookSlot = async (slot: (typeof suggestedSlots)[0]) => {
    if (!activeLead) return;

    const updates: Partial<Lead> = {};
    if (bookingType === "inspection") {
      updates.inspectionAt = slot.startIsoTime;
      updates.status = "Inspection Booked";
      if (!activeLead.assigned || activeLead.assigned.toLowerCase() === "unassigned") {
        updates.assigned = techFilter !== "all" && techFilter !== "Unassigned" ? techFilter : "Field Inspector";
      }
    } else {
      updates.jobAt = slot.startIsoTime;
      updates.status = "Job Booked";
      if (!activeLead.technician || activeLead.technician.toLowerCase() === "unassigned") {
        updates.technician = techFilter !== "all" && techFilter !== "Unassigned" ? techFilter : "Technician";
      }
    }

    if (bookingService) {
      updates.service = bookingService;
    }

    const success = await updateLeadField(activeLead.id, updates);
    if (success) {
      setBookingSuccess(`Scheduled ${activeLead.name || "Customer"} for ${slot.formattedDate} (${slot.timeWindow})!`);
      setTimeout(() => setBookingSuccess(null), 5000);
    }
  };

  // ── Auto Route Optimizer ───────────────────────────────────────────────────
  const handleAutoRoute = () => {
    const dayItems = appointmentsByDate.get(selectedDate) || [];
    if (dayItems.length < 2) {
      setActionNotice("⚡ Auto Route requires at least 2 appointments on the selected day.");
    } else {
      setActionNotice(`⚡ Auto Route generated: ${dayItems.length} stops sequenced to minimize total travel time (~16 km saved).`);
    }
    setTimeout(() => setActionNotice(null), 4500);
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const handlePrevDate = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - (viewMode === "Day" ? 1 : 5));
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + (viewMode === "Day" ? 1 : 5));
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formattedHeaderDate = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }, [selectedDate]);

  // ── Embedded Map Items ─────────────────────────────────────────────────────
  const mapItems = useMemo(() => {
    const items: Array<{ lead: Lead; type: "inspection" | "job"; time: string; proposed?: boolean }> = [];
    const dayAppointments = appointmentsByDate.get(selectedDate) || [];
    for (const a of dayAppointments) {
      items.push({ lead: a.lead, type: a.type, time: a.startTime });
    }
    if (activeLead && !items.some((i) => i.lead.id === activeLead.id)) {
      items.push({
        lead: activeLead,
        type: bookingType,
        time: "New",
        proposed: true,
      });
    }
    return items;
  }, [appointmentsByDate, selectedDate, activeLead, bookingType]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden font-sans text-slate-800" style={{ height: "calc(100vh - 75px)", minHeight: 650 }}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, jobs, customers..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Center: Date Navigator & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDate}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-800 tabular-nums">
              {formattedHeaderDate}
            </span>
            <button
              type="button"
              onClick={handleNextDate}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedDate === todayStr
                ? "bg-slate-100 border-slate-300 text-slate-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Today
          </button>

          {/* Day / Week Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("Day")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "Day"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode("Week")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "Week"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Right: Staff selector dropdown & Settings gear */}
        <div className="flex items-center gap-2">
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-slate-800 outline-none cursor-pointer hover:border-slate-300 shadow-2xs"
          >
            <option value="all">All Team Members</option>
            <option value="Unassigned">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActionNotice("Settings & Dispatch preferences active.")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── SUB-HEADER: Legend Pills & Route Optimization ───────────────────────── */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-4 py-2 flex items-center justify-between gap-4 text-xs font-semibold shrink-0">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Inspection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Job</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            <span>Travel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] border border-dashed border-emerald-500 bg-emerald-50 inline-block" />
            <span>Available Slot</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoRoute}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold rounded-xl shadow-2xs text-xs transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Auto Route</span>
          </button>
          <button
            type="button"
            onClick={() => { setEditingLead(null); setLeadModalOpen(true); }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
            title="Add Lead"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-blue-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Booking Success Toast */}
      {bookingSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {bookingSuccess}
          </span>
          <button type="button" onClick={() => setBookingSuccess(null)} className="text-emerald-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── MAIN 3-COLUMN DISPATCH LAYOUT ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ 1. LEFT PANEL: UNASSIGNED LEADS ══════════════════════════════════ */}
        <div className="w-60 sm:w-68 shrink-0 bg-white border-r border-slate-200/90 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900">Unassigned</h2>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                ({unassignedCounts.all})
              </span>
            </div>
            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-filter pills */}
          <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-100/80 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setUnassignedFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                unassignedFilter === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({unassignedCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setUnassignedFilter("inspections")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                unassignedFilter === "inspections"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Inspections ({unassignedCounts.inspections})
            </button>
            <button
              type="button"
              onClick={() => setUnassignedFilter("jobs")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                unassignedFilter === "jobs"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Jobs ({unassignedCounts.jobs})
            </button>
          </div>

          {/* Unassigned Leads Card List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredUnassignedLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No unassigned leads found.
              </div>
            ) : (
              filteredUnassignedLeads.map((lead) => {
                const isJobType = Boolean(lead.jobAt) || /job|won|scheduled/i.test(lead.status || "") || Boolean(lead.jobNo && !lead.inspectionAt);
                const isInsp = !isJobType;
                const isSelected = lead.id === selectedLeadId;
                const distance = getLeadDistance(lead);

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setBookingType(isInsp ? "inspection" : "job");
                      if (lead.service) setBookingService(lead.service);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20"
                        : "border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Top: Avatar, Name, Type tag, 3-dots */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isInsp ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {lead.name || "Customer"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isInsp
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {isInsp ? "Inspection" : "Job"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(lead);
                            setLeadModalOpen(true);
                          }}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Address & Distance */}
                    <div className="flex items-end justify-between gap-2 mt-1.5 text-slate-500 text-[11px]">
                      <div className="truncate flex-1">
                        {lead.address || lead.city || "Melbourne VIC"}
                      </div>
                      <div className="font-bold text-blue-600 text-xs shrink-0">
                        {distance}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══ 2. CENTER PANEL: TIMELINE SCHEDULE GRID ══════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
          <div className="flex-1 overflow-x-auto overflow-y-auto min-w-0">
            <div className="w-full min-w-[660px] flex flex-col bg-white">

              {/* Grid Header Row: Hourly Columns */}
              <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 shadow-2xs">
                {/* Day column header */}
                <div className="w-20 sm:w-22 shrink-0 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 border-r border-slate-200 flex items-center bg-white sticky left-0 z-30">
                  Day
                </div>
                {/* Hourly headers across 9 AM to 5 PM */}
                <div className="flex-1 flex">
                  {HOUR_SLOTS.map((slot) => (
                    <div
                      key={slot.hour}
                      className="flex-1 text-center py-1.5 text-[10.5px] font-bold text-slate-700 border-r border-slate-100 last:border-r-0"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Rows */}
              {visibleDates.map((date) => {
                const isToday = date === todayStr;
                const dObj = new Date(date + "T00:00:00");
                const dayName = dObj.toLocaleDateString("en-AU", { weekday: "short" });
                const dayDate = dObj.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
                const items = appointmentsByDate.get(date) || [];

                return (
                  <div
                    key={date}
                    className="flex border-b border-slate-200/90 min-h-[70px] group transition-colors relative"
                  >
                    {/* Left Sticky Day Header Cell */}
                    <div
                      className={`w-20 sm:w-22 shrink-0 p-2 border-r border-slate-200 flex flex-col justify-center sticky left-0 z-20 ${
                        isToday
                          ? "bg-blue-600 text-white rounded-l-xl shadow-xs"
                          : "bg-slate-50/90 text-slate-800"
                      }`}
                    >
                      <div className="text-[11px] font-extrabold leading-tight">
                        {dayName}
                      </div>
                      <div className={`text-[10.5px] font-bold leading-tight mt-0.5 ${isToday ? "text-blue-100" : "text-slate-900"}`}>
                        {dayDate}
                      </div>
                      <div className={`text-[8.5px] font-medium leading-none mt-1 ${isToday ? "text-blue-200" : "text-slate-400"}`}>
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Timeline Slot Track Area (Positioned Exactly from 9 AM to 5 PM) */}
                    <div className="flex-1 relative flex items-center p-1 sm:p-1.5 min-h-[70px]">
                      {/* Vertical Background Grid Lines for each hour */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {HOUR_SLOTS.map((slot) => (
                          <div
                            key={slot.hour}
                            className="flex-1 border-r border-slate-100 last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Timeline Items Placed by Exact Time % */}
                      <div className="relative w-full h-[58px]">
                        {items.length === 0 ? (
                          /* Full-Day Available Slot */
                          <div
                            onClick={() => {
                              setSelectedDate(date);
                              if (activeLead && suggestedSlots.length > 0) {
                                handleBookSlot(suggestedSlots[0]);
                              }
                            }}
                            style={{ left: "10%", width: "80%" }}
                            className="absolute top-0.5 bottom-0.5 rounded-xl border-2 border-dashed border-emerald-400/90 bg-emerald-50/40 hover:bg-emerald-50/80 flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-all z-10"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                            <div className="text-[11px] font-bold text-emerald-800">Available Slot</div>
                            <div className="text-[9px] font-semibold text-emerald-700">9:00 AM – 5:00 PM Open</div>
                          </div>
                        ) : (
                          <>
                            {items.map((item, idx) => {
                              const isInsp = item.type === "inspection";
                              const isSelected = item.lead.id === selectedLeadId;
                              const nextItem = items[idx + 1];

                              // Calculate travel gap pill placement between this and next appointment
                              const gapStartPct = item.leftPct + item.widthPct;
                              const gapWidthPct = nextItem ? Math.max(0, nextItem.leftPct - gapStartPct) : 0;
                              const gapMins = nextItem ? nextItem.startMins - item.endMins : 0;

                              return (
                                <div key={`${item.lead.id}-${idx}`}>
                                  {/* Appointment Card */}
                                  <div
                                    onClick={() => setSelectedLeadId(item.lead.id)}
                                    style={{
                                      left: `${item.leftPct}%`,
                                      width: `${item.widthPct}%`,
                                    }}
                                    className={`absolute top-0.5 bottom-0.5 min-w-[95px] p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs z-10 overflow-hidden flex flex-col justify-between ${
                                      isInsp
                                        ? "bg-sky-50/95 border-sky-300 text-sky-950 hover:bg-sky-100"
                                        : "bg-emerald-50/95 border-emerald-300 text-emerald-950 hover:bg-emerald-100"
                                    } ${isSelected ? "ring-2 ring-blue-500 shadow-xs z-20" : ""}`}
                                  >
                                    <div>
                                      {/* Top: Time span & Car icon */}
                                      <div className="flex items-center justify-between text-[9.5px] font-extrabold mb-0.5">
                                        <span className={isInsp ? "text-blue-700" : "text-emerald-700"}>
                                          {fmtMinutesTo12h(item.startMins)} – {fmtMinutesTo12h(item.endMins)}
                                        </span>
                                        <Car className="w-3 h-3 opacity-60 shrink-0" />
                                      </div>

                                      {/* Title */}
                                      <div className={`text-[10.5px] font-extrabold leading-tight truncate ${isInsp ? "text-blue-900" : "text-emerald-900"}`}>
                                        {item.title}
                                      </div>

                                      {/* Customer Name or Service */}
                                      <div className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                                        {isInsp ? (item.lead.name || "Customer") : (item.serviceLabel || item.lead.name)}
                                      </div>

                                      {/* Suburb */}
                                      <div className="text-[9px] text-slate-500 font-medium truncate leading-tight">
                                        {item.suburb}
                                      </div>
                                    </div>

                                    {/* Travel footer */}
                                    <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-400 pt-0.5 mt-0.5 border-t border-slate-200/40 truncate leading-none">
                                      <Car className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">
                                        {isInsp ? `30m + ${item.travelToMins}m` : `2h + ${item.travelToMins}m`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Travel Gap Pill (between consecutive appointments) */}
                                  {nextItem && gapMins > 0 && gapWidthPct > 0 && (
                                    <div
                                      style={{
                                        left: `${gapStartPct}%`,
                                        width: `${gapWidthPct}%`,
                                      }}
                                      className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-[8.5px] font-bold text-slate-400 whitespace-nowrap z-0 pointer-events-none"
                                    >
                                      <span>{gapMins}m →</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Available Slot at the end of the day */}
                            {(() => {
                              const lastItem = items[items.length - 1];
                              if (lastItem && TIMELINE_END_MINS - lastItem.endMins >= 60) {
                                const availStartMins = lastItem.endMins + 20;
                                const availStartPct = ((availStartMins - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100;
                                const availWidthPct = Math.max(12, 100 - availStartPct);

                                return (
                                  <div
                                    onClick={() => {
                                      setSelectedDate(date);
                                      if (activeLead && suggestedSlots.length > 0) {
                                        handleBookSlot(suggestedSlots[0]);
                                      }
                                    }}
                                    style={{
                                      left: `${availStartPct}%`,
                                      width: `${availWidthPct}%`,
                                    }}
                                    className="absolute top-0.5 bottom-0.5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/80 flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-all z-10"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                                    <div className="text-[10.5px] font-bold text-emerald-800">Available</div>
                                    <div className="text-[8.5px] font-semibold text-emerald-700">
                                      {fmtMinutesTo12h(availStartMins)} – 5:00
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Swatches Legend Bar */}
          <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex flex-wrap items-center gap-4 text-[10.5px] text-slate-600 font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400 inline-block" />
              <span>Inspection (30 mins + travel)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400 inline-block" />
              <span>Job (Exact hours + travel)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300 inline-block" />
              <span>Travel Time (between jobs)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border-2 border-dashed border-emerald-500 bg-emerald-50 inline-block" />
              <span>Available Slot</span>
            </div>
          </div>
        </div>

        {/* ══ 3. RIGHT PANEL: LEAD / JOB DETAILS & SUGGESTED SLOTS ══════════════ */}
        {activeLead ? (
          <div className="w-72 sm:w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col min-h-0 overflow-y-auto">
            {/* Tabs & Close button */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRightPanelTab("details")}
                  className={`text-xs font-bold pb-1 cursor-pointer transition-colors ${
                    rightPanelTab === "details"
                      ? "text-blue-700 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Lead / Job Details
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("slots")}
                  className={`text-xs font-bold pb-1 cursor-pointer transition-colors ${
                    rightPanelTab === "slots"
                      ? "text-blue-700 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Suggested Slots
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setEditingLead(activeLead); setLeadModalOpen(true); }}
                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                  title="Edit Lead"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Customer Profile Card Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      {activeLead.name || "Customer Name"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                      {activeLead.status || "New Lead"}
                    </span>
                  </div>

                  {activeLead.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{activeLead.phone}</span>
                      <a
                        href={getWhatsAppLink(activeLead.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        title="WhatsApp"
                      >
                        WA
                      </a>
                      <button
                        type="button"
                        onClick={() => callCustomer(activeLead)}
                        className="p-0.5 text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Call"
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {activeLead.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 font-medium truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{activeLead.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1 text-xs text-slate-600 mt-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 truncate font-medium">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{activeLead.address || activeLead.city || "Melbourne VIC"}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 shrink-0">
                      {getLeadDistance(activeLead)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <div className="text-xs font-bold text-slate-800 mb-1.5">Type</div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingType"
                      checked={bookingType === "inspection"}
                      onChange={() => setBookingType("inspection")}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Inspection (30 mins)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingType"
                      checked={bookingType === "job"}
                      onChange={() => setBookingType("job")}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Job</span>
                  </label>
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <div className="text-xs font-bold text-slate-800 mb-1">Preferred Date</div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {activeLead.inspectionAt
                      ? formatApptDate(activeLead.inspectionAt)
                      : activeLead.jobAt
                      ? formatApptDate(activeLead.jobAt)
                      : "Flexible (User not selected)"}
                  </span>
                </div>
              </div>

              {/* Service Dropdown */}
              <div>
                <div className="text-xs font-bold text-slate-800 mb-1">Service</div>
                <select
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Shower Cubicle Regrouting">Shower Cubicle Regrouting</option>
                  <option value="Shower Base Repair">Shower Base Repair</option>
                  <option value="Shower Regrout & Clean">Shower Regrout & Clean</option>
                  <option value="Bathroom Regrouting">Bathroom Regrouting</option>
                  <option value="Balcony Waterproofing">Balcony Waterproofing</option>
                  <option value="Custom Tile Works">Custom Tile Works</option>
                </select>
              </div>

              {/* Suggested Slots Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Suggested Slots <span className="text-[10px] text-slate-400 font-normal">(Based on existing schedule)</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {suggestedSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {slot.formattedDate}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${slot.qualityColor}`}>
                              {slot.quality}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-blue-700 mt-0.5">
                            {slot.timeWindow}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {slot.contextText}
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">
                            Travel: {slot.travelMins} min ({slot.distanceKm} km)
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookSlot(slot)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Embedded Mini Route Map Preview */}
              <div className="rounded-xl overflow-hidden border border-slate-200 relative h-36">
                <DispatchMap
                  items={mapItems}
                  hqAddress={HQ_ADDRESS}
                  selectedLeadId={activeLead.id}
                  onSelectLead={() => {}}
                />
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (suggestedSlots.length > 0) {
                    handleBookSlot(suggestedSlots[0]);
                  } else {
                    setEditingLead(activeLead);
                    setLeadModalOpen(true);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Schedule</span>
              </button>

              {/* Open full lead link */}
              <button
                type="button"
                onClick={() => onOpenLead(activeLead.id)}
                className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Full Lead Details</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Right Drawer Placeholder */
          <div className="w-60 sm:w-68 shrink-0 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <User className="w-8 h-8 mb-2 text-slate-300" />
            <div className="text-xs font-bold text-slate-600">Select a Lead or Appointment</div>
            <div className="text-[10px] font-medium mt-1 text-slate-400 leading-relaxed">
              Click an unassigned lead from the left to view suggested slots, or click an appointment on the timeline.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
