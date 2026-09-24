"use client";

import { Search, CheckCircle2 } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { IntakeLeadRow } from "@/components/admin/rows/IntakeLeadRow";
import { FieldLeadRow } from "@/components/admin/rows/FieldLeadRow";
import { TechnicianLeadRow } from "@/components/admin/rows/TechnicianLeadRow";
import { FinanceLeadRow } from "@/components/admin/rows/FinanceLeadRow";
import { StandardLeadCard } from "@/components/admin/rows/StandardLeadCard";
import { STAGE_GROUP_ACCENT, getRoleStatusOptions, getJobsGroups, type JobsGroupDef } from "@/lib/adminHelpers";
import { isFlowCompleted } from "@/lib/pipeline";

const PAGE_SIZE = 20;

type Grp = JobsGroupDef & { customCount?: number };

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

  const groups: Grp[] = getJobsGroups(role).map((g) => {
    if ((role === "inspection" || role === "field" || role === "technician") && g.label === "Completed") {
      return { ...g, customCount: scopedLeads.filter((l) => isFlowCompleted(role, l.status, l)).length };
    }
    return g;
  });

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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "finance"
                ? "Finance Pipeline by Stage"
                : role === "inspection" || role === "field"
                ? "Inspection Pipeline by Stage"
                : "Jobs Pipeline by Stage"}
            </h2>
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
              Click any stage to filter jobs
            </span>
          </div>
        </div>
        <div className={`grid gap-2.5 ${
          groups.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : groups.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        }`}>
          {groups.map((grp) => {
            const accent = STAGE_GROUP_ACCENT[grp.group] || {
              dot: "bg-sky-500",
              value: "text-sky-600",
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
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-2xs"
                    : "border-slate-200/70 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300"
                }`}
                title={
                  grp.totalCount ? "Show all leads (clear stage filter)" : `Filter by ${grp.label}`
                }
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${grp.totalCount ? "bg-blue-600" : accent.dot}`}
                  />
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

      {/* Jobs list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
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
              <div className="text-xs text-slate-400 font-medium">
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
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
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
                value={filterOptions.includes(statusFilter) ? statusFilter : ""}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl font-medium text-slate-700 focus:outline-hidden shadow-2xs"
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
                className="text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                title="View all completed records"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Completed Records</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                  {completedLeads.length}
                </span>
              </button>

              {(statusFilter || globalSearch) && (
                <button
                  onClick={() => { setStatusFilter(""); setGlobalSearch(""); }}
                  className="text-xs text-rose-600 hover:underline font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
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
