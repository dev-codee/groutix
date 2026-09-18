"use client";

import { X, Check } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import type { Lead } from "@/components/admin/types";
import { STATUS_KEYS } from "@/lib/pipeline";
import { getLeadQuoteTotal } from "@/lib/adminHelpers";

interface Props {
  lead: Lead;
  onClose: () => void;
}

export function JobCardModal({ lead: jobCardLead, onClose }: Props) {
  const { leads, updateLeadField } = useAdminPageCtx();
  const l = leads.find((x) => x.id === jobCardLead.id) || jobCardLead;

  const milestones: { label: string; status: string }[] = [
    { label: "Lead Received", status: "New" },
    { label: "Contacted", status: "Contacted" },
    { label: "Inspection Booked", status: "Inspection Booked" },
    { label: "Inspection Completed", status: "Inspection Completed" },
    { label: "Quote Created", status: "Quote Pending" },
    { label: "Quote Sent", status: "Quote Sent" },
    { label: "Quote Accepted", status: "Won" },
    { label: "Job Booked", status: "Job Booked" },
    { label: "Job Done", status: "Job Done" },
    { label: "Invoice Sent", status: "Invoice Sent" },
    { label: "Payment Pending", status: "Payment Pending" },
    { label: "Payment Received", status: "Payment Received" },
    {
      label:
        l.warrantyProvided === false || l.warranty?.provided === false
          ? "Warranty Not Provided"
          : "Warranty Sent",
      status: "Warranty Sent",
    },
    { label: "Completed", status: "Completed" },
  ];

  const currentIdx = STATUS_KEYS.indexOf(l.status);
  const next = milestones.find((m) => {
    const mi = STATUS_KEYS.indexOf(m.status);
    return mi !== -1 && mi > currentIdx;
  });
  const total = getLeadQuoteTotal(l);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-5 my-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {l.name || "Customer"} — Client Job Card
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              {[l.email, l.phone, l.address].filter(Boolean).join("  •  ")}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Current Stage", value: l.status, strong: true },
            { label: "Service", value: l.service || "Standard Service" },
            { label: "Quote / Job Value", value: `AUD $${total.toFixed(2)}`, strong: true },
            {
              label: "Warranty Status",
              value:
                l.warrantyProvided === false || l.warranty?.provided === false
                  ? "Warranty Not Provided ⚠️"
                  : "Warranty Provided 🛡️",
              strong: true,
              isWarranty: true,
              isOff: l.warrantyProvided === false || l.warranty?.provided === false,
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border p-3 ${
                c.isWarranty
                  ? c.isOff
                    ? "border-rose-300 bg-rose-50/70"
                    : "border-emerald-300 bg-emerald-50/70"
                  : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {c.label}
              </div>
              <div
                className={`${
                  c.isWarranty
                    ? c.isOff
                      ? "text-rose-700"
                      : "text-emerald-700"
                    : "text-slate-900"
                } ${c.strong ? "text-base font-black" : "text-xs font-semibold leading-snug"}`}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline timeline */}
        <div className="flex items-start overflow-x-auto pb-2 no-scrollbar">
          {milestones.map((m, i) => {
            const mi = STATUS_KEYS.indexOf(m.status);
            const done = mi !== -1 && mi <= currentIdx;
            const current = m.status === l.status;
            return (
              <div key={m.status} className="flex items-center shrink-0">
                {i > 0 && <div className={`h-0.5 w-8 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
                <div className="flex flex-col items-center w-24 px-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      done
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    } ${current ? "ring-2 ring-blue-600 ring-offset-2" : ""}`}
                  >
                    {done ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-semibold text-center leading-tight ${
                      current ? "text-blue-600 font-bold" : done ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <div className="text-sm font-bold text-slate-900">Workflow Action</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Current: <b className="text-slate-700">{l.status}</b>
              {next ? (
                <>
                  {" "}
                  → Next: <b className="text-slate-700">{next.label}</b>
                </>
              ) : (
                <> → Fully completed 🏆</>
              )}
            </div>
          </div>
          {next && (
            <button
              type="button"
              onClick={() => updateLeadField(l.id, { status: next.status })}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Move to {next.label} →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Conversation — updates every few seconds
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
            🏅 Finance &amp; Automation
          </span>
        </div>
      </div>
    </div>
  );
}
