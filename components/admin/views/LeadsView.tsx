"use client";

import { Search, Mail, Plus, Briefcase } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { IntakeLeadRow } from "@/components/admin/rows/IntakeLeadRow";
import { FieldLeadRow } from "@/components/admin/rows/FieldLeadRow";
import { TechnicianLeadRow } from "@/components/admin/rows/TechnicianLeadRow";
import { FinanceLeadRow } from "@/components/admin/rows/FinanceLeadRow";
import { StandardLeadCard } from "@/components/admin/rows/StandardLeadCard";
import { STATUS_LIST, STAGE_GROUP_ACCENT } from "@/lib/adminHelpers";
import { STAGES } from "@/lib/pipeline";
import type { StageGroup } from "@/lib/pipeline";

const PAGE_SIZE = 20;

type Grp = { label: string; group: StageGroup; statuses: string[]; totalCount?: boolean };

const intakeGroups: Grp[] = [
  { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
  { label: "New leads", group: "lead", statuses: ["New"] },
  { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
  {
    label: "Inspections",
    group: "booking",
    statuses: [
      "Inspection Booked",
      "Inspection En Route",
      "Inspection Arrived",
      "Inspection In Progress",
      "Inspection Completed",
    ],
  },
  { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
  { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
  { label: "Job Booked", group: "job", statuses: ["Job Booked", "Scheduled", "Job Confirmed"] },
];

const managerGroups: Grp[] = [
  { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
  { label: "New leads", group: "lead", statuses: ["New"] },
  { label: "Contacted", group: "lead", statuses: ["Contacted", "Waiting for Info"] },
  {
    label: "Inspection",
    group: "booking",
    statuses: [
      "Inspection Booked",
      "Inspection En Route",
      "Inspection Arrived",
      "Inspection In Progress",
      "Inspection Completed",
    ],
  },
  { label: "Quotes", group: "quote", statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"] },
  { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
  {
    label: "Job Booked",
    group: "job",
    statuses: [
      "Job Booked",
      "Scheduled",
      "Job Confirmed",
      "Job En Route",
      "Job Arrived",
      "Job In Progress",
    ],
  },
  { label: "Job Done", group: "finance", statuses: ["Job Done"] },
  { label: "Payment Pending", group: "finance", statuses: ["Payment Pending"] },
  {
    label: "Payment Received",
    group: "finance",
    statuses: ["Invoice Sent", "Payment Pending", "Payment Received"],
  },
  { label: "Warranty Sent", group: "finance", statuses: ["Warranty Sent"] },
  { label: "Achievements", group: "closed", statuses: ["Completed"] },
];

export function LeadsView() {
  const {
    role,
    leads,
    filteredLeads,
    scopedLeads,
    counts,
    page,
    setPage,
    globalSearch,
    setGlobalSearch,
    statusFilter,
    setStatusFilter,
    onlyUnread,
    setOnlyUnread,
    setPriorityFilter,
    unreadReplyCount,
    openInbox,
    startNewLead,
    setCurrentView,
  } = useAdminPageCtx();

  const groups: Grp[] =
    role === "intake"
      ? intakeGroups
      : role === "manager"
      ? managerGroups
      : [
          { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
          ...STAGES.map((s) => ({ label: s.label, group: s.group, statuses: [s.key] })),
        ];

  return (
    <div className="space-y-6">
      {/* Hero bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001f97] to-[#0a34c4] text-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
              Groutix Operations
            </div>
            <h2 className="text-2xl font-black mt-1">Today at a glance</h2>
            <p className="text-sm text-white/70 mt-1">Run the whole business from one screen.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentView("jobs")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Open Dispatch
            </button>
            <button
              type="button"
              onClick={openInbox}
              className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Open Inbox
              {unreadReplyCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                  {unreadReplyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={startNewLead}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#001f97] text-sm font-black hover:bg-white/90 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">Pipeline by Stage</h2>
            {statusFilter && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#001f97]/10 text-[#001f97]">
                Filtered: {statusFilter}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statusFilter && (
              <button
                type="button"
                onClick={() => { setStatusFilter(""); setPage(1); }}
                className="text-[11px] font-bold text-[#001f97] hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any stage to filter the leads table
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {groups.map((grp) => {
            const accent = STAGE_GROUP_ACCENT[grp.group] || { dot: "bg-blue-500", value: "text-[#001f97]" };
            const value = grp.totalCount
              ? scopedLeads.length
              : grp.statuses.reduce((a, k) => a + (counts[k] || 0), 0);
            const joined = grp.statuses.join("|");
            const active = grp.totalCount ? statusFilter === "" : statusFilter === joined;
            return (
              <button
                key={grp.label}
                type="button"
                onClick={() => {
                  if (grp.totalCount) { setStatusFilter(""); } else { setStatusFilter(active ? "" : joined); }
                  setPage(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#001f97]/30 cursor-pointer ${
                  active
                    ? "border-[#001f97] bg-[#001f97]/5 ring-1 ring-[#001f97]"
                    : "border-slate-200 bg-slate-50/60 hover:border-[#001f97]/40"
                }`}
                title={grp.totalCount ? "Show all leads (clear stage filter)" : `Show ${grp.label} leads`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-[#001f97]" : accent.dot}`} />
                  <span className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-1">
                    {grp.label}
                  </span>
                </div>
                <div
                  className={`text-2xl font-black ${
                    value ? (grp.totalCount ? "text-[#001f97]" : accent.value) : "text-slate-300"
                  }`}
                >
                  {value}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads list */}
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job #, name, phone, email, service..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#001f97] focus:bg-white transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="">All statuses ({leads.length})</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s} ({counts[s] || 0})
                </option>
              ))}
            </select>

            <button
              onClick={() => setOnlyUnread((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl border font-semibold transition-colors ${
                onlyUnread
                  ? "bg-[#001f97] text-white border-[#001f97]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Show only conversations with an unread customer reply"
            >
              <Mail className="w-3.5 h-3.5" />
              Unread replies
              {unreadReplyCount > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                    onlyUnread ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                  }`}
                >
                  {unreadReplyCount}
                </span>
              )}
            </button>

            {(statusFilter || globalSearch || onlyUnread) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setGlobalSearch("");
                  setOnlyUnread(false);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>

        {/* Table header & list */}
        <div className="w-full">
          {role === "intake" ? (
            <div className="grid grid-cols-12 gap-4 xl:gap-6 px-4 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">INSPECTION &amp; QUOTE</div>
              <div className="col-span-3">WORKFLOW (UPTO JOB BOOKED)</div>
            </div>
          ) : role === "inspection" || role === "field" ? (
            <div className="grid grid-cols-12 gap-4 xl:gap-6 px-4 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">INSPECTION (NO QUOTE)</div>
              <div className="col-span-3">WORKFLOW (UPTO INSPECTION COMPLETED)</div>
            </div>
          ) : role === "technician" ? (
            <div className="grid grid-cols-12 gap-4 xl:gap-6 px-4 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">JOB (NO QUOTE)</div>
              <div className="col-span-3">WORKFLOW (JOB BOOKED TO JOB DONE)</div>
            </div>
          ) : role === "finance" ? (
            <div className="grid grid-cols-12 gap-4 xl:gap-6 px-4 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">FINANCE (FROM JOB DONE)</div>
              <div className="col-span-3">WORKFLOW (FINANCE)</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6 px-5 py-3 bg-[#e8f0fe] text-[#1e3a8a] text-xs font-black uppercase tracking-wider rounded-xl mb-3 w-full">
              <div>CLIENT</div>
              <div>INSPECTION &amp; QUOTE</div>
              <div>FINANCE</div>
              <div>WORKFLOW</div>
            </div>
          )}

          <div className="divide-y divide-slate-200/80 w-full">
            {filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => {
              if ((role as string) === "intake") return <IntakeLeadRow key={l.id} l={l} />;
              if ((role as string) === "inspection" || (role as string) === "field")
                return <FieldLeadRow key={l.id} l={l} />;
              if ((role as string) === "technician") return <TechnicianLeadRow key={l.id} l={l} />;
              if ((role as string) === "finance") return <FinanceLeadRow key={l.id} l={l} />;
              return <StandardLeadCard key={l.id} l={l} />;
            })}
            {filteredLeads.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                No leads matching the current filters.
              </div>
            )}
          </div>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={filteredLeads.length} onPage={setPage} />
      </div>
    </div>
  );
}
