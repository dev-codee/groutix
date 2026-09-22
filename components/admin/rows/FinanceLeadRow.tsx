"use client";

import { useState } from "react";
import {
  Phone, Mail, MapPin, MessageSquare, Send,
  ShieldAlert, ShieldCheck, Check, Eye, DollarSign, X, StickyNote,
} from "lucide-react";
import { ScopeOfWorkPanel } from "@/components/admin/ScopeOfWorkPanel";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt, getWhatsAppLink, fmtDate, getLeadQuoteTotal } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange, formatApptTime } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";
import { useDistanceKm } from "@/lib/useDistanceKm";

export function FinanceLeadRow({ l }: { l: Lead }) {
  const distanceKm = useDistanceKm(l.address);
  const ctx = useAdminPageCtx();
  const {
    role,
    rowAssigneeOptions,
    isTechnicianName,
    updateLeadField,
    callCustomer,
    openGpsModal,
    openMessagesModal,
    openInvoiceModal,
    openWarrantyModal,
    setEditingLead,
    setLeadModalOpen,
  } = ctx;

  const hasCustomerUnread = l.messages?.some((m) => m.from === "customer" && m.read === false);
  const statusOptions = getRoleStatusOptions(role, l.status);
  const assigneeOptions = rowAssigneeOptions(l.assigned, l.status);
  const waUrl = getWhatsAppLink(l.phone);
  const followupPrompt = getFollowupPrompt(l);

  const isJobDone = l.status === "Job Done" || ["Invoice Sent","Payment Request","Payment Pending","Payment Received","Warranty Sent","Completed"].includes(l.status);
  const isInvoiceSent = l.status === "Invoice Sent" || (Boolean(l.invoiceSentAt) && l.status !== "Job Done") || ["Payment Request","Payment Pending","Payment Received","Warranty Sent","Completed"].includes(l.status);
  const isPaymentPending = l.status === "Payment Pending";
  const isPaymentPendingDone = ["Payment Pending","Payment Request","Payment Received","Warranty Sent","Completed"].includes(l.status);
  const isPaymentReceived = ["Payment Received","Warranty Sent","Completed"].includes(l.status);
  const isWarrantySent = l.status === "Warranty Sent" || Boolean(l.warranty?.sentAt) || l.status === "Completed";
  const isCompleted = l.status === "Completed";

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  // ── Payment dialog state ──────────────────────────────────────────────────
  type PaymentStep = "idle" | "ask_type" | "ask_amount";
  const [payStep, setPayStep] = useState<PaymentStep>("idle");
  const [partialAmt, setPartialAmt] = useState<string>("");

  const quoteTotal = getLeadQuoteTotal(l);
  const invoiceTotal = quoteTotal && quoteTotal > 0 ? quoteTotal : (l.quoteAmount && l.quoteAmount > 0 ? l.quoteAmount : null);
  const invoiceTotalFmt = invoiceTotal ? `AUD $${invoiceTotal.toFixed(2)}` : null;
  const halfAmt = invoiceTotal ? invoiceTotal / 2 : null;
  const amountPaid = l.amountPaid ? Number(l.amountPaid) : null;
  const remainingAmt = invoiceTotal && amountPaid !== null ? Math.max(0, invoiceTotal - amountPaid) : null;

  const hasRemainingDues = (() => {
    if (l.paymentType === "full") return false;
    if (remainingAmt !== null && remainingAmt <= 0) return false;
    if (l.paymentType === "partial") return true;
    if (remainingAmt !== null && remainingAmt > 0) return true;
    if (!isPaymentReceived) return true;
    return false;
  })();

  function confirmCompleteIfDues(): boolean {
    if (!hasRemainingDues) return true;
    const msg = remainingAmt && remainingAmt > 0
      ? `Are you sure you want to complete this lead without the remaining payment of AUD $${remainingAmt.toFixed(2)}?`
      : "Are you sure you want to complete this lead without receiving full payment?";
    return window.confirm(msg);
  }

  function handlePaymentReceived(type: "full" | "partial", customAmt?: number) {
    const isFull = type === "full" || (invoiceTotal !== null && customAmt !== undefined && customAmt >= invoiceTotal);
    const finalAmt = isFull ? (invoiceTotal ?? customAmt) : customAmt;
    const updates: Partial<Lead> = {
      status: isFull ? "Payment Received" : "Payment Pending",
      paymentType: isFull ? "full" : "partial",
      amountPaid: finalAmt,
    };
    updateLeadField(l.id, updates);
    setPayStep("idle");
    setPartialAmt("");
  }

  const dateTimeDisplay = (() => {
    const v = l.jobAt || l.inspectionAt;
    if (v) return `${formatApptDate(v)} ${formatApptTimeRange(v)}`;
    if (l.createdAt) return `${formatApptDate(l.createdAt)} ${formatApptTime(l.createdAt)}`;
    return "";
  })();

  const serviceDisplay = l.notes || l.message
    ? `Notes: ${l.notes || l.message}${l.service ? ` | ${l.service}` : ""}`
    : l.service ? `Notes: ${l.service}` : "Notes: Leaking | Silicone Replacement";

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
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
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

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate min-w-0">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{l.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate text-right min-w-0">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={l.email}>{l.email || "—"}</span>
            </div>
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

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          {(l.technicianNotes || l.scopeNotes) && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs shadow-2xs">
              <StickyNote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    Technician Extra Notes
                  </span>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                    On-Site
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800 leading-snug whitespace-pre-wrap break-words">
                  {l.technicianNotes || l.scopeNotes}
                </p>
              </div>
            </div>
          )}

          <ScopeOfWorkPanel
            lead={l}
            readOnly={true}
            onSaveNotes={(id, notes) => updateLeadField(id, { technicianNotes: notes, scopeNotes: notes })}
          />

          <div className="grid grid-cols-5 gap-1 pt-1">
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <Phone className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">Call</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!l.email) { alert("This customer does not have an email address saved."); return; }
                openMessagesModal(l);
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <Mail className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">Email</span>
            </button>

            <button
              type="button"
              onClick={() => openMessagesModal(l, "sms")}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <MessageSquare className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">SMS</span>
            </button>

            <a
              href={getWhatsAppLink(l.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors min-w-0"
            >
              <Send className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => openMessagesModal(l)}
              className="relative flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <MessageSquare className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">Conversation</span>
              {hasCustomerUnread && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* COLUMN 2: FINANCE ACTIONS */}
        <div className="col-span-12 lg:col-span-5 min-w-0 space-y-2 pt-4 lg:pt-0">
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">STATUS</label>
              <select
                value={l.status || "Job Done"}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus === "Completed" && !confirmCompleteIfDues()) return;
                  updateLeadField(l.id, { status: newStatus });
                }}
                className="w-full h-[34px] text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden focus:border-blue-500 cursor-pointer hover:border-blue-400 shadow-2xs truncate"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === "Completed" ? "Completed 🏆" : s}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">ASSIGNED</label>
              <div className="w-full h-[34px] text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 truncate flex items-center">
                {(l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned")}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGpsModal(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer h-[34px] ${l.gps ? "bg-blue-600 hover:bg-blue-700 text-white" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={isJobDone}
              onClick={() => {
                if (isJobDone) return;
                updateLeadField(l.id, { status: "Job Done" });
              }}
              className={`py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center ${
                isJobDone
                  ? "bg-blue-600 text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
            >
              Job Done
            </button>
            <button
              type="button"
              onClick={() => openInvoiceModal(l)}
              className={`py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center shadow-2xs ${
                isInvoiceSent
                  ? "bg-blue-600 text-white shadow-2xs hover:bg-blue-700"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isInvoiceSent ? "Invoice Sent" : "Send Invoice"}
            </button>
          </div>

          {l.invoiceSentAt && (
            l.invoiceOpenedAt ? (
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[10px] font-bold text-emerald-800">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-600 shrink-0" />
                  Customer Opened Invoice
                </span>
                <span className="text-[9.5px] font-black text-emerald-700">{fmtDate(l.invoiceOpenedAt)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400 shrink-0 opacity-50" />
                  Invoice Not Opened Yet
                </span>
                <span className="text-[9px] text-amber-600 font-semibold">Pending</span>
              </div>
            )
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <div className="space-y-1">
              <button
                type="button"
                disabled={isPaymentPendingDone}
                onClick={() => {
                  if (isPaymentPendingDone) return;
                  updateLeadField(l.id, { status: "Payment Pending" });
                }}
                className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center w-full ${
                  isPaymentPendingDone
                    ? "bg-amber-500 text-white shadow-2xs cursor-default select-none"
                    : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                }`}
              >
                Payment Pending
              </button>
              {invoiceTotalFmt && (
                <div
                  className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-center text-[10px] font-bold text-blue-700 shadow-2xs flex items-center justify-center gap-1 min-w-0"
                  title={`Total Amount: ${invoiceTotalFmt}`}
                >
                  <DollarSign className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="text-slate-600 font-semibold text-[9px]">Total:</span>
                  <span className="font-bold text-blue-700 truncate">{invoiceTotalFmt}</span>
                </div>
              )}
            </div>
            {/* Payment Received — smart button with Full/Partial dialog */}
            <div className="space-y-1">
              {payStep === "idle" && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setPayStep("ask_type")}
                    className={`py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center w-full cursor-pointer ${
                      l.paymentType === "partial"
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
                        : l.paymentType === "full" || isPaymentReceived
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {l.paymentType === "partial"
                      ? `Part Paid${amountPaid ? ` — AUD $${amountPaid.toFixed(2)}` : ""}`
                      : l.paymentType === "full" || isPaymentReceived
                      ? "Payment Received (Full)"
                      : "Payment Received"}
                  </button>
                  {l.paymentType === "partial" && remainingAmt !== null && (
                    <div
                      className="px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-center text-[10px] font-bold text-rose-700 shadow-2xs flex items-center justify-center gap-1 min-w-0"
                      title={`Invoice: ${invoiceTotalFmt || ""} | Paid: AUD $${(amountPaid || 0).toFixed(2)} | Remaining: AUD $${remainingAmt.toFixed(2)}`}
                    >
                      <span className="text-slate-600 font-semibold text-[9.5px]">Remaining:</span>
                      <span className="font-bold text-rose-700">AUD ${remainingAmt.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {payStep === "ask_type" && (
                <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-2.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Payment Received?</span>
                    <button type="button" onClick={() => setPayStep("idle")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {invoiceTotalFmt && (
                    <div className="text-[10px] font-semibold text-slate-600 text-center">
                      Invoice Total: <span className="font-bold text-blue-700">{invoiceTotalFmt}</span>
                      {amountPaid !== null && amountPaid > 0 && (
                        <div className="text-[9.5px] text-amber-800 mt-0.5">
                          Paid so far: <b>AUD ${amountPaid.toFixed(2)}</b>
                          {remainingAmt !== null && (
                            <span> | Remaining: <b className="text-rose-700">AUD ${remainingAmt.toFixed(2)}</b></span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePaymentReceived("full")}
                      className="py-1.5 px-2 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-center"
                    >
                      ✅ {amountPaid && amountPaid > 0 && remainingAmt !== null && remainingAmt > 0 ? "Pay Remaining" : "Full"}
                      <div className="text-[9px] font-semibold opacity-80">
                        {remainingAmt !== null && remainingAmt > 0 ? `AUD $${remainingAmt.toFixed(2)}` : invoiceTotalFmt || "Full"}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayStep("ask_amount")}
                      className="py-1.5 px-2 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer text-center"
                    >
                      ⚡ {amountPaid && amountPaid > 0 ? "+ Add Further" : "Partial"}
                      <div className="text-[9px] font-semibold opacity-80">
                        {amountPaid && amountPaid > 0 && remainingAmt ? `e.g. $${(remainingAmt / 2).toFixed(2)}` : halfAmt ? `e.g. $${halfAmt.toFixed(2)}` : "Custom"}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {payStep === "ask_amount" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                      {amountPaid && amountPaid > 0 ? "Add Payment Amount (AUD)" : "Amount Received (AUD)"}
                    </span>
                    <button type="button" onClick={() => setPayStep("ask_type")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {amountPaid !== null && amountPaid > 0 && (
                    <div className="text-[10px] font-medium text-slate-600 bg-white/80 p-1.5 rounded border border-amber-200">
                      Already paid: <b className="text-emerald-700">AUD ${amountPaid.toFixed(2)}</b>
                      {remainingAmt !== null && (
                        <span> • Remaining: <b className="text-rose-700">AUD ${remainingAmt.toFixed(2)}</b></span>
                      )}
                    </div>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={amountPaid && remainingAmt ? remainingAmt.toFixed(2) : halfAmt ? halfAmt.toFixed(2) : "0.00"}
                    value={partialAmt}
                    onChange={(e) => setPartialAmt(e.target.value)}
                    className="w-full text-xs font-bold border border-amber-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && partialAmt && !isNaN(parseFloat(partialAmt))) {
                        const entered = parseFloat(partialAmt);
                        const newTotal = (amountPaid || 0) + entered;
                        handlePaymentReceived("partial", newTotal);
                      }
                    }}
                  />
                  {partialAmt && !isNaN(parseFloat(partialAmt)) && (
                    <div className="text-[10.5px] font-bold text-slate-700 bg-amber-100/60 p-1.5 rounded border border-amber-200/80">
                      {amountPaid && amountPaid > 0 ? (
                        <>
                          New Total Paid: <span className="text-emerald-700 font-black">AUD ${((amountPaid || 0) + parseFloat(partialAmt)).toFixed(2)}</span>
                          {invoiceTotal && (
                            <span className="text-slate-500 font-semibold block text-[9.5px]">
                              Remaining: AUD ${Math.max(0, invoiceTotal - ((amountPaid || 0) + parseFloat(partialAmt))).toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : (
                        invoiceTotal && (
                          <span className="text-slate-500 font-semibold block text-[9.5px]">
                            Remaining: AUD ${Math.max(0, invoiceTotal - parseFloat(partialAmt)).toFixed(2)}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!partialAmt || isNaN(parseFloat(partialAmt))}
                    onClick={() => {
                      const entered = parseFloat(partialAmt);
                      const newTotal = (amountPaid || 0) + entered;
                      handlePaymentReceived("partial", newTotal);
                    }}
                    className="w-full py-1.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer shadow-xs"
                  >
                    {amountPaid && amountPaid > 0
                      ? `Confirm Add AUD $${parseFloat(partialAmt || "0").toFixed(2)}`
                      : `Confirm Partial Payment (AUD $${parseFloat(partialAmt || "0").toFixed(2)})`}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={isWarrantySent || l.warrantyProvided === false || l.warranty?.provided === false}
              onClick={() => {
                if (isWarrantySent || l.warrantyProvided === false || l.warranty?.provided === false) return;
                openWarrantyModal(l);
              }}
              className={`py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center ${
                l.warrantyProvided === false || l.warranty?.provided === false
                  ? "border border-rose-300 bg-rose-50 text-rose-700 shadow-2xs cursor-default"
                  : isWarrantySent
                  ? "bg-blue-600 text-white shadow-2xs cursor-default"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
            >
              {l.warrantyProvided === false || l.warranty?.provided === false ? (
                <span className="flex items-center gap-1 truncate">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">No Warranty</span>
                </span>
              ) : "Warranty Sent"}
            </button>
          </div>
        </div>

        {/* COLUMN 3: WORKFLOW */}
        <div className="col-span-12 lg:col-span-3 min-w-0 space-y-1.5 pt-4 lg:pt-0">
          <div className="bg-[#ffe4e6] border border-rose-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-rose-600 uppercase tracking-wider text-[10px] shrink-0">FOLLOW-UP</span>
            <span className="font-medium text-slate-700 truncate text-[11px] min-w-0">
              {followupPrompt || l.followUpNext || (l.status === "Payment Received" ? (l.warrantyProvided === false || l.warranty?.provided === false ? "Payment Received — No Warranty Required" : "Payment Received — Issue Warranty") : l.status === "Payment Pending" ? "Payment Pending — Follow up" : "Invoice Sent — Awaiting payment")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between cursor-default select-none border min-w-0 ${isJobDone ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">Job Done</span>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
              </div>

              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between cursor-default select-none border min-w-0 ${isPaymentPending ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">Payment Pending</span>
                {isPaymentPending && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>
              {/* Total amount label — ALWAYS visible, never hides */}
              {invoiceTotalFmt && (
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-blue-50/70 border border-blue-200/60 min-w-0">
                  <span className="flex items-center gap-1 text-[9.5px] font-medium text-slate-600">
                    <DollarSign className="w-3 h-3 text-blue-600 shrink-0" />
                    Total:
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 truncate">{invoiceTotalFmt}</span>
                </div>
              )}

              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${
                  l.warrantyProvided === false || l.warranty?.provided === false
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : isWarrantySent
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">
                  {l.warrantyProvided === false || l.warranty?.provided === false ? "Warranty Not Provided" : "Warranty Sent"}
                </span>
                {l.warrantyProvided === false || l.warranty?.provided === false ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-0.5" />
                ) : isWarrantySent ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${isInvoiceSent ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">Invoice Sent</span>
                {isInvoiceSent && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>

              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${
                  isPaymentReceived
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900"
                    : l.paymentType === "partial"
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <span className="truncate">
                  {l.paymentType === "partial"
                    ? `Part Paid${l.amountPaid ? ` — $${Number(l.amountPaid).toFixed(2)}` : ""}`
                    : "Payment Received"}
                </span>
                {isPaymentReceived ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
                ) : l.paymentType === "partial" ? (
                  <span className="text-[10px] font-bold text-amber-700 shrink-0 ml-0.5">⚡</span>
                ) : null}
              </div>
              {l.paymentType === "partial" && remainingAmt !== null && (
                <div className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700 flex items-center justify-between min-w-0">
                  <span className="text-slate-600 font-semibold text-[9.5px]">Remaining:</span>
                  <span className="font-black text-rose-700">AUD ${remainingAmt.toFixed(2)}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isCompleted}
                onClick={() => {
                  if (isCompleted) return;
                  if (!confirmCompleteIfDues()) return;
                  const updates: Record<string, unknown> = { status: "Completed" };
                  if (l.warrantyProvided === false || l.warranty?.provided === false) {
                    updates.warrantyProvided = false;
                    updates.warranty = { ...(l.warranty || {}), provided: false };
                  } else {
                    updates.warrantyProvided = true;
                    updates.warranty = { ...(l.warranty || {}), provided: true };
                  }
                  updateLeadField(l.id, updates as Partial<Lead>);
                }}
                className={`w-full py-1.5 px-2 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition-colors text-center min-w-0 ${isCompleted ? "bg-emerald-700 ring-2 ring-emerald-400 cursor-default select-none" : "bg-[#059669] hover:bg-[#047857] cursor-pointer"}`}
              >
                <span className="leading-tight truncate">
                  {isCompleted
                    ? (l.warrantyProvided === false || l.warranty?.provided === false ? "Completed (No Warranty)" : "Completed (Warranty Provided)")
                    : (l.warrantyProvided === false || l.warranty?.provided === false ? "Complete (No Warranty)" : "Complete & Save")}
                </span>
                <span className="text-xs shrink-0">🏆</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
