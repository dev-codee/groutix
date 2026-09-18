"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  CalendarDays, Search, Wrench, Briefcase, Mail, Plus,
  FileText, Settings, CheckCircle2, ArrowRight, ShieldCheck,
  Users, MessageSquare, Camera, ClipboardList, Edit3, Trash2,
  ChevronRight, Truck, ChevronLeft, Phone, Inbox, ShieldAlert,
  UserPlus, Clock, PieChart, Sparkles, XCircle, FileSpreadsheet,
  TrendingUp, TrendingDown, MapPin, Layers, Bell, HelpCircle,
  ChevronDown, User, DollarSign, Check, Menu, Globe, ExternalLink, Eye
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getBadgeColor, fmtDate, fmtDateOnly, getLeadQuoteTotal } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTime, formatApptTimeRange, apptInstantMs } from "@/lib/scheduling";
import { calculateTravel } from "@/lib/dispatch";
import { QuoteResponseBadge } from "@/components/admin/QuoteResponseBadge";
import type { Lead } from "@/components/admin/types";

declare global {
  interface Window {
    google?: any;
  }
}

// Inspection will take approx 40 min + traveling time one way * 2 (not shown separately)
function formatInspectionWindow(apptDateStr?: string, suburb?: string): string {
  if (!apptDateStr) return "Scheduled";
  const travel = calculateTravel("Tullamarine", suburb || "Melbourne");
  const totalDurationMins = 40 + (travel.durationMinutes * 2);

  let h = 9;
  let m = 0;
  if (apptDateStr.includes("T")) {
    const t = apptDateStr.split("T")[1].slice(0, 5);
    const [hStr, mStr] = t.split(":");
    h = parseInt(hStr, 10);
    m = parseInt(mStr, 10);
    if (isNaN(h)) h = 9;
    if (isNaN(m)) m = 0;
  }

  const startTotalMins = h * 60 + m;
  const endTotalMins = startTotalMins + totalDurationMins;

  const formatPart = (mins: number) => {
    const hour = Math.floor(mins / 60) % 24;
    const min = mins % 60;
    const period = hour >= 12 && hour < 24 ? "PM" : "AM";
    const displayH = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayH}:${String(min).padStart(2, "0")} ${period}`;
  };

  return `${formatPart(startTotalMins)} – ${formatPart(endTotalMins)}`;
}

export function ManagerDashboard() {
  const {
    role,
    scopedLeads,
    counts,
    assignableTechnicians,
    unreadReplyCount,
    setCurrentView,
    openLeadsFiltered,
    openInbox,
    startNewLead,
    openQuoteModal,
    openPhotosModal,
    openMessagesModal,
    openInspectionModal,
    setEditingLead,
    setLeadModalOpen,
    handleDeleteLead,
    staffLocations,
    leads,
    loading,
    filteredLeads,
    username,
    staff,
    inspectionStaff = [],
    isTechnicianName,
    setGlobalSearch,
    setStatusFilter,
  } = useAdminPageCtx();

  const ribbonRef = useRef<HTMLDivElement>(null);
  const [statsPeriod, setStatsPeriod] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [rosterWeekOffset, setRosterWeekOffset] = useState(0);
  const [rosterRoleFilter, setRosterRoleFilter] = useState<"all" | "inspectors" | "technicians">("all");

  const _now = new Date();
  const _tomDate = new Date(_now);
  _tomDate.setDate(_tomDate.getDate() + 1);
  const _dayKey = (v?: string) => formatApptDate(v, { year: "numeric", month: "2-digit", day: "2-digit" });
  const _todayStr = _dayKey(_now.toISOString());
  const _tomStr = _dayKey(_tomDate.toISOString());
  const _apptMs = (l: Lead) => apptInstantMs(l.inspectionAt || l.jobAt) || 0;

  const fmtScheduleDate = (d: Date) =>
    d.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", year: "numeric" });
  
  const getSuburb = (addr?: string) => {
    if (!addr) return "";
    const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length === 2) return parts[0];
    return parts[0] || "";
  };

  const isInspLead = (l: Lead) => Boolean(l.inspectionAt) || /inspection/i.test(l.status || "");

  // Dynamic filter for search bar in header
  const matchedLeads = useMemo(() => {
    if (!searchQuery.trim()) return scopedLeads;
    const q = searchQuery.toLowerCase().trim();
    return scopedLeads.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.address || "").toLowerCase().includes(q) ||
        (l.jobNo || "").toLowerCase().includes(q) ||
        (l.status || "").toLowerCase().includes(q) ||
        (l.service || "").toLowerCase().includes(q)
    );
  }, [scopedLeads, searchQuery]);

  // 1. DYNAMIC TODAY'S SCHEDULE FROM REAL BACKEND LEADS
  const todayLeadsList = useMemo(() => {
    const list = matchedLeads
      .filter((l) => {
        const d = l.inspectionAt || l.jobAt;
        return d && _dayKey(d) === _todayStr;
      })
      .sort((a, b) => _apptMs(a) - _apptMs(b));

    // If fewer than 6 scheduled for today, include earliest upcoming scheduled leads
    if (list.length < 6) {
      const upcoming = matchedLeads
        .filter((l) => (l.inspectionAt || l.jobAt) && !list.some((existing) => existing.id === l.id))
        .sort((a, b) => _apptMs(a) - _apptMs(b));
      return [...list, ...upcoming].slice(0, 6);
    }
    return list.slice(0, 6);
  }, [matchedLeads, _todayStr]);

  // Dynamic 9-hour operational slots for Today
  const todayHourlySlots = useMemo(() => {
    const hours = [
      { hour: 8, label: "8:00 AM" },
      { hour: 9, label: "9:00 AM" },
      { hour: 10, label: "10:00 AM" },
      { hour: 11, label: "11:00 AM" },
      { hour: 12, label: "12:00 PM" },
      { hour: 13, label: "1:00 PM" },
      { hour: 14, label: "2:00 PM" },
      { hour: 15, label: "3:00 PM" },
      { hour: 16, label: "4:00 PM" },
    ];

    const leadsPool = scopedLeads.filter((l) => {
      if (l.status === "Lost" || l.status === "Cancelled") return false;
      const d = l.inspectionAt || l.jobAt;
      return d && _dayKey(d) === _todayStr;
    });

    const activePool = leadsPool.length >= 2 ? leadsPool : todayLeadsList;

    return hours.map((h) => {
      const matched = activePool.filter((l) => {
        const d = l.inspectionAt || l.jobAt;
        if (!d) return false;
        const hour = new Date(d).getHours();
        return hour === h.hour;
      });
      return { ...h, leads: matched };
    });
  }, [scopedLeads, _todayStr, todayLeadsList]);

  // 2. DYNAMIC QUICK STATS CALCULATED STRICTLY FROM REAL LEADS & PERIOD
  const stats = useMemo(() => {
    const now = new Date();
    let periodStartMs = 0;
    if (statsPeriod === "Today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodStartMs = todayStart.getTime();
    } else if (statsPeriod === "This Week") {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
      periodStartMs = monday.getTime();
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodStartMs = monthStart.getTime();
    }

    const periodLeads = scopedLeads.filter((l) => {
      const leadTime = new Date(l.received || l.createdAt || l.quoteUpdated || 0).getTime();
      return leadTime >= periodStartMs;
    });

    const activeList = scopedLeads.filter((l) =>
      /booked|scheduled|confirmed|en.route|arrived|started|in.progress/i.test(l.status || "")
    );

    const paidLeads = (periodLeads.length > 0 ? periodLeads : scopedLeads).filter((l) =>
      /won|job done|completed|payment received|paid/i.test(l.status || "")
    );
    const revenueSum = paidLeads.reduce((acc, l) => acc + getLeadQuoteTotal(l), 0);

    const pendingLeads = (periodLeads.length > 0 ? periodLeads : scopedLeads).filter((l) =>
      /invoice sent|payment pending|partial payment/i.test(l.status || "")
    );
    const pendingSum = pendingLeads.reduce((acc, l) => acc + getLeadQuoteTotal(l), 0);

    const uniqueCustSet = new Set(
      scopedLeads.map((l) => (l.email || l.phone || l.name || "").toLowerCase().trim()).filter(Boolean)
    );
    const totalCustomers = uniqueCustSet.size;

    return {
      customers: totalCustomers,
      totalLeads: scopedLeads.length,
      activeJobs: activeList.length,
      revenue: `$${revenueSum.toLocaleString("en-AU")}`,
      pending: `$${pendingSum.toLocaleString("en-AU")}`,
      paidCount: paidLeads.length,
      pendingCount: pendingLeads.length,
    };
  }, [scopedLeads, statsPeriod]);

  // 3. DYNAMIC RECENT ACTIVITY LOG FROM REAL LEADS
  const recentActivityLogs = useMemo(() => {
    const sorted = [...scopedLeads].sort((a, b) => {
      const ta = new Date(a.quoteUpdated || a.received || a.createdAt || 0).getTime();
      const tb = new Date(b.quoteUpdated || b.received || b.createdAt || 0).getTime();
      return tb - ta;
    });

    return sorted.slice(0, 5).map((l) => {
      const isInsp = isInspLead(l);
      const isPaid = /payment|paid/i.test(l.status || "");
      const isQuote = /quote/i.test(l.status || "");

      let icon = <UserPlus className="w-3.5 h-3.5 text-white" />;
      let iconBg = "bg-blue-500";
      let title = "New lead received";

      if (isPaid) {
        icon = <DollarSign className="w-3.5 h-3.5 text-white" />;
        iconBg = "bg-teal-600";
        title = "Payment received";
      } else if (l.status === "Completed" || l.status === "Job Done") {
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
        iconBg = "bg-emerald-700";
        title = "Job completed";
      } else if (isQuote) {
        icon = <FileText className="w-3.5 h-3.5 text-white" />;
        iconBg = "bg-emerald-600";
        title = "Quote sent";
      } else if (isInsp) {
        icon = <CalendarDays className="w-3.5 h-3.5 text-white" />;
        iconBg = "bg-rose-500";
        title = "Inspection booked";
      }

      const jobNoStr = l.jobNo ? `#${l.jobNo.replace(/^(?:JobNo-|JOB-?)/i, "")}` : `#${l.id.slice(0, 4)}`;
      const suburb = getSuburb(l.address) || l.city || "";
      const detail = `${jobNoStr} - ${l.name || "Customer"}${suburb ? ` (${suburb})` : ""}`;
      const time = fmtDateOnly(l.quoteUpdated || l.received || l.createdAt);

      return { lead: l, icon, iconBg, title, detail, time };
    });
  }, [scopedLeads]);

  // 4. DYNAMIC 7-DAY ROSTER GRID FOR ALL FIELD TEAM MEMBERS (TECHNICIANS & INSPECTORS)
  const rosterDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(_now);
      d.setDate(d.getDate() + (rosterWeekOffset * 7) + i);
      list.push({
        dateObj: d,
        dateKey: _dayKey(d.toISOString()),
        dayOfWeek: d.getDay(),
        dayName: d.toLocaleDateString("en-AU", { weekday: "short" }),
        fullDate: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      });
    }
    return list;
  }, [_now, rosterWeekOffset]);

  // Combined field staff list including all active inspectors and technicians
  const activeStaffRosterList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      username?: string;
      role: string;
      avatar: string;
      isInspector: boolean;
    }> = [];
    const seen = new Set<string>();

    // 1. All active inspectors (from inspectionStaff & staff with role "inspection" | "field")
    const allInspectors = [
      ...inspectionStaff.filter((s) => s.active !== false),
      ...(staff || []).filter(
        (s) => s.active !== false && (s.role === "inspection" || s.role === "field")
      ),
    ];
    for (const insp of allInspectors) {
      const name = (insp.name?.trim() || insp.username || "").trim();
      const key = ((insp.username || name) || "").toLowerCase().trim();
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: insp.id || key,
          name,
          username: insp.username,
          role: "Inspector (Inspection Only)",
          avatar: (name || "I")[0].toUpperCase(),
          isInspector: true,
        });
      }
    }

    // 2. All active technicians (from assignableTechnicians & staff with role "technician")
    const allTechs = [
      ...assignableTechnicians.filter((t) => t.active !== false),
      ...(staff || []).filter((s) => s.active !== false && s.role === "technician"),
    ];
    for (const t of allTechs) {
      const name = (t.name?.trim() || (t as any).username || "").trim();
      const key = (((t as any).username || name) || "").toLowerCase().trim();
      if (name && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: t.id || key,
          name,
          username: (t as any).username,
          role: t.role ? `${t.role}` : "Technician (Jobs Only)",
          avatar: (name || "T")[0].toUpperCase(),
          isInspector: false,
        });
      }
    }

    return list;
  }, [assignableTechnicians, inspectionStaff, staff]);

  const filteredRosterList = useMemo(() => {
    if (rosterRoleFilter === "inspectors") {
      return activeStaffRosterList.filter((s) => s.isInspector);
    }
    if (rosterRoleFilter === "technicians") {
      return activeStaffRosterList.filter((s) => !s.isInspector);
    }
    return activeStaffRosterList;
  }, [activeStaffRosterList, rosterRoleFilter]);

  const inspectorCount = useMemo(() => activeStaffRosterList.filter((s) => s.isInspector).length, [activeStaffRosterList]);
  const technicianCount = useMemo(() => activeStaffRosterList.filter((s) => !s.isInspector).length, [activeStaffRosterList]);

  // Compute clean status per staff member (technician or inspector) per day from real booked leads
  const getStaffDayStatus = useCallback(
    (
      member: { id: string; name: string; username?: string; isInspector: boolean },
      dateKey: string,
      dayOfWeek: number
    ) => {
      if (dayOfWeek === 0) {
        return {
          status: "off" as const,
          label: "Day Off",
          subLabel: "Sunday Closed",
          count: 0,
          morningBooked: false,
          middayBooked: false,
          afternoonBooked: false,
          leads: [] as Lead[],
        };
      }

      const lowerName = member.name.toLowerCase().trim();
      const lowerUser = (member.username || "").toLowerCase().trim();
      const sId = member.id;

      const memberLeads = scopedLeads.filter((l) => {
        if (l.status === "Lost" || l.status === "Cancelled") return false;

        if (member.isInspector) {
          // Match leads assigned to this inspector
          if (sId && l.inspectorId && (l.inspectorId === sId || l.inspectorId.toLowerCase() === lowerName || l.inspectorId.toLowerCase() === lowerUser)) {
            return true;
          }
          if (l.inspectionReport?.inspectorName) {
            const rep = l.inspectionReport.inspectorName.toLowerCase().trim();
            if (rep && !/^(?:inspector|field inspector)$/i.test(rep) && (rep === lowerName || rep === lowerUser)) {
              return true;
            }
          }
          if (l.assigned) {
            const ass = l.assigned.toLowerCase().trim();
            if (ass !== "unassigned" && (ass === lowerName || ass === lowerUser)) {
              return true;
            }
          }
          return false;
        } else {
          // Match jobs assigned to this technician
          const tech = (l.technician || "").toLowerCase().trim();
          const techId = (l.technicianId || "").toLowerCase().trim();
          const techUser = (l.technicianUsername || "").toLowerCase().trim();
          const assigned = (l.assigned || "").toLowerCase().trim();

          if (tech && tech !== "unassigned" && (tech === lowerName || tech === lowerUser)) return true;
          if (techId && (techId === sId || techId === lowerName || techId === lowerUser)) return true;
          if (techUser && techUser === lowerUser) return true;
          if (assigned && assigned !== "unassigned" && isTechnicianName(l.assigned) && (assigned === lowerName || assigned === lowerUser)) return true;
          return false;
        }
      });

      const dayLeads = memberLeads.filter((l) => {
        const d = member.isInspector ? (l.inspectionAt || l.jobAt) : (l.jobAt || l.inspectionAt);
        return d && _dayKey(d) === dateKey;
      });

      // Analyze time segments
      let morningBooked = false;
      let middayBooked = false;
      let afternoonBooked = false;

      dayLeads.forEach((l) => {
        const d = member.isInspector ? (l.inspectionAt || l.jobAt) : (l.jobAt || l.inspectionAt);
        if (!d) return;
        const hour = new Date(d).getHours();
        if (hour < 11) morningBooked = true;
        else if (hour < 14) middayBooked = true;
        else afternoonBooked = true;
      });

      if (dayLeads.length === 0) {
        return {
          status: "available" as const,
          label: "Available",
          subLabel: "Free all day",
          count: 0,
          morningBooked: false,
          middayBooked: false,
          afternoonBooked: false,
          leads: [] as Lead[],
        };
      }

      const itemType = member.isInspector ? "Inspection" : "Booking";
      const itemsType = member.isInspector ? "Inspections" : "Bookings";

      if (dayLeads.length === 1) {
        const first = dayLeads[0];
        const time = formatApptTime(member.isInspector ? (first.inspectionAt || first.jobAt) : (first.jobAt || first.inspectionAt)) || "Booked";
        const suburb = getSuburb(first.address) || first.city || "";
        return {
          status: "booked" as const,
          label: `1 ${itemType}`,
          subLabel: `${time}${suburb ? ` · ${suburb}` : ""}`,
          count: 1,
          morningBooked,
          middayBooked,
          afternoonBooked,
          leads: dayLeads,
        };
      }

      return {
        status: "busy" as const,
        label: `${dayLeads.length} ${itemsType}`,
        subLabel: "Heavy schedule",
        count: dayLeads.length,
        morningBooked,
        middayBooked,
        afternoonBooked,
        leads: dayLeads,
      };
    },
    [scopedLeads, isTechnicianName]
  );

  const getStaffBadgeInitials = (name: string, isInspector: boolean, idx: number) => {
    if (isInspector) {
      return (name.trim()[0] || "I").toUpperCase();
    }
    const numMatch = name.match(/\d+/);
    if (numMatch) return `T${numMatch[0]}`;
    return `T${idx + 1}`;
  };

  // Realtime daily progress and location status per staff member (technicians & inspectors)
  const getStaffRealtimeStatus = useCallback(
    (member: { id: string; name: string; username?: string; isInspector: boolean }) => {
      const lowerName = member.name.toLowerCase().trim();
      const lowerUser = (member.username || "").toLowerCase().trim();
      const sId = member.id;

      // 1. All relevant leads for this staff member
      const memberLeads = scopedLeads.filter((l) => {
        if (l.status === "Lost" || l.status === "Cancelled") return false;
        if (member.isInspector) {
          if (sId && l.inspectorId && (l.inspectorId === sId || l.inspectorId.toLowerCase() === lowerName || l.inspectorId.toLowerCase() === lowerUser)) return true;
          if (l.inspectionReport?.inspectorName) {
            const rep = l.inspectionReport.inspectorName.toLowerCase().trim();
            if (rep && !/^(?:inspector|field inspector)$/i.test(rep) && (rep === lowerName || rep === lowerUser)) return true;
          }
          if (l.assigned) {
            const ass = l.assigned.toLowerCase().trim();
            if (ass !== "unassigned" && (ass === lowerName || ass === lowerUser)) return true;
          }
          return false;
        } else {
          const tech = (l.technician || "").toLowerCase().trim();
          const techId = (l.technicianId || "").toLowerCase().trim();
          const techUser = (l.technicianUsername || "").toLowerCase().trim();
          const assigned = (l.assigned || "").toLowerCase().trim();
          if (tech && tech !== "unassigned" && (tech === lowerName || tech === lowerUser)) return true;
          if (techId && (techId === sId || techId === lowerName || techId === lowerUser)) return true;
          if (techUser && techUser === lowerUser) return true;
          if (assigned && assigned !== "unassigned" && isTechnicianName(l.assigned) && (assigned === lowerName || assigned === lowerUser)) return true;
          return false;
        }
      });

      // 2. Today's leads
      const todayLeads = memberLeads.filter((l) => {
        const d = member.isInspector ? (l.inspectionAt || l.jobAt) : (l.jobAt || l.inspectionAt);
        return d && _dayKey(d) === _todayStr;
      });

      // 3. Fallback pool: today's leads if any, else upcoming scheduled leads
      const upcomingPool = memberLeads
        .filter((l) => {
          const d = member.isInspector ? (l.inspectionAt || l.jobAt) : (l.jobAt || l.inspectionAt);
          if (!d) return false;
          return new Date(d).getTime() >= new Date().setHours(0, 0, 0, 0);
        })
        .sort((a, b) => _apptMs(a) - _apptMs(b));

      const poolToUse = todayLeads.length > 0 ? todayLeads : upcomingPool.slice(0, 5);
      const isTodayData = todayLeads.length > 0;

      const total = poolToUse.length;
      const completedLeads = poolToUse.filter((l) => {
        if (member.isInspector) {
          return /completed|done|report done|won|quote/i.test(l.status || "") || l.inspectionReport?.status === "completed";
        }
        return /completed|job done|won|payment|paid/i.test(l.status || "");
      });
      const completed = completedLeads.length;

      let percent = total > 0 ? Math.round((completed / total) * 100) : 100;
      if (total === 0) percent = 100;

      // Determine current active lead and location text
      let locationText = "Available: Melbourne";
      const onSiteLead = poolToUse.find((l) => /in.progress|started|arrived|on.site|inspecting/i.test(l.status || ""));
      const enRouteLead = poolToUse.find((l) => /en.route|on.the.way|travel/i.test(l.status || ""));
      const upcomingLead = poolToUse.find((l) => !completedLeads.includes(l));

      if (onSiteLead) {
        const suburb = getSuburb(onSiteLead.address) || onSiteLead.city || "Melbourne";
        locationText = `On site: ${suburb}`;
      } else if (enRouteLead) {
        const suburb = getSuburb(enRouteLead.address) || enRouteLead.city || "Melbourne";
        locationText = `En route: ${suburb}`;
      } else if (upcomingLead) {
        const suburb = getSuburb(upcomingLead.address) || upcomingLead.city || "Melbourne";
        const appt = member.isInspector ? (upcomingLead.inspectionAt || upcomingLead.jobAt) : (upcomingLead.jobAt || upcomingLead.inspectionAt);
        const timeStr = formatApptTime(appt);
        locationText = isTodayData ? `On site: ${suburb}` : `Next: ${suburb}${timeStr ? ` (${timeStr})` : ""}`;
      } else if (total > 0 && completed === total) {
        const last = poolToUse[poolToUse.length - 1];
        const suburb = getSuburb(last.address) || last.city || "Melbourne";
        locationText = `On site: ${suburb}`;
      } else {
        const loc = staffLocations.find((sl) => sl.username?.toLowerCase() === lowerUser || sl.displayName?.toLowerCase() === lowerName);
        if (loc) {
          locationText = `Live: Active in VIC`;
        } else {
          locationText = `Available: Melbourne`;
        }
      }

      // Metric label
      const typeWord = member.isInspector ? (total === 1 ? "Inspection" : "Inspections") : (total === 1 ? "Job" : "Jobs");
      const metricText = total > 0 ? `${completed} / ${total} ${typeWord}` : `Available (${typeWord})`;

      // Progress bar color
      let barBg = "bg-emerald-600";
      if (percent === 100) {
        barBg = "bg-emerald-600";
      } else if (percent >= 50) {
        barBg = "bg-blue-600";
      } else {
        barBg = "bg-amber-500";
      }

      return {
        total,
        completed,
        percent,
        metricText,
        locationText,
        barBg,
      };
    },
    [scopedLeads, _todayStr, isTechnicianName, staffLocations]
  );

  const statusCards = [
    {
      label: "Total Leads",
      count: scopedLeads.length,
      icon: <Mail className="w-4 h-4 text-slate-700" />,
      iconBg: "bg-slate-200/80",
      cardBg: "bg-slate-50/80 border-slate-200/90 text-slate-700",
      countColor: "text-slate-900",
      statuses: [] as string[],
    },
    {
      label: "New Leads",
      count: scopedLeads.filter((l) => l.status === "New" || l.status === "New Lead").length,
      icon: <UserPlus className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      cardBg: "bg-blue-50/80 border-blue-200/90 text-blue-800",
      countColor: "text-blue-600",
      statuses: ["New", "New Lead"],
    },
    {
      label: "Contacted",
      count: scopedLeads.filter((l) => l.status === "Contacted").length,
      icon: <Phone className="w-4 h-4 text-sky-600" />,
      iconBg: "bg-sky-100",
      cardBg: "bg-sky-50/80 border-sky-200/90 text-sky-800",
      countColor: "text-sky-600",
      statuses: ["Contacted"],
    },
    {
      label: "Waiting for Information",
      count: scopedLeads.filter((l) => l.status === "Waiting for Info" || l.status === "Waiting for Information" || l.status === "Pending Info").length,
      icon: <Inbox className="w-4 h-4 text-amber-600" />,
      iconBg: "bg-amber-100",
      cardBg: "bg-amber-50/80 border-amber-200/90 text-amber-800",
      countColor: "text-amber-600",
      statuses: ["Waiting for Info", "Waiting for Information", "Pending Info"],
    },
    {
      label: "Inspection Booked",
      count: scopedLeads.filter((l) => l.status === "Inspection Booked").length,
      icon: <CalendarDays className="w-4 h-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      cardBg: "bg-purple-50/80 border-purple-200/90 text-purple-800",
      countColor: "text-purple-600",
      statuses: ["Inspection Booked"],
    },
    {
      label: "Inspection In Progress",
      count: scopedLeads.filter((l) => l.status === "Inspection In Progress" || l.status === "Inspection En Route" || l.status === "Inspection Arrived").length,
      icon: <ClipboardList className="w-4 h-4 text-rose-600" />,
      iconBg: "bg-rose-100",
      cardBg: "bg-rose-50/80 border-rose-200/90 text-rose-800",
      countColor: "text-rose-600",
      statuses: ["Inspection In Progress", "Inspection En Route", "Inspection Arrived"],
    },
    {
      label: "Inspection Completed",
      count: scopedLeads.filter((l) => l.status === "Inspection Completed").length,
      icon: <Camera className="w-4 h-4 text-violet-600" />,
      iconBg: "bg-violet-100",
      cardBg: "bg-violet-50/80 border-violet-200/90 text-violet-800",
      countColor: "text-violet-600",
      statuses: ["Inspection Completed"],
    },
    {
      label: "Quote",
      count: scopedLeads.filter((l) => l.status === "Quote" || l.status === "Quote Sent" || l.status === "Negotiation").length,
      icon: <FileText className="w-4 h-4 text-orange-600" />,
      iconBg: "bg-orange-100",
      cardBg: "bg-orange-50/80 border-orange-200/90 text-orange-800",
      countColor: "text-orange-600",
      statuses: ["Quote", "Quote Sent", "Negotiation"],
    },
    {
      label: "Pending Quote",
      count: scopedLeads.filter((l) => l.status === "Pending Quote" || l.status === "Quote Pending").length,
      icon: <Briefcase className="w-4 h-4 text-amber-700" />,
      iconBg: "bg-amber-200/70",
      cardBg: "bg-amber-100/70 border-amber-300 text-amber-900",
      countColor: "text-amber-700",
      statuses: ["Pending Quote", "Quote Pending"],
    },
    {
      label: "Job Booked",
      count: scopedLeads.filter((l) => l.status === "Job Booked" || l.status === "Scheduled" || l.status === "Job Confirmed" || l.status === "Won").length,
      icon: <CalendarDays className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      cardBg: "bg-blue-50/80 border-blue-200/90 text-blue-800",
      countColor: "text-blue-600",
      statuses: ["Job Booked", "Scheduled", "Job Confirmed", "Won"],
    },
    {
      label: "Job Started",
      count: scopedLeads.filter((l) => l.status === "Job Started" || l.status === "Job Arrived").length,
      icon: <Users className="w-4 h-4 text-sky-600" />,
      iconBg: "bg-sky-100",
      cardBg: "bg-sky-50/80 border-sky-200/90 text-sky-800",
      countColor: "text-sky-600",
      statuses: ["Job Started", "Job Arrived"],
    },
    {
      label: "Job In Progress",
      count: scopedLeads.filter((l) => l.status === "Job In Progress" || l.status === "Job En Route").length,
      icon: <Wrench className="w-4 h-4 text-amber-600" />,
      iconBg: "bg-amber-100",
      cardBg: "bg-amber-50/80 border-amber-200/90 text-amber-800",
      countColor: "text-amber-600",
      statuses: ["Job In Progress", "Job En Route"],
    },
    {
      label: "Job Done",
      count: scopedLeads.filter((l) => l.status === "Job Done").length,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      iconBg: "bg-emerald-100",
      cardBg: "bg-emerald-50/80 border-emerald-200/90 text-emerald-800",
      countColor: "text-emerald-600",
      statuses: ["Job Done"],
    },
    {
      label: "Invoice Sent",
      count: scopedLeads.filter((l) => l.status === "Invoice Sent").length,
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      cardBg: "bg-blue-50/80 border-blue-200/90 text-blue-800",
      countColor: "text-blue-600",
      statuses: ["Invoice Sent"],
    },
    {
      label: "Payment Pending",
      count: scopedLeads.filter((l) => l.status === "Payment Pending").length,
      icon: <ArrowRight className="w-4 h-4 text-rose-600" />,
      iconBg: "bg-rose-100",
      cardBg: "bg-rose-50/80 border-rose-200/90 text-rose-800",
      countColor: "text-rose-600",
      statuses: ["Payment Pending"],
    },
    {
      label: "Partial Payment",
      count: scopedLeads.filter((l) => l.status === "Partial Payment").length,
      icon: <PieChart className="w-4 h-4 text-indigo-600" />,
      iconBg: "bg-indigo-100",
      cardBg: "bg-indigo-50/80 border-indigo-200/90 text-indigo-800",
      countColor: "text-indigo-600",
      statuses: ["Partial Payment"],
    },
    {
      label: "Payment Received",
      count: scopedLeads.filter((l) => l.status === "Payment Received" || l.status === "Paid").length,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      iconBg: "bg-emerald-100",
      cardBg: "bg-emerald-50/80 border-emerald-200/90 text-emerald-800",
      countColor: "text-emerald-600",
      statuses: ["Payment Received", "Paid"],
    },
    {
      label: "Warranty Sent",
      count: scopedLeads.filter((l) => l.status === "Warranty Sent").length,
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      cardBg: "bg-purple-50/80 border-purple-200/90 text-purple-800",
      countColor: "text-purple-600",
      statuses: ["Warranty Sent"],
    },
    {
      label: "Warranty Not Provided",
      count: scopedLeads.filter((l) => l.status === "Warranty Not Provided" || l.status === "No Warranty").length,
      icon: <ShieldAlert className="w-4 h-4 text-slate-600" />,
      iconBg: "bg-slate-200/80",
      cardBg: "bg-slate-100/90 border-slate-200/90 text-slate-700",
      countColor: "text-slate-700",
      statuses: ["Warranty Not Provided", "No Warranty"],
    },
    {
      label: "Completed",
      count: scopedLeads.filter((l) => l.status === "Completed" || l.status === "Closed").length,
      icon: <CheckCircle2 className="w-4 h-4 text-blue-300" />,
      iconBg: "bg-slate-700",
      cardBg: "bg-[#1E293B] border-slate-700 text-white shadow-xs",
      countColor: "text-white",
      statuses: ["Completed", "Closed"],
    },
    {
      label: "Lost / No Response",
      count: scopedLeads.filter((l) => l.status === "Lost" || l.status === "Lost / No Response" || l.status === "Cancelled" || l.status === "No Response").length,
      icon: <XCircle className="w-4 h-4 text-rose-600" />,
      iconBg: "bg-rose-100",
      cardBg: "bg-rose-50/80 border-rose-200/90 text-rose-800",
      countColor: "text-rose-600",
      statuses: ["Lost", "Lost / No Response", "Cancelled", "No Response"],
    },
  ];


  return (
    <div className="-mt-2 sm:-mt-4 space-y-4">
      {/* 1. Dynamic Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <button type="button" className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setGlobalSearch(searchQuery.trim());
                setCurrentView("leads");
              }
            }}
            className="relative flex-1 max-w-xl"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job #, customer name, phone or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/90 border border-slate-200/90 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </form>
        </div>

        {/* Right: Live Date selector, notification, help & user info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>{fmtScheduleDate(_now)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button type="button" onClick={openInbox} className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors" title="Open Inbox">
            <Bell className="w-4 h-4" />
            {unreadReplyCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadReplyCount}
              </span>
            )}
          </button>

          <button type="button" className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {(username || "Manager")[0].toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">{username || "Manager"}</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight capitalize">{role || "Administrator"}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Today at a Glance Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E68] tracking-tight">
              Today at a Glance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Complete view of your business – click any status to see details, assign or take action.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditingLead({ status: "New", priority: "Medium", received: new Date().toISOString().slice(0, 16) });
                setLeadModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("dispatch")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1736] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Truck className="w-3.5 h-3.5 text-blue-300" /> Open Dispatch
            </button>

            <button
              type="button"
              onClick={openInbox}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E1B4B] hover:bg-indigo-950 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Mail className="w-3.5 h-3.5 text-blue-300" /> Open Inbox
            </button>
          </div>
        </div>

        {/* Status Cards Grid (Compact 2-row view without scrolling) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 xl:grid-cols-11 gap-1.5 sm:gap-2 pt-1">
          {statusCards.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openLeadsFiltered(c.statuses)}
              className={`flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border ${c.cardBg} transition-all hover:scale-[1.03] hover:shadow-xs cursor-pointer text-center group/card min-w-0 w-full min-h-[62px] shadow-2xs`}
              title={`${c.label}: ${c.count} leads (click to view)`}
            >
              <div className={`p-1 rounded-md ${c.iconBg} mb-0.5 shrink-0 transition-transform group-hover/card:scale-110 [&>svg]:w-3.5 [&>svg]:h-3.5`}>
                {c.icon}
              </div>
              <span className="text-[10px] font-bold leading-tight truncate w-full px-0.5 text-slate-700" title={c.label}>
                {c.label}
              </span>
              <span className={`text-base font-black tabular-nums leading-none mt-0.5 ${c.countColor}`}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Middle Grid: 4 Cards (2 in first row, 2 in second row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Column 1: Quick Stats + Upcoming Slots (Today) */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Card 1: Dynamic Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Quick Stats</h2>
              <select
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(e.target.value)}
                className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
              >
                <option value="This Month">This Month</option>
                <option value="This Week">This Week</option>
                <option value="Today">Today</option>
              </select>
            </div>

            <div className="space-y-3.5">
              {/* Total Customers */}
              <div
                onClick={() => {
                  setStatusFilter("");
                  setCurrentView("leads");
                }}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title="View all customer leads"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Total Customers</div>
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">{stats.customers}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  {stats.totalLeads} Leads
                </span>
              </div>

              {/* Active Jobs */}
              <div
                onClick={() => openLeadsFiltered(["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job Started", "Job In Progress"])}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title="View active field jobs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Active Jobs</div>
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">{stats.activeJobs}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                  {stats.activeJobs} Active
                </span>
              </div>

              {/* Revenue */}
              <div
                onClick={() => openLeadsFiltered(["Job Done", "Payment Received", "Completed", "Won"])}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title={`View completed & paid leads (${statsPeriod})`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">{statsPeriod} Revenue</div>
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">{stats.revenue}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {stats.paidCount} Paid
                </span>
              </div>

              {/* Pending Payments */}
              <div
                onClick={() => openLeadsFiltered(["Invoice Sent", "Payment Pending", "Partial Payment"])}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title="View invoices pending payment"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">Pending Payments</div>
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">{stats.pending}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {stats.pendingCount} Pending
                </span>
              </div>
            </div>
          </div>

          {/* Card: Upcoming Slots (Today) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Upcoming Slots (Today)</h2>
              <button
                type="button"
                onClick={() => setCurrentView("dispatch")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {todayHourlySlots.map((slot) => {
                const isBooked = slot.leads.length > 0;

                return (
                  <div
                    key={slot.hour}
                    className="flex items-center justify-between py-2 px-1 hover:bg-slate-50/60 rounded-lg transition-colors"
                  >
                    <span className="text-xs font-bold text-[#001f97] tabular-nums">
                      {slot.label}
                    </span>

                    {isBooked ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (slot.leads[0]) {
                            setEditingLead(slot.leads[0]);
                            setLeadModalOpen(true);
                          }
                        }}
                        className="px-4 py-1 rounded-md text-xs font-bold bg-[#fee2e2]/90 text-[#dc2626] border border-rose-200/70 min-w-[85px] text-center hover:bg-rose-200/80 transition-colors cursor-pointer"
                        title={`${slot.label} Booked:\n` + slot.leads.map((l) => `• ${l.name || "Customer"} (${getSuburb(l.address) || "Melbourne"})`).join("\n")}
                      >
                        Booked
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentView("dispatch")}
                        className="px-4 py-1 rounded-md text-xs font-bold bg-[#dcfce7]/90 text-[#16a34a] border border-emerald-200/70 min-w-[85px] text-center hover:bg-emerald-200/80 transition-colors cursor-pointer"
                        title={`${slot.label} Available - Click to open Dispatch`}
                      >
                        Available
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Today's Schedule Table + Technician & Inspector Status */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Today's Schedule Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Today's Schedule ({_now.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })})
              </h2>
              <button
                type="button"
                onClick={() => setCurrentView("schedule")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse min-w-[320px]">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <th className="py-1 px-1">Time</th>
                    <th className="py-1 px-1">Type</th>
                    <th className="py-1 px-1">Customer</th>
                    <th className="py-1 px-1">Area</th>
                    <th className="py-1 px-1">Technician</th>
                    <th className="py-1 px-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayLeadsList.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No jobs scheduled today</td></tr>
                  )}
                  {todayLeadsList.map((l) => {
                    const isInsp = isInspLead(l);
                    const apptDateStr = l.inspectionAt || l.jobAt;
                    const isToday = apptDateStr && _dayKey(apptDateStr) === _todayStr;
                    const suburb = getSuburb(l.address) || l.city || "Melbourne";
                    const timeStr = isInsp
                      ? formatInspectionWindow(apptDateStr, suburb)
                      : (formatApptTime(apptDateStr) || "Scheduled");
                    const displayTime = isToday ? timeStr : `${formatApptDate(apptDateStr, { day: "numeric", month: "short" })} ${timeStr}`;
                    const techName = isInsp
                      ? (l.inspectorId || (inspectionStaff.some((s) => s.name?.toLowerCase() === l.assigned?.toLowerCase() || s.username?.toLowerCase() === l.assigned?.toLowerCase()) ? l.assigned : "") || (l.inspectionReport?.inspectorName && !/^(?:inspector|field inspector)$/i.test(l.inspectionReport.inspectorName) ? l.inspectionReport.inspectorName : "") || "None")
                      : (l.technician || (isTechnicianName(l.assigned) ? l.assigned : "") || "None");
                    const isWorking = /in.progress|started|arrived/i.test(l.status || "");
                    const typeLabel = isInsp ? "Inspection" : "Job";
                    const typeColor = isInsp ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                    const statusLabel = isWorking ? "In Progress" : l.status || "Scheduled";
                    const statusColor = isWorking ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200";

                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingLead(l);
                          setLeadModalOpen(true);
                        }}
                        title={`Open Lead #${l.jobNo || l.id} (${l.name || "Customer"})`}
                      >
                        <td className="py-1.5 px-2 font-bold text-blue-600 whitespace-nowrap tabular-nums">{displayTime}</td>
                        <td className="py-1.5 px-1.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border whitespace-nowrap ${typeColor}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-semibold text-slate-800 whitespace-nowrap truncate max-w-[140px]">{l.name || "Customer"}</td>
                        <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap truncate max-w-[120px]">{suburb}</td>
                        <td className="py-1.5 px-2 text-slate-600 font-medium whitespace-nowrap">{techName}</td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border whitespace-nowrap ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technician & Inspector Status Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Technician Status</h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  ({activeStaffRosterList.length} Field Staff)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView("dispatch")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeStaffRosterList.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs font-medium col-span-full">
                  No field technicians or inspectors configured
                </div>
              )}
              {activeStaffRosterList.map((member, idx) => {
                const status = getStaffRealtimeStatus(member);
                const initials = getStaffBadgeInitials(member.name, member.isInspector, idx);

                return (
                  <div
                    key={member.id}
                    onClick={() => setCurrentView("dispatch")}
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
                    title={`View ${member.name}'s schedule in Dispatch`}
                  >
                    {/* Top: Avatar + Name + Role */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#0a192f] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate">{member.name}</div>
                        <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                          {member.isInspector ? "Inspector (Inspection Only)" : "Technician (Jobs Only)"}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Metric + Progress Bar */}
                    <div className="mt-3">
                      <div className="text-xs font-bold text-slate-900">
                        {status.metricText}
                      </div>
                      <div className="relative w-full bg-slate-100 rounded-full h-5 overflow-hidden flex items-center px-2 mt-1.5 border border-slate-200/40">
                        <div
                          className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${status.barBg}`}
                          style={{ width: `${Math.max(status.percent, 6)}%` }}
                        />
                        <span
                          className={`relative z-10 text-[11px] font-black tabular-nums ml-auto ${
                            status.percent >= 75 ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {status.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Location Pin */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-3 pt-2 border-t border-slate-100 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10 shrink-0" />
                      <span className="truncate">{status.locationText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 4: Dynamic Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            <button
              type="button"
              onClick={() => setCurrentView("leads")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivityLogs.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">No recent activity recorded</div>
            )}
            {recentActivityLogs.map((act, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setEditingLead(act.lead);
                  setLeadModalOpen(true);
                }}
                className="flex items-center justify-between gap-2 text-xs p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title={`Open Lead #${act.lead.jobNo || act.lead.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {act.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate leading-tight">{act.title}</div>
                    <div className="text-[10px] text-slate-500 truncate leading-tight">{act.detail}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">{act.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Available Slots (Next 7 Days) Schedule Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* Header with Title, Role Filters, Legend & Date Navigator */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Available Slots (Next 7 Days)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Technician & inspector work availability and booking status at a glance.
              </p>
            </div>

            {/* Quick Role Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto sm:ml-2">
              <button
                type="button"
                onClick={() => setRosterRoleFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rosterRoleFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Team ({activeStaffRosterList.length})
              </button>
              <button
                type="button"
                onClick={() => setRosterRoleFilter("inspectors")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  rosterRoleFilter === "inspectors"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-indigo-700"
                }`}
              >
                <Eye className="w-3 h-3" />
                Inspectors ({inspectorCount})
              </button>
              <button
                type="button"
                onClick={() => setRosterRoleFilter("technicians")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  rosterRoleFilter === "technicians"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wrench className="w-3 h-3" />
                Technicians ({technicianCount})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            {/* Legend */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Inspection</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Job</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Busy</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Day Off</span>
              </div>
            </div>

            {/* Live Date Range Navigator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setRosterWeekOffset((v) => v - 1)}
                className="p-0.5 text-slate-400 hover:text-slate-800 cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold">
                {rosterDays[0].dayName}, {rosterDays[0].fullDate} - {rosterDays[6].dayName}, {rosterDays[6].fullDate}
              </span>
              <button
                type="button"
                onClick={() => setRosterWeekOffset((v) => v + 1)}
                className="p-0.5 text-slate-400 hover:text-slate-800 cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Available Slots Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold">
                <th className="py-2.5 px-3 min-w-[170px]">Team Member</th>
                <th className="py-2.5 px-3 min-w-[130px]">Role</th>
                {rosterDays.map((d, idx) => (
                  <th key={idx} className="py-2.5 px-2 text-center border-l border-slate-100 bg-slate-50/40">
                    <div className={`font-extrabold text-xs ${d.dayOfWeek === 0 ? "text-rose-600" : "text-blue-950"}`}>
                      {d.dayName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">{d.fullDate}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRosterList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No field staff configured for this filter
                  </td>
                </tr>
              )}
              {filteredRosterList.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                          member.isInspector ? "bg-indigo-600" : "bg-slate-900"
                        }`}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{member.name}</div>
                        {member.username && member.username !== member.name && (
                          <div className="text-[10px] text-slate-400 font-normal">@{member.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    {member.isInspector ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        <Eye className="w-3 h-3 text-indigo-500" />
                        Inspector
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        <Wrench className="w-3 h-3 text-slate-500" />
                        Technician
                      </span>
                    )}
                  </td>

                  {/* 7 Days Slots */}
                  {rosterDays.map((day, dIdx) => {
                    const dayStatus = getStaffDayStatus(member, day.dateKey, day.dayOfWeek);

                    return (
                      <td key={dIdx} className="p-2 border-l border-slate-100 align-middle">
                        <div
                          onClick={() => setCurrentView("dispatch")}
                          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-[1.02] flex flex-col items-center justify-center min-h-[54px] text-center ${
                            dayStatus.status === "available"
                              ? "bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70 text-emerald-950"
                              : dayStatus.status === "booked"
                              ? member.isInspector
                                ? "bg-indigo-50/70 border-indigo-200/80 hover:bg-indigo-100/70 text-indigo-950"
                                : "bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/70 text-blue-950"
                              : dayStatus.status === "busy"
                              ? "bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70 text-rose-950"
                              : "bg-slate-50/80 border-slate-200/70 text-slate-400"
                          }`}
                          title={
                            dayStatus.leads.length > 0
                              ? `${member.name} on ${day.dayName} ${day.fullDate}:\n` +
                                dayStatus.leads
                                  .map(
                                    (l: Lead) =>
                                      `• ${formatApptTime(member.isInspector ? (l.inspectionAt || l.jobAt) : (l.jobAt || l.inspectionAt))} - ${
                                        l.name || "Customer"
                                      } (${l.address || "Melbourne"}) [${member.isInspector ? "Inspection" : "Job"}]`
                                  )
                                  .join("\n") +
                                "\nClick to open in Dispatch"
                              : `${member.name} - ${day.dayName} ${day.fullDate} (${dayStatus.label}) - Click to open Dispatch`
                          }
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                dayStatus.status === "available"
                                  ? "bg-emerald-500"
                                  : dayStatus.status === "booked"
                                  ? member.isInspector
                                    ? "bg-indigo-600"
                                    : "bg-blue-600"
                                  : dayStatus.status === "busy"
                                  ? "bg-rose-500"
                                  : "bg-slate-300"
                              }`}
                            />
                            <span className="truncate">{dayStatus.label}</span>
                          </div>
                          <div className="text-[10px] opacity-80 font-medium truncate mt-0.5 max-w-[115px]">
                            {dayStatus.subLabel}
                          </div>

                          {/* 3-segment visual time indicator: Morning, Midday, Afternoon */}
                          <div className="flex items-center gap-1 w-full mt-1.5 px-1">
                            <div
                              className={`h-1 flex-1 rounded-full ${
                                dayStatus.status === "off"
                                  ? "bg-slate-200"
                                  : dayStatus.morningBooked
                                  ? member.isInspector
                                    ? "bg-indigo-600"
                                    : "bg-blue-600"
                                  : "bg-emerald-400/80"
                              }`}
                              title="Morning (8:00 AM - 11:30 AM)"
                            />
                            <div
                              className={`h-1 flex-1 rounded-full ${
                                dayStatus.status === "off"
                                  ? "bg-slate-200"
                                  : dayStatus.middayBooked
                                  ? member.isInspector
                                    ? "bg-indigo-600"
                                    : "bg-blue-600"
                                  : "bg-emerald-400/80"
                              }`}
                              title="Midday (11:30 AM - 2:00 PM)"
                            />
                            <div
                              className={`h-1 flex-1 rounded-full ${
                                dayStatus.status === "off"
                                  ? "bg-slate-200"
                                  : dayStatus.afternoonBooked
                                  ? member.isInspector
                                    ? "bg-indigo-600"
                                    : "bg-blue-600"
                                  : "bg-emerald-400/80"
                              }`}
                              title="Afternoon (2:00 PM - 5:00 PM)"
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Dynamic Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 px-1 text-xs text-slate-400 font-medium">
        <div>© {new Date().getFullYear()} Groutix. All rights reserved.</div>
        <div className="text-blue-600 font-semibold">Cleaner Spaces, Healthier Homes.</div>
      </div>
    </div>
  );
}
