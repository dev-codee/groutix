"use client";

import { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  ClipboardList,
  Phone,
  MapPin,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Calendar,
  Briefcase,
  FileCheck2,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { Pagination } from "@/components/admin/Pagination";
import { formatApptDate, formatApptTimeRange } from "@/lib/scheduling";
import { calculateInspectionSummary } from "@/lib/inspection";
import type { Lead } from "@/components/admin/types";

const PAGE_SIZE = 20;

type FilterType = "all" | "jobs" | "inspections";

export function CompletedView() {
  const {
    role,
    completedLeads,
    openInspectionModal,
    openPhotosModal,
    openGpsModal,
    callCustomer,
  } = useAdminPageCtx();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [page, setPage] = useState(1);

  // Categorization helpers
  const isCompletedJob = (l: Lead) => {
    return [
      "Job Done",
      "Invoice Sent",
      "Payment Pending",
      "Payment Received",
      "Warranty Sent",
      "Completed",
    ].includes(l.status);
  };

  const isCompletedInspection = (l: Lead) => {
    return (
      l.status === "Inspection Completed" ||
      l.inspectionReport?.status === "completed" ||
      Boolean(l.inspectionReport) ||
      Boolean(l.inspectionAt && [
        "Quote Pending",
        "Quote Sent",
        "Negotiation",
        "Won",
        "Job Booked",
        "Scheduled",
        "Job Confirmed",
        "Job En Route",
        "Job Arrived",
        "Job Started",
        "Job In Progress",
        "Job Done",
        "Invoice Sent",
        "Payment Pending",
        "Payment Received",
        "Warranty Sent",
        "Completed",
      ].includes(l.status))
    );
  };

  // Filter the completed leads list
  const filtered = useMemo(() => {
    let list = completedLeads;

    // Filter by type
    if (filterType === "jobs") {
      list = list.filter((l) => isCompletedJob(l));
    } else if (filterType === "inspections") {
      list = list.filter((l) => isCompletedInspection(l));
    }

    // Filter by search query
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((l) =>
        [l.jobNo, l.name, l.phone, l.email, l.service, l.address, l.notes, l.message]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return list;
  }, [completedLeads, filterType, search]);

  const totalJobsCount = useMemo(
    () => completedLeads.filter((l) => isCompletedJob(l)).length,
    [completedLeads]
  );
  const totalInspectionsCount = useMemo(
    () => completedLeads.filter((l) => isCompletedInspection(l)).length,
    [completedLeads]
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header Summary Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {role === "technician"
                ? "Completed Jobs & Inspections Archive"
                : role === "inspection" || role === "field"
                ? "Completed Inspections Archive"
                : role === "finance"
                ? "Completed Jobs Record"
                : "Completed Work & Archive"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical record of finished visits, executed jobs, and completed inspection reports retained for reference.
            </p>
          </div>
        </div>

        {/* KPI stat summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setFilterType("all");
              setPage(1);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterType === "all"
                ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30"
                : "border-slate-200/80 bg-slate-50/50 hover:border-blue-500/40 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">All Completed Records</span>
              <FileCheck2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{completedLeads.length}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("jobs");
              setPage(1);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterType === "jobs"
                ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600/30"
                : "border-slate-200/80 bg-slate-50/50 hover:border-emerald-500/40 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Completed Jobs</span>
              <Briefcase className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{totalJobsCount}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("inspections");
              setPage(1);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterType === "inspections"
                ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600/30"
                : "border-slate-200/80 bg-slate-50/50 hover:border-sky-500/40 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Completed Inspections</span>
              <ClipboardList className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-sky-700">{totalInspectionsCount}</div>
          </button>
        </div>
      </div>

      {/* Main Records List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Job #, client name, phone, address, or service..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length === 1 ? "" : "s"}
            </span>
            {(search || filterType !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 xl:gap-6 px-4 py-2.5 bg-slate-50/80 border-y border-slate-200/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider rounded-lg w-full">
          <div className="col-span-4">Client & Details</div>
          <div className="col-span-5">Completed Work & Findings</div>
          <div className="col-span-3">Actions & Records</div>
        </div>

        {/* Records list */}
        <div className="divide-y divide-slate-200/70 w-full">
          {paginated.map((l) => {
            const jobNoDisplay = l.jobNo
              ? l.jobNo.startsWith("JobNo-")
                ? l.jobNo
                : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`
              : `JobNo-${l.id.slice(0, 4)}`;

            const completedDate = l.jobAt || l.inspectionAt || l.createdAt;
            const dateTimeDisplay = completedDate
              ? `${formatApptDate(completedDate)} ${formatApptTimeRange(completedDate)}`
              : "";

            const serviceDisplay =
              l.service && (l.notes || l.message)
                ? `${l.service} | ${l.notes || l.message}`
                : l.service || l.notes || l.message || "General Service";

            const isJob = isCompletedJob(l);
            const isInsp = isCompletedInspection(l);
            const photosTotal = l.photos?.length || l.photosCount || 0;

            return (
              <div
                key={l.id}
                className="py-4 px-3 hover:bg-slate-50/60 transition-colors rounded-xl"
              >
                <div className="grid grid-cols-12 gap-4 xl:gap-6 items-start w-full">
                  {/* COLUMN 1: CLIENT & DETAILS */}
                  <div className="col-span-4 min-w-0 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
                      <span className="text-blue-700 whitespace-nowrap font-bold">
                        {jobNoDisplay}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span
                        className="text-slate-900 font-semibold truncate max-w-[180px]"
                        title={l.name || "Unnamed Customer"}
                      >
                        {l.name || "Unnamed Customer"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{l.phone || "—"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={l.address}>
                        {l.address || "No address provided"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={serviceDisplay}>
                        {serviceDisplay}
                      </span>
                    </div>

                    {dateTimeDisplay && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium pt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{dateTimeDisplay}</span>
                      </div>
                    )}
                  </div>

                  {/* COLUMN 2: COMPLETED WORK & FINDINGS */}
                  <div className="col-span-5 min-w-0 space-y-2.5">
                    {/* Status & Flow Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          l.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : l.status === "Job Done"
                            ? "bg-teal-50 text-teal-700 border-teal-200/80"
                            : l.status === "Inspection Completed"
                            ? "bg-sky-50 text-sky-700 border-sky-200/80"
                            : "bg-slate-50 text-slate-700 border-slate-200/80"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{l.status}</span>
                      </span>

                      {isJob && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-50/80 text-emerald-700 border border-emerald-200/80">
                          Job Flow Done
                        </span>
                      )}

                      {isInsp && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-sky-50/80 text-sky-700 border border-sky-200/80">
                          Inspection Done
                        </span>
                      )}
                    </div>

                    {/* Assigned Personnel */}
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70">
                      {l.technician && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Technician:</span>
                          <span className="font-semibold text-slate-800">{l.technician}</span>
                        </div>
                      )}
                      {l.assigned && l.assigned !== l.technician && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Inspector/Staff:</span>
                          <span className="font-semibold text-slate-800">{l.assigned}</span>
                        </div>
                      )}
                    </div>

                    {/* Inspection Report Snippet if available */}
                    {l.inspectionReport && (() => {
                      const summary = l.inspectionReport.findings ? calculateInspectionSummary(l.inspectionReport.findings) : null;
                      return (
                        <div className="p-2.5 bg-sky-50/50 border border-sky-200/70 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sky-900 flex items-center gap-1">
                              <ClipboardList className="w-3 h-3 text-sky-600" />
                              Inspection Report
                            </span>
                            <span className="text-[10px] font-semibold text-sky-700 uppercase bg-sky-100/70 px-1.5 py-0.5 rounded-full">
                              {l.inspectionReport.status || "Completed"}
                            </span>
                          </div>
                          {l.inspectionReport.room && (
                            <div className="text-slate-600 text-[11px]">
                              Area: <span className="font-semibold text-slate-800">{l.inspectionReport.room}</span>
                            </div>
                          )}
                          {summary && summary.yesCount > 0 && (
                            <div className="text-slate-600 text-[11px]">
                              Issues Flagged:{" "}
                              <span className="font-bold text-rose-600">
                                {summary.yesCount} issues
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Warranty Status */}
                    {l.warrantyProvided === false || l.warranty?.provided === false ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                        Warranty Not Provided
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        Warranty Provided
                      </span>
                    )}
                  </div>

                  {/* COLUMN 3: ACTIONS & RECORDS */}
                  <div className="col-span-3 min-w-0 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => callCustomer(l)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Call Customer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openPhotosModal(l)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Photos</span>
                      {photosTotal > 0 && (
                        <span className="min-w-[18px] h-4 px-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {photosTotal}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openInspectionModal(l)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-sky-50/80 hover:bg-sky-100/80 text-sky-700 border border-sky-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Inspection Form</span>
                    </button>

                    {l.gps && (
                      <button
                        type="button"
                        onClick={() => openGpsModal(l)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>View GPS Log</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {paginated.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              No completed records matching this search or filter.
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
