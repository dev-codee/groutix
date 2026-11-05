import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminBasePath, SESSION_COOKIE, verifySession } from "@/lib/adminAuth";

// Preserve existing bookmarks while displaying applications inside the CRM shell.
export default async function ApplicationsPage() {
  const basePath = getAdminBasePath();
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect(`${basePath}/login`);
  redirect(["manager", "super_admin"].includes(session.role)
    ? `${basePath}?view=applications`
    : basePath);
}
