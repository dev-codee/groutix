"use client";
import { useEffect, useState } from "react";
import { Loader2, Save, StickyNote } from "lucide-react";
import { fmtDate } from "@/lib/adminHelpers";

export function ManagerNotesCard() {
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
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
        setError(""); setLoaded(true); setLoading(false);
      })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [loadVersion]);

  async function save() {
    const snapshot = text;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/manager-notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snapshot }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save notes.");
      setSavedText(snapshot); setUpdatedAt(data.updatedAt);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save notes."); }
    finally { setSaving(false); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3" aria-labelledby="manager-notes-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 id="manager-notes-title" className="flex items-center gap-2 text-sm font-bold text-slate-900"><StickyNote className="w-4 h-4 text-amber-600" />My Notes</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Your personal reminders and reference notes, saved to your manager account.</p></div>
      <button type="button" onClick={save} disabled={!loaded || loading || saving || text === savedText}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-default">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}{saving ? "Saving…" : "Save Notes"}
      </button>
    </div>
    <textarea aria-label="My notes" value={text} onChange={event => setText(event.target.value)} disabled={!loaded || loading} maxLength={20000} rows={4}
      placeholder={loading ? "Loading your notes…" : "Write reminders, job references or helpful information here…"}
      className="w-full resize-y rounded-xl border border-slate-200 bg-amber-50/40 p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 disabled:opacity-50" />
    <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
      <span role="status">{loading ? "Loading…" : text !== savedText ? "Unsaved changes — click Save Notes" : updatedAt ? `Saved ${fmtDate(updatedAt)}` : "No notes saved yet"}</span>
      {error && <span className="flex items-center gap-2"><span role="alert" className="text-red-600">{error}</span>
        {!loaded && <button type="button" onClick={() => { setLoading(true); setLoadVersion(version => version + 1); }} className="text-blue-600 underline cursor-pointer">Retry</button>}</span>}
    </div>
  </section>;
}
