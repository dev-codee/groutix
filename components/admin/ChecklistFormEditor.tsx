"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_CHECKLIST_FORM, type ChecklistForm } from "@/lib/checklistForm";

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
        if (!response.ok) throw new Error(data.error || "Could not load quote request settings.");
        setForm(data.form);
      })
      .catch(error => setMessage(error.message || "Could not load quote request settings."))
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
      if (!response.ok) throw new Error(data.error || "Could not save quote request settings.");
      setForm(data.form);
      setDirty(false);
      setMessage("Quote request wording saved for all customers.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save quote request settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading quote request settings…</div>;

  return <div className="max-w-4xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div>
      <h2 className="text-base font-bold text-slate-900">Smart Quote Request wording</h2>
      <p className="mt-1 text-xs text-slate-500">These heading and introduction changes apply to every customer quote request link.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["title", "pageTitle"] as const).map(key => <label key={key} className="space-y-1 text-xs font-semibold text-slate-700">
        <span>{key === "title" ? "Form title" : "Area heading"}</span>
        <input className={inputClass} value={form[key]} onChange={event => change({ ...form, [key]: event.target.value })} />
      </label>)}
      <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
        <span>Introduction</span>
        <textarea rows={3} className={inputClass} value={form.intro} onChange={event => change({ ...form, intro: event.target.value })} />
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save wording
      </button>
      <button type="button" onClick={() => change(structuredClone(DEFAULT_CHECKLIST_FORM))} className="text-xs font-semibold text-slate-600 hover:underline">Restore default wording</button>
      {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
      {message && <span role="status" className="text-xs text-slate-700">{message}</span>}
    </div>
  </div>;
}
