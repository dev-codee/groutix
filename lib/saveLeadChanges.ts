import type { Lead } from "@/components/admin/types";

export async function saveLeadChanges(id: string, updates: Partial<Lead>): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    if (response.ok) return { ok: true };
    const data = await response.json().catch(() => ({}));
    const error = response.status === 401 ? "Your session has expired. Please sign in again to save the quote."
      : typeof data.error === "string" ? data.error : "Could not save changes. Please try again.";
    return { ok: false, error };
  } catch { return { ok: false, error: "Could not connect to the server. Check your connection and try again." }; }
}
