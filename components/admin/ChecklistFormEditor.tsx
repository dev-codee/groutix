"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { DEFAULT_CHECKLIST_FORM, SMART_QUESTION_LABELS, type ChecklistForm, type SmartQuestion } from "@/lib/checklistForm";

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
    if (form.customQuestions.some(q => !q.label.trim() || (["single", "multiple"].includes(q.type) && !q.options.some(option => option.trim())))) {
      setMessage("Give every added question a label and at least one choice for selection questions.");
      return;
    }
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
      setMessage("Quote request form saved for all customers.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save quote request settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading quote request settings…</div>;

  return <div className="max-w-4xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div>
      <h2 className="text-base font-bold text-slate-900">Smart Quote Request editor</h2>
      <p className="mt-1 text-xs text-slate-500">Changes to services, questions and photo categories apply to every customer quote request link.</p>
    </div>
    <section className="space-y-3 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Service choices</h3><button type="button" className="text-xs font-bold text-blue-700 inline-flex items-center gap-1" onClick={() => change({ ...form, serviceChoices: [...form.serviceChoices, "New service"] })}><Plus className="w-4 h-4"/>Add service</button></div>
      <p className="text-xs text-slate-500">Shower and balcony use their guided questions. Additional services use the general tiled area questions and are marked for manual pricing.</p>
      <div className="grid gap-2 sm:grid-cols-2">{form.serviceChoices.map((service, index) => <div key={index} className="flex gap-2"><input aria-label={`Service ${index + 1}`} className={inputClass} value={form.serviceLabels[service] || service} onChange={event => {
        const next = event.target.value;
        if (["Shower", "Bathroom", "Balcony", "Other tiled area"].includes(service)) change({ ...form, serviceLabels: { ...form.serviceLabels, [service]: next } });
        else change({ ...form, serviceChoices: form.serviceChoices.map((item, i) => i === index ? next : item), customQuestions: form.customQuestions.map(q => q.service === service ? { ...q, service: next } : q) });
      }}/><button type="button" disabled={form.serviceChoices.length <= 1} aria-label={`Remove ${service}`} className="text-rose-600 disabled:opacity-40" onClick={() => change({ ...form, serviceChoices: form.serviceChoices.filter((_, i) => i !== index), customQuestions: form.customQuestions.filter(q => q.service !== service) })}><Trash2 className="w-4 h-4"/></button></div>)}</div>
    </section>
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
    <section className="space-y-3 border-t border-slate-200 pt-5">
      <h3 className="text-sm font-bold text-slate-800">Built-in questions</h3>
      <p className="text-xs text-slate-500">Edit a label or hide a question. To change its answer choices, hide it and add a replacement question below. The service selector always remains visible so answers reach the right CRM area.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SMART_QUESTION_LABELS.filter(key => key !== "What area requires attention?").map(key => <div key={key} className="rounded-xl border border-slate-200 p-3 space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={!form.hiddenQuestions.includes(key)} onChange={event => change({ ...form, hiddenQuestions: event.target.checked ? form.hiddenQuestions.filter(item => item !== key) : [...form.hiddenQuestions, key] })}/>Show {key}</label>
          <input aria-label={`Label for ${key}`} className={inputClass} value={form.questionLabels[key] || key} disabled={form.hiddenQuestions.includes(key)} onChange={event => change({ ...form, questionLabels: { ...form.questionLabels, [key]: event.target.value } })}/>
        </div>)}
      </div>
    </section>
    <section className="space-y-3 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Photo categories</h3><button type="button" className="text-xs font-bold text-blue-700 inline-flex items-center gap-1" onClick={() => change({ ...form, photoCategories: [...form.photoCategories, "New photo category"] })}><Plus className="w-4 h-4"/>Add category</button></div>
      <div className="grid gap-2 sm:grid-cols-2">{form.photoCategories.map((category, index) => <div key={index} className="flex gap-2"><input aria-label={`Photo category ${index + 1}`} className={inputClass} value={category} onChange={event => change({ ...form, photoCategories: form.photoCategories.map((item, i) => i === index ? event.target.value : item) })}/><button type="button" aria-label={`Remove ${category}`} className="text-rose-600" onClick={() => change({ ...form, photoCategories: form.photoCategories.filter((_, i) => i !== index) })}><Trash2 className="w-4 h-4"/></button></div>)}</div>
    </section>
    <section className="space-y-3 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Additional questions</h3><button type="button" className="text-xs font-bold text-blue-700 inline-flex items-center gap-1" onClick={() => change({ ...form, customQuestions: [...form.customQuestions, { id: crypto.randomUUID().replace(/-/g, ""), service: "All", label: "", type: "text", options: [], required: false }] })}><Plus className="w-4 h-4"/>Add question</button></div>
      <p className="text-xs text-slate-500">Add questions for every service or one specific area. Answers appear in the customer request in the CRM.</p>
      {form.customQuestions.map((item, index) => {
        const update = (patch: Partial<SmartQuestion>) => change({ ...form, customQuestions: form.customQuestions.map((q, i) => i === index ? { ...q, ...patch } : q) });
        return <div key={item.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex justify-between items-center"><strong className="text-xs text-slate-700">Question {index + 1}</strong><button type="button" aria-label={`Remove question ${index + 1}`} className="text-rose-600" onClick={() => change({ ...form, customQuestions: form.customQuestions.filter((_, i) => i !== index) })}><Trash2 className="w-4 h-4"/></button></div>
          <input aria-label={`Question ${index + 1} label`} className={inputClass} placeholder="Question shown to customers" value={item.label} onChange={event => update({ label: event.target.value })}/>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-slate-700">Service<select className={inputClass} value={item.service} onChange={event => update({ service: event.target.value })}>{["All", ...form.serviceChoices].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Answer type<select className={inputClass} value={item.type} onChange={event => update({ type: event.target.value as SmartQuestion["type"] })}>{[["text", "Short text"], ["textarea", "Long text"], ["number", "Number"], ["single", "One choice"], ["multiple", "Multiple choices"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          {["single", "multiple"].includes(item.type) && <label className="block text-xs font-semibold text-slate-700">Choices, one per line<textarea className={inputClass} rows={4} value={item.options.join("\n")} onChange={event => update({ options: event.target.value.split("\n") })}/></label>}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={item.required} onChange={event => update({ required: event.target.checked })}/>Required</label>
        </div>;
      })}
    </section>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save form
      </button>
      <button type="button" onClick={() => change(structuredClone(DEFAULT_CHECKLIST_FORM))} className="text-xs font-semibold text-slate-600 hover:underline">Restore default form</button>
      {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
      {message && <span role="status" className="text-xs text-slate-700">{message}</span>}
    </div>
  </div>;
}
