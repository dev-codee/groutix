"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  CHECKLIST_FIELDS, CHECKLIST_OPTION_GROUPS, CHECKLIST_PLACEHOLDERS,
  DEFAULT_CHECKLIST_FORM, type ChecklistForm,
} from "@/lib/checklistForm";
import { CHECKLIST_OPTIONS } from "@/lib/checklistOptions";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

export function ChecklistFormEditor() {
  const [form, setForm] = useState<ChecklistForm>(DEFAULT_CHECKLIST_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/checklist-form", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load checklist settings.");
        setForm(data.form);
      })
      .catch(error => setMessage(error.message || "Could not load checklist settings."))
      .finally(() => setLoading(false));
  }, []);

  function change(next: ChecklistForm) {
    setForm(next);
    setDirty(true);
    setMessage("");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings/checklist-form", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save checklist settings.");
      setForm(data.form);
      setDirty(false);
      setMessage("Checklist form saved for all customers.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save checklist settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading checklist form…</div>;

  return <div className="max-w-4xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div>
      <h2 className="text-base font-bold text-slate-900">Customer checklist form</h2>
      <p className="mt-1 text-xs text-slate-500">Changes apply to every customer checklist link. Answer codes stay fixed so automatic quote matching keeps working.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["title", "pageTitle"] as const).map(key => <label key={key} className="space-y-1 text-xs font-semibold text-slate-700">
        <span>{key === "title" ? "Form title" : "Page heading"}</span>
        <input className={inputClass} value={form[key]} onChange={event => change({ ...form, [key]: event.target.value })} />
      </label>)}
      <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
        <span>Introduction</span>
        <textarea rows={2} className={inputClass} value={form.intro} onChange={event => change({ ...form, intro: event.target.value })} />
      </label>
    </div>
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Questions and section labels</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHECKLIST_FIELDS.map(([key, defaultText]) => <label key={key} className="space-y-1 text-xs font-semibold text-slate-700">
          <span>{defaultText}</span>
          <input className={inputClass} value={form.fields[key]} onChange={event => change({ ...form, fields: { ...form.fields, [key]: event.target.value } })} />
        </label>)}
      </div>
    </section>
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Input hints</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHECKLIST_PLACEHOLDERS.map(([key, defaultText]) => <label key={key} className="space-y-1 text-xs font-semibold text-slate-700">
          <span>{defaultText}</span>
          <input className={inputClass} value={form.placeholders[key]} onChange={event => change({ ...form, placeholders: { ...form.placeholders, [key]: event.target.value } })} />
        </label>)}
      </div>
    </section>
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Answer labels</h3>
      {CHECKLIST_OPTION_GROUPS.map(group => <div key={group} className="rounded-xl border border-slate-200 p-3">
        <h4 className="mb-2 text-xs font-bold text-slate-700">{group.replace(/([A-Z])/g, " $1")}</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHECKLIST_OPTIONS[group].map(([value]) => <label key={value} className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-16 shrink-0 truncate" title={value}>{value}</span>
            <input className={inputClass} value={form.optionLabels[group][value] || ""} onChange={event => change({ ...form, optionLabels: { ...form.optionLabels, [group]: { ...form.optionLabels[group], [value]: event.target.value } } })} />
          </label>)}
        </div>
      </div>)}
    </section>
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Additional area choices</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {form.additionalAreas.map((area, index) => <div key={index} className="flex gap-2">
          <input aria-label={`Additional area ${index + 1}`} className={inputClass} value={area} onChange={event => change({ ...form, additionalAreas: form.additionalAreas.map((item, i) => i === index ? event.target.value : item) })} />
          <button type="button" aria-label={`Remove ${area}`} onClick={() => change({ ...form, additionalAreas: form.additionalAreas.filter((_, i) => i !== index) })} className="rounded-lg border border-rose-200 px-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
        </div>)}
      </div>
      <button type="button" disabled={form.additionalAreas.length >= 20} onClick={() => change({ ...form, additionalAreas: [...form.additionalAreas, "New area"] })} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 disabled:opacity-50"><Plus className="h-4 w-4" />Add area</button>
    </section>
    <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save globally
      </button>
      <button type="button" onClick={() => change(structuredClone(DEFAULT_CHECKLIST_FORM))} className="text-xs font-semibold text-slate-600 hover:underline">Restore default wording</button>
      {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
      {message && <span role="status" className="text-xs text-slate-700">{message}</span>}
    </div>
  </div>;
}
