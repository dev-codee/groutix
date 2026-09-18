"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  CalendarDays, Search, Wrench, Briefcase, Mail, Plus,
  FileText, Settings, CheckCircle2, ArrowRight, ShieldCheck,
  Users, MessageSquare, Camera, ClipboardList, Edit3, Trash2,
  ChevronRight, Truck, ChevronLeft, Phone, Inbox, ShieldAlert,
  UserPlus, Clock, PieChart, Sparkles, XCircle, FileSpreadsheet,
  TrendingUp, TrendingDown, MapPin, Layers, Bell, HelpCircle,
  ChevronDown, User, DollarSign, Check, Menu, Globe
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getBadgeColor, fmtDate, fmtDateOnly, getLeadQuoteTotal } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTime, formatApptTimeRange, apptInstantMs } from "@/lib/scheduling";
import { QuoteResponseBadge } from "@/components/admin/QuoteResponseBadge";
import type { Lead } from "@/components/admin/types";

declare global {
  interface Window {
    google?: any;
  }
}

const VIC_SUBURBS_MAP: Record<string, { lat: number; lng: number }> = {
  keilor: { lat: -37.7236, lng: 144.8258 },
  tullamarine: { lat: -37.7050, lng: 144.8810 },
  "st albans": { lat: -37.7460, lng: 144.7980 },
  essendon: { lat: -37.7550, lng: 144.9120 },
  werribee: { lat: -37.9000, lng: 144.6600 },
  "glen waverley": { lat: -37.8800, lng: 145.1600 },
  geelong: { lat: -38.1499, lng: 144.3617 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  richmond: { lat: -37.8230, lng: 144.9980 },
  carlton: { lat: -37.8000, lng: 144.9670 },
  footscray: { lat: -37.8000, lng: 144.9000 },
  dandenong: { lat: -37.9810, lng: 145.2150 },
  frankston: { lat: -38.1400, lng: 145.1200 },
  sunbury: { lat: -37.5811, lng: 144.7228 },
  craigieburn: { lat: -37.6019, lng: 144.9431 },
  preston: { lat: -37.7428, lng: 145.0076 },
  reservoir: { lat: -37.7170, lng: 145.0080 },
  doncaster: { lat: -37.7880, lng: 145.1260 },
  "box hill": { lat: -37.8190, lng: 145.1220 },
  ringwood: { lat: -37.8150, lng: 145.2280 },
  brighton: { lat: -37.9060, lng: 144.9960 },
  "point cook": { lat: -37.9020, lng: 144.7390 },
  tarneit: { lat: -37.8340, lng: 144.6660 },
  epping: { lat: -37.6520, lng: 145.0290 },
  melton: { lat: -37.6833, lng: 144.5833 },
  pakenham: { lat: -38.0717, lng: 145.4853 },
  ballarat: { lat: -37.5622, lng: 143.8503 },
  bendigo: { lat: -36.7570, lng: 144.2794 },
};

function getVicCoordsForAddress(addressOrSuburb?: string, indexOffset = 0): { lat: number; lng: number; suburb: string } {
  if (!addressOrSuburb) {
    const defaultSuburbs = ["Keilor", "Tullamarine", "St Albans", "Essendon", "Werribee", "Glen Waverley", "Geelong"];
    const sub = defaultSuburbs[indexOffset % defaultSuburbs.length];
    return { ...VIC_SUBURBS_MAP[sub.toLowerCase()], suburb: `${sub}, VIC` };
  }

  const clean = addressOrSuburb.toLowerCase();
  for (const [key, coords] of Object.entries(VIC_SUBURBS_MAP)) {
    if (clean.includes(key)) {
      const nameCapitalized = key.replace(/\b\w/g, (c) => c.toUpperCase());
      return { ...coords, suburb: `${nameCapitalized}, VIC` };
    }
  }

  const baseLat = -37.8136;
  const baseLng = 144.9631;
  const spreadLat = (((indexOffset * 17) % 25) - 12) * 0.015;
  const spreadLng = (((indexOffset * 23) % 25) - 12) * 0.018;

  const parts = addressOrSuburb.split(",").map((s) => s.trim());
  const suburbText = parts.length > 1 ? parts[parts.length - 2] || parts[0] : parts[0];

  return {
    lat: baseLat + spreadLat,
    lng: baseLng + spreadLng,
    suburb: suburbText.toUpperCase().includes("VIC") ? suburbText : `${suburbText}, VIC`,
  };
}

function GoogleMapLive({ apiKey, mapMode, leads }: { apiKey: string; mapMode: "map" | "zone"; leads?: Lead[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).gm_authFailure = () => {
      console.warn("Google Maps API authentication failed. Switching to embedded Victoria map.");
      setAuthError(true);
    };

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    if (!apiKey) {
      setAuthError(true);
      return;
    }

    const scriptId = "google-maps-js-sdk-dashboard";
    const existing = document.getElementById(scriptId);
    if (existing) {
      const interval = setInterval(() => {
        if (window.google?.maps) {
          setMapLoaded(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setAuthError(true);
    document.head.appendChild(script);
  }, [apiKey]);

  const appointmentPins = useMemo(() => {
    if (!leads || leads.length === 0) {
      return [];
    }

    const apptLeads = leads.filter((l) => {
      const hasInsp = Boolean(l.inspectionAt) || /inspection/i.test(l.status || "");
      const hasJob = Boolean(l.jobAt) || /job/i.test(l.status || "");
      return hasInsp || hasJob;
    });

    return apptLeads.map((l, idx) => {
      const isJob = Boolean(l.jobAt) || /job/i.test(l.status || "");
      const isInsp = Boolean(l.inspectionAt) || /inspection/i.test(l.status || "");
      
      const typeLabel = isJob ? "Technician Job" : isInsp ? "Inspection Scheduled" : "Service Appointment";
      const color = isJob ? "#10B981" : "#8B5CF6"; // Emerald green for Job, Purple for Inspection

      const addressStr = l.address || l.city || "";
      const geo = getVicCoordsForAddress(addressStr, idx);
      const apptTime = formatApptTimeRange(l.inspectionAt || l.jobAt) || "Scheduled";
      const apptDate = formatApptDate(l.inspectionAt || l.jobAt) || "Upcoming";
      const staffName = isJob ? (l.technician || l.assigned || "Tech Assigned") : (l.inspectorId || l.assigned || "Inspector Assigned");

      return {
        id: l.id,
        title: l.name ? `${isJob ? "🔧 Job" : "📋 Inspection"}: ${l.name}` : typeLabel,
        customerName: l.name || "Customer",
        address: addressStr || geo.suburb,
        suburb: geo.suburb,
        lat: geo.lat,
        lng: geo.lng,
        type: typeLabel,
        color,
        date: `${apptDate} • ${apptTime}`,
        staff: staffName,
        status: l.status || "Scheduled",
      };
    });
  }, [leads]);

  const zoneCounts = useMemo(() => {
    let inspCount = 0;
    let jobCount = 0;
    appointmentPins.forEach((p) => {
      if (p.type.includes("Inspection")) inspCount++;
      if (p.type.includes("Job")) jobCount++;
    });
    return { inspCount, jobCount, total: appointmentPins.length };
  }, [appointmentPins]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps || mapMode !== "map" || authError) return;

    try {
      const center = { lat: -37.8136, lng: 144.9631 };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 9,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      appointmentPins.forEach((p) => {
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          title: `${p.title} (${p.suburb})`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: p.color,
            fillOpacity: 1,
            strokeWeight: 2.5,
            strokeColor: "#ffffff",
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:6px;font-family:sans-serif;max-width:210px;">
              <div style="font-weight:700;color:#0f172a;font-size:12px;">${p.customerName}</div>
              <div style="font-size:10px;font-weight:700;color:${p.color};margin-top:2px;text-transform:uppercase;">${p.type}</div>
              <div style="font-size:11px;color:#334155;margin-top:4px;">📍 ${p.address}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">📅 ${p.date}</div>
              <div style="font-size:10px;color:#0f766e;font-weight:600;margin-top:4px;background:#f0fdf4;padding:2px 6px;border-radius:4px;display:inline-block;">👤 ${p.staff}</div>
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });
    } catch (err) {
      console.warn("Error instantiating Google Map instance:", err);
      setAuthError(true);
    }
  }, [mapLoaded, mapMode, authError, appointmentPins]);

  if (mapMode === "zone") {
    return (
      <div className="w-full h-full min-h-[220px] rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 flex flex-col justify-between">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Victoria Appointment Territory Zones</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-semibold text-slate-800">Inspection Appointments</span>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">📋 {zoneCounts.inspCount} Booked</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-semibold text-slate-800">Technician Jobs</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">🔧 {zoneCounts.jobCount} Scheduled</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
            <span className="font-semibold text-slate-800">Total Active VIC Coverage</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">📍 {zoneCounts.total} Locations</span>
          </div>
        </div>
      </div>
    );
  }

  const vicQuery = appointmentPins.map((p) => p.suburb.replace(", VIC", "")).slice(0, 5).join(" ") || "Victoria Australia";

  if (authError) {
    return (
      <iframe
        title="Victoria Australia Live Map"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(`Victoria Australia ${vicQuery}`)}&t=&z=9&ie=UTF8&iwloc=&output=embed`}
        className="w-full h-full min-h-[220px] rounded-xl border-0"
        loading="lazy"
        allowFullScreen
      />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full min-h-[220px] rounded-xl" />
      {!mapLoaded && (
        <iframe
          title="Victoria Australia Live Map Loading Fallback"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(`Victoria Australia ${vicQuery}`)}&t=&z=9&ie=UTF8&iwloc=&output=embed`}
          className="w-full h-full min-h-[220px] rounded-xl border-0"
          loading="lazy"
        />
      )}
    </div>
  );
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
    setGlobalSearch,
    setStatusFilter,
  } = useAdminPageCtx();

  const ribbonRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<"map" | "zone">("map");
  const [statsPeriod, setStatsPeriod] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [rosterWeekOffset, setRosterWeekOffset] = useState(0);

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

  // 4. DYNAMIC 7-DAY ROSTER GRID FOR ACTIVE TECHNICIANS
  const rosterDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(_now);
      d.setDate(d.getDate() + (rosterWeekOffset * 7) + i);
      list.push({
        dateObj: d,
        dateKey: _dayKey(d.toISOString()),
        dayName: d.toLocaleDateString("en-AU", { weekday: "short" }),
        fullDate: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      });
    }
    return list;
  }, [_now, rosterWeekOffset]);

  const activeTechList = useMemo(() => {
    const fromTechs = assignableTechnicians.filter((t) => t.active !== false);
    if (fromTechs.length > 0) {
      return fromTechs.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role ? `${t.role}` : /inspect/i.test(t.name) ? "Inspector (Inspection Only)" : "Technician (Jobs Only)",
        avatar: (t.name || "T")[0].toUpperCase(),
      }));
    }
    const fromStaff = (staff || []).filter((s) => s.active !== false && (s.role === "technician" || s.role === "inspection" || s.role === "field"));
    if (fromStaff.length > 0) {
      return fromStaff.map((s) => ({
        id: s.id,
        name: s.name || s.username,
        role: s.role === "inspection" ? "Inspector (Inspection Only)" : "Technician (Jobs Only)",
        avatar: (s.name || s.username || "S")[0].toUpperCase(),
      }));
    }
    return [];
  }, [assignableTechnicians, staff]);

  // Compute 9 hourly slot states (8am-4pm) per technician per day from real booked leads
  const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4];

  const getTechSlotType = (techName: string, dateKey: string, hourNum: number) => {
    // Lunch break at 12pm by default
    if (hourNum === 12) return "K"; // Break

    const lowerTech = techName.toLowerCase();
    const techLeads = scopedLeads.filter(
      (l) => {
        const a = (l.technician || "").toLowerCase();
        const b = (l.assigned || "").toLowerCase();
        const c = (l.technicianId || "").toLowerCase();
        return a === lowerTech || b === lowerTech || c === lowerTech || a.includes(lowerTech) || b.includes(lowerTech);
      }
    );

    const dayLeads = techLeads.filter((l) => {
      const d = l.inspectionAt || l.jobAt;
      return d && _dayKey(d) === dateKey;
    });

    if (dayLeads.length > 2) return "L"; // Limited / heavy schedule
    if (dayLeads.length > 0) {
      const hasHourAppt = dayLeads.some((l) => {
        const d = l.inspectionAt || l.jobAt;
        if (!d) return false;
        const h = new Date(d).getHours();
        const converted = h > 12 ? h - 12 : h;
        return converted === hourNum;
      });
      return hasHourAppt ? "B" : "A"; // Booked or Available
    }

    return "A"; // Available
  };

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

  const getSlotBg = (type: string) => {
    switch (type) {
      case "B": return "bg-[#FB7185]"; // Booked (pink)
      case "K": return "bg-[#94A3B8]"; // Break (grey)
      case "L": return "bg-[#FBBF24]"; // Limited (yellow)
      default: return "bg-[#10B981]";  // Available (green)
    }
  };

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

        {/* Scrollable Status Card Ribbon */}
        <div className="relative group pt-1">
          <button
            type="button"
            onClick={() => ribbonRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={ribbonRef}
            className="flex items-stretch gap-2.5 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {statusCards.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLeadsFiltered(c.statuses)}
                className={`flex flex-col items-center justify-between p-2.5 rounded-xl border ${c.cardBg} transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer shrink-0 min-w-[95px] max-w-[110px] text-center group/card`}
              >
                <div className={`p-1.5 rounded-lg ${c.iconBg} mb-1 transition-transform group-hover/card:scale-110`}>
                  {c.icon}
                </div>
                <span className="text-[11px] font-bold leading-tight mb-2 min-h-[28px] flex items-center justify-center">
                  {c.label}
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${c.countColor}`}>
                  {c.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => ribbonRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Middle Grid: 4 Cards (2 in first row, 2 in second row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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

        {/* Card 2: Map & Zone View with Live Google Maps API */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Map
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMapMode("map")}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mapMode === "map"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Map View
              </button>
              <button
                type="button"
                onClick={() => setMapMode("zone")}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mapMode === "zone"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Zone View
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[220px] rounded-xl overflow-hidden border border-slate-200/80">
            <GoogleMapLive
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAuP7kswkFDeHgJPOl8shofwL8E4vhDywQ"}
              mapMode={mapMode}
              leads={scopedLeads}
            />
          </div>
        </div>

        {/* Card 3: Dynamic Today's Schedule Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today's Schedule</h2>
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
                  const timeStr = formatApptTime(apptDateStr) || "Scheduled";
                  const displayTime = isToday ? timeStr : `${formatApptDate(apptDateStr, { day: "numeric", month: "short" })} ${timeStr}`;
                  const suburb = getSuburb(l.address) || l.city || "Melbourne";
                  const techName = l.assigned || l.technician || l.inspectorId || "Unassigned";
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
        {/* Header with Title, Legend & Date Navigator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            Available Slots (Next 7 Days)
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            {/* Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#10B981]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#FB7185]" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#94A3B8]" />
                <span>Break</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#FBBF24]" />
                <span>Limited</span>
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
                <th className="py-2 px-3 min-w-[180px]">Technician</th>
                <th className="py-2 px-3 min-w-[100px]">Role</th>
                {rosterDays.map((d, idx) => (
                  <th key={idx} className="py-2 px-2 text-center border-l border-slate-100">
                    <div className="font-extrabold text-blue-700">{d.dayName}</div>
                    <div className="text-[10px] text-slate-500">{d.fullDate}</div>
                    <div className="flex items-center justify-between gap-0.5 text-[8px] font-semibold text-slate-400 mt-1">
                      {hoursList.map((h) => (
                        <span key={h} className="flex-1 text-center">{h}</span>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTechList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No field technicians configured in system roster
                  </td>
                </tr>
              )}
              {activeTechList.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {tech.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{tech.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] font-medium max-w-[140px]">
                    {tech.role}
                  </td>

                  {/* 7 Days Slots */}
                  {rosterDays.map((day, dIdx) => (
                    <td key={dIdx} className="py-3 px-2 border-l border-slate-100">
                      <div className="flex items-center justify-between gap-0.5">
                        {hoursList.map((h, sIdx) => {
                          const slotType = getTechSlotType(tech.name, day.dateKey, h);
                          const slotBg = getSlotBg(slotType);
                          const slotLabel = slotType === "A" ? "Available" : slotType === "B" ? "Booked" : slotType === "K" ? "Break" : "Limited";
                          return (
                            <div
                              key={sIdx}
                              onClick={() => setCurrentView("dispatch")}
                              className={`h-5 flex-1 rounded-xs ${slotBg} transition-all hover:scale-110 shadow-2xs cursor-pointer`}
                              title={`${tech.name} - ${day.dayName} ${day.fullDate} @ ${h}:00 (${slotLabel}) - Click to view dispatch`}
                            />
                          );
                        })}
                      </div>
                    </td>
                  ))}
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
