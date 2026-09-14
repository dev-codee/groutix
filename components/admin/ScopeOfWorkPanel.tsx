"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Save, X } from "lucide-react";
import type { Lead, QuoteItem } from "@/components/admin/types";

interface Props {
  lead: Lead;
  onSave: (id: string, scope: string) => Promise<unknown> | unknown;
}

export function ScopeOfWorkPanel({ lead: l, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const items: QuoteItem[] | null =
    Array.isArray(l.quoteItems) && l.quoteItems.length > 0 ? l.quoteItems : null;
  const fallback = l.quoteScope || l.service || null;

  if (!items && !fallback) return null;

  async function handleSave() {
    setSaving(true);
    await onSave(l.id, draft);
    setSaving(false);
    setEditing(false);
  }

  function parseBullets(raw: string): string[] {
    return raw
      .split(/\s*[•·\u2013\u2014\-]\s+|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <div className="border border-[#001f97]/20 rounded-lg bg-[#001f97]/[0.03] overflow-hidden">
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setEditing(false); }}
        className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-[#001f97]/[0.06] transition-colors cursor-pointer"
      >
        <span className="text-[10px] font-black text-[#001f97] uppercase tracking-wider">
          Scope of Work
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
        )}
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-2.5 pb-2.5 border-t border-[#001f97]/10">
          {editing ? (
            <div className="pt-2 space-y-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                autoFocus
                className="w-full text-[11px] text-slate-700 leading-snug border border-[#001f97]/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#001f97] resize-none bg-white"
                placeholder="Enter scope of work…"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#001f97] hover:bg-[#001777] text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3 h-3" />
                  {saving ? "Saving\u2026" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              {items ? (
                <ul className="space-y-1.5">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                      <span className="mt-[3px] w-1.5 h-1.5 rounded-full bg-[#001f97] shrink-0" />
                      <span>
                        <span className="font-semibold">{it.service || it.description || `Item ${i + 1}`}</span>
                        {it.scope && it.scope !== it.service && (
                          <span className="text-slate-500"> \u2014 {it.scope}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1.5">
                  {parseBullets(fallback as string).map((bullet, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                      <span className="mt-[3px] w-1.5 h-1.5 rounded-full bg-[#001f97] shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!items && (
                <button
                  type="button"
                  onClick={() => { setDraft(fallback as string); setEditing(true); }}
                  className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-[#001f97] hover:underline cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  Edit scope
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
