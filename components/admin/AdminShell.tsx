"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, UserCheck, FileText, LogOut, Menu, X } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const renderNavLinks = (onItemClick?: () => void) => (
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
            onClick={() => onItemClick?.()}
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
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200/80 p-4 flex-col justify-between shrink-0 h-screen overflow-y-auto sticky top-0">
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
          {renderNavLinks()}
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between h-full overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-xs ring-1 ring-blue-500/20 shrink-0">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-base leading-tight text-slate-900 tracking-tight">Groutix Portal</div>
                    <div className="text-[11px] font-medium text-slate-400">CRM &amp; Operations</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderNavLinks(() => setMobileNavOpen(false))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Role</span>
                <span className="font-semibold text-slate-900">{ROLE_LABELS[role]}</span>
              </div>
              <button
                onClick={() => { setMobileNavOpen(false); logout(); }}
                disabled={loggingOut}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {loggingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-1 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
            title="Open Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="font-bold text-sm text-slate-900">Groutix Portal</div>
          <div className="w-8" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex-1 w-full">{children}</div>
      </main>
    </div>
  );
}
