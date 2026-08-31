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
    { href: `${basePath}/users`, label: "Staff Accounts", icon: UserCheck, roles: ["manager"] },
    { href: `${basePath}/content`, label: "Site Content", icon: FileText, roles: ["manager"] },
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
    <div className="flex min-h-screen bg-[#f5f7fb] text-[#14213d]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e4e9f1] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#e4e9f1]">
            <div className="w-10 h-10 bg-[#001f97] text-white flex items-center justify-center font-black text-xl shadow-sm">
              G
            </div>
            <div>
              <div className="font-black text-lg leading-tight text-[#001f97]">Groutix Portal</div>
              <div className="text-xs text-slate-400">CRM &amp; Administration</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex flex-col gap-1.5">
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#001f97] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: role + logout */}
        <div className="pt-4 border-t border-[#e4e9f1] flex flex-col gap-2">
          <div className="px-2 text-xs text-slate-400">{ROLE_LABELS[role]}</div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
