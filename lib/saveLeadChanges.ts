import type { Lead } from "@/components/admin/types";

export async function saveLeadChanges(id: string, updates: Partial<Lead>): Promise<{ ok: true; recycled?: boolean; item?: Lead } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
      signal: controller.signal, method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return data.recycled === true ? { ok: true, recycled: true } : { ok: true, ...(data.item ? { item: data.item } : {}) };
    }
    const data = await response.json().catch(() => ({}));
    const error = response.status === 401 ? "Your session has expired. Please sign in again to save the quote."
      : typeof data.error === "string" ? data.error : "Could not save changes. Please try again.";
    return { ok: false, error };
  } catch {
    return { ok: false, error: controller.signal.aborted
      ? "Saving took too long. Your edits are still in this form. Check the quote after refreshing before retrying, as the server may have saved it."
      : "Could not connect to the server. Check your connection and try again." };
  } finally { clearTimeout(timeout); }
}
