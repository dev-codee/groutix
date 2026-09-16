"use client";

import {
  Phone, Mail, MapPin, Wrench, MessageSquare, Send,
  ShieldAlert, ShieldCheck, Check, ChevronRight, ClipboardList,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt, getWhatsAppLink } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";

export function IntakeLeadRow({ l }: { l: Lead }) {
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
    openPhotosModal,
    openMessagesModal,
    openQuoteModal,
    setEditingLead,
    setLeadModalOpen,
    staff,
    assignableTechnicians,
  } = ctx;

  const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
  const statusOptions = getRoleStatusOptions("intake", l.status);
  const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);
  const waUrl = getWhatsAppLink(l.phone);
  const followupPrompt = getFollowupPrompt(l);

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  const dateTimeDisplay = (() => {
    const v = l.createdAt || l.inspectionAt || l.jobAt;
    if (!v) return "";
    return `${formatApptDate(v)} ${formatApptTime(v)}`;
  })();

  const serviceDisplay = l.service || "3 Bathrooms | Silicone Replacement";
  const notesDisplay = l.notes || l.message;

  const isNewDone = true;
  const isInspectionBookedDone = Boolean(l.inspectionAt) || (l.status && (l.status.startsWith("Inspection") || l.status.startsWith("Quote") || l.status === "Job Booked" || l.status === "Completed"));
  const isInspectionCompletedDone = l.status === "Inspection Completed" || (l.status && (l.status.startsWith("Quote") || l.status === "Job Booked" || l.status === "Completed")) || l.inspectionReport?.status === "completed";
  const isQuoteSentDone = l.status === "Quote Sent" || l.status === "Won" || l.status === "Job Booked" || l.status === "Completed";
  const isJobBookedDone = l.status === "Job Booked" || l.status === "Completed";

  return (
    <div
      key={l.id}
      className="py-5 px-3 hover:bg-slate-50/60 transition-colors rounded-xl"
    >
      <div className="grid grid-cols-12 gap-4 xl:gap-6 items-start w-full">
        {/* COLUMN 1: CLIENT */}
        <div className="col-span-4 min-w-0 space-y-2.5">
          {/* Row 1: JobNo | Name | Date Time */}
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
                onClick={() => {
                  setEditingLead(l);
                  setLeadModalOpen(true);
                }}
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

          {/* Row 2: Phone & Email */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate min-w-0">
              <Phone className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
              <span className="truncate">{l.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate text-right min-w-0">
              <Mail className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
              <span className="truncate" title={l.email}>{l.email || "—"}</span>
            </div>
          </div>

          {/* Row 3: Address */}
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={l.address}>{l.address || "No address provided"}</span>
          </div>

          {/* Row 4: Service */}
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <Wrench className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          {/* Row 5: Notes */}
          {notesDisplay ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
              <MessageSquare className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
              <span className="truncate" title={`Notes: ${notesDisplay}`}>Notes: {notesDisplay}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-normal truncate">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Notes: None</span>
            </div>
          )}

          {/* Row 6: 5 Action Buttons */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="Call"
            >
              <Phone className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Call</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!l.email) { alert("This customer does not have an email address saved."); return; }
                openMessagesModal(l);
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="Email"
            >
              <Mail className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Email</span>
            </button>

            <button
              type="button"
              onClick={() => openMessagesModal(l, "sms")}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="SMS"
            >
              <MessageSquare className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">SMS</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors min-w-0"
              title="WhatsApp"
            >
              <Send className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => openMessagesModal(l)}
              className="relative flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
              title="Conversation"
            >
              <MessageSquare className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Conversation</span>
              {hasCustomerUnread && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* COLUMN 2: INSPECTION & QUOTE */}
        <div className="col-span-5 min-w-0 space-y-2.5">
          {/* Row 1: STATUS, ASSIGNED, GPS */}
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">
                STATUS
              </label>
              <select
                value={l.status || "New"}
                onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">
                ASSIGNED
              </label>
              <select
                value={l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned"}
                onChange={(e) => {
                  const name = e.target.value === "Unassigned" ? "" : e.target.value;
                  const inspectorStaff = staff.find((s) => s.name === name);
                  updateLeadField(l.id, { assigned: name, inspectorId: inspectorStaff?.id || "" });
                }}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {assigneeOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => openGpsModal(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer h-[34px] ${l.gps ? "bg-[#001f97] hover:bg-[#001777] text-white" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              title={l.gps ? "GPS Location Recorded" : "GPS Check-in"}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>GPS</span>
            </button>
          </div>

          {/* Row 2: On the Way, Reached, Start, Inspection Form, Complete */}
          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => handleOnTheWay(l, "en_route")}
              disabled={onTheWayLoading === l.id}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 disabled:opacity-60 disabled:cursor-wait ${
                l.status === "Inspection En Route"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {onTheWayLoading === l.id ? "..." : "On the Way"}
            </button>

            <button
              type="button"
              onClick={() => handleOnTheWay(l, "arrived")}
              disabled={onTheWayLoading === l.id}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 disabled:opacity-60 disabled:cursor-wait ${
                l.status === "Inspection Arrived"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Reached
            </button>

            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: "Inspection In Progress" })}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${
                l.status === "Inspection In Progress"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
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
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${
                l.status === "Inspection Completed"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Complete
            </button>
          </div>

          {/* Row 3: Quote, Sent, Job Booked, Assign Tech */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => openQuoteModal(l)}
              className="py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer truncate min-w-0"
            >
              Quote
            </button>

            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: "Quote Sent" })}
              className={`py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${
                l.status === "Quote Sent"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sent
            </button>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Job Booked" })}
                className={`w-full py-1.5 px-0.5 text-center text-[10px] xl:text-[11px] font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 ${
                  l.status === "Job Booked"
                    ? "bg-[#001f97] text-white shadow-2xs"
                    : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Job Booked
              </button>
              {l.jobAt && (
                <div className="mt-1 px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-semibold text-emerald-700 text-center leading-tight">
                  {formatApptDate(l.jobAt, { day: "numeric", month: "short" })} {formatApptTime(l.jobAt)}
                </div>
              )}
            </div>

            <select
              value={l.technician || ""}
              onChange={(e) => {
                const techName = e.target.value;
                const tech = assignableTechnicians.find((t) => t.name === techName);
                updateLeadField(l.id, { technician: techName, technicianId: tech?.id || "" });
              }}
              className="w-full text-[10px] xl:text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate min-w-0"
            >
              <option value="">Assign Tech</option>
              {assignableTechnicians.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* COLUMN 3: WORKFLOW */}
        <div className="col-span-3 min-w-0 space-y-1.5">
          <div className="bg-[#ffe4e6] border border-rose-200 text-slate-800 text-xs px-2 py-0.5 rounded-lg flex items-center gap-1.5 min-w-0">
            <span className="font-black text-rose-600 uppercase tracking-wider text-[10px] shrink-0">FOLLOW-UP</span>
            <span className="font-semibold text-slate-700 truncate text-[11px] min-w-0">
              {followupPrompt || l.followUpNext || "New enquiry – Contact customer"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <div className="space-y-1 min-w-0">
              <div
                className={`w-full px-1.5 py-1.5 rounded text-[10px] xl:text-[11px] font-bold flex items-center justify-between cursor-default select-none min-w-0 border ${
                  isNewDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">New</span>
                {isNewDone && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>

              <div
                className={`w-full px-1.5 py-1.5 rounded text-[10px] xl:text-[11px] font-bold flex items-center justify-between cursor-default select-none min-w-0 border ${
                  isInspectionCompletedDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">Inspection Completed</span>
                {isInspectionCompletedDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                )}
              </div>

              <div
                className={`w-full px-1.5 py-1.5 rounded text-[10px] xl:text-[11px] font-bold flex items-center justify-between cursor-default select-none min-w-0 border ${
                  isJobBookedDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">Job Booked</span>
                {isJobBookedDone && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>
              {l.jobAt && (
                <div className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-semibold text-emerald-700 text-center leading-tight">
                  {formatApptDate(l.jobAt, { day: "numeric", month: "short" })} {formatApptTime(l.jobAt)}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div
                className={`w-full px-1.5 py-1.5 rounded text-[10px] xl:text-[11px] font-bold flex items-center justify-between cursor-default select-none min-w-0 border ${
                  isInspectionBookedDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">Inspection Booked</span>
                {isInspectionBookedDone && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>

              <div
                className={`w-full px-1.5 py-1.5 rounded text-[10px] xl:text-[11px] font-bold flex items-center justify-between cursor-default select-none min-w-0 border ${
                  isQuoteSentDone
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">Quote Sent</span>
                {isQuoteSentDone && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
