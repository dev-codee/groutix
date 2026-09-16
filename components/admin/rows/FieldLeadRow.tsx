"use client";

import {
  Phone, MapPin, Wrench, Camera,
  ShieldAlert, ShieldCheck, Check, ClipboardList,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";

export function FieldLeadRow({ l }: { l: Lead }) {
  const ctx = useAdminPageCtx();
  const {
    role,
    onTheWayLoading,
    isTechnicianName,
    updateLeadField,
    callCustomer,
    openGpsModal,
    handleOnTheWay,
    openInspectionModal,
    openPhotosModal,
    setEditingLead,
    setLeadModalOpen,
    staff,
  } = ctx;

  const statusOptions = getRoleStatusOptions("inspection", l.status);
  const followupPrompt = getFollowupPrompt(l);

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  const dateTimeDisplay = (() => {
    const v = l.inspectionAt || l.createdAt || l.jobAt;
    if (!v) return "";
    return `${formatApptDate(v)} ${formatApptTimeRange(v)}`;
  })();

  const serviceDisplay = l.service && (l.notes || l.message)
    ? `${l.service} | ${l.notes || l.message}`
    : l.service || l.notes || l.message || "3 Bathrooms | Silicone Replacement";

  const isInspectionBookedDone = Boolean(l.inspectionAt) || (l.status && (l.status.startsWith("Inspection") || l.status.startsWith("Quote") || l.status === "Job Booked" || l.status === "Completed"));
  const isInspectionCompletedDone = l.status === "Inspection Completed" || (l.status && (l.status.startsWith("Quote") || l.status === "Job Booked" || l.status === "Completed")) || l.inspectionReport?.status === "completed";

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
            <Wrench className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          <div className="pt-1 flex gap-1.5">
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="Call"
            >
              <Phone className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Call</span>
            </button>
            <button
              type="button"
              onClick={() => openPhotosModal(l)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="View & upload job photos"
            >
              <Camera className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="truncate">Photos</span>
              {Array.isArray(l.photos) && l.photos.length > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-blue-100 text-[#001f97] text-[10px] font-black flex items-center justify-center shrink-0">
                  {l.photos.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* COLUMN 2: INSPECTION */}
        <div className="col-span-5 min-w-0 space-y-2.5">
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">STATUS</label>
              <select
                value={l.status || "Inspection Booked"}
                onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">ASSIGNED</label>
              <div className="w-full text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs truncate cursor-default select-none">
                {(l.assigned && !isTechnicianName(l.assigned) ? l.assigned : null) || "Unassigned"}
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

          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => handleOnTheWay(l, "en_route")}
              disabled={onTheWayLoading === l.id}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 disabled:opacity-60 disabled:cursor-wait ${l.status === "Inspection En Route" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {onTheWayLoading === l.id ? "..." : "On the Way"}
            </button>

            <button
              type="button"
              onClick={() => handleOnTheWay(l, "arrived")}
              disabled={onTheWayLoading === l.id}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 disabled:opacity-60 disabled:cursor-wait ${l.status === "Inspection Arrived" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Reached
            </button>

            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: "Inspection In Progress" })}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${l.status === "Inspection In Progress" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Start
            </button>

            <button
              type="button"
              onClick={() => openInspectionModal(l)}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 flex items-center justify-center gap-1 ${l.inspectionReport?.status === "completed" || l.status === "Inspection Completed" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Inspection Form</span>
            </button>

            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: "Inspection Completed" })}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${l.status === "Inspection Completed" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Complete
            </button>
          </div>
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
            {[
              { label: "Inspection Booked", isDone: isInspectionBookedDone },
              { label: "Inspection Completed", isDone: isInspectionCompletedDone },
            ].map((item) => (
              <div
                key={item.label}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${
                  item.isDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
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
