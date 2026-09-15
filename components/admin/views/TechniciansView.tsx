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
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <HardHat className="w-4 h-4 text-[#001f97]" />
          <h2 className="text-base font-black text-slate-900">Add a Field Technician</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Technicians are dispatched to jobs. To allow a technician to log into the portal, create
          their account in Staff Accounts with the <b>Technician</b> role.
        </p>
        <form onSubmit={handleAddTechnician} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
            placeholder="Technician name"
            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm"
          />
          <input
            type="email"
            value={techEmail}
            onChange={(e) => setTechEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm"
          />
          <button
            type="submit"
            disabled={techBusy}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#001f97] text-white text-sm font-bold hover:bg-[#001777] transition-colors disabled:opacity-50"
          >
            {techBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
        {techError && <p className="text-xs text-rose-600 font-semibold mt-2">{techError}</p>}
      </div>

      {/* Roster */}
      <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs">
        <h2 className="text-base font-black text-slate-900 mb-4">
          Technician Roster
          <span className="ml-2 text-xs font-semibold text-slate-400">
            {assignableTechnicians.length} total
          </span>
        </h2>
        {assignableTechnicians.length === 0 ? (
          <div className="text-sm text-slate-400 py-8 text-center">
            No technicians yet. Add your first one above or in Staff Accounts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assignableTechnicians.map((t) => {
              const activeJobs = leads.filter(
                (l) =>
                  l.technicianId === t.id ||
                  (l.technician && l.technician.toLowerCase() === t.name.toLowerCase())
              ).length;
              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-slate-900 text-base">{t.name}</div>
                    <div className="flex items-center gap-1.5">
                      {(t as any).hasLogin ? (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800"
                          title={`Username: ${t.username}`}
                        >
                          Portal Login
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Dispatch Roster
                        </span>
                      )}
                      {!t.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 break-all">
                    {(t as any).email
                      ? (t as any).email
                      : t.username
                      ? `Username: ${t.username}`
                      : "No email specified"}
                  </div>
                  <div className="text-xs text-slate-600 pt-2">
                    Active jobs: <b>{activeJobs}</b>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 mt-auto">
                    {(t as any).hasLogin ? (
                      <Link
                        href={`${basePath}/users`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors"
                      >
                        Edit in Staff Accounts
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleDeleteTechnician(t)}
                        disabled={deletingTechId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
