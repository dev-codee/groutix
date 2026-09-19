"use client";

import Link from "next/link";
import { ExternalLink, MessageSquare, Trash2, Crown, UserCog, Search, Wrench, DollarSign, Plus } from "lucide-react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import type { StaffMember } from "@/components/admin/types";
import { inRoleQueue, isFlowInProgress, isFlowCompleted } from "@/lib/pipeline";
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

const ROLE_GROUPS = [
  {
    key: "management",
    label: "Management",
    roles: ["manager", "super_admin"],
    icon: Crown,
    color: "text-rose-500",
    border: "border-rose-100",
    bg: "bg-rose-50/60",
    headerBg: "bg-rose-50",
    badgeColor: "text-rose-600 bg-rose-100",
    addLabel: "Add Manager",
  },
  {
    key: "intake",
    label: "Intake",
    roles: ["intake"],
    icon: UserCog,
    color: "text-blue-500",
    border: "border-blue-100",
    bg: "bg-blue-50/60",
    headerBg: "bg-blue-50",
    badgeColor: "text-blue-600 bg-blue-100",
    addLabel: "Add Intake",
  },
  {
    key: "inspection",
    label: "Inspection",
    roles: ["inspection", "field"],
    icon: Search,
    color: "text-emerald-500",
    border: "border-emerald-100",
    bg: "bg-emerald-50/60",
    headerBg: "bg-emerald-50",
    badgeColor: "text-emerald-600 bg-emerald-100",
    addLabel: "Add Inspector",
  },
  {
    key: "technicians",
    label: "Technicians",
    roles: ["technician"],
    icon: Wrench,
    color: "text-violet-500",
    border: "border-violet-100",
    bg: "bg-violet-50/60",
    headerBg: "bg-violet-50",
    badgeColor: "text-violet-600 bg-violet-100",
    addLabel: "Add Technician",
  },
  {
    key: "finance",
    label: "Finance",
    roles: ["finance"],
    icon: DollarSign,
    color: "text-amber-500",
    border: "border-amber-100",
    bg: "bg-amber-50/60",
    headerBg: "bg-amber-50",
    badgeColor: "text-amber-600 bg-amber-100",
    addLabel: "Add Finance",
  },
] as const;

