import { redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminAuth";

export default function ContentPage() {
  redirect(`${getAdminBasePath()}?view=content`);
}
