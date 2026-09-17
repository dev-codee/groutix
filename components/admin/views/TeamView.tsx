"use client";

import Link from "next/link";
import { ExternalLink, MessageSquare, Trash2 } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import type { StaffMember } from "@/components/admin/types";
import { inRoleQueue, isFlowInProgress } from "@/lib/pipeline";
import type { Role } from "@/lib/roles";

interface Props {
  isManager: boolean;
  basePath: string;
  openAsRole: (s: StaffMember) => void;
  openChat: (s: StaffMember) => void;
  handleDeleteStaff: (s: { id: string; name: string }) => void;
  deletingStaffId: string | null;
  unread: Record<string, number>;
}

export function TeamView({
  isManager,
  basePath,
  openAsRole,
  openChat,
  handleDeleteStaff,
  deletingStaffId,
  unread,
}: Props) {
  const { staff, leads, username } = useAdminPageCtx();

  return (
    <div className="bg-white rounded-2xl border border-[#e4e9f1] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900">Groutix Operations Team</h2>
        {isManager && (
          <Link href={`${basePath}/users`} className="text-xs font-semibold text-[#001f97] hover:underline">
            Manage staff accounts →
          </Link>
        )}
      </div>
      {staff.length === 0 ? (
        <div className="text-sm text-slate-400 py-8 text-center">
          No staff accounts yet. Add them under Staff Accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...staff]
            .sort((a, b) => {
              const roleOrder: Record<string, number> = {
                manager: 1,
                super_admin: 1,
                intake: 2,
                inspection: 3,
                field: 3,
                technician: 4,
                finance: 5,
              };
              const orderA = roleOrder[(a.role || "").toLowerCase()] ?? 99;
              const orderB = roleOrder[(b.role || "").toLowerCase()] ?? 99;
              if (orderA !== orderB) return orderA - orderB;
              return (a.name || a.username).localeCompare(b.name || b.username);
            })
            .map((s) => {
              const role = s.role as Role;
              const sNameLower = (s.name || s.username).trim().toLowerCase();
              const sUserLower = (s.username || "").trim().toLowerCase();
              const sId = s.id;

              const isAssigned = (l: (typeof leads)[number]) => {
                if (role === "technician") {
                  return (
                    (sId && l.technicianId === sId) ||
                    (l.technician && (l.technician.trim().toLowerCase() === sNameLower || l.technician.trim().toLowerCase() === sUserLower)) ||
                    (sId && l.inspectorId === sId) ||
                    (l.assigned && (l.assigned.trim().toLowerCase() === sNameLower || l.assigned.trim().toLowerCase() === sUserLower))
                  );
                }
                if (role === "inspection" || role === "field") {
                  if (sId && l.inspectorId) return l.inspectorId === sId;
                  const assignedTo = (l.assigned || "").trim().toLowerCase();
                  return Boolean(assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower));
                }
                const assignedTo = (l.assigned || "").trim().toLowerCase();
                return Boolean(assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower));
              };

              // Only leads currently in progress
              const inProgressLeads = leads.filter((l) => isAssigned(l) && isFlowInProgress(role, l.status, l)).length;

              const isSelf = s.username.toLowerCase() === (username || "").toLowerCase();
              const unreadCount = unread[s.username.toLowerCase()] || 0;

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-slate-900 text-base">
                      {s.name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] font-bold text-slate-400">(you)</span>
                      )}
                    </div>
                    {!s.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                        disabled
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#001f97]">
                    {s.role}
                  </div>
                  <div className="text-xs text-slate-600 pt-2">
                    Assigned leads: <b>{inProgressLeads}</b>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 mt-auto">
                    {isManager && (
                      <button
                        onClick={() => openAsRole(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001f97] text-white text-xs font-bold hover:bg-[#001777] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => openChat(s)}
                      disabled={isSelf}
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSelf ? "This is you" : `Message ${s.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Contact
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isManager && (
                      <button
                        onClick={() => handleDeleteStaff(s)}
                        disabled={isSelf || deletingStaffId === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          isSelf
                            ? "You can't delete your own account here"
                            : `Delete ${s.name}`
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingStaffId === s.id ? "…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
