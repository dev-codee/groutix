"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, UserCheck, FileText, LogOut } from "lucide-react";
import { useAdminBasePath, useAdminRole } from "@/components/admin/AdminProvider";
import { ROLE_LABELS } from "@/lib/roles";

// Shared chrome for the secondary admin pages (Submissions, Staff, Content).
// Renders the same persistent left sidebar as the CRM dashboard so navigation
// never jumps between a sidebar and a header. The login page renders without it.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const basePath = useAdminBasePath();
  const role = useAdminRole();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const nav = [
    { href: basePath, label: "CRM Dashboard", icon: LayoutDashboard, roles: null },
    { href: `${basePath}/users`, label: "Staff Accounts", icon: UserCheck, roles: ["manager", "super_admin"] },
    { href: `${basePath}/content`, label: "Site Content", icon: FileText, roles: ["manager", "super_admin"] },
  ].filter((item) => !item.roles || item.roles.includes(role));

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore - cookie may already be gone */
    }
    router.replace(`${basePath}/login`);
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 h-screen overflow-y-auto sticky top-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-xs ring-1 ring-blue-500/20 shrink-0">
              G
            </div>
            <div>
              <div className="font-bold text-base leading-tight text-slate-900 tracking-tight">Groutix Portal</div>
              <div className="text-[11px] font-medium text-slate-400">CRM &amp; Operations</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                item.href === basePath
                  ? pathname === basePath
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: role + logout */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Role</span>
            <span className="font-semibold text-slate-900">{ROLE_LABELS[role]}</span>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
