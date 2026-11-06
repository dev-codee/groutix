import { redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminAuth";

export default function UsersPage() {
  redirect(`${getAdminBasePath()}?view=team&manageAccess=1`);
}
