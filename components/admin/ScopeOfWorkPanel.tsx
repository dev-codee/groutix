"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Pencil, Save, X, StickyNote, Plus, Loader2 } from "lucide-react";
import type { Lead } from "@/components/admin/types";

interface Props {
  lead: Lead;
  onSave?: (id: string, scope: string) => Promise<unknown> | unknown;
  onSaveNotes?: (id: string, notes: string) => Promise<unknown> | unknown;
  readOnly?: boolean;
}

interface ScopeSection {
  title?: string;
  bullets: string[];
}

function parseBullets(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/(?:\r?\n)+|(?:\s*[•·◦▪]\s*)/)
    .map((s) => s.replace(/^[•·◦▪\-\*—]\s*/, "").trim())
    .filter((s) => s.length > 0 && s !== "—" && s !== "-");
}

function parseScopeText(text: string): ScopeSection[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections: ScopeSection[] = [];
  let current: ScopeSection = { bullets: [] };

  for (const line of lines) {
    if (line.includes("•") || line.includes("·")) {
      const firstPart = line.split(/[•·◦▪]/)[0].trim().replace(/[—\-]+$/, "").trim();
      const bulletIndex = Math.min(
        line.indexOf("•") === -1 ? Infinity : line.indexOf("•"),
        line.indexOf("·") === -1 ? Infinity : line.indexOf("·")
      );
      const bulletParts = bulletIndex !== Infinity
        ? line.substring(bulletIndex).split(/(?:\s*[•·◦▪]\s*)/).map((p) => p.trim()).filter(Boolean)
        : [];

      if (firstPart && !line.startsWith("•") && !line.startsWith("·") && !line.startsWith("-") && !line.startsWith("*")) {
        if (current.title || current.bullets.length > 0) {
          sections.push(current);
        }
        current = {
          title: firstPart,
          bullets: bulletParts.map((b) => b.replace(/^[—\-]\s*/, "").trim()).filter(Boolean),
        };
      } else {
        current.bullets.push(...bulletParts.map((b) => b.replace(/^[—\-]\s*/, "").trim()).filter(Boolean));
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      current.bullets.push(line.replace(/^[-*]\s*/, "").trim());
    } else {
      if (current.title || current.bullets.length > 0) {
        sections.push(current);
      }
      current = { title: line, bullets: [] };
    }
  }

  if (current.title || current.bullets.length > 0) {
    sections.push(current);
  }

  return sections;
}

function getInitialDraft(l: Lead): string {
  if (l.quoteScope && l.quoteScope.trim()) {
    return l.quoteScope.trim();
  }
  if (Array.isArray(l.quoteItems) && l.quoteItems.length > 0) {
    return l.quoteItems
      .map((it) => {
        const title = it.service || it.description || "";
        const rawScope = it.scope && it.scope !== title ? it.scope : "";
        const bullets = parseBullets(rawScope);
        if (bullets.length > 0) {
          return `${title}\n${bullets.map((b) => `• ${b}`).join("\n")}`;
        }
        return title;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return l.service || l.notes || l.message || "";
}

export function ScopeOfWorkPanel({ lead: l, onSave, onSaveNotes, readOnly = true }: Props) {
  const [open, setOpen] = useState(false);
  const [editingScope, setEditingScope] = useState(false);
  const [scopeDraft, setScopeDraft] = useState("");
  const [savingScope, setSavingScope] = useState(false);
  const [savedScopeOverride, setSavedScopeOverride] = useState<string | null>(null);

  // Extra notes (technician external notes)
  const initialExtraNotes = l.technicianNotes ?? l.scopeNotes ?? "";
  const [extraNotes, setExtraNotes] = useState<string>(initialExtraNotes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setExtraNotes(l.technicianNotes ?? l.scopeNotes ?? "");
  }, [l.technicianNotes, l.scopeNotes]);

  const hasItems = Array.isArray(l.quoteItems) && l.quoteItems.length > 0;
  const activeScopeText = savedScopeOverride ?? l.quoteScope;
  const fallback = activeScopeText || (hasItems ? null : (l.service || l.notes || l.message || null));

  if (!hasItems && !fallback && !extraNotes) return null;

  function handleStartEditScope() {
    if (readOnly) return;
    setScopeDraft(savedScopeOverride ?? getInitialDraft(l));
    setEditingScope(true);
  }

  async function handleSaveScope() {
    if (readOnly || !onSave) return;
    setSavingScope(true);
    try {
      await onSave(l.id, scopeDraft);
      setSavedScopeOverride(scopeDraft);
      setEditingScope(false);
    } catch (err) {
      console.error("Failed to save scope:", err);
    } finally {
      setSavingScope(false);
    }
  }

  function handleStartEditNotes() {
    setNotesDraft(extraNotes);
    setEditingNotes(true);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const trimmed = notesDraft.trim();
    try {
      if (onSaveNotes) {
        await onSaveNotes(l.id, trimmed);
      } else if (onSave) {
        await onSave(l.id, trimmed);
      }
      setExtraNotes(trimmed);
      setEditingNotes(false);
    } catch (err) {
      console.error("Failed to save extra notes:", err);
    } finally {
      setSavingNotes(false);
    }
  }

  // Sections to display
  let sections: ScopeSection[] = [];
  if (activeScopeText && activeScopeText.trim()) {
    sections = parseScopeText(activeScopeText);
  } else if (hasItems && l.quoteItems) {
    sections = l.quoteItems.map((it) => ({
      title: it.service || it.description || undefined,
      bullets: parseBullets(it.scope && it.scope !== it.service ? it.scope : ""),
    }));
  } else if (fallback) {
    sections = parseScopeText(fallback);
  }

  return (
    <div className="border border-[#001f97]/20 rounded-lg bg-[#001f97]/[0.03] overflow-hidden">
      {/* Clickable Header / Toggle Button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setEditingScope(false);
          setEditingNotes(false);
        }}
        className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-[#001f97]/[0.07] transition-colors cursor-pointer text-left select-none"
        title={open ? "Click to collapse Scope of Work" : "Click to view Scope of Work"}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10.5px] font-black text-[#001f97] uppercase tracking-wider flex items-center gap-1.5">
            Scope of Work
          </span>
          {readOnly && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Read-Only
            </span>
          )}
          {extraNotes && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              <StickyNote className="w-2.5 h-2.5 text-amber-700" />
              Extra Note
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[#001f97] shrink-0">
          <span className="text-[9.5px] font-bold text-slate-500">
            {open ? "Hide" : "View"}
          </span>
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#001f97] shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-2.5 pb-2.5 pt-2 border-t border-[#001f97]/15 bg-white/70 space-y-3">
          {/* SECTION 1: ACTUAL SCOPE OF WORK (READ ONLY) */}
          {editingScope && !readOnly ? (
            <div className="space-y-2">
              <textarea
                value={scopeDraft}
                onChange={(e) => setScopeDraft(e.target.value)}
                rows={8}
                autoFocus
                className="w-full text-[11px] text-slate-800 leading-relaxed border border-[#001f97]/30 rounded-lg p-2.5 focus:outline-none focus:border-[#001f97] focus:ring-1 focus:ring-[#001f97] resize-y bg-white shadow-inner font-sans"
                placeholder="Enter scope of work with bullet points..."
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveScope}
                  disabled={savingScope}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001f97] hover:bg-[#001777] text-white text-[10.5px] font-black rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <Save className="w-3 h-3" />
                  {savingScope ? "Saving…" : "Save Scope"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingScope(false)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Official Scope of Work
                </span>
                <span className="text-[9.5px] font-bold text-slate-400">
                  {readOnly ? "Read-Only (Locked)" : "Contract Scope"}
                </span>
              </div>

              {sections.length > 0 ? (
                <div className="space-y-2.5">
                  {sections.map((sec, si) => (
                    <div key={si} className="space-y-1">
                      {sec.title && (
                        <div className="text-[11px] font-bold text-slate-900 leading-snug uppercase tracking-tight">
                          {sec.title}
                        </div>
                      )}
                      {sec.bullets.length > 0 && (
                        <ul className="space-y-1 pl-1">
                          {sec.bullets.map((bullet, bi) => (
                            <li
                              key={bi}
                              className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug"
                            >
                              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-[#001f97] shrink-0" />
                              <span className="break-words">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  No scope details specified.
                </div>
              )}

              {/* Edit scope button (Hidden when readOnly) */}
              {!readOnly && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleStartEditScope}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#001f97]/5 hover:bg-[#001f97]/10 text-[10.5px] font-bold text-[#001f97] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit Scope of Work</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: EXTRA / EXTERNAL NOTES */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                Extra Notes / Site Remarks
              </span>
              {!editingNotes && extraNotes && (
                <button
                  type="button"
                  onClick={handleStartEditNotes}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-[#001f97] bg-[#001f97]/5 hover:bg-[#001f97]/15 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  Edit Note
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full text-xs text-slate-800 leading-relaxed border border-amber-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#001f97] bg-white shadow-inner"
                  placeholder="Add any extra external notes, on-site observations, or variations here (will not change the actual scope of work text)..."
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#001f97] hover:bg-[#001777] text-white text-[10.5px] font-black rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>{savingNotes ? "Saving…" : "Save Extra Note"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNotes(false)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : extraNotes ? (
              <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs font-sans">
                {extraNotes}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-dashed border-slate-200">
                <span className="text-[11px] text-slate-500 italic">
                  No extra notes added.
                </span>
                <button
                  type="button"
                  onClick={handleStartEditNotes}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#001f97] hover:bg-[#001777] text-white text-[10px] font-black transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  Add Extra Note
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
