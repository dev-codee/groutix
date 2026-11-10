import type { Lead } from "@/components/admin/types";
const EVENT = "groutix-crm-changed", STORAGE = "groutix-crm-change";
/** Publish only confirmed writes. Full customer records stay within this tab. */
export function publishCrmChange(item?: Lead) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: item }));
  try { window.localStorage.setItem(STORAGE, `${Date.now()}-${Math.random()}`); } catch { /* Local refresh still works without storage. */ }
}
export function subscribeCrmChanges(listener: (item?: Lead) => void) {
  const local = (event: Event) => listener((event as CustomEvent<Lead | undefined>).detail);
  const remote = (event: StorageEvent) => { if (event.key === STORAGE) listener(); };
  window.addEventListener(EVENT, local); window.addEventListener("storage", remote);
  return () => { window.removeEventListener(EVENT, local); window.removeEventListener("storage", remote); };
}
