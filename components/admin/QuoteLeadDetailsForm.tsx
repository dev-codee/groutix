"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Lead } from "./types";
import { isPropertyManagerLead } from "@/lib/quoteLeadDetails";

export function QuoteLeadDetailsForm({ lead, onChange }: { lead: Lead; onChange: (lead: Lead) => void }) {
  const propertyManager = isPropertyManagerLead(lead);
  const tenants = lead.tenants || [];
  const fieldClass = "w-full p-2 border border-slate-200 rounded-lg text-xs bg-white";
  const updateTenant = (index: number, field: "name" | "phone" | "email", value: string) => onChange({
    ...lead, tenants: tenants.map((tenant, position) => position === index ? { ...tenant, [field]: value } : tenant),
  });

  return <section className="space-y-3" aria-label={propertyManager ? "Property Manager Lead Details" : "Customer Details"}>
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h3 className="font-bold text-slate-800 text-sm">{propertyManager ? "Property Manager Details" : "Customer Details"}</h3>
      {propertyManager && <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 text-[10px] font-bold">Property Manager Lead</span>}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {([
        ["name", propertyManager ? "Manager Name" : "Customer Name", "text"],
        ["phone", propertyManager ? "Manager Phone" : "Phone", "tel"],
        ["email", propertyManager ? "Manager Email" : "Email", "email"],
        ["address", "Property Address", "text"],
      ] as const).map(([field, label, type]) => <label key={field} className="space-y-1 text-[11px] font-semibold text-slate-600">
        <span>{label}</span>
        <input type={type} placeholder={label} value={lead[field] || ""} onChange={event => onChange({ ...lead, [field]: event.target.value })} className={fieldClass} />
      </label>)}
      {propertyManager && <label className="sm:col-span-2 space-y-1 text-[11px] font-semibold text-slate-600">
        <span>Real Estate Agency / Company</span>
        <input type="text" value={lead.agency || ""} placeholder="Real Estate Agency / Company" onChange={event => onChange({ ...lead, agency: event.target.value })} className={fieldClass} />
      </label>}
    </div>
    {propertyManager && <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-800">Tenant Details for Site Access</h4>
        <button type="button" disabled={tenants.length >= 6} onClick={() => onChange({ ...lead, tenants: [...tenants, { name: "", phone: "", email: "" }] })}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 cursor-pointer disabled:opacity-40 disabled:cursor-default">
          <Plus className="w-3 h-3" />Add Tenant
        </button>
      </div>
      {tenants.length === 0 && <p className="text-xs text-slate-500">No tenant details provided. Add a tenant to coordinate property access.</p>}
      {tenants.map((tenant, index) => <div key={index} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
        <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-700">Tenant {index + 1}</span>
          <button type="button" aria-label={`Remove tenant ${index + 1}`} onClick={() => onChange({ ...lead, tenants: tenants.filter((_, position) => position !== index) })}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([ ["name", "Name", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"] ] as const).map(([field, label, type]) =>
            <label key={field} className={`space-y-1 text-[11px] font-semibold text-slate-600 ${field === "email" ? "sm:col-span-2" : ""}`}>
              <span>Tenant {label}</span>
              <input aria-label={`Tenant ${index + 1} ${label}`} type={type} placeholder={`Tenant ${label}`} value={tenant[field] || ""} onChange={event => updateTenant(index, field, event.target.value)} className={fieldClass} />
            </label>)}
        </div>
      </div>)}
    </div>}
  </section>;
}