export function TeamView({
  isManager,
  basePath,
  openAsRole,
  openChat,
  handleDeleteStaff,
  deletingStaffId,
  unread,
}: Props) {
  const { staff, leads, username, isTechnicianName } = useAdminPageCtx();

  const getAssignedCount = (s: StaffMember) => {
    const role = s.role as Role;
    const sNameLower = (s.name || s.username).trim().toLowerCase();
    const sUserLower = (s.username || "").trim().toLowerCase();
    const sId = s.id;

    const isAssigned = (l: (typeof leads)[number]) => {
      if (role === "technician") {
        const hasTechField = Boolean(l.technicianId || l.technician || l.technicianUsername);
        if (hasTechField) {
          return Boolean(
            (sId && l.technicianId === sId) ||
            (l.technician && (l.technician.trim().toLowerCase() === sNameLower || l.technician.trim().toLowerCase() === sUserLower)) ||
            (l.technicianUsername && l.technicianUsername.toLowerCase() === sUserLower)
          );
        }
        return Boolean(
          l.assigned &&
          l.assigned.trim().toLowerCase() !== "unassigned" &&
          isTechnicianName(l.assigned) &&
          (l.assigned.trim().toLowerCase() === sNameLower || l.assigned.trim().toLowerCase() === sUserLower)
        );
      }
      if (role === "inspection" || role === "field") {
        if (sId && l.inspectorId) return l.inspectorId === sId;
        const assignedTo = (l.assigned || "").trim().toLowerCase();
        return Boolean(assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower));
      }
      if (role === "finance") {
        const assignedTo = (l.assigned || "").trim().toLowerCase();
        if (assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower)) return true;
        const otherFinance = staff.filter((o) => o.role === "finance" && o.id !== sId);
        const isOther = otherFinance.some((o) => (o.name && assignedTo === o.name.trim().toLowerCase()) || (o.username && assignedTo === o.username.trim().toLowerCase()));
        if (!isOther) return inRoleQueue("finance", l.status);
        return false;
      }
      if (role === "intake") {
        const assignedTo = (l.assigned || "").trim().toLowerCase();
        if (assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower)) return true;
        const otherIntake = staff.filter((o) => o.role === "intake" && o.id !== sId);
        const isOther = otherIntake.some((o) => (o.name && assignedTo === o.name.trim().toLowerCase()) || (o.username && assignedTo === o.username.trim().toLowerCase()));
        if (!isOther) return inRoleQueue("intake", l.status);
        return false;
      }
      const assignedTo = (l.assigned || "").trim().toLowerCase();
      return Boolean(assignedTo && assignedTo !== "unassigned" && (assignedTo === sNameLower || assignedTo === sUserLower));
    };

    return leads.filter(
      (l) =>
        isAssigned(l) &&
        !isFlowCompleted(role, l.status, l) &&
        l.status !== "Completed" &&
        l.status !== "Lost" &&
        isFlowInProgress(role, l.status, l)
    ).length;
  };

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.active).length;
  const inactiveStaff = totalStaff - activeStaff;

  // Row layout: [management, intake], [inspection, technicians], [finance]
  const groupRows = [
    ["management", "intake"],
    ["inspection", "technicians"],
    ["finance"],
  ];

  const groupMap = Object.fromEntries(
    ROLE_GROUPS.map((g) => [
      g.key,
      {
        ...g,
        members: [...staff]
          .filter((s) => (g.roles as readonly string[]).includes(s.role))
          .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username)),
      },
    ])
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Operations Team</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your team, roles and access permissions</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 text-xs">👥</span>
            <div>
              <div className="font-bold text-slate-900 text-base leading-none">{totalStaff}</div>
              <div className="text-[10px] text-slate-400 font-medium">Total Staff</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <div>
              <div className="font-bold text-slate-900 text-base leading-none">{activeStaff}</div>
              <div className="text-[10px] text-slate-400 font-medium">Active</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
            <div>
              <div className="font-bold text-slate-900 text-base leading-none">{inactiveStaff}</div>
              <div className="text-[10px] text-slate-400 font-medium">Inactive</div>
            </div>
          </div>
          {isManager && (
            <Link
              href={`${basePath}/users`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Staff
            </Link>
          )}
        </div>
      </div>

      {/* Group rows */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
          No staff accounts yet.{" "}
          {isManager && (
            <Link href={`${basePath}/users`} className="text-blue-600 font-semibold hover:underline">
              Add them under Staff Accounts →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupRows.map((row, ri) => (
            <div
              key={ri}
              className={`grid gap-4 ${row.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
            >
              {row.map((groupKey) => {
                const group = groupMap[groupKey];
                if (!group) return null;
                const Icon = group.icon;
                return (
                  <div
                    key={group.key}
                    className={`rounded-2xl border ${group.border} bg-white shadow-xs overflow-hidden`}
                  >
                    {/* Group header */}
                    <div className={`flex items-center justify-between px-4 py-3 ${group.headerBg} border-b ${group.border}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${group.color}`} />
                        <span className={`text-sm font-bold ${group.color}`}>
                          {group.label} ({group.members.length})
                        </span>
                      </div>
                      {isManager && (
                        <Link
                          href={`${basePath}/users`}
                          className={`flex items-center gap-1 text-[11px] font-semibold ${group.color} hover:underline`}
                        >
                          <Plus className="w-3 h-3" />
                          {group.addLabel}
                        </Link>
                      )}
                    </div>

                    {/* Members */}
                    {group.members.length === 0 ? (
                      <div className="px-4 py-5 text-xs text-slate-400 text-center">
                        No {group.label.toLowerCase()} staff yet.
                      </div>
                    ) : (
                      <div className={`grid gap-3 p-4 ${group.members.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                        {group.members.map((s) => {
                          const isSelf = s.username.toLowerCase() === (username || "").toLowerCase();
                          const unreadCount = unread[s.username.toLowerCase()] || 0;
                          const assignedCount = getAssignedCount(s);

                          return (
                            <div
                              key={s.id}
                              className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col"
                            >
                              {/* Name + status */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm leading-tight">
                                    {s.name || s.username}
                                    {isSelf && (
                                      <span className="ml-1.5 text-[10px] font-medium text-slate-400">(you)</span>
                                    )}
                                  </div>
                                  <div className={`mt-0.5 text-[11px] font-bold uppercase tracking-wider ${group.color}`}>
                                    {s.role}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {s.active ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Active" />
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                      disabled
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Details */}
                              <div className="text-[11px] text-slate-500 space-y-0.5">
                                <div className="font-medium">{s.username}@groutix.com</div>
                                <div className="text-slate-400">Assigned leads: <b className="text-slate-700">{assignedCount}</b></div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 pt-1 mt-auto">
                                {isManager && (
                                  <button
                                    onClick={() => openAsRole(s)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open Dashboard
                                  </button>
                                )}
                                <button
                                  onClick={() => openChat(s)}
                                  disabled={isSelf}
                                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                                  title={isSelf ? "This is you" : `Message ${s.name}`}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Contact
                                  {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                                      {unreadCount}
                                    </span>
                                  )}
                                </button>
                                {isManager && (
                                  <button
                                    onClick={() => handleDeleteStaff(s)}
                                    disabled={isSelf || deletingStaffId === s.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-400 text-[11px] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                                    title={isSelf ? "Can't delete your own account" : `Delete ${s.name}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    {deletingStaffId === s.id ? "…" : ""}
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
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
