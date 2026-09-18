"use client";

import { useMemo } from "react";
import { Search, Mail } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { IntakeLeadRow } from "@/components/admin/rows/IntakeLeadRow";
import { FieldLeadRow } from "@/components/admin/rows/FieldLeadRow";
import { TechnicianLeadRow } from "@/components/admin/rows/TechnicianLeadRow";
import { FinanceLeadRow } from "@/components/admin/rows/FinanceLeadRow";
import { StandardLeadCard } from "@/components/admin/rows/StandardLeadCard";
import { STATUS_LIST } from "@/lib/adminHelpers";

const PAGE_SIZE = 20;

export function LeadsView() {
  const {
    role,
    leads,
    filteredLeads,
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
  } = useAdminPageCtx();

  const totalStatusCount = useMemo(() => {
    return STATUS_LIST.reduce((acc, s) => acc + (counts[s] || 0), 0);
  }, [counts]);

  return (
    <div className="space-y-6">
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
              <option value="">All statuses ({totalStatusCount || leads.length})</option>
              {statusFilter && !STATUS_LIST.includes(statusFilter) && (
                <option value={statusFilter}>
                  Filtered: {statusFilter.split("|").length > 3 ? `${statusFilter.split("|").slice(0, 2).join(", ")} +${statusFilter.split("|").length - 2}` : statusFilter.split("|").join(", ")} ({filteredLeads.length})
                </option>
              )}
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
