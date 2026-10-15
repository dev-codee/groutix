"use client";

import { useRef, useState } from "react";
import { ChevronRight, MessageSquare, Pencil, StickyNote } from "lucide-react";
import type { Lead } from "./types";

const fields = ["notes", "message", "enquiry"] as const;
const labels = { notes: "Lead Notes", message: "Customer Request Detail", enquiry: "Additional Customer Request Detail" };

export function LeadRequestDetails({ lead, onSave }: {
  lead: Lead;
  onSave: (id: string, changes: Partial<Lead>) => Promise<void | boolean>;
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

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <button type="button" aria-expanded={expanded} disabled={Boolean(draft)}
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          {expanded ? "Hide lead notes & customer request" : "View lead notes & customer request"}
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        {!draft && <button type="button" onClick={edit} aria-label="Edit lead notes and customer request"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer shrink-0">
          <Pencil className="w-3 h-3" /> Edit
        </button>}
      </div>
      {draft ? (
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
      ) : expanded && (
        <div className="space-y-1.5">
          {fields.filter(field => lead[field]?.trim() && !(field === "enquiry" && lead.enquiry === lead.message)).map(field => (
            <div key={field} className="flex items-start gap-1.5 text-xs text-slate-700 min-w-0">
              {field === "notes" ? <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" /> : <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
              <p className="min-w-0 whitespace-pre-wrap break-words"><span className="font-bold">{field === "notes" ? "Lead Notes" : "Customer Request Detail"}:</span> {lead[field]}</p>
            </div>
          ))}
          {!fields.some(field => lead[field]?.trim()) && <p className="text-xs text-slate-500">No lead notes or customer request details yet.</p>}
        </div>
      )}
    </div>
  );
}
