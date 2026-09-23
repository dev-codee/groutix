"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HardHat, Plus, Loader2, Trash2, Check } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface Props {
  basePath: string;
  techName: string;
  setTechName: (v: string) => void;
  techEmail: string;
  setTechEmail: (v: string) => void;
  handleAddTechnician: (e: React.FormEvent) => void;
  techBusy: boolean;
  techError: string;
  deletingTechId: string | null;
  handleDeleteTechnician: (t: { id: string; name: string }) => void;
}

function WorkDaysEditor({
  techId,
  workDays,
  hasLogin,
  onSaved,
}: {
  techId: string;
  workDays: number[] | undefined;
  hasLogin: boolean;
  onSaved: (id: string, days: number[] | undefined) => void;
}) {
  const effective = workDays ?? ALL_DAYS;
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>(effective);
  const [saving, setSaving] = useState(false);

  function toggle(d: number) {
    setSelected((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function save() {
    setSaving(true);
    try {
      const days = selected.length === 7 ? null : selected; // null = clear (all days)
      const res = await fetch(`/api/admin/technicians/${techId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDays: days }),
      });
      if (res.ok) {
        onSaved(techId, days === null ? undefined : selected);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1 pt-1">
        {ALL_DAYS.map((d) => (
          <span
            key={d}
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
              effective.includes(d)
                ? "bg-blue-50 text-blue-700 border-blue-200/70"
                : "bg-slate-100 text-slate-300 border-slate-200/60 line-through"
            }`}
          >
            {DAY_LABELS[d]}
          </span>
        ))}
        {!hasLogin && (
          <button
            onClick={() => { setSelected(effective); setEditing(true); }}
            className="ml-1 text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-2">
      <div className="flex flex-wrap gap-1">
        {ALL_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => toggle(d)}
            className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-all cursor-pointer ${
              selected.includes(d)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || selected.length === 0}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-[10px] text-slate-500 hover:underline cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TechniciansView({
  basePath,
  techName,
  setTechName,
  techEmail,
  setTechEmail,
  handleAddTechnician,
  techBusy,
  techError,
  deletingTechId,
  handleDeleteTechnician,
}: Props) {
  const { assignableTechnicians, leads } = useAdminPageCtx();

  // Local override for workDays after in-place edits (until next full reload)
  const [localWorkDays, setLocalWorkDays] = useState<Record<string, number[] | undefined>>({});

  function handleWorkDaysSaved(id: string, days: number[] | undefined) {
    setLocalWorkDays((prev) => ({ ...prev, [id]: days }));
  }

  return (
    <div className="space-y-5">
      {/* Add technician */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <HardHat className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Add a Field Technician</h2>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-3">
          Technicians are dispatched to jobs. To allow a technician to log into the portal, create
          their account in Staff Accounts with the <b>Technician</b> role.
        </p>
        <form onSubmit={handleAddTechnician} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
            placeholder="Technician name"
            className="flex-1 px-3 py-2 border border-slate-200/90 bg-slate-50/80 rounded-xl text-xs focus:border-blue-500 focus:bg-white shadow-2xs"
          />
          <input
            type="email"
            value={techEmail}
            onChange={(e) => setTechEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 px-3 py-2 border border-slate-200/90 bg-slate-50/80 rounded-xl text-xs focus:border-blue-500 focus:bg-white shadow-2xs"
          />
          <button
            type="submit"
            disabled={techBusy}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {techBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </form>
        {techError && <p className="text-xs text-rose-600 font-semibold mt-2">{techError}</p>}
      </div>

      {/* Roster */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
          Technician Roster
          <span className="ml-2 text-xs font-medium text-slate-400">
            ({assignableTechnicians.length} total)
          </span>
        </h2>
        {assignableTechnicians.length === 0 ? (
          <div className="text-xs text-slate-400 py-8 text-center">
            No technicians yet. Add your first one above or in Staff Accounts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignableTechnicians.map((t) => {
              const activeJobs = leads.filter(
                (l) =>
                  l.technicianId === t.id ||
                  (l.technician && l.technician.toLowerCase() === t.name.toLowerCase())
              ).length;
              const workDays = t.id in localWorkDays ? localWorkDays[t.id] : (t as any).workDays;
              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 flex flex-col hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="flex items-center gap-1.5">
                      {(t as any).hasLogin ? (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60"
                          title={`Username: ${t.username}`}
                        >
                          Portal Login
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                          Dispatch Roster
                        </span>
                      )}
                      {!t.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200/60">
                          inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium break-all">
                    {(t as any).email
                      ? (t as any).email
                      : t.username
                      ? `Username: ${t.username}`
                      : "No email specified"}
                  </div>
                  <div className="text-xs text-slate-500 pt-1 font-medium">
                    Active jobs: <b className="text-slate-800 font-semibold">{activeJobs}</b>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wide">Work Days</div>
                    <WorkDaysEditor
                      techId={t.id}
                      workDays={workDays}
                      hasLogin={!!(t as any).hasLogin}
                      onSaved={handleWorkDaysSaved}
                    />
                    {(t as any).hasLogin && (
                      <p className="text-[10px] text-slate-400 mt-1">Work days are set in Staff Accounts.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 mt-auto">
                    {(t as any).hasLogin ? (
                      <Link
                        href={`${basePath}/users`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/80 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-all shadow-2xs"
                      >
                        Edit in Staff Accounts
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleDeleteTechnician(t)}
                        disabled={deletingTechId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingTechId === t.id ? "…" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
