"use client";

import { useRef, useState } from "react";
import { ChevronRight, MessageSquare, Pencil, StickyNote } from "lucide-react";
import { formatLeadBookingTime } from "@/lib/bookingPresentation";
import { isPropertyManagerLead } from "@/lib/quoteLeadDetails";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";
import type { Lead } from "./types";

const fields = ["notes", "message", "enquiry"] as const;
const labels = { notes: "Lead Notes", message: "Customer Request Detail", enquiry: "Additional Customer Request Detail" };

export function LeadRequestDetails({ lead, onSave, onOpenPhotos }: {
  lead: Lead;
  onSave: (id: string, changes: Partial<Lead>) => Promise<void | boolean>;
  onOpenPhotos: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Pick<Lead, typeof fields[number]> | null>(null);
  const original = useRef<Pick<Lead, typeof fields[number]>>({});
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function edit() {
    original.current = { notes: lead.notes || "", message: lead.message || "", enquiry: lead.enquiry || "" };
    setDraft({ ...original.current });
    setExpanded(true);
    setError("");
  }

  async function save() {
    if (!draft || pending.current) return;
    const changes: Partial<Lead> = {};
    for (const field of fields) {
      if (draft[field] !== original.current[field]) changes[field] = draft[field];
    }
    if (!Object.keys(changes).length) { setDraft(null); return; }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      if (await onSave(lead.id, changes) === false) {
        setError("Could not save changes. Please try again.");
      } else {
        setDraft(null);
      }
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const answers = lead.quoteChecklist;
  const photoLabels = Array.isArray(answers?.photoLabels) ? answers.photoLabels : [];
  const photoCount = lead.photos?.length ?? lead.photosCount ?? photoLabels.length;
  const propertyManager = isPropertyManagerLead(lead);
  const requestedInspection = lead.requestedInspectionAt;
  const bookedInspection = lead.inspectionAt;
  const requestMode = lead.quoteRequestMode === "quote" ? "Quote only"
    : lead.quoteRequestMode === "inspection" ? "Free inspection" : undefined;
  const requestFields = [
    [propertyManager ? "Property manager" : "Customer", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Property address", lead.address],
    ["Agency / company", lead.agency],
    ["Request type", requestMode],
    ["Preferred inspection", requestedInspection && `${formatApptDate(requestedInspection)} ${formatApptTime(requestedInspection)}`],
    ["Booked inspection", bookedInspection && `${formatApptDate(bookedInspection)} ${formatLeadBookingTime(lead, "inspection")}`],
    ["Inspection status", lead.quoteRequestMode === "inspection" && !bookedInspection ? "To be arranged" : undefined],
    ["Service requested", lead.service],
    ["Areas to service", lead.areas],
    ["Leakage", lead.leaking],
    ["Damaged tiles", lead.damagedTiles],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <button type="button" aria-expanded={expanded} disabled={Boolean(draft)}
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          {expanded ? "Hide request" : "View request"}
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        {!draft && <button type="button" onClick={edit} aria-label="Edit lead notes and customer request"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer shrink-0">
          <Pencil className="w-3 h-3" /> Edit
        </button>}
      </div>
      {draft && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
          <fieldset disabled={saving} className="space-y-2">
            {fields.map(field => (
              <label key={field} className="block text-xs font-bold text-slate-700">
                {labels[field]}
                <textarea rows={3} value={draft[field] || ""}
                  onChange={event => setDraft({ ...draft, [field]: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs font-normal focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={save} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{saving ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => { setDraft(null); setError(""); }} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">Cancel</button>
            </div>
          </fieldset>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </div>
      )}
      {expanded && (
        <div className="space-y-1.5">
          <section className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Submitted details</h3>
            <dl className="space-y-1.5">
              {requestFields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="font-bold">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
            {Boolean(lead.tenants?.length) && (
              <div className="mt-2 border-t border-slate-200 pt-2">
                <h4 className="mb-1 font-bold">Tenant access details</h4>
                <ul className="space-y-1.5">
                  {lead.tenants?.map((tenant, index) => (
                    <li key={index} className="break-words">
                      <div className="font-semibold">Tenant {index + 1}{tenant.name && ` · ${tenant.name}`}</div>
                      {tenant.phone && <div>{tenant.phone}</div>}
                      {tenant.email && <div>{tenant.email}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {photoCount > 0 && (
              <button type="button" onClick={onOpenPhotos} className="mt-2 cursor-pointer font-semibold text-blue-700 hover:text-blue-900">View photos ({photoCount})</button>
            )}
          </section>
          {!draft && (
            <>
              {fields.filter(field => lead[field]?.trim() && !(field === "enquiry" && lead.enquiry === lead.message)).map(field => (
                <div key={field} className="flex items-start gap-1.5 text-xs text-slate-700 min-w-0">
                  {field === "notes" ? <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" /> : <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
                  <p className="min-w-0 whitespace-pre-wrap break-words"><span className="font-bold">{labels[field]}:</span> {lead[field]}</p>
                </div>
              ))}
              {!fields.some(field => lead[field]?.trim()) && <p className="text-xs text-slate-500">No lead notes or customer request details yet.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
