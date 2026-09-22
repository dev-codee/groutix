"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Truck, Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  Navigation, Phone, Mail, MessageSquare, Camera, Zap, UserPlus,
  MoreHorizontal, ExternalLink, Plus, Home, RefreshCw, User,
  CheckCircle2, X,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { resolveArea, formatApptTimeRange } from "@/lib/scheduling";
import { calculateTravel, DISPATCH_WORKING_HOURS } from "@/lib/dispatch";
import { getWhatsAppLink } from "@/lib/adminHelpers";
import type { Lead } from "@/components/admin/types";

function fmtTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

const ITEM_COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

function getInitials(name: string): string {
  const parts = (name || "FS").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function DispatchView({ onOpenLead }: { onOpenLead: (id: string) => void }) {
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

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"all" | "leads" | "inspections" | "jobs">("inspections");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Build all items for selectedDate
  const allDateItems = useMemo(() => {
    const items: { lead: Lead; type: "inspection" | "job"; time: string; tech: string }[] = [];
    for (const lead of scopedLeads) {
      if (lead.status === "Lost" || lead.status === "Cancelled") continue;

      if (lead.inspectionAt && lead.inspectionAt.startsWith(selectedDate)) {
        const tRaw = lead.inspectionAt.split("T")[1] || "09:00";
        const t = tRaw.slice(0, 5);
        let techName = "Unassigned";
        if (lead.assigned && lead.assigned.toLowerCase() !== "unassigned") techName = lead.assigned;
        else if (lead.inspectionReport?.inspectorName) techName = lead.inspectionReport.inspectorName;
        items.push({ lead, type: "inspection", time: t, tech: techName });
      }

      if (lead.jobAt && lead.jobAt.startsWith(selectedDate)) {
        const tRaw = lead.jobAt.split("T")[1] || "09:00";
        const t = tRaw.slice(0, 5);
        let techName = "Unassigned";
        if (lead.technician && lead.technician.toLowerCase() !== "unassigned") techName = lead.technician;
        else if (lead.assigned && lead.assigned.toLowerCase() !== "unassigned") techName = lead.assigned;
        items.push({ lead, type: "job", time: t, tech: techName });
      }
    }
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  }, [scopedLeads, selectedDate]);

  const inspItems = useMemo(() => allDateItems.filter(i => i.type === "inspection"), [allDateItems]);
  const jobItems = useMemo(() => allDateItems.filter(i => i.type === "job"), [allDateItems]);
  const leadsCount = useMemo(() => scopedLeads.filter(l => ["New", "Contacted", "Waiting for Info"].includes(l.status)).length, [scopedLeads]);

  const filteredItems = useMemo(() => {
    const base = viewTab === "inspections" ? inspItems : viewTab === "jobs" ? jobItems : allDateItems;
    return base.filter(item => {
      if (areaFilter !== "all") {
        const area = resolveArea(item.lead.address || item.lead.city);
        if (!area.suburb?.toLowerCase().includes(areaFilter.toLowerCase())) return false;
      }
      if (statusFilter !== "all" && !item.lead.status.toLowerCase().includes(statusFilter.toLowerCase())) return false;
      if (techFilter !== "all" && !item.tech.toLowerCase().includes(techFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!`${item.lead.name || ""} ${item.lead.address || ""} ${item.lead.jobNo || ""} ${item.lead.phone || ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allDateItems, inspItems, jobItems, viewTab, areaFilter, statusFilter, techFilter, searchQuery]);

  const selectedItem = useMemo(() => filteredItems.find(i => i.lead.id === selectedLeadId) || null, [filteredItems, selectedLeadId]);

  // Route summary
  const routeSummary = useMemo(() => {
    let totalKm = 0;
    let totalMins = 0;
    const items = filteredItems;
    for (let i = 0; i < items.length; i++) {
      const area = resolveArea(items[i].lead.address || items[i].lead.city);
      const prevSuburb = i === 0 ? "Tullamarine" : resolveArea(items[i - 1].lead.address || items[i - 1].lead.city).suburb || "Melbourne";
      const travel = calculateTravel(prevSuburb, area.suburb || "Melbourne");
      totalKm += travel.distanceKm;
      totalMins += items[i].type === "inspection" ? 40 + travel.durationMinutes * 2 : 120;
    }
    if (items.length > 0) {
      const lastArea = resolveArea(items[items.length - 1].lead.address || items[items.length - 1].lead.city);
      totalKm += calculateTravel(lastArea.suburb || "Melbourne", "Tullamarine").distanceKm;
    }
    const startMins = 9 * 60;
    const returnMins = startMins + totalMins;
    const rh = Math.floor(returnMins / 60);
    const rm = returnMins % 60;
    const rPeriod = rh >= 12 ? "PM" : "AM";
    const rdh = rh > 12 ? rh - 12 : rh;
    return {
      totalKm: Math.round(totalKm),
      travelLabel: fmtMins(totalMins),
      returnTime: `${rdh}:${String(rm).padStart(2, "0")} ${rPeriod}`,
    };
  }, [filteredItems]);

  // Map embed URL — shows route from Tullamarine through all addresses
  const mapEmbedUrl = useMemo(() => {
    const items = filteredItems.slice(0, 8);
    if (items.length === 0) return "https://maps.google.com/maps?q=Tullamarine+Victoria+Australia&z=12&output=embed";
    const daddr = items
      .map(i => encodeURIComponent((i.lead.address || resolveArea(i.lead.address || i.lead.city).suburb || "Melbourne") + ", VIC, Australia"))
      .join("+to:");
    return `https://maps.google.com/maps?saddr=Tullamarine+Victoria+Australia&daddr=${daddr}&output=embed`;
  }, [filteredItems]);

  // Date navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formattedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    const prefix = selectedDate === todayStr ? "Today, " : "";
    return prefix + d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }, [selectedDate, todayStr]);

  const dynamicSuburbs = useMemo(() => {
    const s = new Set<string>();
    for (const i of allDateItems) {
      const a = resolveArea(i.lead.address || i.lead.city);
      if (a.suburb) s.add(a.suburb);
    }
    return Array.from(s).sort();
  }, [allDateItems]);

  const fieldStaffNames = useMemo(() => {
    const s = new Set<string>();
    for (const i of allDateItems) { if (i.tech && i.tech !== "Unassigned") s.add(i.tech); }
    return Array.from(s).sort();
  }, [allDateItems]);

  // Selected lead helpers
  const sl = selectedItem?.lead;
  const slArea = sl ? resolveArea(sl.address || sl.city) : null;
  const slTravel = slArea ? calculateTravel("Tullamarine", slArea.suburb || "Melbourne") : null;
  const slPhotos = (sl?.photos || []).filter(p => p.secureUrl || p.url || p.dataUrl);
  const slApptStr = selectedItem?.type === "inspection" ? sl?.inspectionAt : sl?.jobAt;
  const slTimeRange = slApptStr ? formatApptTimeRange(slApptStr) : null;

  const slNavUrl = sl?.address
    ? `https://www.google.com/maps/dir/?api=1&origin=Tullamarine+Victoria+Australia&destination=${encodeURIComponent(sl.address + ", VIC, Australia")}`
    : null;

  const slGoogleMapsUrl = sl?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sl.address + ", VIC, Australia")}`
    : null;

  const tabLabel = viewTab === "inspections" ? "Inspections" : viewTab === "jobs" ? "Jobs" : "Appointments";

  return (
    <div className="flex flex-col bg-slate-100/60 font-sans text-slate-800 rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "calc(100vh - 80px)", minHeight: 600 }}>

      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-blue-950 leading-none">Dispatch &amp; Map View</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">
              View all leads, inspections and jobs on map, plan routes and manage field team.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setActionNotice("⚡ Route optimized for minimum travel time."); setTimeout(() => setActionNotice(null), 4000); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            Optimize Route
          </button>
          <button
            type="button"
            onClick={() => { setEditingLead(null); setLeadModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold px-4 py-1.5 flex items-center justify-between shrink-0">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-emerald-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── TAB FILTER ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-1 shrink-0">
        {([
          { key: "all", label: `All (${allDateItems.length})`, icon: <Truck className="w-3 h-3" /> },
          { key: "leads", label: `Leads (${leadsCount})`, icon: <User className="w-3 h-3" /> },
          { key: "inspections", label: `Inspections (${inspItems.length})`, icon: <CheckCircle2 className="w-3 h-3" /> },
          { key: "jobs", label: `Jobs (${jobItems.length})`, icon: <Navigation className="w-3 h-3" /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setViewTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-b-2 transition-colors cursor-pointer ${
              viewTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-2 shrink-0">
        {/* Date navigator */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-[11px] font-bold text-blue-950">
          <button type="button" onClick={handlePrevDay} className="p-1 rounded hover:bg-slate-200 cursor-pointer">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <Calendar className="w-3 h-3 text-blue-600" />
          <span className="px-1">{formattedDateLabel}</span>
          <button type="button" onClick={handleNextDay} className="p-1 rounded hover:bg-slate-200 cursor-pointer">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
          className="text-[11px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer hover:bg-slate-100">
          <option value="all">All Areas</option>
          {dynamicSuburbs.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-[11px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer hover:bg-slate-100">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
        </select>

        <select value={techFilter} onChange={e => setTechFilter(e.target.value)}
          className="text-[11px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer hover:bg-slate-100">
          <option value="all">All Staff</option>
          {fieldStaffNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search inspections..."
            className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 w-44"
          />
        </div>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Inspection / Job List */}
        <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-y-auto">
          {/* List header */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Today&apos;s {tabLabel} ({filteredItems.length})
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              Sort: Time
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No {tabLabel.toLowerCase()} scheduled for this day.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const area = resolveArea(item.lead.address || item.lead.city);
                const isSelected = item.lead.id === selectedLeadId;
                const color = ITEM_COLORS[idx % ITEM_COLORS.length];
                const isInsp = item.type === "inspection";
                const statusColor = item.lead.status?.toLowerCase().includes("complete") ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : item.lead.status?.toLowerCase().includes("route") || item.lead.status?.toLowerCase().includes("en route") ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-blue-700 bg-blue-50 border-blue-200";

                return (
                  <button
                    key={`${item.lead.id}-${item.time}`}
                    type="button"
                    onClick={() => setSelectedLeadId(isSelected ? null : item.lead.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Numbered circle */}
                    <div
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                      style={{ backgroundColor: color }}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 truncate">{item.lead.name || "Customer"}</span>
                        <span className="text-[10px] font-black text-blue-700 shrink-0">{fmtTime(item.time)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.lead.address || area.suburb || "Address not set"}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isInsp ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {isInsp ? "Inspection" : "Job"} · 1 hr
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                          {item.lead.status || "Scheduled"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Route Summary */}
          <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
              <RefreshCw className="w-3 h-3 text-blue-600" />
              Route Summary
              {filteredItems.length > 0 && (
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded ml-auto">(Optimized)</span>
              )}
            </div>
            {[
              { icon: <CheckCircle2 className="w-3 h-3 text-blue-600" />, label: `Total ${tabLabel}`, value: filteredItems.length.toString() },
              { icon: <MapPin className="w-3 h-3 text-blue-600" />, label: "Total Distance", value: `~ ${routeSummary.totalKm} km` },
              { icon: <Clock className="w-3 h-3 text-blue-600" />, label: "Est. Travel Time", value: `~ ${routeSummary.travelLabel}` },
              { icon: <Clock className="w-3 h-3 text-slate-400" />, label: "Working Hours", value: "9:00 AM – 5:00 PM" },
              { icon: <Home className="w-3 h-3 text-slate-400" />, label: "Return to Base", value: routeSummary.returnTime },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">{icon}{label}</span>
                <span className="font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="flex-1 relative flex flex-col min-w-0">
          {/* Map legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-sm flex items-center gap-3 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1"><Home className="w-3 h-3 text-slate-700" />Base</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Inspection</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Job</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block" />Optimized Route</span>
          </div>

          <iframe
            title="Dispatch Route Map"
            src={mapEmbedUrl}
            className="w-full flex-1 border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* RIGHT: Inspection Details Panel */}
        {sl ? (
          <div className="w-80 shrink-0 flex flex-col bg-white border-l border-slate-200 overflow-y-auto">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <span className="text-xs font-extrabold text-blue-950">
                {selectedItem?.type === "inspection" ? "Inspection" : "Job"} Details
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingLead(sl); setLeadModalOpen(true); }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4">

              {/* Customer name + status */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ backgroundColor: ITEM_COLORS[(filteredItems.findIndex(i => i.lead.id === selectedLeadId)) % ITEM_COLORS.length] }}>
                  {filteredItems.findIndex(i => i.lead.id === selectedLeadId) + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">{sl.name || "Customer"}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {sl.status || "Scheduled"}
                </span>
              </div>

              {/* Detail rows */}
              <div className="space-y-2.5 text-xs">
                {slTimeRange && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date &amp; Time</div>
                      <div className="font-semibold text-slate-800 text-[11px] mt-0.5">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} | {slTimeRange}
                      </div>
                    </div>
                  </div>
                )}

                {sl.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</div>
                      <div className="font-semibold text-slate-800 text-[11px] mt-0.5">{sl.address}</div>
                      {slGoogleMapsUrl && (
                        <a href={slGoogleMapsUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 font-semibold">
                          <ExternalLink className="w-2.5 h-2.5" />Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {slTravel && (
                  <div className="flex items-start gap-2.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance from Base</div>
                      <div className="font-semibold text-slate-800 text-[11px] mt-0.5">
                        {slTravel.distanceKm} km (Approx {slTravel.durationMinutes} min)
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Type</div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-0.5">
                      {selectedItem?.type === "inspection" ? "Inspection" : "Job"} · {sl.service || "Tile & Grout"}
                    </div>
                  </div>
                </div>

                {sl.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Phone</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-800 text-[11px]">{sl.phone}</span>
                        <a href={getWhatsAppLink(sl.phone)} target="_blank" rel="noopener noreferrer"
                          className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-[9px] font-black text-emerald-700 transition-colors"
                          title="WhatsApp">WA</a>
                        <button type="button" onClick={() => callCustomer(sl)}
                          className="w-5 h-5 rounded bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                          title="Call">
                          <Phone className="w-2.5 h-2.5 text-blue-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {sl.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Email</div>
                      <div className="font-semibold text-slate-800 text-[11px] mt-0.5 break-all">{sl.email}</div>
                    </div>
                  </div>
                )}

                {(selectedItem?.tech && selectedItem.tech !== "Unassigned") && (
                  <div className="flex items-start gap-2.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</div>
                      <div className="font-semibold text-slate-800 text-[11px] mt-0.5">
                        {selectedItem.tech} ({selectedItem.type === "inspection" ? "Inspector" : "Technician"})
                      </div>
                    </div>
                  </div>
                )}

                {/* Status dropdown */}
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</div>
                    <select
                      value={sl.status || ""}
                      onChange={e => updateLeadField(sl.id, { status: e.target.value })}
                      className="w-full text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-400"
                    >
                      {["New", "Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed", "Job Booked", "Job En Route", "Job Arrived", "Job Started", "Job Done", "Completed"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {slNavUrl && (
                <a
                  href={slNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Start Navigation
                </a>
              )}

              <div className="grid grid-cols-3 gap-1.5">
                <button type="button"
                  onClick={() => setActionNotice("Open the lead to reschedule the appointment.")}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 cursor-pointer transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Reschedule
                </button>
                <button type="button"
                  onClick={() => { setEditingLead(sl); setLeadModalOpen(true); }}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 cursor-pointer transition-colors">
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  Reassign
                </button>
                <button type="button"
                  onClick={() => openMessagesModal(sl)}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 cursor-pointer transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  More
                </button>
              </div>

              {/* Customer Notes */}
              {(sl.notes || sl.technicianNotes || sl.scopeNotes) && (
                <div>
                  <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Customer Notes</div>
                  <div className="text-[11px] text-slate-600 font-medium bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-snug">
                    {sl.notes || sl.technicianNotes || sl.scopeNotes}
                  </div>
                </div>
              )}

              {/* Customer Photos */}
              {slPhotos.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer Photos ({slPhotos.length})
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {slPhotos.slice(0, 3).map((p, i) => {
                      const src = p.secureUrl || p.url || p.dataUrl || "";
                      return (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openPhotosModal(sl)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => openPhotosModal(sl)}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors">
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-[8px] font-bold text-slate-400">Add Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick action: Open full lead */}
              <button
                type="button"
                onClick={() => onOpenLead(sl.id)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Lead
              </button>
            </div>
          </div>
        ) : (
          /* Placeholder when nothing selected */
          <div className="w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <MapPin className="w-8 h-8 mb-2 text-slate-300" />
            <div className="text-xs font-bold text-slate-500">Select an appointment</div>
            <div className="text-[10px] font-medium mt-1 text-slate-400">Click any item in the list to view full details here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
