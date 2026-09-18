"use client";

import React from "react";
import Link from "next/link";
import { HardHat, Plus, Loader2, Trash2 } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";

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
