"use client";

import { Search, CheckCircle2 } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { IntakeLeadRow } from "@/components/admin/rows/IntakeLeadRow";
import { FieldLeadRow } from "@/components/admin/rows/FieldLeadRow";
import { TechnicianLeadRow } from "@/components/admin/rows/TechnicianLeadRow";
import { FinanceLeadRow } from "@/components/admin/rows/FinanceLeadRow";
import { StandardLeadCard } from "@/components/admin/rows/StandardLeadCard";
import { STAGE_GROUP_ACCENT, getRoleStatusOptions } from "@/lib/adminHelpers";
import {
  STAGES,
  FIELD_STATUSES,
  FINANCE_STATUSES,
  INTAKE_STATUSES,
  TECHNICIAN_STATUSES,
  INSPECTION_STATUSES,
  isFlowCompleted,
} from "@/lib/pipeline";
import type { StageGroup } from "@/lib/pipeline";

const PAGE_SIZE = 20;

type Grp = { label: string; group: StageGroup; statuses: string[]; totalCount?: boolean; customCount?: number };

export function JobsView() {
  const {
    role,
    scopedLeads,
    counts,
    jobLeads,
    completedLeads,
    page,
    setPage,
    globalSearch,
    setGlobalSearch,
    statusFilter,
    setStatusFilter,
    setCurrentView,
  } = useAdminPageCtx();

  const single = (keys: string[]) =>
    STAGES.filter((s) => keys.includes(s.key)).map((s) => ({
      label: s.label,
      group: s.group,
      statuses: [s.key],
    }));

  const groups: Grp[] =
    role === "intake"
      ? [
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
          {
            label: "Quotes",
            group: "quote",
            statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"],
          },
          { label: "Pending Quote", group: "quote", statuses: ["Quote Pending"] },
          { label: "Job Booked", group: "job", statuses: ["Job Booked", "Scheduled", "Job Confirmed"] },
          { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
        ]
      : role === "finance"
      ? single([
          "Job Done",
          "Invoice Sent",
          "Payment Pending",
          "Payment Received",
          "Warranty Sent",
          "Completed",
        ])
      : role === "inspection" || role === "field"
      ? [
          { label: "Booked", group: "booking", statuses: ["Inspection Booked"] },
          {
            label: "In Progress",
            group: "job",
            statuses: ["Inspection En Route", "Inspection Arrived", "Inspection In Progress"],
          },
          {
            label: "Completed",
            group: "finance",
            statuses: ["Inspection Completed"],
            customCount: scopedLeads.filter((l) => isFlowCompleted(role, l.status, l)).length,
          },
        ]
      : role === "technician"
      ? [
          { label: "Booked", group: "job", statuses: ["Won", "Job Booked", "Scheduled", "Job Confirmed", "Inspection Booked"] },
          {
            label: "In Progress",
            group: "job",
            statuses: [
              "Job En Route",
              "Job Arrived",
              "Job Started",
              "Job In Progress",
              "Inspection En Route",
              "Inspection Arrived",
              "Inspection In Progress",
            ],
          },
          {
            label: "Completed",
            group: "finance",
            statuses: ["Job Done", "Completed", "Inspection Completed"],
            customCount: scopedLeads.filter((l) => isFlowCompleted(role, l.status, l)).length,
          },
        ]
      : role === "manager"
      ? [
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
          {
            label: "Quotes",
            group: "quote",
            statuses: ["Quote Pending", "Quote Sent", "Negotiation", "Won"],
          },
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
          { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
        ]
      : [
          ...STAGES.filter(
            (s) => FIELD_STATUSES.includes(s.key) || FINANCE_STATUSES.includes(s.key)
          ).map((s) => ({ label: s.label, group: s.group, statuses: [s.key] })),
          { label: "Total Leads", group: "lead", statuses: [], totalCount: true },
        ];

  const boardStatuses = getRoleStatusOptions(role);
  const filterOptions =
    role === "inspection" || role === "field"
      ? [
          "Inspection Booked",
          "Inspection En Route",
          "Inspection Arrived",
          "Inspection In Progress",
          "Inspection Completed",
        ]
      : role === "technician"
      ? Array.from(
          new Set([
            "Job Booked",
            "Inspection Booked",
            "Scheduled",
            "Job Confirmed",
            "Job En Route",
            "Job Arrived",
            "Job Started",
            "Job In Progress",
            "Job Done",
            "Completed",
            ...scopedLeads.map((l) => l.status).filter(Boolean),
          ])
        )
      : role === "finance"
      ? ["Job Done", "Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"]
      : role === "intake"
      ? ["New", "Contacted", "Inspection Booked", "Quote Pending", "Job Booked"]
      : boardStatuses;

  const allLabel =
    role === "technician"
      ? "All Assigned Jobs"
      : role === "finance"
      ? "All Finance Jobs"
      : role === "intake"
      ? "All Leads"
      : "All Active";
  const totalActive =
    role === "technician"
      ? scopedLeads.length
      : scopedLeads.filter((l) => boardStatuses.includes(l.status)).length;

  const completedCount = scopedLeads.filter(
    (l) => l.status === "Job Done" || l.status === "Completed"
  ).length;
  const isCompletedActive =
    statusFilter === "Job Done|Completed" ||
    statusFilter === "Job Done" ||
    statusFilter === "Completed";

  return (
    <div className="space-y-6">
      {/* Pipeline by Stage */}
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">
              {role === "finance"
                ? "Finance Pipeline by Stage"
                : role === "inspection" || role === "field"
                ? "Inspection Pipeline by Stage"
                : "Jobs Pipeline by Stage"}
            </h2>
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
              Click any stage to filter jobs
            </span>
          </div>
        </div>
        <div className={`grid gap-3 ${
          groups.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : groups.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        }`}>
          {groups.map((grp) => {
            const accent = STAGE_GROUP_ACCENT[grp.group] || {
              dot: "bg-cyan-500",
              value: "text-cyan-600",
            };
            const value = grp.customCount !== undefined
              ? grp.customCount
              : grp.totalCount
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
                title={
                  grp.totalCount ? "Show all leads (clear stage filter)" : `Filter by ${grp.label}`
                }
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-[#001f97]" : accent.dot}`}
                  />
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

      {/* Jobs list */}
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {role === "finance"
                  ? "Finance & Job Completion"
                  : role === "intake"
                  ? "Leads & Bookings"
                  : role === "technician"
                  ? "Technician Jobs & Work"
                  : role === "inspection" || role === "field"
                  ? "Inspection Visits"
                  : "Bookings & Jobs"}
              </h2>
              <div className="text-xs text-slate-500">
                {role === "finance"
                  ? `Showing ${jobLeads.length} completed jobs for invoicing, payment & warranty`
                  : role === "intake"
                  ? `Showing ${jobLeads.length} active leads from New to Job Booked`
                  : role === "technician"
                  ? `Showing ${jobLeads.length} assigned jobs from Booked to Job Done`
                  : role === "inspection" || role === "field"
                  ? `Showing ${jobLeads.length} inspection bookings and visit reports`
                  : `Showing ${jobLeads.length} bookings & jobs from Inspection Booked to Job Done`}
              </div>
            </div>
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-1">
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
                value={filterOptions.includes(statusFilter) ? statusFilter : ""}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="">
                  {allLabel} ({totalActive})
                </option>
                {filterOptions.map((st) => {
                  const count = scopedLeads.filter((l) => l.status === st).length;
                  return (
                    <option key={st} value={st}>
                      {st} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => {
                  setCurrentView("completed");
                  setPage(1);
                }}
                className="text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                title="View all completed records"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Completed Records</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                  {completedLeads.length}
                </span>
              </button>

              {(statusFilter || globalSearch) && (
                <button
                  onClick={() => { setStatusFilter(""); setGlobalSearch(""); }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table header & jobs list */}
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
            {jobLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => {
              if ((role as string) === "intake") return <IntakeLeadRow key={l.id} l={l} />;
              if ((role as string) === "inspection" || (role as string) === "field")
                return <FieldLeadRow key={l.id} l={l} />;
              if ((role as string) === "technician") return <TechnicianLeadRow key={l.id} l={l} />;
              if ((role as string) === "finance") return <FinanceLeadRow key={l.id} l={l} />;
              return <StandardLeadCard key={l.id} l={l} />;
            })}
            {jobLeads.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-sm">
                No bookings or jobs matching this filter.
              </div>
            )}
          </div>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={jobLeads.length} onPage={setPage} />
      </div>
    </div>
  );
}
