"use client";

import { bookingLead, leadBookings } from "@/lib/leadBookings";

import { staffBookingRules } from "@/lib/staffBookingRules";

import type { DayAppointment } from "@/lib/bookings";
import { bookingAvailability } from "@/lib/bookingCapacity";
import { bookingSegments, bookingEndForDuration } from "@/lib/bookingSpan";
import { appointmentDurationMinutes, savedLeadBookingMinutes } from "@/lib/bookingDuration";

import { useState, useMemo, useCallback, useEffect, type DragEvent, type PointerEvent } from "react";
import { dispatchDates, dispatchDropMinutes, dispatchResizeEndMinutes, dispatchBookingIssue } from "@/lib/dispatchTimeline";
import {
  Truck, Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  Navigation, Phone, Mail, MessageSquare, Camera, Zap, UserPlus,
  MoreHorizontal, MoreVertical, ExternalLink, Plus, PlusCircle, Home, RefreshCw, User,
  CheckCircle2, X, Filter, Wand2, Settings, Car, Check, Info, AlertCircle, Edit3,
  ArrowRight, Layers, LayoutGrid, CalendarDays, CheckCircle, Loader2, CalendarClock
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { resolveArea, addDaysYmd, formatApptTimeRange, todayAU, tomorrowAU, formatApptDate, formatApptTime } from "@/lib/scheduling";
import { calculateTravel } from "@/lib/dispatch";
import { fromMinutes, slotsForDate, dayHours, weekdayOf, toMinutes } from "@/lib/bookingRules";
import { useBookingRules } from "@/lib/useBookingRules";
import { useZoneRules } from "@/lib/useZoneRules";
import { getWhatsAppLink } from "@/lib/adminHelpers";
import { DispatchDatePicker } from "@/components/admin/DispatchDatePicker";
import { EditBookingModal } from "@/components/admin/modals/EditBookingModal";
import { DispatchBookingModal } from "@/components/admin/modals/DispatchBookingModal";
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

interface BookingResize {
  lead: Lead;
  type: "inspection" | "job";
  date: string;
  pointerId: number;
  initialX: number;
  trackWidth: number;
  originalEnd: number;
  minimumEnd: number;
  endMinutes: number;
}

interface RescheduleConfirmData {
  lead: Lead;
  type: "inspection" | "job";
  oldDateTime?: string;
  newDate: string;
  newTime: string;
  endAt?: string;
  technician?: string;
  service?: string;
}

export function DispatchView({
  onOpenLead,
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
    upsertLead,
    setEditingLead,
    setLeadModalOpen,
    openPhotosModal,
    openMessagesModal,
    callCustomer,
  } = useAdminPageCtx();

  const bookingRules = staffBookingRules(useBookingRules());
  const zoneRules = useZoneRules();

  const todayStr = useMemo(() => todayAU(), []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedBookingType, setSelectedBookingType] = useState<"inspection" | "job" | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [techFilter, setTechFilter] = useState<string>(initialTechFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"details" | "slots">("details");

  // Change Booking drawer
  const [isChangeBookingOpen, setIsChangeBookingOpen] = useState<boolean>(
    Boolean(initialAction === "reschedule" && initialLeadId)
  );
  const [changeBookingType, setChangeBookingType] = useState<"inspection" | "job">("inspection");
  const [changeBookingTech, setChangeBookingTech] = useState<string>("");
  const [changeBookingService, setChangeBookingService] = useState<string>("Shower Cubicle Regrouting");
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [confirmRescheduleData, setConfirmRescheduleData] = useState<RescheduleConfirmData | null>(null);

  const [newBooking, setNewBooking] = useState<{ date: string; time: string; staffName?: string; initialType?: "inspection" | "job" } | null>(null);
  const [newTimeSelection, setNewTimeSelection] = useState<{ date: string; minutes: number; staffName: string } | null>(null);

  const [dragBooking, setDragBooking] = useState<{ lead: Lead; type: "inspection" | "job"; duration: number; grabOffset: number } | null>(null);
  const [dropPreview, setDropPreview] = useState<{ date: string; minutes: number; duration: number; staffName: string } | null>(null);
  const [resizeBooking, setResizeBooking] = useState<BookingResize | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Sync props changes (deep link navigation from Schedule)
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
      setSelectedBookingType(null);
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
      if (i.name && i.active) map.set(i.name, { name: i.name, role: map.has(i.name) ? "Technician / Inspector" : "Inspector" });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignableTechnicians, inspectionStaff]);

  // ── 2. Visible Dates in Timeline ────────────────────────────────────────────
  const visibleDates = useMemo(() => dispatchDates(selectedDate, "Week"), [selectedDate]);

  // The visible day stays fixed; staff booking permissions are independent.
  const TIMELINE_START_MINS = 9 * 60;
  const TIMELINE_END_MINS = 17 * 60;
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
      bookingStatus: string;
      // Exact timeline coordinates (% of 9 AM - 5 PM track)
      leftPct: number;
      widthPct: number;
    }>>();

    for (const date of visibleDates) {
      map.set(date, []);
    }

    for (const visit of scopedLeads.flatMap(lead => leadBookings(lead).filter(booking => booking.status !== "Cancelled").map(booking => ({ lead: bookingLead(lead, booking), type: booking.type, status: booking.status! })))) {
      const lead = visit.lead;
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

      for (const type of [visit.type]) {
        const start = type === "job" ? lead.jobAt : lead.inspectionAt;
        const end = type === "job" ? lead.jobEndAt : lead.inspectionEndAt;
        if (!start?.includes("T")) continue;
        const storedSegments = type === "job" ? lead.jobWorkSegments : lead.inspectionWorkSegments;
        let segments;
        try { segments = storedSegments?.length ? storedSegments : end ? bookingSegments(type, start.slice(0, 16), end, bookingRules) : [{ date: start.slice(0, 10), time: start.slice(11, 16), scheduledMinutes: savedLeadBookingMinutes(lead, type) }]; }
        catch { segments = [{ date: start.slice(0, 10), time: start.slice(11, 16), scheduledMinutes: savedLeadBookingMinutes(lead, type) }]; }
        for (const segment of segments) {
          if (!map.has(segment.date)) continue;
          const startMins = parseMinutes(segment.time), durationMins = segment.scheduledMinutes, endMins = startMins + durationMins;
          const clampedStart = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, startMins));
          const clampedEnd = Math.max(TIMELINE_START_MINS, Math.min(TIMELINE_END_MINS, endMins));
          const travel = calculateTravel("Tullamarine", suburb);
          map.get(segment.date)!.push({ lead, type, startTime: segment.time, startMins, durationMins, endMins,
            endTime: fmtMinutesTo12h(endMins), tech: type === "job" ? lead.technician || "Unassigned" : lead.assigned || "Unassigned",
            suburb, travelToMins: travel.durationMinutes, travelToKm: travel.distanceKm,
            title: `${type === "job" ? "Job" : "Inspection"} (${durationMins / 60} hrs)${segments.length > 1 ? " · multi-day" : ""}`,
            serviceLabel: lead.service || "Tile & Grout Service", bookingStatus: visit.status, leftPct: (clampedStart - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS * 100,
            widthPct: Math.max(1, (clampedEnd - clampedStart) / TOTAL_TIMELINE_MINS * 100) });
        }
      }
    }

    for (const [, list] of map) {
      list.sort((a, b) => a.startMins - b.startMins);
    }

    return map;
  }, [scopedLeads, visibleDates, techFilter, searchQuery, bookingRules]);

  // ── Currently Selected Lead ────────────────────────────────────────────────
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const activeLead = useMemo(() => {
    if (!selectedLeadId) return null;
    const lead = scopedLeads.find((l) => l.id === selectedLeadId);
    if (!lead) return null;
    const booking = leadBookings(lead).find(b => b.type === selectedBookingType && (selectedBookingId ? b.bookingId === selectedBookingId : `${b.date}T${b.time}` === selectedStart));
    return booking ? bookingLead(lead, booking) : lead;
  }, [scopedLeads, selectedLeadId, selectedStart, selectedBookingType, selectedBookingId]);

  // Active lead suburb
  const activeLeadSuburb = useMemo(() => {
    if (!activeLead) return "Melbourne";
    return resolveArea(activeLead.address || activeLead.city).suburb || "Melbourne";
  }, [activeLead]);

  const staffRows = useMemo(() => {
    const items = appointmentsByDate.get(selectedDate) || [];
    const roster = [...staffOptions];
    for (const item of items) {
      if (!roster.some(person => person.name === item.tech)) roster.push({ name: item.tech, role: "Assigned staff" });
    }
    return roster.filter(person => techFilter === "all" || person.name === techFilter)
      .map(person => ({ ...person, items: items.filter(item => item.tech === person.name) }));
  }, [staffOptions, appointmentsByDate, selectedDate, techFilter]);

  // Open the exact appointment clicked, including its full multi-day end time.
  useEffect(() => {
    if (!activeLead) return;
    const type = selectedBookingType || (activeLead.inspectionAt ? "inspection" : "job");
    setChangeBookingType(type);
    setChangeBookingTech((type === "job" ? activeLead.technician : activeLead.assigned) || "");
    setChangeBookingService(activeLead.service || "Shower Cubicle Regrouting");
  }, [activeLead, selectedBookingType]);

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
    const duration = appointmentDurationMinutes({ type: changeBookingType }, bookingRules);
    for (let offset = 0; offset < 7 && suggestions.length < 3; offset++) {
      const date = addDaysYmd(selectedDate, offset);
      const time = slotsForDate(bookingRules, changeBookingType, date).filter(time => parseMinutes(time) >= TIMELINE_START_MINS && parseMinutes(time) + duration <= TIMELINE_END_MINS).find((time) => bookingAvailability(
        capacityAppointments.appointments,
        { bookingId: activeLead.activeBooking?.bookingId, leadId: activeLead.id, type: changeBookingType, date, time, durationMinutes: duration,
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

  const bookingDuration = (type: "inspection" | "job") => appointmentDurationMinutes({ type }, bookingRules);

  const leadWorkingMinutes = (lead: Lead, type: "inspection" | "job") => {
    const start = type === "job" ? lead.jobAt : lead.inspectionAt;
    const end = type === "job" ? lead.jobEndAt : lead.inspectionEndAt;
    const storedSegments = type === "job" ? lead.jobWorkSegments : lead.inspectionWorkSegments;
    try { if (start && end) return (storedSegments?.length ? storedSegments : bookingSegments(type, start.slice(0, 16), end, bookingRules)).reduce((sum, row) => sum + row.scheduledMinutes, 0); } catch { /* legacy appointment */ }
    return bookingDuration(type);
  };

  const proposalIssue = (proposal: RescheduleConfirmData, appointments: DayAppointment[]) => {
    try {
      const segments = proposal.endAt ? bookingSegments(proposal.type, `${proposal.newDate}T${proposal.newTime}`, proposal.endAt, bookingRules) : [{ date: proposal.newDate, time: proposal.newTime }];
      for (const segment of segments) {
        const issue = dispatchBookingIssue({ bookingId: proposal.lead.activeBooking?.bookingId, leadId: proposal.lead.id, type: proposal.type, ...segment,
          assigned: proposal.type === "inspection" ? proposal.technician || proposal.lead.assigned : undefined,
          inspectorId: proposal.type === "inspection" && !proposal.technician ? proposal.lead.inspectorId : undefined,
          technician: proposal.technician || proposal.lead.technician,
          technicianId: proposal.technician ? undefined : proposal.lead.technicianId,
          technicianUsername: proposal.technician ? undefined : proposal.lead.technicianUsername,
        }, appointments, bookingRules, assignableTechnicians);
        if (issue) return `${segment.date}: ${issue}`;
      }
      return null;
    } catch (error) { return error instanceof Error ? error.message : "Invalid booking time."; }
  };

  const stageReschedule = (proposal: RescheduleConfirmData) => {
    try {
      if (!proposal.endAt) proposal.endAt = bookingEndForDuration(proposal.type, `${proposal.newDate}T${proposal.newTime}`, leadWorkingMinutes(proposal.lead, proposal.type), bookingRules);
    } catch (error) { setActionNotice(error instanceof Error ? error.message : "Invalid time."); return; }
    if (capacityAppointments?.date !== selectedDate) { setActionNotice("Availability is still loading. Please try again shortly."); return; }
    const issue = proposalIssue(proposal, capacityAppointments.appointments);
    if (issue) { setActionNotice(issue); return; }
    setRescheduleError(null);
    setConfirmRescheduleData(proposal);
  };

  const startBookingDrag = (event: DragEvent<HTMLDivElement>, lead: Lead, type: "inspection" | "job", fromTimeline = true) => {
    const workingMinutes = leadWorkingMinutes(lead, type);
    const duration = workingMinutes > TOTAL_TIMELINE_MINS ? bookingDuration(type) : workingMinutes;
    const rect = event.currentTarget.getBoundingClientRect();
    const grabOffset = fromTimeline ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * duration : 0;
    event.dataTransfer.setData("application/x-groutix-booking", `${lead.id}:${type}`);
    event.dataTransfer.effectAllowed = "move";
    setDragBooking({ lead, type, duration, grabOffset });
    setSelectedLeadId(lead.id);
    setSelectedBookingType(type);
  };

  const previewBookingDrop = (event: DragEvent<HTMLDivElement>, date: string, staffName: string) => {
    if (!dragBooking || isSavingBooking || confirmRescheduleData) return null;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = dispatchDropMinutes((event.clientX - rect.left) / rect.width,
      TIMELINE_START_MINS, TIMELINE_END_MINS, dragBooking.duration, dragBooking.grabOffset);
    const eligible = dragBooking.type === "job" ? assignableTechnicians : inspectionStaff;
    if (!eligible.some(person => person.active && person.name === staffName)) return null;
    return { date, minutes, duration: dragBooking.duration, staffName };
  };

  const dropBooking = (event: DragEvent<HTMLDivElement>, date: string, staffName: string) => {
    const preview = previewBookingDrop(event, date, staffName);
    if (!dragBooking || !preview) return;
    const { lead, type } = dragBooking;
    stageReschedule({ lead, type, oldDateTime: type === "job" ? lead.jobAt : lead.inspectionAt,
      newDate: date, newTime: fromMinutes(preview.minutes),
      technician: staffName, service: lead.service });
    setDragBooking(null);
    setDropPreview(null);
  };

  const resizeEnd = (event: PointerEvent<HTMLButtonElement>, resize: BookingResize) =>
    dispatchResizeEndMinutes((event.clientX - resize.initialX) / resize.trackWidth, resize.originalEnd, resize.minimumEnd, TIMELINE_END_MINS);

  const finishBookingResize = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!resizeBooking || event.pointerId !== resizeBooking.pointerId) return;
    const resize = resizeBooking;
    const endMinutes = resizeEnd(event, resize);
    setResizeBooking(null);
    if (endMinutes === resize.originalEnd) return;
    const start = resize.type === "job" ? resize.lead.jobAt : resize.lead.inspectionAt;
    if (!start) return;
    stageReschedule({ lead: resize.lead, type: resize.type, oldDateTime: start,
      newDate: start.slice(0, 10), newTime: start.slice(11, 16), endAt: `${resize.date}T${fromMinutes(endMinutes)}`,
      technician: resize.type === "job" ? resize.lead.technician : resize.lead.assigned, service: resize.lead.service });
  };

  // ── Book / Schedule Slot Handler (opens confirmation modal) ────────────────
  const handleBookSlot = async (slot: (typeof suggestedSlots)[0]) => {
    if (!activeLead) return;
    const newTime = slot.startIsoTime.split("T")[1];
    const oldDateTime = changeBookingType === "inspection" ? activeLead.inspectionAt : activeLead.jobAt;
    stageReschedule({
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
    setRescheduleError(null);
    setIsSavingBooking(true);
    try {
      // Fetch fresh capacity: another dispatcher may have booked the slot while the popup was open.
      const response = await fetch(`/api/admin/slots?from=${confirmRescheduleData.newDate}&to=${confirmRescheduleData.endAt?.slice(0, 10) || confirmRescheduleData.newDate}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not check availability. Please try again.");
      const availability = await response.json();
      const issue = proposalIssue(confirmRescheduleData, availability.appointments);
      if (issue) { setRescheduleError(issue); return; }
      const timeFormatted = (confirmRescheduleData.newTime || "09:00").slice(0, 5).padStart(5, "0");
      const isoDateTime = `${confirmRescheduleData.newDate}T${timeFormatted}`;
      const updates: Partial<Lead> = {};

      if (confirmRescheduleData.type === "inspection") {
        updates.inspectionAt = isoDateTime;
        updates.inspectionEndAt = confirmRescheduleData.endAt;
        if (confirmRescheduleData.endAt) updates.inspectionWorkSegments = bookingSegments("inspection", isoDateTime, confirmRescheduleData.endAt, bookingRules);
        if (!confirmRescheduleData.oldDateTime) updates.status = "Inspection Booked";
        if (confirmRescheduleData.technician && confirmRescheduleData.technician !== "all" && confirmRescheduleData.technician !== "Unassigned") {
          updates.assigned = confirmRescheduleData.technician;
          updates.inspectorId = inspectionStaff.find(person => person.name === confirmRescheduleData.technician)?.id || "";
        }
      } else {
        updates.jobAt = isoDateTime;
        updates.jobEndAt = confirmRescheduleData.endAt;
        if (confirmRescheduleData.endAt) updates.jobWorkSegments = bookingSegments("job", isoDateTime, confirmRescheduleData.endAt, bookingRules);
        if (!confirmRescheduleData.oldDateTime) updates.status = "Job Booked";
        if (confirmRescheduleData.technician && confirmRescheduleData.technician !== "all" && confirmRescheduleData.technician !== "Unassigned") {
          updates.technician = confirmRescheduleData.technician;
          updates.technicianId = assignableTechnicians.find(person => person.name === confirmRescheduleData.technician)?.id || "";
          updates.technicianUsername = assignableTechnicians.find(person => person.name === confirmRescheduleData.technician)?.username || "";
        }
      }

      if (confirmRescheduleData.service) updates.service = confirmRescheduleData.service;

      const saveResponse = await fetch(`/api/admin/submissions/${confirmRescheduleData.lead.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, bookingId: confirmRescheduleData.lead.activeBooking?.bookingId, bookingOriginalStart: confirmRescheduleData.oldDateTime?.slice(0, 16), bookingNotifications: true }),
      });
      const saved = await saveResponse.json();
      if (saveResponse.ok) {
        upsertLead(saved.item || { ...confirmRescheduleData.lead, ...updates });
        setSelectedDate(confirmRescheduleData.newDate);
        setBookingSuccess(
          `✓ ${confirmRescheduleData.oldDateTime ? "Rescheduled" : "Booked"} ${confirmRescheduleData.lead.name || "Customer"} for ${fmtReadableDate(confirmRescheduleData.newDate)} at ${fmtScheduleTime(timeFormatted)}. ${(saved.notificationWarnings || []).join(" ")}`
        );

        setIsChangeBookingOpen(false);
        setConfirmRescheduleData(null);
      } else {
        setRescheduleError(saved.error || "The booking could not be saved. Please choose another time or try again.");
      }
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Could not save the booking. Please try again.");
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
  const handlePrevDate = () => setSelectedDate(addDaysYmd(selectedDate, -1));
  const handleNextDate = () => setSelectedDate(addDaysYmd(selectedDate, 1));

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden font-sans text-slate-800" style={{ height: "calc(100dvh - 112px)", minHeight: 320 }}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/90 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[160px] max-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, jobs, customers..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Center: Daily date navigator */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDate}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer transition-colors"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <DispatchDatePicker value={selectedDate} today={todayStr} onChange={setSelectedDate} />
            <button
              type="button"
              onClick={handleNextDate}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer transition-colors"
              title="Next day"
              aria-label="Next day"
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

          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 whitespace-nowrap">
            Day
          </span>
          <button type="button" onClick={() => setNewBooking({ date: selectedDate, time: "09:00" })}
            className="rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus className="h-4 w-4" />New booking</button>
        </div>

        {/* Right: Staff selector dropdown & Settings gear */}
        <div className="flex items-center gap-2">
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="max-w-[180px] text-xs font-bold px-2 py-1.5 bg-white border border-slate-200/90 rounded-xl text-slate-800 outline-none cursor-pointer hover:border-slate-300 shadow-2xs"
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
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold shrink-0">
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
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

      {/* ── DISPATCH TIMELINE AND OPTIONAL BOOKING EDITOR ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ 2. RIGHT PANEL: DAILY STAFF TIMELINE ═══════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          <p className="px-3 py-1.5 text-[11px] text-slate-500">Right-click or drag across empty space to choose a booking start time. Drag a booking to reschedule, or drag its right edge to resize in 30-minute steps. Changes require confirmation.</p>
          {/* ── TIMELINE SCHEDULE GRID ─────────────────────────────────────────── */}
          <div className="flex flex-col bg-slate-50/40 flex-1 min-h-0">
            <div className="flex-1 overflow-x-auto overflow-y-auto min-w-0">
              <div className="w-full min-w-[580px] flex flex-col bg-white">

                {/* Grid Header Row: Hourly Columns */}
                <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 shadow-2xs">
                  {/* Staff column header */}
                  <div className="w-32 shrink-0 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 border-r border-slate-200 flex items-center bg-white sticky left-0 z-30">
                    Team member
                  </div>
                  {/* Hourly headers across 9 AM to 5 PM */}
                  <div className="flex-1 relative h-8 mx-1 sm:mx-1.5">
                    {HOUR_SLOTS.map((slot) => (
                      <div
                        key={slot.hour}
                        style={{ left: `${((slot.hour * 60 - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100}%`, transform: slot.hour * 60 === TIMELINE_START_MINS ? "none" : slot.hour * 60 === TIMELINE_END_MINS ? "translateX(-100%)" : "translateX(-50%)" }}
                        className="absolute whitespace-nowrap py-1.5 text-[10.5px] font-bold text-slate-700"
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>
                </div>

                {staffRows.length === 0 && <p className="p-6 text-sm text-slate-500">No technicians or inspectors match this filter.</p>}

                {/* Staff rows for the selected day */}
                {staffRows.map((row) => {
                  const date = selectedDate;
                  const items = row.items;
                  const initialType = row.role === "Technician" ? "job" as const : "inspection" as const;
                  const laneEnds: number[] = [];
                  const lanes = items.map(item => {
                    let lane = laneEnds.findIndex(end => end <= item.startMins);
                    if (lane < 0) lane = laneEnds.length;
                    laneEnds[lane] = item.endMins;
                    return lane;
                  });

                  return (
                    <div
                      key={row.name}
                      className="flex border-b border-slate-200/90 min-h-[60px] group transition-colors relative"
                    >
                      {/* Staff name remains visible when scrolling the timeline */}
                      <div
                        className="w-32 shrink-0 p-2 border-r border-slate-200 flex flex-col justify-center sticky left-0 z-20 bg-slate-50 text-slate-800"
                      >
                        <div className="text-xs font-extrabold leading-tight break-words">{row.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{row.role}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{items.length} booking{items.length !== 1 ? "s" : ""}</div>
                      </div>

                      {/* Timeline Slot Track Area (Positioned Exactly from 9 AM to 5 PM) */}
                      <div className="flex-1 relative flex items-center p-1 sm:p-1.5 min-h-[60px]">
                        {/* Each row uses the same time coordinates for grid, cards and drops. */}
                        <div data-dispatch-track className="relative w-full" style={{ height: Math.max(74, laneEnds.length * 74) }}
                          onContextMenu={event => {
                            if ((event.target as HTMLElement).closest('[draggable="true"]')) return;
                            event.preventDefault();
                            const rect = event.currentTarget.getBoundingClientRect();
                            setNewBooking({ date, staffName: row.name, initialType, time: fromMinutes(dispatchDropMinutes((event.clientX - rect.left) / rect.width, TIMELINE_START_MINS, TIMELINE_END_MINS, bookingRules.inspection.slotMinutes)) });
                          }}
                          onPointerDown={event => {
                            if (event.button !== 0 || (event.target as HTMLElement).closest('[draggable="true"], button, [data-slot-action]')) return;
                            const rect = event.currentTarget.getBoundingClientRect();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            setNewTimeSelection({ date, staffName: row.name, minutes: dispatchDropMinutes((event.clientX - rect.left) / rect.width, TIMELINE_START_MINS, TIMELINE_END_MINS, bookingRules.inspection.slotMinutes) });
                          }}
                          onPointerMove={event => {
                            if (!newTimeSelection || newTimeSelection.staffName !== row.name) return;
                            const rect = event.currentTarget.getBoundingClientRect();
                            setNewTimeSelection({ date, staffName: row.name, minutes: dispatchDropMinutes((event.clientX - rect.left) / rect.width, TIMELINE_START_MINS, TIMELINE_END_MINS, bookingRules.inspection.slotMinutes) });
                          }}
                          onPointerUp={() => {
                            if (!newTimeSelection) return;
                            setNewBooking({ date, staffName: row.name, initialType, time: fromMinutes(newTimeSelection.minutes) });
                            setNewTimeSelection(null);
                          }}
                          onPointerCancel={() => setNewTimeSelection(null)}
                          onDragOver={(event) => { const preview = previewBookingDrop(event, date, row.name); if (preview) setDropPreview(preview); }}
                          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropPreview(null); }}
                          onDrop={(event) => dropBooking(event, date, row.name)}>
                          {HOUR_SLOTS.map(slot => <div key={slot.hour} className="absolute inset-y-0 border-l border-slate-100 pointer-events-none"
                            style={{ left: `${((slot.hour * 60 - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100}%` }} />)}
                          {newTimeSelection?.staffName === row.name && <div className="absolute inset-y-0 z-30 pointer-events-none rounded-lg border-2 border-blue-500 bg-blue-100/90 p-2 text-xs font-bold text-blue-900"
                            style={{ left: `${(newTimeSelection.minutes - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS * 100}%`, width: `${bookingRules.inspection.slotMinutes / TOTAL_TIMELINE_MINS * 100}%` }}>{fmtMinutesFull(newTimeSelection.minutes)}</div>}
                          {dropPreview?.staffName === row.name && <div className="absolute inset-y-0 rounded-lg border-2 border-dashed border-blue-500 bg-blue-100/80 z-30 pointer-events-none text-[10px] font-bold text-blue-900 p-1"
                            style={{ left: `${(dropPreview.minutes - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS * 100}%`, width: `${dropPreview.duration / TOTAL_TIMELINE_MINS * 100}%` }}>
                            {fmtMinutesFull(dropPreview.minutes)} – {fmtMinutesFull(dropPreview.minutes + dropPreview.duration)}
                          </div>}
                          {items.length === 0 ? (
                            /* Full-Day Available Slot */
                            <div
                              style={{ left: "10%", width: "80%" }}
                              className="absolute top-0.5 bottom-0.5 rounded-xl border-2 border-dashed border-emerald-400/90 bg-emerald-50/40 hover:bg-emerald-50/80 flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-all z-10"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                              <div className="text-[11px] font-bold text-emerald-800">No bookings</div>
                              <div className="text-[9px] font-semibold text-emerald-700">Click or drag here to create a booking</div>
                            </div>
                          ) : (
                            <>
                              {items.map((item, idx) => {
                                const isInsp = item.type === "inspection";
                                const isSelected = item.lead.id === selectedLeadId;
                                const nextItem = items[idx + 1];
                                const resizing = resizeBooking?.lead.id === item.lead.id && resizeBooking.type === item.type && resizeBooking.date === date;
                                const shownEnd = resizing ? resizeBooking.endMinutes : item.endMins;
                                const actualEnd = item.type === "job" ? item.lead.jobEndAt : item.lead.inspectionEndAt;
                                const canResize = (!actualEnd || actualEnd.slice(0, 10) === date) && item.endMins > TIMELINE_START_MINS && item.endMins <= TIMELINE_END_MINS && item.startMins + 30 <= TIMELINE_END_MINS;
                                const shownWidth = resizing ? Math.max(1, (shownEnd - Math.max(TIMELINE_START_MINS, item.startMins)) / TOTAL_TIMELINE_MINS * 100) : item.widthPct;

                                // Calculate travel gap pill placement between this and next appointment
                                const gapStartPct = item.leftPct + item.widthPct;
                                const gapWidthPct = nextItem ? Math.max(0, nextItem.leftPct - gapStartPct) : 0;
                                const gapMins = nextItem ? nextItem.startMins - item.endMins : 0;

                                return (
                                  <div key={`${item.lead.id}-${idx}`}>
                                    {/* Appointment Card */}
                                    <div
                                      draggable={!resizeBooking && !isSavingBooking && !confirmRescheduleData}
                                      onDragStart={(event) => startBookingDrag(event, item.lead, item.type)}
                                      onDragEnd={() => { setDragBooking(null); setDropPreview(null); }}
                                      title={`${item.lead.name || "Customer"}: ${fmtMinutesFull(item.startMins)} – ${fmtMinutesFull(item.endMins)}. Drag to reschedule.`}
                                      onClick={() => {
                                        setSelectedLeadId(item.lead.id);
                                        setSelectedBookingType(item.type);
                                        setSelectedBookingId(item.lead.activeBooking?.bookingId || null);
                                        setSelectedStart((item.type === "job" ? item.lead.jobAt : item.lead.inspectionAt)?.slice(0, 16) || null);
                                        setIsChangeBookingOpen(true);
                                      }}
                                      style={{
                                        left: `${item.leftPct}%`,
                                        width: `${shownWidth}%`,
                                        top: lanes[idx] * 74 + 2, height: 70,
                                      }}
                                      className={`absolute min-w-0 p-1.5 pr-3.5 rounded-xl border transition-colors cursor-grab active:cursor-grabbing shadow-2xs z-10 overflow-hidden flex flex-col justify-between ${
                                        isInsp
                                          ? "bg-sky-50/95 border-sky-300 text-sky-950 hover:bg-sky-100"
                                          : "bg-emerald-50/95 border-emerald-300 text-emerald-950 hover:bg-emerald-100"
                                      } ${isSelected ? "ring-2 ring-blue-500 shadow-xs z-20" : ""}`}
                                    >
                                      <div>
                                        {/* Top: Time span & Car icon */}
                                        <div className="flex items-center justify-between text-[9.5px] font-extrabold mb-0.5">
                                          <span className={isInsp ? "text-blue-700" : "text-emerald-700"}>
                                            {fmtMinutesTo12h(item.startMins)} – {fmtMinutesTo12h(shownEnd)}
                                          </span>
                                          <Car className="w-3 h-3 opacity-60 shrink-0" />
                                        </div>

                                        {/* Title */}
                                        <div className={`text-[10.5px] font-extrabold leading-tight truncate ${isInsp ? "text-blue-900" : "text-emerald-900"}`}>
                                          {isInsp ? "Inspection" : "Job"} · {item.lead.name || "Customer"}
                                        </div>

                                        {/* Customer Name or Service */}
                                        <div className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                                          {item.bookingStatus} · {item.serviceLabel}
                                        </div>

                                        {/* Suburb */}
                                        <div className="text-[9px] text-slate-500 font-medium truncate leading-tight">
                                          {item.suburb} · {item.travelToMins}m travel
                                        </div>
                                      </div>
                                      {canResize && <button type="button" draggable={false}
                                        aria-label={`Resize ${item.type} for ${item.lead.name || "Customer"} in 30-minute steps`}
                                        title="Drag right to extend or left to shorten · 30-minute steps"
                                        disabled={isSavingBooking || !!confirmRescheduleData}
                                        className={`absolute right-0 inset-y-0 w-3 flex items-center justify-center cursor-ew-resize touch-none select-none border-l ${isInsp ? "border-sky-200 bg-sky-200/60 hover:bg-sky-300" : "border-emerald-200 bg-emerald-200/60 hover:bg-emerald-300"}`}
                                        onClick={event => event.stopPropagation()}
                                        onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
                                        onPointerDown={event => {
                                          if (event.button !== 0) return;
                                          event.preventDefault(); event.stopPropagation();
                                          const track = event.currentTarget.closest('[data-dispatch-track]') as HTMLElement | null;
                                          if (!track || track.getBoundingClientRect().width <= 0) return;
                                          event.currentTarget.setPointerCapture(event.pointerId);
                                          setResizeBooking({ lead: item.lead, type: item.type, date, pointerId: event.pointerId,
                                            initialX: event.clientX, trackWidth: track.getBoundingClientRect().width,
                                            originalEnd: item.endMins, minimumEnd: Math.max(TIMELINE_START_MINS, item.startMins + 30), endMinutes: item.endMins });
                                        }}
                                        onPointerMove={event => {
                                          event.stopPropagation();
                                          if (resizeBooking && event.pointerId === resizeBooking.pointerId) setResizeBooking({ ...resizeBooking, endMinutes: resizeEnd(event, resizeBooking) });
                                        }}
                                        onPointerUp={finishBookingResize}
                                        onPointerCancel={event => { event.stopPropagation(); setResizeBooking(null); }}
                                        onLostPointerCapture={() => setResizeBooking(null)}
                                      ><span className="h-5 w-0.5 rounded-full bg-current opacity-50" /></button>}
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
                                const suggestion = activeLead && changeBookingTech === row.name ? suggestedSlots.find((slot) => slot.dateStr === date) : undefined;
                                const availStartMins = suggestion ? parseMinutes(suggestion.startIsoTime.split("T")[1]) : 0;
                                if (lastItem && suggestion && availStartMins >= lastItem.endMins) {
                                  const availStartPct = ((availStartMins - TIMELINE_START_MINS) / TOTAL_TIMELINE_MINS) * 100;
                                  const availWidthPct = Math.max(12, 100 - availStartPct);

                                  return (
                                    <div data-slot-action
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
            <div className="bg-white border-t border-slate-200 px-3 py-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-600 font-semibold shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400 inline-block" />
                <span>Inspection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400 inline-block" />
                <span>Job (reserved working time)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border-2 border-dashed border-emerald-500 bg-emerald-50 inline-block" />
                <span>Available Slot</span>
              </div>
            </div>
          </div>


        </div>
      </div>

      {activeLead && isChangeBookingOpen && <EditBookingModal key={`${activeLead.id}:${activeLead.activeBooking?.bookingId || selectedBookingType || changeBookingType}`}
        lead={activeLead} type={selectedBookingType || changeBookingType} initialDate={selectedDate}
        onClose={() => { setIsChangeBookingOpen(false); setSelectedLeadId(null); }}
        onSaved={(date, message) => { setIsChangeBookingOpen(false); setSelectedLeadId(null); setSelectedDate(date); setBookingSuccess(message); }} />}

      {newBooking && <DispatchBookingModal {...newBooking} onClose={() => setNewBooking(null)} onBooked={(date, message) => {
        setNewBooking(null); setSelectedDate(date); setBookingSuccess(message);
      }} />}

      {/* ── RESCHEDULE CONFIRMATION MODAL ─────────────────────────────────────── */}
      {confirmRescheduleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog" aria-modal="true" aria-labelledby="dispatch-reschedule-title"
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
                  <h3 id="dispatch-reschedule-title" className="text-sm font-bold text-slate-900 leading-tight">Confirm Reschedule</h3>
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
                        {fmtScheduleTime(confirmRescheduleData.newTime)} → {confirmRescheduleData.endAt ? `${fmtReadableDate(confirmRescheduleData.endAt.slice(0, 10))} ${fmtScheduleTime(confirmRescheduleData.endAt.slice(11, 16))}` : fmtMinutesFull(parseMinutes(confirmRescheduleData.newTime) + bookingDuration(confirmRescheduleData.type))}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Proposed timing
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

              {rescheduleError && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">{rescheduleError}</p>}
              {/* Notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  After you confirm, the dispatch calendar and customer record will be updated. Booking or rescheduling confirmations will be sent to the customer’s saved email and phone through the configured services.
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
