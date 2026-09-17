"use client";

import { useState } from "react";
import {
  Phone, Mail, MapPin, MessageSquare, Send,
  ShieldAlert, ShieldCheck, Check, Eye, DollarSign, X,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt, getWhatsAppLink, fmtDate, getLeadQuoteTotal } from "@/lib/adminHelpers";
import { formatApptDate, formatApptTimeRange } from "@/lib/scheduling";
import type { Lead } from "@/components/admin/types";

export function FinanceLeadRow({ l }: { l: Lead }) {
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

  const dateTimeDisplay = (() => {
    const v = l.jobAt || l.inspectionAt || l.createdAt;
    if (!v) return "";
    return `${formatApptDate(v)} ${formatApptTimeRange(v)}`;
  })();

  const serviceDisplay = l.notes || l.message
    ? `Notes: ${l.notes || l.message}${l.service ? ` | ${l.service}` : ""}`
    : l.service ? `Notes: ${l.service}` : "Notes: Leaking | Silicone Replacement";

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

          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={l.address}>{l.address || "No address provided"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold truncate">
            <MessageSquare className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
            <span className="truncate" title={serviceDisplay}>{serviceDisplay}</span>
          </div>

          <div className="grid grid-cols-5 gap-1 pt-1">
            <button
              type="button"
              onClick={() => callCustomer(l)}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
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
            >
              <Mail className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Email</span>
            </button>

            <button
              type="button"
              onClick={() => openMessagesModal(l, "sms")}
              className="flex items-center justify-center gap-1 py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] xl:text-[11px] font-bold transition-colors cursor-pointer min-w-0"
            >
              <MessageSquare className="w-3 h-3 text-[#001f97] shrink-0" />
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
              <MessageSquare className="w-3 h-3 text-[#001f97] shrink-0" />
              <span className="truncate">Conversation</span>
              {hasCustomerUnread && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* COLUMN 2: FINANCE ACTIONS */}
        <div className="col-span-5 min-w-0 space-y-2">
          <div className="flex items-end gap-1.5">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">STATUS</label>
              <select
                value={l.status || "Job Done"}
                onChange={(e) => updateLeadField(l.id, { status: e.target.value })}
                className="w-full h-[34px] text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === "Completed" ? "Completed 🏆" : s}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">ASSIGNED</label>
              <div className="w-full h-[34px] text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 truncate flex items-center">
                {(l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned")}
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
              disabled={isJobDone}
              onClick={() => {
                if (isJobDone) return;
                updateLeadField(l.id, { status: "Job Done" });
              }}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center ${
                isJobDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
            >
              Job Done
            </button>
            <button
              type="button"
              onClick={() => openInvoiceModal(l)}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center shadow-2xs ${
                isInvoiceSent
                  ? "bg-[#001f97] text-white shadow-2xs hover:bg-[#001777]"
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
            <button
              type="button"
              disabled={isPaymentPendingDone}
              onClick={() => {
                if (isPaymentPendingDone) return;
                updateLeadField(l.id, { status: "Payment Pending" });
              }}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center ${
                isPaymentPendingDone
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default select-none"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              }`}
            >
              Payment Pending
            </button>
            {/* Payment Received — smart button with Full/Partial dialog */}
            <div className="space-y-1">
              {payStep === "idle" && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPaymentReceived) return; // already received, no-op
                      setPayStep("ask_type");
                    }}
                    className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center w-full ${
                      isPaymentReceived
                        ? "bg-[#001f97] text-white shadow-2xs cursor-default"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    }`}
                  >
                    {isPaymentReceived && l.paymentType === "partial"
                      ? `Part Paid${l.amountPaid ? ` — AUD $${Number(l.amountPaid).toFixed(2)}` : ""}`
                      : "Payment Received"}
                  </button>
                  {isPaymentReceived && l.paymentType === "partial" && remainingAmt !== null && (
                    <div
                      className="px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-center text-[10px] font-bold text-rose-700 shadow-2xs flex items-center justify-center gap-1 min-w-0"
                      title={`Invoice: ${invoiceTotalFmt || ""} | Paid: AUD $${(amountPaid || 0).toFixed(2)} | Remaining: AUD $${remainingAmt.toFixed(2)}`}
                    >
                      <span className="text-slate-600 font-semibold text-[9.5px]">Remaining:</span>
                      <span className="font-black text-rose-700">AUD ${remainingAmt.toFixed(2)}</span>
                    </div>
                  )}
                </div>
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
                      Invoice Total: <span className="font-black text-[#001f97]">{invoiceTotalFmt}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePaymentReceived("full")}
                      className="py-1.5 px-2 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-center"
                    >
                      ✅ Full
                      {invoiceTotalFmt && <div className="text-[9px] font-semibold opacity-80">{invoiceTotalFmt}</div>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayStep("ask_amount")}
                      className="py-1.5 px-2 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer text-center"
                    >
                      ⚡ Partial
                      {halfAmt && <div className="text-[9px] font-semibold opacity-80">e.g. AUD ${halfAmt.toFixed(2)}</div>}
                    </button>
                  </div>
                </div>
              )}

              {payStep === "ask_amount" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Amount received (AUD)</span>
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
                      if (e.key === "Enter" && partialAmt) {
                        handlePaymentReceived("partial", parseFloat(partialAmt));
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!partialAmt || isNaN(parseFloat(partialAmt))}
                    onClick={() => handlePaymentReceived("partial", parseFloat(partialAmt))}
                    className="w-full py-1.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                  >
                    Confirm Partial Payment
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
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors truncate min-w-0 h-[34px] flex items-center justify-center ${
                l.warrantyProvided === false || l.warranty?.provided === false
                  ? "border border-rose-300 bg-rose-50 text-rose-700 shadow-2xs cursor-default"
                  : isWarrantySent
                  ? "bg-[#001f97] text-white shadow-2xs cursor-default"
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
        <div className="col-span-3 min-w-0 space-y-1.5">
          <div className="bg-[#ffe4e6] border border-rose-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 min-w-0">
            <span className="font-black text-rose-600 uppercase tracking-wider text-[10px] shrink-0">FOLLOW-UP</span>
            <span className="font-semibold text-slate-700 truncate text-[11px] min-w-0">
              {followupPrompt || l.followUpNext || (l.status === "Payment Received" ? (l.warrantyProvided === false || l.warranty?.provided === false ? "Payment Received — No Warranty Required" : "Payment Received — Issue Warranty") : l.status === "Payment Pending" ? "Payment Pending — Follow up" : "Invoice Sent — Awaiting payment")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${isJobDone ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">Job Done</span>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
              </div>

              <div
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${isPaymentPending ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">Payment Pending</span>
                {isPaymentPending && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>
              {/* Invoice amount label — visible when Payment Pending is active */}
              {isPaymentPending && invoiceTotalFmt && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#001f97]/8 border border-[#001f97]/20 min-w-0">
                  <DollarSign className="w-3 h-3 text-[#001f97] shrink-0" />
                  <span className="text-[10px] font-black text-[#001f97] truncate">{invoiceTotalFmt}</span>
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
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-default select-none border min-w-0 ${isPaymentReceived ? "bg-[#dcfce7] border-emerald-300 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <span className="truncate">
                  {isPaymentReceived && l.paymentType === "partial"
                    ? `Part Paid${l.amountPaid ? ` — $${Number(l.amountPaid).toFixed(2)}` : ""}`
                    : "Payment Received"}
                </span>
                {isPaymentReceived && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </div>
              {isPaymentReceived && l.paymentType === "partial" && remainingAmt !== null && (
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
