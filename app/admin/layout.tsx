import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAdminBasePath, verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { AdminProvider } from "@/components/admin/AdminProvider";

// Keep the whole admin area out of search engines regardless of the URL used.
export const metadata: Metadata = {
  title: "Admin - Groutix",
  robots: { index: false, follow: false, nocache: true },
};

// Read ADMIN_BASE_PATH at request time (not build time) so a runtime-only env
// value produces correct in-app links.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const basePath = getAdminBasePath();
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  // Unauthenticated visitors are redirected by middleware before this renders;
  // the fallback only applies on the public login page (which ignores role).
  const role = session?.role ?? "manager";
  const username = session?.username ?? "";
  return (
    <AdminProvider basePath={basePath} role={role} username={username}>
      <div className="admin-ui min-h-screen bg-slate-50 text-slate-900">{children}</div>
    </AdminProvider>
  );
}
