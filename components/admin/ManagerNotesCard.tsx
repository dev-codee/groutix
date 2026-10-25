"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, EyeOff, Loader2, Save, StickyNote } from "lucide-react";
import { fmtDate } from "@/lib/adminHelpers";

export function ManagerNotesCard() {
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [savedSecondaryText, setSavedSecondaryText] = useState("");
  const [columns, setColumns] = useState<1 | 2>(1);
  const [savedColumns, setSavedColumns] = useState<1 | 2>(1);
  const [visibility, setVisibility] = useState<"expanded" | "minimized" | "hidden">("hidden");
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/manager-notes", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load notes.");
        if (controller.signal.aborted) return;
        setText(data.text); setSavedText(data.text); setUpdatedAt(data.updatedAt || undefined);
        setSecondaryText(data.secondaryText || ""); setSavedSecondaryText(data.secondaryText || "");
        setColumns(data.columns === 2 ? 2 : 1); setSavedColumns(data.columns === 2 ? 2 : 1);
        setError(""); setLoaded(true); setLoading(false);
      })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [loadVersion]);

  async function save() {
    const snapshot = text;
    const secondarySnapshot = secondaryText;
    const columnsSnapshot = columns;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/manager-notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snapshot, secondaryText: secondarySnapshot, columns: columnsSnapshot }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save notes.");
      setSavedText(snapshot); setUpdatedAt(data.updatedAt);
      setSavedSecondaryText(secondarySnapshot); setSavedColumns(columnsSnapshot);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save notes."); }
    finally { setSaving(false); }
  }

  const dirty = text !== savedText || secondaryText !== savedSecondaryText || columns !== savedColumns;
  const buttonClass = "flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer";
  if (visibility === "hidden") return <div className="flex items-center gap-2 text-xs text-slate-500">
    <button type="button" onClick={() => setVisibility("expanded")} className={buttonClass}><StickyNote className="h-3.5 w-3.5 text-amber-600" />Show My Notes</button>
    {dirty && <span>Unsaved changes</span>}
  </div>;

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3" aria-labelledby="manager-notes-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 id="manager-notes-title" className="flex items-center gap-2 text-sm font-bold text-slate-900"><StickyNote className="w-4 h-4 text-amber-600" />My Notes</h2>
        {visibility === "expanded" && <p className="text-[11px] text-slate-500 mt-0.5">Your personal reminders and reference notes, saved to your manager account.</p>}</div>
      <div className="flex flex-wrap items-center gap-2">
      {visibility === "expanded" && <select aria-label="Notes columns" value={columns} disabled={!loaded || loading} onChange={event => setColumns(Number(event.target.value) as 1 | 2)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50"><option value={1}>1 column</option><option value={2}>2 columns</option></select>}
      <button type="button" onClick={save} disabled={!loaded || loading || saving || !dirty}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-default">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{saving ? "Saving…" : "Save Notes"}
      </button>
      <button type="button" onClick={() => setVisibility(visibility === "expanded" ? "minimized" : "expanded")} aria-expanded={visibility === "expanded"} aria-controls="manager-notes-editors" className={buttonClass}>
        {visibility === "expanded" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{visibility === "expanded" ? "Minimize" : "Expand"}
      </button>
      <button type="button" onClick={() => setVisibility("hidden")} className={buttonClass}><EyeOff className="h-3.5 w-3.5" />Hide</button>
      </div>
    </div>
    <div id="manager-notes-editors" hidden={visibility !== "expanded"}>
    <div className={`grid gap-3 ${columns === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
    <div className="min-w-0">
    {columns === 2 && <label htmlFor="manager-notes-first" className="mb-1 block text-xs font-semibold text-slate-600">Notes 1</label>}
    <textarea id="manager-notes-first" aria-label="My notes" value={text} onChange={event => setText(event.target.value)} disabled={!loaded || loading} maxLength={20000} rows={columns === 2 ? 7 : 4}
      placeholder={loading ? "Loading your notes…" : "Write reminders, job references or helpful information here…"}
      className="w-full resize-y rounded-xl border border-slate-200 bg-amber-50/40 p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 disabled:opacity-50" />
    </div>
    {columns === 2 && <div className="min-w-0">
      <label htmlFor="manager-notes-second" className="mb-1 block text-xs font-semibold text-slate-600">Notes 2</label>
      <textarea id="manager-notes-second" aria-label="My notes, second column" value={secondaryText} onChange={event => setSecondaryText(event.target.value)} disabled={!loaded || loading} maxLength={20000} rows={7}
        placeholder="More reminders, job references or helpful information…"
        className="w-full resize-y rounded-xl border border-slate-200 bg-amber-50/40 p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 disabled:opacity-50" />
    </div>}
    </div>
    {columns === 1 && secondaryText && <p className="mt-1 text-[11px] text-slate-500">Select 2 columns to view your second column.</p>}
    </div>
    <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
      <span role="status">{loading ? "Loading…" : dirty ? "Unsaved changes — click Save Notes" : updatedAt ? `Saved ${fmtDate(updatedAt)}` : "No notes saved yet"}</span>
      {error && <span className="flex items-center gap-2"><span role="alert" className="text-red-600">{error}</span>
        {!loaded && <button type="button" onClick={() => { setLoading(true); setLoadVersion(version => version + 1); }} className="text-blue-600 underline cursor-pointer">Retry</button>}</span>}
    </div>
  </section>;
}
