"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Inbox, FileText, LogOut } from "lucide-react";
import { useAdminBasePath } from "@/components/admin/AdminProvider";

// Shared chrome (top nav + logout) for authenticated admin pages. The login
// page renders without it.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const basePath = useAdminBasePath();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const nav = [
    { href: basePath, label: "Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/submissions`, label: "Submissions", icon: Inbox },
    { href: `${basePath}/content`, label: "Content", icon: FileText },
  ];

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
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tight text-[#001f97]">
            Groutix<span className="text-slate-400"> Admin</span>
          </span>
          <nav className="flex items-center gap-1">
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
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#001f97] text-white"
                      : "text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
