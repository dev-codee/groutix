"use client";

import { useState } from "react";
import {
  Camera, Phone, Mail, MessageSquare, Trash2, Check,
  Navigation, Eye, CheckCircle2, ShieldCheck, ShieldAlert,
  Clock, ChevronRight, Send, DollarSign, X,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import {
  getLeadQuoteTotal, getFollowupPrompt, getWhatsAppLink,
  getRoleStatusOptions, visitStepsFor, INSPECTION_STEPS,
  JOB_STEPS, STATUS_LIST, fmtDate, getStepActive,
} from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";

export function StandardLeadCard({ l }: { l: Lead }) {
  const {
    role,
    updateLeadField,
    callCustomer,
    openMessagesModal,
    openPhotosModal,
    openInspectionModal,
    openGpsModal,
    openQuoteModal,
    openWarrantyModal,
    openInvoiceModal,
    handleDeleteLead,
    setEditingLead,
    setLeadModalOpen,
    inspectionStaff,
    assignableTechnicians,
    handleOnTheWay,
    onTheWayLoading,
  } = useAdminPageCtx();

  const total = getLeadQuoteTotal(l);
  const photosTotal = l.photos?.length || l.photosCount || 0;
  const followupPrompt = getFollowupPrompt(l);
  const waUrl = getWhatsAppLink(l.phone);
  const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
  const hasReplied = l.messages?.some((m) => m.from === "customer");

  // ── Payment dialog state (mirrors FinanceLeadRow) ──────────────────────────
  type PaymentStep = "idle" | "ask_type" | "ask_amount";
  const [payStep, setPayStep] = useState<PaymentStep>("idle");
  const [partialAmt, setPartialAmt] = useState<string>("");

  const invoiceTotal = l.quoteAmount && l.quoteAmount > 0 ? l.quoteAmount : null;
  const invoiceTotalFmt = invoiceTotal ? `AUD $${invoiceTotal.toFixed(2)}` : null;
  const halfAmt = invoiceTotal ? invoiceTotal / 2 : null;
  const isPaymentReceived = ["Payment Received", "Warranty Sent", "Completed"].includes(l.status);
  const isPaymentPending = l.status === "Payment Pending";

  function handlePaymentReceived(type: "full" | "partial", customAmt?: number) {
    const updates: Partial<Lead> = {
      status: "Payment Received",
      paymentType: type,
      amountPaid: type === "full" ? (invoiceTotal ?? undefined) : customAmt,
    };
    updateLeadField(l.id, updates);
    setPayStep("idle");
    setPartialAmt("");
  }

  return (
    <div className="py-5 px-3 hover:bg-slate-50/60 transition-colors rounded-xl">
      <div className="grid grid-cols-4 gap-6 items-start">

        {/* COLUMN 0: CLIENT */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Status</label>
            <select
              value={l.status || "New"}
              onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
              className={`text-xs px-2 py-1.5 rounded-lg border font-semibold min-h-[34px] cursor-pointer shadow-2xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#001f97] ${
                l.status === "Completed"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-900 hover:border-emerald-400"
                  : "bg-white border-slate-200 text-slate-800 hover:border-[#001f97]"
              }`}
              title="Change status manually"
            >
              {(role === "intake" ? getRoleStatusOptions(role, l.status) : Array.from(new Set([l.status, ...STATUS_LIST, "Payment Request"])).filter(Boolean)).map((s) => (
                <option key={s} value={s}>
                  {s === "Completed" ? "Completed 🏆" : s === "Won" ? "Won (Quote Accepted)" : s === "Lost" ? "Lost / Closed" : s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
              <div className="font-black text-[#001f97] text-xs sm:text-sm whitespace-nowrap tracking-tight shrink-0">
                {l.jobNo || "—"}
              </div>
              {(() => {
                const rIso = l.received || l.createdAt;
                if (!rIso) return null;
                const dateStr = formatApptDate(rIso, { day: "numeric", month: "short" });
                if (!dateStr) return null;
                const timeStr = formatApptTimeRange(rIso);
                const fullDateStr = formatApptDate(rIso);
                return (
                  <div
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap"
                    title={`Received on ${fullDateStr} at ${timeStr}`}
                  >
                    <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span>Rec: {dateStr}, {timeStr}</span>
                  </div>
                );
              })()}
            </div>
            <div className="font-bold text-slate-900 text-sm truncate" title={l.name || "Unnamed Customer"}>
              {l.name || "Unnamed Customer"}
            </div>
            <div className="space-y-1 text-xs text-slate-600 mt-1">
              {l.email ? (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={l.email}>{l.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>No email</span>
                </div>
              )}
              {l.phone ? (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{l.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>No phone</span>
                </div>
              )}
              {l.address && (
                <div className="text-[11px] text-slate-400 italic pt-0.5 truncate" title={l.address}>
                  {l.address}
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <div className="font-bold text-xs text-slate-900 line-clamp-2 uppercase tracking-tight" title={l.service}>
              {l.service || "Standard Work"}
            </div>
          </div>

          <div className="pt-0.5">
            <button
              onClick={() => openPhotosModal(l)}
              className="w-full px-3 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-between border border-slate-200/80 transition-colors cursor-pointer"
              title="View & upload job / inspection photos"
            >
              <span className="flex items-center gap-2 text-slate-800">
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                <span>Photos / Camera</span>
              </span>
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-[#001f97] text-[11px] font-black flex items-center justify-center">
                {photosTotal}
              </span>
            </button>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => callCustomer(l)}
                className="flex items-center justify-center gap-1 py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="Call customer phone"
              >
                <Phone className="w-3 h-3 shrink-0" />
                <span>Call</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!l.email) { alert("This customer does not have an email address saved."); return; }
                  openMessagesModal(l);
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="Send email"
              >
                <Mail className="w-3 h-3 shrink-0" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => openMessagesModal(l, "sms")}
                className="flex items-center justify-center gap-1 py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="Send SMS"
              >
                <span>SMS</span>
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                title="Open WhatsApp chat"
              >
                <span>WhatsApp</span>
              </a>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openMessagesModal(l)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg text-xs font-bold"
                title="Open messaging conversation"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {hasCustomerUnread
                    ? "Customer replied!"
                    : hasReplied
                      ? "Customer replied"
                      : "Conversation"}
                </span>
                {hasCustomerUnread && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
              <button
                onClick={() => { setEditingLead(l); setLeadModalOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteLead(l.id)}
                title="Delete Lead"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fee2e2] hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: INSPECTION & QUOTE */}
        <div className="space-y-2.5 min-w-0">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inspection &amp; Assigned</span>
            </div>
            <div className="mb-1.5">
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Inspection Booked" })}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 text-center leading-tight min-h-[34px] cursor-pointer ${
                  l.status === "Inspection Booked"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                }`}
                title="Set status: Inspection Booked"
              >
                {l.status === "Inspection Booked" && <Check className="w-3 h-3 stroke-[2.5]" />}
                <span>Inspection Booked</span>
              </button>
              {l.inspectionAt && (
                <div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-semibold text-blue-700 text-center">
                  📅 {formatApptDate(l.inspectionAt)} &nbsp;•&nbsp; {formatApptTimeRange(l.inspectionAt)}
                </div>
              )}
            </div>
            <select
              value={
                inspectionStaff.some((s) => s.name === l.assigned || s.username === l.assigned)
                  ? (inspectionStaff.find((s) => s.name === l.assigned || s.username === l.assigned)?.name || l.assigned)
                  : "Unassigned"
              }
              onChange={(e) => {
                const val = e.target.value;
                updateLeadField(l.id, { assigned: val === "Unassigned" ? "" : val });
              }}
              className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden min-h-[34px] cursor-pointer"
              title="Assign inspector"
            >
              <option value="Unassigned">Unassigned</option>
              {inspectionStaff.map((s) => {
                const label = s.name?.trim() || s.username;
                return <option key={s.id} value={label}>{label}</option>;
              })}
            </select>
          </div>

          {/* Inspection Live Visit */}
          {(() => {
            const steps = visitStepsFor(l.status) || INSPECTION_STEPS;
            const currentIdx = steps.findIndex((s) => s.status === l.status);
            return (
              <div className="pt-0.5">
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Inspection live visit</label>
                <div className="grid grid-cols-5 gap-1">
                  {steps.map((step, idx) => {
                    const done = currentIdx >= 0 && idx <= currentIdx;
                    const isNext = idx === currentIdx + 1;
                    if (step.label === "Start") {
                      return (
                        <div key={step.status + "-group"} className="contents">
                          <button
                            key={step.status}
                            type="button"
                            onClick={() => updateLeadField(l.id, { status: step.status })}
                            className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              done ? "bg-amber-500 text-white" : isNext ? "bg-[#001f97] text-white hover:bg-[#001777]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title={`Set status: ${step.status}`}
                          >
                            {step.label}
                          </button>
                          <button
                            key="inspection-form-inline"
                            type="button"
                            onClick={() => openInspectionModal(l)}
                            className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              l.inspectionReport?.status === "completed" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title={l.inspectionReport?.status === "completed" ? "Inspection form completed" : "Open Inspection form"}
                          >
                            Inspection form
                          </button>
                        </div>
                      );
                    }
                    // "On the Way" and "Reached" fire the notify-customer popup
                    const isOnTheWayStep = step.label === "On the Way" || step.label === "Reached";
                    const eventType = step.label === "On the Way" ? "en_route" : "arrived";
                    return (
                      <button
                        key={step.status}
                        type="button"
                        disabled={isOnTheWayStep && onTheWayLoading === l.id}
                        onClick={() =>
                          isOnTheWayStep
                            ? handleOnTheWay(l, eventType)
                            : updateLeadField(l.id, { status: step.status })
                        }
                        className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                          done ? "bg-amber-500 text-white" : isNext ? "bg-[#001f97] text-white hover:bg-[#001777]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                        title={`Set status: ${step.status}`}
                      >
                        {isOnTheWayStep && onTheWayLoading === l.id ? "..." : step.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Hand-off: Share to Booking Office */}
          <div className="pt-0.5">
            {l.status === "Inspection Completed" ? (
              <div className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Shared to Booking Office — awaiting quote
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Inspection Completed" })}
                className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Send this lead back to the Booking Office (Login 1) with all inspection info so they can send the quote"
              >
                <Send className="w-4 h-4" />
                Share to Booking Office
              </button>
            )}
          </div>

          {/* Quote quick status */}
          <div className="grid grid-cols-4 gap-1.5 items-center">
            <button
              onClick={() => openQuoteModal(l)}
              className="px-1 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Open quote builder"
            >
              Quote
            </button>
            {([
              { label: "Sent", status: "Quote Sent", color: "bg-blue-600 hover:bg-blue-700" },
              { label: "Job Booked", status: "Job Booked", color: "bg-violet-600 hover:bg-violet-700" },
            ] as const).map((st) => (
              <button
                key={st.status}
                type="button"
                onClick={() => updateLeadField(l.id, { status: st.status })}
                className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  l.status === st.status ? st.color + " text-white ring-2 ring-offset-1 ring-current" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title={`Set: ${st.status}`}
              >
                {st.label}
              </button>
            ))}
            <select
              value={
                assignableTechnicians.find(
                  (t) => t.id === l.technicianId || (l.technician && t.name.toLowerCase() === l.technician.toLowerCase())
                )?.id || ""
              }
              onChange={(e) => {
                const tech = assignableTechnicians.find((t) => t.id === e.target.value);
                updateLeadField(l.id, { technicianId: e.target.value, technician: tech?.name || "" });
              }}
              className="w-full text-[10px] px-1 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden cursor-pointer truncate"
              title="Assign technician"
            >
              <option value="">Assign Tech</option>
              {assignableTechnicians.filter((t) => t.active !== false).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {l.technicianId && !assignableTechnicians.some((t) => t.id === l.technicianId) && (
                <option value={l.technicianId}>{l.technician || "Former tech"}</option>
              )}
            </select>
          </div>

          {/* Job booked time range (manager only) */}
          {role === "manager" && l.jobAt && (
            <div className="mt-1 px-2 py-1 bg-violet-50 border border-violet-100 rounded-lg text-[10px] font-semibold text-violet-700 text-center">
              📅 {formatApptDate(l.jobAt)} &nbsp;•&nbsp; {formatApptTimeRange(l.jobAt)}
            </div>
          )}

          {/* Job Status */}
          {(() => {
            const steps = JOB_STEPS;
            const currentIdx = steps.findIndex((s) => s.status === l.status);
            return (
              <div className="pt-0.5">
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Job Status</label>
                <div className="grid grid-cols-5 gap-1">
                  {steps.map((step, idx) => {
                    const done = currentIdx >= 0 && idx <= currentIdx;
                    const isNext = idx === currentIdx + 1;
                    const isJobDone = step.status === "Job Done";
                    if (step.label === "Start") {
                      return (
                        <div key={step.status + "-group"} className="contents">
                          <button
                            key={step.status}
                            type="button"
                            onClick={() => updateLeadField(l.id, { status: step.status })}
                            className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              done ? "bg-amber-500 text-white" : isNext ? "bg-[#001f97] text-white hover:bg-[#001777]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title={`Set status: ${step.status}`}
                          >
                            {step.label}
                          </button>
                          <button
                            key="job-done-inline"
                            type="button"
                            onClick={() => updateLeadField(l.id, { status: "Job Done" })}
                            className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              l.status === "Job Done"
                                ? "bg-sky-600 text-white ring-2 ring-offset-1 ring-current"
                                : ["Job Done", "Invoice Sent", "Payment Request", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(l.status)
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title="Set: Job Done"
                          >
                            Job Done
                          </button>
                        </div>
                      );
                    }
                    if (isJobDone) return null;
                    return (
                      <button
                        key={step.status}
                        type="button"
                        onClick={() => updateLeadField(l.id, { status: step.status })}
                        className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          done ? "bg-amber-500 text-white" : isNext ? "bg-[#001f97] text-white hover:bg-[#001777]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                        title={`Set status: ${step.status}`}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => openGpsModal(l)}
                    title={l.gps ? "GPS Location Recorded" : "GPS Navigation"}
                    className={`px-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      l.gps ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Multi-day job progress bar */}
          {l.jobTotalDays && l.jobTotalDays > 1 && (l.status === "Job Started" || l.status === "Job In Progress") && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-800">
                <span>Day {l.jobDaysDone || 1} of {l.jobTotalDays} — {l.technician || "Technician"}</span>
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">
                  {Math.round(((l.jobDaysDone || 1) / l.jobTotalDays) * 100)}%
                </span>
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

        {/* COLUMN 3: FINANCE SUMMARY */}
        <div className="space-y-2.5 min-w-0">
          <div className="p-2 space-y-1.5">
            {l.invoiceSentAt && (
              <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Invoice Sent — {fmtDate(l.invoiceSentAt)}</span>
              </div>
            )}
            {l.invoiceOpenedAt ? (
              <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Invoice Opened</span>
                </span>
                <span className="text-[9.5px] font-black text-emerald-700">{fmtDate(l.invoiceOpenedAt)}</span>
              </div>
            ) : l.invoiceSentAt ? (
              <div className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400 shrink-0 opacity-40" />
                  <span>Invoice Opened</span>
                </span>
                <span className="text-[9px] text-amber-600 font-semibold">Not opened yet</span>
              </div>
            ) : null}
            {l.quoteAcceptedAt && (
              <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Quote Accepted — {fmtDate(l.quoteAcceptedAt)}</span>
              </div>
            )}
            {l.status === "Completed" && role !== "manager" && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🏆</span>
                    <span>Saved in Achievements</span>
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-700 text-white px-1.5 py-0.5 rounded">Completed Record</span>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center justify-between ${
                  l.warrantyProvided === false || l.warranty?.provided === false
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  <span className="flex items-center gap-1">
                    {l.warrantyProvided === false || l.warranty?.provided === false ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>{l.warrantyProvided === false || l.warranty?.provided === false ? "Warranty Not Provided" : "Warranty Provided"}</span>
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                    l.warrantyProvided === false || l.warranty?.provided === false ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    {l.warrantyProvided === false || l.warranty?.provided === false ? "No Warranty" : "10-Yr Active"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Finance quick actions */}
          <div className="grid grid-cols-1 gap-2">
            {([
              { label: "Invoice", step: "Invoice Sent", color: "bg-sky-600" },
              { label: "Sent", step: "Payment Request", color: "bg-blue-600" },
              { label: "Pending Payment", step: "Payment Pending", color: "bg-amber-600" },
            ] as const).map((st) => {
              const isActive = getStepActive(l, st.step);
              return (
                <div key={st.step} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      st.step === "Invoice Sent"
                        ? openInvoiceModal(l)
                        : updateLeadField(l.id, { status: st.step })
                    }
                    className={`w-full px-2 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors text-center ${
                      isActive
                        ? st.color + " text-white ring-2 ring-offset-1 ring-current shadow-xs"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title={st.label}
                  >
                    {st.label}
                  </button>
                  {/* Invoice amount label under Pending Payment */}
                  {st.step === "Payment Pending" && isActive && invoiceTotalFmt && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#001f97]/8 border border-[#001f97]/20">
                      <DollarSign className="w-3 h-3 text-[#001f97] shrink-0" />
                      <span className="text-[10px] font-black text-[#001f97] truncate">{invoiceTotalFmt}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Payment Received — smart Full / Partial dialog */}
            <div className="space-y-1">
              {payStep === "idle" && (
                <button
                  type="button"
                  onClick={() => { if (!isPaymentReceived) setPayStep("ask_type"); }}
                  className={`w-full px-2 py-2 rounded-lg text-xs font-bold text-center transition-colors ${
                    isPaymentReceived
                      ? "bg-green-600 text-white ring-2 ring-offset-1 ring-current shadow-xs cursor-default"
                      : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  }`}
                >
                  {isPaymentReceived && l.paymentType === "partial"
                    ? `Part Paid${l.amountPaid ? ` — AUD $${Number(l.amountPaid).toFixed(2)}` : ""}`
                    : "Received"}
                </button>
              )}

              {payStep === "ask_type" && (
                <div className="rounded-xl border border-[#001f97]/30 bg-blue-50 p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#001f97] uppercase tracking-wider">Payment received?</span>
                    <button type="button" onClick={() => setPayStep("idle")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {invoiceTotalFmt && (
                    <div className="text-[10px] font-semibold text-slate-600 text-center">
                      Invoice: <span className="font-black text-[#001f97]">{invoiceTotalFmt}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePaymentReceived("full")}
                      className="py-1.5 px-1 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-center"
                    >
                      ✅ Full
                      {invoiceTotalFmt && <div className="text-[9px] font-semibold opacity-80">{invoiceTotalFmt}</div>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayStep("ask_amount")}
                      className="py-1.5 px-1 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer text-center"
                    >
                      ⚡ Partial
                      {halfAmt && <div className="text-[9px] font-semibold opacity-80">e.g. ${halfAmt.toFixed(2)}</div>}
                    </button>
                  </div>
                </div>
              )}

              {payStep === "ask_amount" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Amount (AUD)</span>
                    <button type="button" onClick={() => setPayStep("ask_type")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={halfAmt ? halfAmt.toFixed(2) : "0.00"}
                    value={partialAmt}
                    onChange={(e) => setPartialAmt(e.target.value)}
                    className="w-full text-xs font-bold border border-amber-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && partialAmt) handlePaymentReceived("partial", parseFloat(partialAmt));
                    }}
                  />
                  <button
                    type="button"
                    disabled={!partialAmt || isNaN(parseFloat(partialAmt))}
                    onClick={() => handlePaymentReceived("partial", parseFloat(partialAmt))}
                    className="w-full py-1.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                  >
                    Confirm Partial
                  </button>
                </div>
              )}
            </div>

            {/* Warranty Sent & Completed — clickable buttons */}
            {[
              {
                label: l.warrantyProvided === false || l.warranty?.provided === false ? "Warranty Not Provided" : "Warranty Sent",
                step: "Warranty Sent" as const,
                color: l.warrantyProvided === false || l.warranty?.provided === false ? "bg-rose-600" : "bg-slate-700",
                onClick: () => openWarrantyModal(l),
              },
              {
                label: "Completed Jobs",
                step: "Completed" as const,
                color: "bg-emerald-600",
                onClick: () => {
                  const updates: Record<string, unknown> = { status: "Completed" };
                  if (l.warrantyProvided === false || l.warranty?.provided === false) {
                    updates.warrantyProvided = false;
                    updates.warranty = { ...(l.warranty || {}), provided: false };
                  } else {
                    updates.warrantyProvided = true;
                    updates.warranty = { ...(l.warranty || {}), provided: true };
                  }
                  updateLeadField(l.id, updates as Partial<Lead>);
                },
              },
            ].map((st) => {
              const isActive = getStepActive(l, st.step);
              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={st.onClick}
                  className={`w-full px-2 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors text-center ${
                    isActive
                      ? st.color + " text-white ring-2 ring-offset-1 ring-current shadow-xs"
                      : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={st.label}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 4: WORKFLOW */}
        <div className="space-y-2">
          <div className="bg-[#fee2e2]/70 border border-rose-200/80 rounded-xl p-2.5">
            <div className="text-[10px] font-black tracking-wider text-rose-800 uppercase">FOLLOW-UP</div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">{followupPrompt}</div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "New", step: "New" },
              { label: "Inspection Booked", step: "Inspection Booked" },
              { label: "Inspection Completed", step: "Inspection Completed" },
              { label: "Quote Sent", step: "Quote Sent" },
              { label: "Job Booked", step: "Job Booked" },
              { label: "Invoice Sent", step: "Invoice Sent" },
              { label: "Payment Pending", step: "Payment Pending" },
              { label: "Payment Received", step: "Payment Received" },
              {
                label: l.warrantyProvided === false || l.warranty?.provided === false ? "Warranty Not Provided" : "Warranty Sent",
                step: "Warranty Sent",
              },
            ].map(({ label, step }) => {
              const isActive = getStepActive(l, step);
              return (
                <div
                  key={step}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border cursor-default select-none ${
                    isActive
                      ? "bg-[#ccfbf1]/80 text-[#0f766e] border-teal-200/80 shadow-2xs"
                      : "bg-[#f8fafc] text-slate-600 border-slate-200/70"
                  }`}
                  title={label}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{label}</span>
                    {step === "Invoice Sent" && l.invoiceOpenedAt && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5 whitespace-nowrap">
                        <Eye className="w-2.5 h-2.5 text-emerald-600" />
                        Opened
                      </span>
                    )}
                  </div>
                  {isActive ? (
                    <Check className="w-3.5 h-3.5 text-[#0f766e] stroke-[2.5]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>

          {l.status === "Completed" ? (
            <div className="space-y-1">
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                <span>🏆</span>
                <span>Completed &amp; Saved To Achievements</span>
              </div>
              <div className={`p-1.5 rounded-lg text-center text-[11px] font-black flex items-center justify-center gap-1.5 border ${
                l.warrantyProvided === false || l.warranty?.provided === false
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                {l.warrantyProvided === false || l.warranty?.provided === false ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Warranty Not Provided</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Warranty Provided (10-Year)</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const updates: Record<string, any> = { status: "Completed" };
                if (l.warrantyProvided === false || l.warranty?.provided === false) {
                  updates.warrantyProvided = false;
                  updates.warranty = { ...(l.warranty || {}), provided: false };
                } else {
                  updates.warrantyProvided = true;
                  updates.warranty = { ...(l.warranty || {}), provided: true };
                }
                updateLeadField(l.id, updates);
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Mark this lead as completed and save to Achievements"
            >
              <span>
                {l.warrantyProvided === false || l.warranty?.provided === false
                  ? "Complete & Save (No Warranty) 🏆"
                  : "Complete & Save to Achievements 🏆"}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
