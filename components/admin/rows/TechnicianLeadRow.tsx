"use client";

import {
  Phone, MapPin, MessageSquare,
  ShieldAlert, ShieldCheck, Check, ClipboardList,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange } from "@/lib/scheduling";
import { ScopeOfWorkPanel } from "@/components/admin/ScopeOfWorkPanel";
import type { Lead } from "@/components/admin/types";


export function TechnicianLeadRow({ l }: { l: Lead }) {
  const ctx = useAdminPageCtx();
  const {
    role,
    onTheWayLoading,
    rowAssigneeOptions,
    isTechnicianName,
    updateLeadField,
    callCustomer,
    openGpsModal,
    handleOnTheWay,
    openInspectionModal,
    setEditingLead,
    setLeadModalOpen,
    setStartJobDays,
    setStartJobPrompt,
    statusFilter,
    setStatusFilter,
    setPage,
    setCurrentView,
    scopedLeads,
  } = ctx;

  const statusOptions = getRoleStatusOptions("technician", l.status);
  const followupPrompt = getFollowupPrompt(l);

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  const dateTimeDisplay = (() => {
    const v = l.jobAt || l.inspectionAt || l.createdAt;
    if (!v) return "";
    return `${formatApptDate(v)} ${formatApptTimeRange(v)}`;
  })();

  const serviceDisplay = l.service && (l.notes || l.message)
    ? `${l.service} | ${l.notes || l.message}`
    : l.service || l.notes || l.message || "3 Bathrooms | Silicone Replacement";

  const techStepIdx = (() => {
    const s = l.status;
    if (s === "Job En Route") return 1;
    if (s === "Job Arrived") return 2;
    if (s === "Job Started" || s === "Job In Progress" || s === "In Progress") return 3;
    if (s === "Job Done" || s === "Completed" || s === "Invoice Sent" || s === "Payment Pending" || s === "Payment Received" || s === "Warranty Sent") return 4;
    return 0;
  })();

  const isOnTheWayDone = techStepIdx >= 1;
  const isReachedDone = techStepIdx >= 2;
  const isStartDone = techStepIdx >= 3;
  const isJobDoneDone = techStepIdx >= 4;

  return (
    <div
      key={l.id}
      className="py-5 px-3 hover:bg-slate-50/60 transition-colors rounded-xl"
    >

      <div className="grid grid-cols-12 gap-4 xl:gap-6 items-start w-full">
        {/* COLUMN 1: CLIENT */}
        <div className="col-span-4 min-w-0 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold truncate flex-wrap">
            <span className="text-[#001f97] whitespace-nowrap font-black">{jobNoDisplay}</span>
            <span className="text-slate-300 font-bold">|</span>
            {role === "inspection" || role === "field" || role === "technician" ? (
              <span className="text-slate-900 truncate font-bold min-w-0" title={l.name || "Unnamed Customer"}>
                {l.name || "Unnamed Customer"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => { setEditingLead(l); setLeadModalOpen(true); }}
                className="text-slate-900 hover:text-[#001f97] hover:underline truncate cursor-pointer text-left font-bold min-w-0"
                title={l.name || "Unnamed Customer"}
              >
                {l.name || "Unnamed Customer"}
              </button>
            )}
            <span className="text-slate-300 font-bold">|</span>
            <span className="text-[#001f97] whitespace-nowrap font-bold shrink-0">{dateTimeDisplay}</span>
            {l.status === "Completed" && (
              <>
                <span className="text-slate-300 font-bold">|</span>
                {l.warrantyProvided === false || l.warranty?.provided === false ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0 shadow-2xs">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Warranty Not Provided
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Warranty Provided
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate min-w-0">
            <Phone className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate">{l.phone || "—"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={l.address}>{l.address || "No address provided"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <MessageSquare className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <Phone className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Call</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: JOB */}
        <div className="col-span-5 min-w-0 space-y-2.5">
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">STATUS</label>
              <select
                value={l.status || "Job Booked"}
                onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                className="w-full h-[34px] text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">ASSIGNED</label>
                {(() => {
                  const techName = (l.technician || l.assigned || "").trim().toLowerCase();
                  const techCompletedCount = scopedLeads.filter((x) => {
                    const isTech = (x.technician || "").trim().toLowerCase() === techName || (x.assigned || "").trim().toLowerCase() === techName;
                    return isTech && (x.status === "Job Done" || x.status === "Completed");
                  }).length;
                  if (techCompletedCount === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("completed");
                        setPage(1);
                      }}
                      className="text-[9.5px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Open completed records"
                    >
                      <span>Completed:</span>
                      <span className="font-black text-emerald-800 bg-emerald-100 px-1 rounded-full">{techCompletedCount}</span>
                    </button>
                  );
                })()}
              </div>
              <div
                className="w-full h-[34px] text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 flex items-center shadow-2xs truncate"
                title={l.technician || (l.assigned && isTechnicianName(l.assigned) ? l.assigned : l.assigned) || "Unassigned"}
              >
                <span className="truncate">
                  {l.technician || (l.assigned && isTechnicianName(l.assigned) ? l.assigned : l.assigned) || "Unassigned"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGpsModal(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer h-[34px] ${l.gps ? "bg-[#001f97] hover:bg-[#001777] text-white" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => openInspectionModal(l)}
              className="py-1.5 px-2 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer truncate min-w-0 flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Inspection Form</span>
            </button>

            <div>
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Job Booked" })}
                className={`w-full py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${l.status === "Job Booked" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Job Booked
              </button>
              {l.jobAt && (
                <div className="mt-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-semibold text-emerald-700 text-center">
                  {formatApptDate(l.jobAt)} &nbsp;•&nbsp; {formatApptTimeRange(l.jobAt)}
                </div>
              )}
            </div>
          </div>

          <ScopeOfWorkPanel
            lead={l}
            onSave={(id, scope) => updateLeadField(id, { quoteScope: scope })}
          />


          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              disabled={isOnTheWayDone || onTheWayLoading === l.id}
              onClick={() => {
                if (isOnTheWayDone) return;
                handleOnTheWay(l, "en_route");
              }}
              className={`py-1.5 px-1 text-center text-[10.5px] xl:text-xs font-bold rounded-lg transition-colors truncate min-w-0 ${
                isOnTheWayDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              }`}
              title={isOnTheWayDone ? "On the Way (Completed)" : "Mark On the Way"}
            >
              {onTheWayLoading === l.id ? "..." : "On the Way"}
            </button>

            <button
              type="button"
              disabled={isReachedDone || onTheWayLoading === l.id}
              onClick={() => {
                if (isReachedDone) return;
                handleOnTheWay(l, "arrived");
              }}
              className={`py-1.5 px-1 text-center text-[10.5px] xl:text-xs font-bold rounded-lg transition-colors truncate min-w-0 ${
                isReachedDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              }`}
              title={isReachedDone ? "Reached (Completed)" : "Mark Reached"}
            >
              Reached
            </button>

            <button
              type="button"
              disabled={isStartDone}
              onClick={() => {
                if (isStartDone) return;
                setStartJobDays(1);
                setStartJobPrompt({ lead: l });
              }}
              className={`py-1.5 px-1 text-center text-[10.5px] xl:text-xs font-bold rounded-lg transition-colors truncate min-w-0 ${
                isStartDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
              title={isStartDone ? "Job Started (Completed)" : "Start Job"}
            >
              Start
            </button>

            <button
              type="button"
              disabled={isJobDoneDone}
              onClick={() => {
                if (isJobDoneDone) return;
                updateLeadField(l.id, { status: "Job Done" });
              }}
              className={`py-1.5 px-1 text-center text-[10.5px] xl:text-xs font-bold rounded-lg transition-colors truncate min-w-0 ${
                isJobDoneDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
              title={isJobDoneDone ? "Job Done (Completed)" : "Mark Job Done"}
            >
              Job Done
            </button>
          </div>

          {l.jobTotalDays && l.jobTotalDays > 1 && l.status === "Job Started" && (
            <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-800">
                <span>Day {l.jobDaysDone || 1} of {l.jobTotalDays}</span>
                <button
                  type="button"
                  onClick={() => {
                    const done = (l.jobDaysDone || 1) + 1;
                    if (done > l.jobTotalDays!) {
                      updateLeadField(l.id, { status: "Job Done", jobDaysDone: l.jobTotalDays });
                    } else {
                      updateLeadField(l.id, { jobDaysDone: done });
                    }
                  }}
                  className="px-2 py-0.5 bg-[#001f97] text-white rounded-lg text-[9px] font-black hover:bg-[#001777] transition-colors cursor-pointer"
                >
                  {(l.jobDaysDone || 1) >= l.jobTotalDays ? "Complete Job" : "Complete Day"}
                </button>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-[#001f97] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((l.jobDaysDone || 1) / l.jobTotalDays) * 100)}%` }}
                />
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: l.jobTotalDays }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full ${i < (l.jobDaysDone || 1) ? "bg-[#001f97]" : "bg-blue-100"}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: WORKFLOW */}
        <div className="col-span-3 min-w-0 space-y-1.5">
          <div className="bg-[#ffe4e6] border border-rose-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 min-w-0">
            <span className="font-black text-rose-600 uppercase tracking-wider text-[10px] shrink-0">FOLLOW-UP</span>
            <span className="font-semibold text-slate-700 truncate text-[11px] min-w-0">
              {followupPrompt || l.followUpNext || "New enquiry – Contact customer"}
            </span>
          </div>

          <div className="space-y-1.5">
            <div>
              <div
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-default select-none border min-w-0 bg-[#dcfce7] border-emerald-300 text-slate-900"
              >
                <span className="truncate">Job Booked</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0 ml-1" />
              </div>
              {l.jobAt && (
                <div className="mt-0.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-semibold text-emerald-700 text-center">
                  {formatApptDate(l.jobAt)} &nbsp;•&nbsp; {formatApptTimeRange(l.jobAt)}
                </div>
              )}
            </div>
            {[
              { label: "Job Started", status: "Job Started", isDone: ["Job Started","Job In Progress","In Progress","Job Done","Completed"].includes(l.status) },
              { label: "Job Done", status: "Job Done", isDone: l.status === "Job Done" || l.status === "Completed" },
            ].map((item) => (
              <div
                key={item.label}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${item.isDone ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">{item.label}</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0 ml-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
