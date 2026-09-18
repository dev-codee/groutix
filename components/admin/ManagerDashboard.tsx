"use client";

import {
  CalendarDays, Search, Wrench, Briefcase, Mail, Plus,
  FileText, Settings, CheckCircle2, ArrowRight, ShieldCheck,
  Users, MessageSquare, Camera, ClipboardList, Edit3, Trash2,
  ChevronRight, Truck,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getBadgeColor, fmtDate } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange, apptInstantMs } from "@/lib/scheduling";
import { QuoteResponseBadge } from "@/components/admin/QuoteResponseBadge";
import type { Lead } from "@/components/admin/types";

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
  } = useAdminPageCtx();

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
    return "";
  };
  const getScheduleBadge = (status: string) => {
    if (/en.route/i.test(status)) return { label: "On the Way", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80" };
    if (/arrived/i.test(status)) return { label: "Arrived", cls: "bg-sky-50 text-sky-700 border-sky-200/80" };
    if (/in.progress|started/i.test(status)) return { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200/80" };
    if (/completed|done/i.test(status)) return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80" };
    return { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200/80" };
  };
  const isInspLead = (l: Lead) => Boolean(l.inspectionAt) || /inspection/i.test(l.status || "");

  const todayLeads = scopedLeads
    .filter((l) => { const d = l.inspectionAt || l.jobAt; return d && _dayKey(d) === _todayStr; })
    .sort((a, b) => _apptMs(a) - _apptMs(b));
  const tomorrowLeads = scopedLeads
    .filter((l) => { const d = l.inspectionAt || l.jobAt; return d && _dayKey(d) === _tomStr; })
    .sort((a, b) => _apptMs(a) - _apptMs(b));

  const inspCount = ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed"].reduce((a, s) => a + (counts[s] || 0), 0);
  const quoteCount = ["Quote Pending", "Quote Sent", "Negotiation", "Won"].reduce((a, s) => a + (counts[s] || 0), 0);
  const jobBookedCount = ["Job Booked", "Scheduled", "Job Confirmed"].reduce((a, s) => a + (counts[s] || 0), 0);
  const jobInProgCount = ["Job En Route", "Job Arrived", "Job Started", "Job In Progress"].reduce((a, s) => a + (counts[s] || 0), 0);

  const techSummary = assignableTechnicians.filter((t) => t.active !== false).map((t) => {
    const tLeads = scopedLeads.filter((l) => l.technicianId === t.id || l.technician === t.name);
    const todayJobs = tLeads.filter((l) => { const d = l.jobAt; return d && _dayKey(d) === _todayStr; }).length;
    const hasEnRoute = tLeads.some((l) => /en.route/i.test(l.status || ""));
    const hasWorking = tLeads.some((l) => /arrived|in.progress|started/i.test(l.status || ""));
    const statusLabel = hasEnRoute ? "On Route" : hasWorking ? "Working" : "At Office";
    const statusDot = hasEnRoute ? "bg-emerald-500" : hasWorking ? "bg-amber-500" : "bg-slate-300";
    return { ...t, todayJobs, statusLabel, statusDot };
  });

  const todayInsp = todayLeads.filter((l) => isInspLead(l));
  const inspOnWay = todayInsp.filter((l) => /en.route/i.test(l.status || "")).length;
  const inspScheduled = todayInsp.filter((l) => /booked|scheduled|confirmed/i.test(l.status || "")).length;
  const inspCompleted = todayInsp.filter((l) => /completed/i.test(l.status || "")).length;

  const renderScheduleTable = (tableLeads: Lead[], title: string, date: Date) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden xl:inline">{fmtScheduleDate(date)}</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{tableLeads.length} Jobs</span>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-xs z-10">
            <tr className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <th className="py-2.5 px-2.5 whitespace-nowrap">Time</th>
              <th className="py-2.5 px-2.5">Job No</th>
              <th className="py-2.5 px-2.5">Customer</th>
              <th className="py-2.5 px-2.5">Type</th>
              <th className="py-2.5 px-2.5">Assigned</th>
              <th className="py-2.5 px-2.5">Status</th>
              <th className="py-2.5 px-1 w-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableLeads.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-xs">No jobs scheduled</td></tr>
            )}
            {tableLeads.map((l) => {
              const isInsp = isInspLead(l);
              const timeStr = isInsp
                ? (formatApptTimeRange(l.inspectionAt || l.jobAt) || "—").toUpperCase()
                : (formatApptTimeRange(l.jobAt || l.inspectionAt) || "—").toUpperCase();
              const badge = getScheduleBadge(l.status);
              const suburb = getSuburb(l.address);
              return (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => openLeadsFiltered([l.status])}>
                  <td className="py-2.5 px-2.5 font-bold text-blue-600 whitespace-nowrap text-xs tabular-nums">{timeStr}</td>
                  <td className="py-2.5 px-2.5 font-medium text-slate-500 whitespace-nowrap text-xs">#{(l.jobNo || l.id.slice(0, 4)).replace(/^(?:JobNo-|JOB-?)/i, "")}</td>
                  <td className="py-2.5 px-2.5">
                    <div className="font-semibold text-slate-900 whitespace-nowrap text-xs">{l.name || "—"}</div>
                    {suburb && <div className="text-slate-400 text-[10px]">{suburb}</div>}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap ${isInsp ? "text-blue-600" : "text-rose-600"}`}>
                      {isInsp ? <Search className="w-3 h-3 shrink-0" /> : <Wrench className="w-3 h-3 shrink-0" />}
                      {isInsp ? "Inspection" : "Job"}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600 font-medium whitespace-nowrap text-xs">{l.assigned || l.technician || "—"}</td>
                  <td className="py-2.5 px-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td className="py-2.5 px-1"><ChevronRight className="w-3.5 h-3.5 text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-xs border border-slate-800/80">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold uppercase tracking-wider text-blue-200 mb-1 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Groutix Operations
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">Today at a glance</h2>
            <p className="text-xs text-slate-300 font-normal mt-0.5">Run dispatch, schedule, quotes, and customer workflows seamlessly.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline mr-1">
              {_now.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            <button type="button" onClick={() => setCurrentView("dispatch")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer">
              <Truck className="w-3.5 h-3.5 text-blue-300" /> Open Dispatch
            </button>
            <button type="button" onClick={openInbox} className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer">
              <Mail className="w-3.5 h-3.5 text-blue-300" /> Open Inbox
              {unreadReplyCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadReplyCount}</span>
              )}
            </button>
            <button type="button" onClick={startNewLead} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs">
              <Plus className="w-3.5 h-3.5" /> New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-3 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            { label: "Total Leads", count: scopedLeads.length, icon: <Users className="w-3.5 h-3.5 text-blue-600" />, statuses: [] as string[] },
            { label: "New Leads", count: (counts["New"] || 0) + (counts["Contacted"] || 0), icon: <Plus className="w-3.5 h-3.5 text-emerald-600" />, statuses: ["New", "Contacted"] },
            { label: "Inspection", count: inspCount, icon: <Search className="w-3.5 h-3.5 text-violet-600" />, statuses: ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress", "Inspection Completed"] },
            { label: "Quotes", count: quoteCount, icon: <FileText className="w-3.5 h-3.5 text-amber-600" />, statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
            { label: "Job Booked", count: jobBookedCount, icon: <CalendarDays className="w-3.5 h-3.5 text-sky-600" />, statuses: ["Job Booked", "Scheduled", "Job Confirmed"] },
            { label: "In Progress", count: jobInProgCount, icon: <Settings className="w-3.5 h-3.5 text-orange-600" />, statuses: ["Job En Route", "Job Arrived", "Job Started", "Job In Progress"] },
            { label: "Job Done", count: counts["Job Done"] || 0, icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />, statuses: ["Job Done"] },
            { label: "Payment Pending", count: (counts["Invoice Sent"] || 0) + (counts["Payment Pending"] || 0), icon: <ArrowRight className="w-3.5 h-3.5 text-rose-600" />, statuses: ["Invoice Sent", "Payment Pending"] },
            { label: "Warranty Sent", count: counts["Warranty Sent"] || 0, icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />, statuses: ["Warranty Sent"] },
          ]).map((stat) => (
            <button key={stat.label} type="button" onClick={() => openLeadsFiltered(stat.statuses)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 group">
              <div className="p-1 rounded-lg bg-white border border-slate-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-slate-600">{stat.label}</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums ml-0.5">{stat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Today Schedule | Next Day Schedule | Sidebar */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: "380px" }}>
        <div className="col-span-12 lg:col-span-5">
          {renderScheduleTable(todayLeads, "Today's Schedule", _now)}
        </div>
        <div className="col-span-12 lg:col-span-5">
          {renderScheduleTable(tomorrowLeads, "Next Day Schedule", _tomDate)}
        </div>
        <div className="col-span-12 lg:col-span-2 space-y-4">
          {/* Technician Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">Technician Status</h3>
            </div>
            <div className="space-y-2.5">
              {techSummary.length === 0 && <div className="text-[10px] text-slate-400 italic">No technicians assigned</div>}
              {techSummary.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {(t.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{t.name}</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.statusDot}`} />
                      <span className="text-[10px] text-slate-500 truncate">{t.statusLabel}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100">{t.todayJobs}j</div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Status Today */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">Inspection Status</h3>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Total", count: todayInsp.length, dot: "bg-blue-600" },
                { label: "On the Way", count: inspOnWay, dot: "bg-emerald-500" },
                { label: "Scheduled", count: inspScheduled, dot: "bg-sky-400" },
                { label: "Completed", count: inspCompleted, dot: "bg-slate-300" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                    <span className="text-[10px] font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Staff Locations */}
          {staffLocations.length > 0 && (role === "manager" || role === "super_admin") && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live ({staffLocations.length})
              </h3>
              <div className="space-y-1.5">
                {staffLocations.slice(0, 3).map((loc) => (
                  <a key={loc.username} href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {(loc.displayName || loc.username || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] text-slate-600 truncate">{loc.displayName || loc.username}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Customer Leads */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Customer Leads</h2>
          </div>
          <button type="button" onClick={() => setCurrentView("leads")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
            View All ({leads.length}) →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/70">
                <th className="py-2.5 px-3">JOB NO</th>
                <th className="py-2.5 px-3">CUSTOMER</th>
                <th className="py-2.5 px-3">SERVICE / TASK</th>
                <th className="py-2.5 px-3">STAGE</th>
                <th className="py-2.5 px-3">ASSIGNED</th>
                <th className="py-2.5 px-3">FOLLOW-UP</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.slice(0, 10).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-blue-600 text-xs tabular-nums whitespace-nowrap">#{(l.jobNo || l.id.slice(0, 4)).replace(/^(?:JobNo-|JOB-?)/i, "")}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 text-xs">{l.name || "Unnamed"}</div>
                    <div className="text-[11px] text-slate-400">{l.phone || l.email || ""}</div>
                  </td>
                  <td className="py-3 px-3 max-w-[180px]">
                    <div className="line-clamp-2 text-slate-600 text-xs" title={l.service}>{l.service || "General enquiry"}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(l.status)}`}>{l.status}</span>
                      <QuoteResponseBadge lead={l} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium text-xs">{l.assigned || "—"}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs tabular-nums">{l.follow ? fmtDate(l.follow) : "—"}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 flex-nowrap">
                      <button type="button" onClick={() => openQuoteModal(l)} className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer" title="Quote">Quote</button>
                      <button type="button" onClick={() => openPhotosModal(l)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Photos"><Camera className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => openMessagesModal(l)} className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Conversation">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {l.messages?.some((m) => m.from === "customer" && m.read === false) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                      </button>
                      <button type="button" onClick={() => openInspectionModal(l)} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${l.inspectionReport?.status === "completed" ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`} title="Inspection Form"><ClipboardList className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => { setEditingLead(l); setLeadModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleDeleteLead(l.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">{loading ? "Loading leads…" : "No customer leads yet."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
