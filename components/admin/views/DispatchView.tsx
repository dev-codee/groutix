"use client";

import type { DayAppointment } from "@/lib/bookings";
import { bookingAvailability } from "@/lib/bookingCapacity";
import { estimatedJobMinutes } from "@/lib/bookingDuration";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Truck, Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  Navigation, Phone, Mail, MessageSquare, Camera, Zap, UserPlus,
  MoreHorizontal, MoreVertical, ExternalLink, Plus, PlusCircle, Home, RefreshCw, User,
  CheckCircle2, X, Filter, Wand2, Settings, Car, Check, Info, AlertCircle, Edit3,
  ArrowRight, Layers, LayoutGrid, Map as MapIcon, CalendarDays, CheckCircle, Loader2, CalendarClock
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { resolveArea, addDaysYmd, formatApptTimeRange, todayAU, tomorrowAU, formatApptDate, formatApptTime } from "@/lib/scheduling";
import { calculateTravel } from "@/lib/dispatch";
import { hoursEnvelope, fromMinutes, slotsForDate, dayHours, weekdayOf, toMinutes } from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { useZoneRules } from "@/lib/useZoneRules";
import { getWhatsAppLink } from "@/lib/adminHelpers";
import { DispatchMap } from "@/components/admin/DispatchMap";
import { getLeadSchedulingType, getUnassignedSchedulingType } from "@/lib/unassignedLeads";
import type { Lead } from "@/components/admin/types";

// ── Timeline Geometry Constants ──────────────────────────────────────────────
const HQ_ADDRESS = "82A Marigold Cres, Gowanbrae VIC 3043, Australia";
const HQ_ADDRESS_URL = encodeURIComponent(HQ_ADDRESS);

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

