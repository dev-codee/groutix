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
  { label: "Completed 🏆", group: "closed", statuses: ["Completed"] },
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
      : STAGES.map((s) => ({ label: s.label, group: s.group, statuses: [s.key] }));

  return (
    <div className="space-y-6">
      {/* Hero bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-6 shadow-xs border border-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold uppercase tracking-wider text-blue-200 mb-1 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Groutix Operations
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">Lead Pipeline &amp; Inquiries</h2>
            <p className="text-xs text-slate-300 font-normal mt-0.5">Filter, track, and manage customer leads across all operational stages.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentView("jobs")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-300" />
              Open Dispatch
            </button>
            <button
              type="button"
              onClick={openInbox}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-300" />
              Open Inbox
              {unreadReplyCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadReplyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={startNewLead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline by Stage */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Pipeline by Stage</h2>
            {statusFilter && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Filtered: {statusFilter}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statusFilter && (
              <button
                type="button"
                onClick={() => { setStatusFilter(""); setPage(1); }}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">
              Click any stage to filter the leads table
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {groups.map((grp) => {
            const accent = STAGE_GROUP_ACCENT[grp.group] || { dot: "bg-blue-500", value: "text-blue-600" };
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-2xs"
                    : "border-slate-200/70 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300"
                }`}
                title={grp.totalCount ? "Show all leads (clear stage filter)" : `Show ${grp.label} leads`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-blue-600" : accent.dot}`} />
                  <span className="text-[11px] font-semibold text-slate-600 leading-tight line-clamp-1">
                    {grp.label}
                  </span>
                </div>
                <div
                  className={`text-xl font-bold tabular-nums ${
                    value ? (grp.totalCount ? "text-blue-600" : accent.value) : "text-slate-300"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job #, name, phone, email, service..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl font-medium text-slate-700 focus:outline-hidden shadow-2xs"
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
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-2xs ${
                onlyUnread
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-50/80 text-slate-600 border-slate-200/90 hover:bg-slate-100"
              }`}
              title="Show only conversations with an unread customer reply"
            >
              <Mail className="w-3.5 h-3.5" />
              Unread replies
              {unreadReplyCount > 0 && (
                <span
                  className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
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
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-400">
            Showing <span className="font-semibold text-slate-700">{filteredLeads.length}</span> of {leads.length} leads
          </div>
        </div>

        {/* Table header & list */}
        <div className="w-full">
          {role === "intake" ? (
            <div className="hidden lg:grid grid-cols-12 gap-4 xl:gap-6 px-4 py-2.5 bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">INSPECTION &amp; QUOTE</div>
              <div className="col-span-3">WORKFLOW (UPTO JOB BOOKED)</div>
            </div>
          ) : role === "inspection" || role === "field" ? (
            <div className="hidden lg:grid grid-cols-12 gap-4 xl:gap-6 px-4 py-2.5 bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">INSPECTION (NO QUOTE)</div>
              <div className="col-span-3">WORKFLOW (UPTO INSPECTION COMPLETED)</div>
            </div>
          ) : role === "technician" ? (
            <div className="hidden lg:grid grid-cols-12 gap-4 xl:gap-6 px-4 py-2.5 bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">JOB (NO QUOTE)</div>
              <div className="col-span-3">WORKFLOW (JOB BOOKED TO JOB DONE)</div>
            </div>
          ) : role === "finance" ? (
            <div className="hidden lg:grid grid-cols-12 gap-4 xl:gap-6 px-4 py-2.5 bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl mb-3 w-full">
              <div className="col-span-4">CLIENT</div>
              <div className="col-span-5">FINANCE (FROM JOB DONE)</div>
              <div className="col-span-3">WORKFLOW (FINANCE)</div>
            </div>
          ) : (
            <div className="hidden lg:grid grid-cols-4 gap-6 px-5 py-2.5 bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-xl mb-3 w-full">
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
