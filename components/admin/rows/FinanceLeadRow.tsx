"use client";

import {
  Phone, Mail, MapPin, MessageSquare, Send,
  ShieldAlert, ShieldCheck, Check, Eye,
} from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { getRoleStatusOptions, getFollowupPrompt, getWhatsAppLink, fmtDate } from "@/lib/adminHelpers";
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
  const isPaymentReceived = ["Payment Received","Warranty Sent","Completed"].includes(l.status);
  const isWarrantySent = l.status === "Warranty Sent" || Boolean(l.warranty?.sentAt) || l.status === "Completed";
  const isCompleted = l.status === "Completed";

  const jobNoDisplay = l.jobNo
    ? (l.jobNo.startsWith("JobNo-") ? l.jobNo : `JobNo-${l.jobNo.replace(/^JOB-?/i, "")}`)
    : `JobNo-${l.id.slice(0, 4)}`;

  const dateTimeDisplay = (() => {
    const d = new Date(l.jobAt || l.inspectionAt || l.createdAt || Date.now());
    if (isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", year: "numeric" })} ${d.toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", hour12: true })}`;
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
              <select
                value={l.assigned && !isTechnicianName(l.assigned) ? l.assigned : "Unassigned"}
                onChange={(e) => updateLeadField(l.id, { assigned: e.target.value === "Unassigned" ? "" : e.target.value })}
                className="w-full h-[34px] text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer hover:border-[#001f97] shadow-2xs truncate"
              >
                {assigneeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
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
              onClick={() => updateLeadField(l.id, { status: "Job Done" })}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center ${l.status === "Job Done" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Job Done
            </button>
            <button
              type="button"
              onClick={() => openInvoiceModal(l)}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center shadow-2xs ${l.status === "Invoice Sent" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Send Invoice
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
              onClick={() => updateLeadField(l.id, { status: "Payment Pending" })}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center ${l.status === "Payment Pending" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Payment Pending
            </button>
            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: "Payment Received" })}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center ${l.status === "Payment Received" ? "bg-[#001f97] text-white shadow-2xs" : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Payment Received
            </button>
            <button
              type="button"
              onClick={() => openWarrantyModal(l)}
              className={`py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer truncate min-w-0 h-[34px] flex items-center justify-center ${
                l.warrantyProvided === false || l.warranty?.provided === false
                  ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                  : l.status === "Warranty Sent"
                  ? "bg-[#001f97] text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Job Done" })}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border min-w-0 ${isJobDone ? "bg-[#dcfce7] border-emerald-300 text-slate-900 hover:bg-emerald-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <span className="truncate">Job Done</span>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Payment Pending" })}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border min-w-0 ${isPaymentPending ? "bg-[#dcfce7] border-emerald-300 text-slate-900 hover:bg-emerald-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <span className="truncate">Payment Pending</span>
                {isPaymentPending && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (l.warrantyProvided === false || l.warranty?.provided === false) {
                    openWarrantyModal(l);
                  } else {
                    updateLeadField(l.id, { status: "Warranty Sent" });
                    openWarrantyModal(l);
                  }
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border min-w-0 ${
                  l.warrantyProvided === false || l.warranty?.provided === false
                    ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                    : isWarrantySent
                    ? "bg-[#dcfce7] border-emerald-300 text-slate-900 hover:bg-emerald-100"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Invoice Sent", invoiceSentAt: l.invoiceSentAt || new Date().toISOString() })}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border min-w-0 ${isInvoiceSent ? "bg-[#dcfce7] border-emerald-300 text-slate-900 hover:bg-emerald-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <span className="truncate">Invoice Sent</span>
                {isInvoiceSent && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => updateLeadField(l.id, { status: "Payment Received" })}
                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border min-w-0 ${isPaymentReceived ? "bg-[#dcfce7] border-emerald-300 text-slate-900 hover:bg-emerald-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <span className="truncate">Payment Received</span>
                {isPaymentReceived && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
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
                className={`w-full py-1.5 px-2 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer text-center min-w-0 ${isCompleted ? "bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-400" : "bg-[#059669] hover:bg-[#047857]"}`}
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
