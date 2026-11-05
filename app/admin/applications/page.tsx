import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminBasePath, SESSION_COOKIE, verifySession } from "@/lib/adminAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import ApplicationsPanel from "@/components/admin/ApplicationsPanel";

export default async function ApplicationsPage() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect(`${getAdminBasePath()}/login`);
  return <AdminShell>{["manager", "super_admin"].includes(session.role) ? <ApplicationsPanel /> : <p className="rounded-xl bg-amber-50 p-6 text-amber-900">Only hiring managers can access career applications.</p>}</AdminShell>;
}
