import type { Metadata } from "next";
import { getAdminBasePath } from "@/lib/adminAuth";
import { AdminProvider } from "@/components/admin/AdminProvider";

// Keep the whole admin area out of search engines regardless of the URL used.
export const metadata: Metadata = {
  title: "Admin — Groutix",
  robots: { index: false, follow: false, nocache: true },
};

// Read ADMIN_BASE_PATH at request time (not build time) so a runtime-only env
// value produces correct in-app links.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const basePath = getAdminBasePath();
  return (
    <AdminProvider basePath={basePath}>
      <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>
    </AdminProvider>
  );
}
