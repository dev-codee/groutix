"use client";

import {
  Phone, MapPin, Wrench, Camera, Navigation,
  ShieldAlert, ShieldCheck, Check, ClipboardList,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getFollowupPrompt, getEffectiveWorkflowStatus } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange, formatApptTime } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";
import { useDistanceKm } from "@/lib/useDistanceKm";
import { ZoneBadge } from "@/components/admin/ZoneBadge";

export function FieldLeadRow({ l }: { l: Lead }) {
  const distanceKm = useDistanceKm(l.address);
  const ctx = useAdminPageCtx();
  const {
    role,
    onTheWayLoading,
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

  const followupPrompt = getFollowupPrompt(l);

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  const dateTimeDisplay = (() => {
    const v = l.inspectionAt || l.jobAt;
    if (v) return `${formatApptDate(v)} ${formatApptTimeRange(v)}`;
    if (l.createdAt) return `${formatApptDate(l.createdAt)} ${formatApptTime(l.createdAt)}`;
    return "";
  })();

  const serviceDisplay = l.service && (l.notes || l.message)
    ? `${l.service} | ${l.notes || l.message}`
    : l.service || l.notes || l.message || "3 Bathrooms | Silicone Replacement";

  const workflowStatus = getEffectiveWorkflowStatus(l);
  const isInspectionBookedDone = Boolean(l.inspectionAt) || (workflowStatus && (workflowStatus.startsWith("Inspection") || workflowStatus.startsWith("Quote") || workflowStatus === "Job Booked" || workflowStatus === "Completed"));
  const isInspectionCompletedDone = workflowStatus === "Inspection Completed" || (workflowStatus && (workflowStatus.startsWith("Quote") || workflowStatus === "Job Booked" || workflowStatus === "Completed")) || l.inspectionReport?.status === "completed";

  const inspectionStepIdx = (() => {
    const s = workflowStatus;
    if (!s || s === "Inspection Booked") return 0;
    if (s === "Inspection En Route") return 1;
    if (s === "Inspection Arrived") return 2;
    if (s === "Inspection In Progress") return 3;
    if (
      s === "Inspection Completed" ||
      l.inspectionReport?.status === "completed" ||
      s.startsWith("Quote") ||
      s === "Won" ||
      s.startsWith("Job") ||
      s === "Scheduled" ||
      s.startsWith("Invoice") ||
      s.startsWith("Payment") ||
      s.startsWith("Warranty") ||
      s === "Completed"
    ) return 4;
    return 0;
  })();

  const isOnTheWayDone = inspectionStepIdx >= 1;
  const isReachedDone = inspectionStepIdx >= 2;
  const isStartDone = inspectionStepIdx >= 3;
  const isCompleteDone = inspectionStepIdx >= 4;

  return (
    <div
      key={l.id}
      className="py-5 px-3 hover:bg-slate-50/60 transition-colors rounded-xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-start w-full divide-y divide-slate-100 lg:divide-y-0">
        {/* COLUMN 1: CLIENT */}
        <div className="col-span-12 lg:col-span-4 min-w-0 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold truncate flex-wrap">
            <span className="text-blue-700 whitespace-nowrap font-bold">{jobNoDisplay}</span>
            <span className="text-slate-300 font-normal">|</span>
            {role === "inspection" || role === "field" || role === "technician" ? (
              <span className="text-slate-900 truncate font-semibold min-w-0" title={l.name || "Unnamed Customer"}>
                {l.name || "Unnamed Customer"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => { setEditingLead(l); setLeadModalOpen(true); }}
                className="text-slate-900 hover:text-blue-600 hover:underline truncate cursor-pointer text-left font-semibold min-w-0"
                title={l.name || "Unnamed Customer"}
              >
                {l.name || "Unnamed Customer"}
              </button>
            )}
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-slate-500 whitespace-nowrap font-medium shrink-0">{dateTimeDisplay}</span>
            {l.status === "Completed" && (
              <>
                <span className="text-slate-300 font-normal">|</span>
                {l.warrantyProvided === false || l.warranty?.provided === false ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0 shadow-2xs">
                    <ShieldAlert className="w-3 h-3 text-rose-500" />
                    Warranty Not Provided
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Warranty Provided
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate min-w-0">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{l.phone || "—"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={l.address}>{l.address || "No address provided"}</span>
            {distanceKm !== null && (
              <span className="shrink-0 ml-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                {distanceKm} km
              </span>
            )}
          </div>

          {l.address && (
            <div className="flex items-center gap-1.5">
              <ZoneBadge address={l.address} />
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          <div className="pt-1 flex gap-1.5">
            {/* Directions: an inspector drives to every one of these, so the map
                link belongs on the row rather than two clicks deep in the GPS modal. */}
            <a
              href={l.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.address}, VIC, Australia`)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!l.address}
              onClick={(e) => { if (!l.address) e.preventDefault(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border rounded-lg text-[10px] xl:text-[11px] font-semibold transition-colors min-w-0 shadow-2xs ${
                l.address
                  ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 cursor-pointer"
                  : "bg-slate-50 text-slate-300 border-slate-200/60 cursor-not-allowed"
              }`}
              title={l.address ? "Open driving directions" : "No address on this lead"}
            >
              <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">Navigate</span>
            </a>
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-[10px] xl:text-[11px] font-semibold transition-colors cursor-pointer min-w-0 shadow-2xs"
              title="Call"
            >
              <Phone className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">Call</span>
            </button>
            <button
              type="button"
              onClick={() => openPhotosModal(l)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-[10px] xl:text-[11px] font-semibold transition-colors cursor-pointer min-w-0 shadow-2xs"
              title="View & upload job photos"
            >
              <Camera className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">Photos</span>
              {Array.isArray(l.photos) && l.photos.length > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {l.photos.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* COLUMN 2: INSPECTION */}
        <div className="col-span-12 lg:col-span-5 min-w-0 space-y-2.5 pt-4 lg:pt-0">
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">STATUS</label>
              <div className="w-full text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs truncate cursor-default select-none">
                {l.status || "Inspection Booked"}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">ASSIGNED</label>
              <div className="w-full text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs truncate cursor-default select-none">
                {l.assigned || "Unassigned"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGpsModal(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer h-[34px] ${
                l.gps
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ctx.locationTrackingActive
                    ? "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title={l.gps ? `GPS Check-in: ${l.gps.lat.toFixed(5)}, ${l.gps.lng.toFixed(5)}` : "Live Real-Time GPS Tracking"}
            >
              <span className={`w-2 h-2 rounded-full ${l.gps ? "bg-white" : ctx.locationTrackingActive ? "bg-blue-600 animate-ping" : "bg-slate-400"}`} />
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{l.gps ? "GPS Saved" : ctx.locationTrackingActive ? "Live GPS" : "GPS"}</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              disabled={isOnTheWayDone || onTheWayLoading === l.id}
              onClick={() => {
                if (isOnTheWayDone) return;
                handleOnTheWay(l, "en_route", "inspection");
              }}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors truncate min-w-0 ${
                isOnTheWayDone
                  ? "bg-amber-500 text-white shadow-2xs cursor-default select-none"
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
                handleOnTheWay(l, "arrived", "inspection");
              }}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors truncate min-w-0 ${
                isReachedDone
                  ? "bg-amber-500 text-white shadow-2xs cursor-default select-none"
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
                updateLeadField(l.id, { status: "Inspection In Progress" });
              }}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors truncate min-w-0 ${
                isStartDone
                  ? "bg-blue-600 text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
              title={isStartDone ? "Inspection Started (Completed)" : "Start Inspection"}
            >
              Start
            </button>

            <button
              type="button"
              onClick={() => openInspectionModal(l)}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 flex items-center justify-center gap-1 ${l.inspectionReport?.status === "completed" || isCompleteDone ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              title="Inspection Form"
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Inspection Form</span>
            </button>

            <button
              type="button"
              disabled={isCompleteDone}
              onClick={() => {
                if (isCompleteDone) return;
                updateLeadField(l.id, { status: "Inspection Completed" });
              }}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors truncate min-w-0 ${
                isCompleteDone
                  ? "bg-blue-600 text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
              title={isCompleteDone ? "Inspection Completed" : "Mark Complete"}
            >
              Complete
            </button>
          </div>
        </div>

        {/* COLUMN 3: WORKFLOW */}
        <div className="col-span-12 lg:col-span-3 min-w-0 space-y-1.5 pt-4 lg:pt-0">
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
                {item.isDone ? (
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0 ml-1" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 ml-1" aria-label="Not done yet" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