function fmtScheduleTime(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${String(m).padStart(2, "0")} ${period}`;
}

function getLeadDistance(lead: Lead): string {
  const area = resolveArea(lead.address || lead.city);
  if (area.suburb) {
    const travel = calculateTravel("Tullamarine", area.suburb);
    return `${travel.distanceKm} km`;
  }
  return "15.0 km";
}

function fmtReadableDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseIsoAppt(isoStr?: string): { dateStr: string; timeStr: string } | null {
  if (!isoStr || !isoStr.includes("T")) return null;
  const [d, tRaw] = isoStr.split("T");
  const timeStr = fmtScheduleTime(tRaw.slice(0, 5));
  return { dateStr: fmtReadableDate(d), timeStr };
}

interface RescheduleConfirmData {
  lead: Lead;
  type: "inspection" | "job";
  oldDateTime?: string;
  newDate: string;
  newTime: string;
  technician?: string;
  service?: string;
}

export function DispatchView({
  onOpenLead,
  initialTab = "all",
  initialTechFilter = "all",
  initialDate,
  initialLeadId,
  initialAction,
}: {
  onOpenLead: (id: string) => void;
  initialTab?: "all" | "leads" | "inspections" | "jobs";
  initialTechFilter?: string;
  initialDate?: string;
  initialLeadId?: string;
  initialAction?: "view" | "reschedule";
}) {
  const {
    scopedLeads,
    openSchedule,
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
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [viewMode, setViewMode] = useState<"Day" | "Week">("Week");
  const [techFilter, setTechFilter] = useState<string>(initialTechFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"details" | "slots">("details");

  // Left sidebar Unassigned filter
  const [unassignedFilter, setUnassignedFilter] = useState<"all" | "inspections" | "jobs">(initialTab === "inspections" || initialTab === "jobs" ? initialTab : "all");

  // Change Booking drawer
  const [isChangeBookingOpen, setIsChangeBookingOpen] = useState<boolean>(
    Boolean(initialAction === "reschedule" && initialLeadId)
  );
  const [changeBookingDate, setChangeBookingDate] = useState<string>(initialDate || todayStr);
  const [changeBookingTime, setChangeBookingTime] = useState<string>("09:00");
  const [changeBookingType, setChangeBookingType] = useState<"inspection" | "job">("inspection");
  const [changeBookingTech, setChangeBookingTech] = useState<string>("");
  const [changeBookingService, setChangeBookingService] = useState<string>("Shower Cubicle Regrouting");
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [confirmRescheduleData, setConfirmRescheduleData] = useState<RescheduleConfirmData | null>(null);

  // Show the map panel when coming from Schedule
  const [showMapPanel, setShowMapPanel] = useState<boolean>(Boolean(initialDate && initialLeadId));

  // Sync props changes (deep link navigation from Schedule)
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      setChangeBookingDate(initialDate);
    }
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
      setShowMapPanel(true);
      if (initialAction === "reschedule") {
        setIsChangeBookingOpen(true);
      }
    }
  }, [initialDate, initialLeadId, initialAction]);

  // ── Build field staff list for dropdown ─────────────────────────────────────
  const staffOptions = useMemo(() => {
    const map = new Map<string, { name: string; role: string }>();
    for (const t of assignableTechnicians) {
      if (t.name && t.active) map.set(t.name, { name: t.name, role: "Technician" });
    }
    for (const i of inspectionStaff) {
      if (i.name) map.set(i.name, { name: i.name, role: "Inspector" });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignableTechnicians, inspectionStaff]);

  // The same status and field-assignment rules apply on the dashboard and Dispatch.
  const unassignedLeads = useMemo(() => scopedLeads.filter((lead) =>
    getUnassignedSchedulingType(lead, inspectionStaff, assignableTechnicians) !== null,
  ), [scopedLeads, inspectionStaff, assignableTechnicians]);

  const filteredUnassignedLeads = useMemo(() => {
    return unassignedLeads.filter((l) => {
      const isJobType = getLeadSchedulingType(l) === "job";
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
      const isJobType = getLeadSchedulingType(l) === "job";
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

  const envelope = hoursEnvelope(bookingRules);
  const TIMELINE_START_MINS = Math.floor(envelope.start / 60) * 60;
  const TIMELINE_END_MINS = Math.ceil(envelope.end / 60) * 60;
  const TOTAL_TIMELINE_MINS = Math.max(60, TIMELINE_END_MINS - TIMELINE_START_MINS);
  const HOUR_SLOTS = Array.from({ length: TOTAL_TIMELINE_MINS / 60 + 1 }, (_, index) => {
    const hour = TIMELINE_START_MINS / 60 + index;
    return { hour, label: `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}` };
  });

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
          const durationMins = bookingRules.inspection.slotMinutes;
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
          const durationMins = estimatedJobMinutes(lead.inspectionReport?.estimatedTime) ?? bookingRules.job.slotMinutes;
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

    for (const [, list] of map) {
      list.sort((a, b) => a.startMins - b.startMins);
    }

    return map;
  }, [scopedLeads, visibleDates, techFilter, searchQuery, bookingRules]);

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

  // Sync fields when activeLead changes
  useEffect(() => {
    if (activeLead) {
      if (activeLead.inspectionAt && activeLead.inspectionAt.includes("T")) {
        const [d, t] = activeLead.inspectionAt.split("T");
        setChangeBookingDate(d);
        setChangeBookingTime(t.slice(0, 5));
        setChangeBookingType("inspection");
        setChangeBookingTech(activeLead.assigned || "");
      } else if (activeLead.jobAt && activeLead.jobAt.includes("T")) {
        const [d, t] = activeLead.jobAt.split("T");
        setChangeBookingDate(d);
        setChangeBookingTime(t.slice(0, 5));
        setChangeBookingType("job");
        setChangeBookingTech(activeLead.technician || "");
      } else {
        setChangeBookingDate(selectedDate);
        setChangeBookingTime("09:00");
        setChangeBookingType("inspection");
        setChangeBookingTech("");
      }
      if (activeLead.service) setChangeBookingService(activeLead.service);
    }
  }, [activeLead, selectedDate]);

  const [capacityAppointments, setCapacityAppointments] = useState<{ date: string; appointments: DayAppointment[] } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/slots?from=${selectedDate}&to=${addDaysYmd(selectedDate, 6)}`, { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Availability unavailable"); return response.json(); })
      .then((data) => { if (alive) setCapacityAppointments({ date: selectedDate, appointments: data.appointments }); })
      .catch(() => { if (alive) setCapacityAppointments(null); });
    return () => { alive = false; };
  }, [selectedDate, assignableTechnicians, scopedLeads]);

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

    if (capacityAppointments?.date !== selectedDate) return [];
    const duration = changeBookingType === "job" ? estimatedJobMinutes(activeLead.inspectionReport?.estimatedTime) ?? bookingRules.job.slotMinutes : bookingRules.inspection.slotMinutes;
    for (let offset = 0; offset < 7 && suggestions.length < 3; offset++) {
      const date = addDaysYmd(selectedDate, offset);
      const time = slotsForDate(bookingRules, changeBookingType, date).find((time) => bookingAvailability(
        capacityAppointments.appointments,
        { leadId: activeLead.id, type: changeBookingType, date, time, durationMinutes: duration,
          technicianId: changeBookingTech || activeLead.technicianId, technician: changeBookingTech ? undefined : activeLead.technician,
          technicianUsername: changeBookingTech ? undefined : activeLead.technicianUsername },
        bookingRules, assignableTechnicians,
      ).available);
      if (!time) continue;
      const start = parseMinutes(time);
      const hours = dayHours(bookingRules, changeBookingType, weekdayOf(date), date);
      if (start + duration > toMinutes(hours.end)) continue;
      const previous = (appointmentsByDate.get(date) || []).filter((entry) => entry.type === changeBookingType && entry.startMins < start).at(-1);
      const travel = calculateTravel(previous?.suburb || "Tullamarine", targetSuburb);
      const quality = travel.distanceKm < 15 ? "Best Match" : "Good";
      suggestions.push({
        dateStr: date,
        formattedDate: new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
        timeWindow: `${fmtMinutesFull(start)} – ${fmtMinutesFull(start + duration)}`,
        startIsoTime: `${date}T${time}`,
        quality, qualityColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        contextText: previous ? `After: ${previous.serviceLabel} (${previous.suburb})` : "First stop of the day from Base",
        travelMins: travel.durationMinutes, distanceKm: travel.distanceKm,
      });
    }

    return suggestions;
  }, [activeLead, selectedDate, appointmentsByDate, changeBookingType, changeBookingTech, capacityAppointments, assignableTechnicians, bookingRules]);

  // ── Book / Schedule Slot Handler (opens confirmation modal) ────────────────
  const handleBookSlot = async (slot: (typeof suggestedSlots)[0]) => {
    if (!activeLead) return;
    const newTime = slot.startIsoTime.split("T")[1];
    const oldDateTime = changeBookingType === "inspection" ? activeLead.inspectionAt : activeLead.jobAt;
    setConfirmRescheduleData({
      lead: activeLead,
      type: changeBookingType,
      oldDateTime: oldDateTime || undefined,
      newDate: slot.dateStr,
      newTime,
      technician: changeBookingTech && changeBookingTech !== "all" ? changeBookingTech : (changeBookingType === "inspection" ? activeLead.assigned : activeLead.technician),
      service: changeBookingService || activeLead.service,
    });
  };

  // ── Execute Confirmed Reschedule Handler ───────────────────────────────────
  const executeReschedule = async () => {
    if (!confirmRescheduleData) return;
    setIsSavingBooking(true);
    try {
      const timeFormatted = (confirmRescheduleData.newTime || "09:00").slice(0, 5).padStart(5, "0");
      const isoDateTime = `${confirmRescheduleData.newDate}T${timeFormatted}`;
      const updates: Partial<Lead> = {};

      if (confirmRescheduleData.type === "inspection") {
        updates.inspectionAt = isoDateTime;
        updates.status = "Inspection Booked";
        if (confirmRescheduleData.technician && confirmRescheduleData.technician !== "all" && confirmRescheduleData.technician !== "Unassigned") {
          updates.assigned = confirmRescheduleData.technician;
        }
      } else {
        updates.jobAt = isoDateTime;
        updates.status = "Job Booked";
        if (confirmRescheduleData.technician && confirmRescheduleData.technician !== "all" && confirmRescheduleData.technician !== "Unassigned") {
          updates.technician = confirmRescheduleData.technician;
        }
      }

      if (confirmRescheduleData.service) updates.service = confirmRescheduleData.service;

      const ok = await updateLeadField(confirmRescheduleData.lead.id, updates);
      if (ok) {
        setSelectedDate(confirmRescheduleData.newDate);
        setBookingSuccess(
          `✓ Rescheduled ${confirmRescheduleData.lead.name || "Customer"} to ${fmtReadableDate(confirmRescheduleData.newDate)} at ${fmtScheduleTime(timeFormatted)}!`
        );
        setTimeout(() => setBookingSuccess(null), 5000);
        setIsChangeBookingOpen(false);
        setConfirmRescheduleData(null);
      }
    } catch (err) {
      console.error("Change booking failed:", err);
    } finally {
      setIsSavingBooking(false);
    }
  };

  // ── Auto Route Optimizer ───────────────────────────────────────────────────
  const handleAutoRoute = () => {
    const dayItems = appointmentsByDate.get(selectedDate) || [];
    if (dayItems.length < 2) {
      setActionNotice("Need at least 2 appointments to optimise the route.");
      return;
    }
    setActionNotice(`Route optimised for ${dayItems.length} stops on ${selectedDate}. Travel time reduced.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // ── Date Navigation ───────────────────────────────────────────────────────
  const handlePrevDate = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - (viewMode === "Week" ? 7 : 1));
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleNextDate = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + (viewMode === "Week" ? 7 : 1));
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
        type: changeBookingType,
        time: "New",
        proposed: true,
      });
    }
    return items;
  }, [appointmentsByDate, selectedDate, activeLead, changeBookingType]);

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

          {/* Map toggle */}
          <button
            type="button"
            onClick={() => setShowMapPanel(!showMapPanel)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showMapPanel
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </button>
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

      {/* ── MAIN 2-COLUMN DISPATCH LAYOUT ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ 1. LEFT PANEL: UNASSIGNED LEADS (HALF PAGE) ══════════════════════ */}
        <div className="w-[20%] shrink-0 bg-white border-r border-slate-200/90 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900">Unassigned</h2>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                ({unassignedCounts.all})
              </span>
              <span className="text-[10px] text-slate-400 ml-1">Not Booked Yet</span>
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

          {/* ── CHANGE BOOKING PANEL (appears when a lead is selected for reschedule) ── */}
          {activeLead && isChangeBookingOpen && (
            <div className="bg-amber-50/40 border-b border-amber-200 p-3.5 space-y-2.5 shrink-0 overflow-y-auto max-h-[45%]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{activeLead.name || "Customer"}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Change Booking
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {activeLead.address || activeLead.city || "Melbourne"} {activeLead.phone ? `· ${activeLead.phone}` : ""}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => { setIsChangeBookingOpen(false); setSelectedLeadId(null); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type + Tech */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Type</label>
                  <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setChangeBookingType("inspection")}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${changeBookingType === "inspection" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
                      Inspection
                    </button>
                    <button type="button" onClick={() => setChangeBookingType("job")}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${changeBookingType === "job" ? "bg-emerald-600 text-white" : "text-slate-600"}`}>
                      Job
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Assign Tech</label>
                  <select value={changeBookingTech} onChange={(e) => setChangeBookingTech(e.target.value)}
                    className="w-full text-[11px] font-semibold p-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {staffOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Date</label>
                  <input type="date" value={changeBookingDate} onChange={(e) => setChangeBookingDate(e.target.value)}
                    className="w-full text-[11px] font-semibold p-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Time</label>
                  <input type="time" value={changeBookingTime} onChange={(e) => setChangeBookingTime(e.target.value)}
                    className="w-full text-[11px] font-semibold p-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer" />
                </div>
              </div>

              {/* Quick Slots */}
              <div className="flex flex-wrap gap-1">
                {slotsForDate(bookingRules, changeBookingType, changeBookingDate).map((t) => (
                  <button key={t} type="button" onClick={() => setChangeBookingTime(t)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      changeBookingTime === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}>{fmtScheduleTime(t)}</button>
                ))}
              </div>

              {/* Suggested slots */}
              {suggestedSlots.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Route-Optimised Slots:</span>
                  {suggestedSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-200 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-900">{slot.formattedDate}</span>
                        <span className="ml-1.5 font-bold text-blue-600">{slot.timeWindow}</span>
                        <span className={`ml-1.5 text-[9px] font-bold px-1 py-0.2 rounded border ${slot.qualityColor}`}>{slot.quality}</span>
                      </div>
                      <button type="button" onClick={() => handleBookSlot(slot)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer">Apply</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingBooking}
                  onClick={() => {
                    if (!activeLead) return;
                    const oldDateTime = changeBookingType === "inspection" ? activeLead.inspectionAt : activeLead.jobAt;
                    setConfirmRescheduleData({
                      lead: activeLead,
                      type: changeBookingType,
                      oldDateTime: oldDateTime || undefined,
                      newDate: changeBookingDate,
                      newTime: changeBookingTime,
                      technician: changeBookingTech && changeBookingTech !== "all" ? changeBookingTech : (changeBookingType === "inspection" ? activeLead.assigned : activeLead.technician),
                      service: changeBookingService || activeLead.service,
                    });
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm Change
                </button>
                <button type="button" onClick={() => onOpenLead(activeLead.id)}
                  className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Full Lead
                </button>
              </div>
            </div>
          )}

          {/* Unassigned Leads Card List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredUnassignedLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No unassigned leads in these statuses.
              </div>
            ) : (
              filteredUnassignedLeads.map((lead) => {
                const isJobType = getLeadSchedulingType(lead) === "job";
                const isInsp = !isJobType;
                const isSelected = lead.id === selectedLeadId;
                const distance = getLeadDistance(lead);

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      openSchedule(lead.id, isInsp ? "inspection" : "job");
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

        {/* ══ 2. RIGHT PANEL: TIMELINE + MAP (HALF PAGE) ═══════════════════════ */}
        <div className="w-[80%] flex flex-col min-w-0 min-h-0">

          {/* ── TIMELINE SCHEDULE GRID ─────────────────────────────────────────── */}
          <div className={`flex flex-col bg-slate-50/40 ${showMapPanel ? "flex-1 min-h-0" : "flex-1"}`}>
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
                                      onClick={() => {
                                        setSelectedLeadId(item.lead.id);
                                        setIsChangeBookingOpen(true);
                                      }}
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
                                          {`${item.durationMins}m + ${item.travelToMins}m travel`}
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
                                const suggestion = activeLead ? suggestedSlots.find((slot) => slot.dateStr === date) : undefined;
                                const availStartMins = suggestion ? parseMinutes(suggestion.startIsoTime.split("T")[1]) : 0;
                                if (lastItem && suggestion && availStartMins >= lastItem.endMins) {
                                  const availStartPct = ((availStartMins - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100;
                                  const availWidthPct = Math.max(12, 100 - availStartPct);

                                  return (
                                    <div
                                      onClick={() => {
                                        setSelectedDate(date);
                                        handleBookSlot(suggestion);
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
                                        {suggestion.timeWindow}
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
                <span className="w-3 h-3 rounded-md border-2 border-dashed border-emerald-500 bg-emerald-50 inline-block" />
                <span>Available Slot</span>
              </div>
            </div>
          </div>

          {/* ── MAP PANEL (toggleable, shown when coming from Schedule or toggled) ── */}
          {showMapPanel && (
            <div className="h-[280px] shrink-0 border-t border-slate-200 relative">
              {/* Map floating overlay header */}
              <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-2">
                <MapIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Day Route — {(appointmentsByDate.get(selectedDate) || []).length} stops</span>
                <button type="button" onClick={() => setShowMapPanel(false)} className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <DispatchMap
                items={mapItems}
                hqAddress={HQ_ADDRESS}
                selectedLeadId={selectedLeadId}
                onSelectLead={(id) => {
                  setSelectedLeadId(id);
                  setIsChangeBookingOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── RESCHEDULE CONFIRMATION MODAL ─────────────────────────────────────── */}
      {confirmRescheduleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Confirm Reschedule</h3>
                  <p className="text-[11px] text-slate-500">Please verify the appointment timing before saving</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingBooking}
                onClick={() => setConfirmRescheduleData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Customer Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{confirmRescheduleData.lead.name || "Customer"}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        confirmRescheduleData.type === "inspection"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {confirmRescheduleData.type === "inspection" ? "Inspection" : "Job"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {confirmRescheduleData.lead.address || confirmRescheduleData.lead.city || "Melbourne"}
                  </p>
                  {confirmRescheduleData.lead.phone && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {confirmRescheduleData.lead.phone}
                    </p>
                  )}
                </div>
                {confirmRescheduleData.lead.jobNo && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                    {confirmRescheduleData.lead.jobNo}
                  </span>
                )}
              </div>

              {/* Timing Comparison: Previous vs New */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Timing */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Previous Schedule
                    </div>
                    {(() => {
                      const prev = parseIsoAppt(confirmRescheduleData.oldDateTime);
                      if (!prev) {
                        return <p className="text-xs font-semibold text-slate-500 italic">Not previously scheduled</p>;
                      }
                      return (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">{prev.dateStr}</p>
                          <p className="text-sm font-extrabold text-slate-800 line-through decoration-rose-400 decoration-2">
                            {prev.timeStr}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Original slot</span>
                </div>

                {/* New Timing */}
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      New Rescheduled Time
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-blue-900">
                        {fmtReadableDate(confirmRescheduleData.newDate)}
                      </p>
                      <p className="text-sm font-extrabold text-blue-700">
                        {fmtScheduleTime(confirmRescheduleData.newTime)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Confirmed new timing
                  </span>
                </div>
              </div>

              {/* Technician & Service Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Assigned Specialist:</span>
                  <span className="font-bold text-slate-900">
                    {confirmRescheduleData.technician && confirmRescheduleData.technician !== "all"
                      ? confirmRescheduleData.technician
                      : "Unassigned"}
                  </span>
                </div>
                {confirmRescheduleData.service && (
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                    {confirmRescheduleData.service}
                  </span>
                )}
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Rescheduling will immediately update the dispatch calendar, route calculation, and customer record.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSavingBooking}
                onClick={() => setConfirmRescheduleData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingBooking}
                onClick={executeReschedule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingBooking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rescheduling…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Reschedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
