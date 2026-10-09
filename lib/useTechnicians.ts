"use client";

import { useEffect, useState } from "react";
import type { TechnicianJSON } from "./technicians";

export const TECHNICIANS_EVENT = "groutix:technicians";
const STORAGE_KEY = "groutix:technicians-updated";
let cached: TechnicianJSON[] | null = null;
let inflight: Promise<TechnicianJSON[]> | null = null;
let requestVersion = 0;

export function refreshTechnicians(): Promise<TechnicianJSON[]> {
  if (inflight) return inflight;
  const version = requestVersion;
  inflight = fetch("/api/admin/technicians", { cache: "no-store" })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load technicians.");
      return data.technicians as TechnicianJSON[];
    })
    .then((technicians) => {
      if (version === requestVersion) {
        cached = technicians;
        window.dispatchEvent(new CustomEvent(TECHNICIANS_EVENT, { detail: technicians }));
      }
      return technicians;
    })
    .finally(() => { if (version === requestVersion) inflight = null; });
  return inflight;
}

/** Refresh every mounted roster/slot consumer and notify other dashboard tabs. */
export async function publishTechnicianChanges(): Promise<void> {
  requestVersion++;
  inflight = null;
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* storage may be unavailable */ }
  await refreshTechnicians();
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<TechnicianJSON[]>(cached || []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cached === null);
  useEffect(() => {
    let alive = true;
    const refresh = () => refreshTechnicians()
      .then(() => { if (alive) { setError(null); setLoading(false); } })
      .catch((err) => { if (alive) { setError(err.message); setLoading(false); } });
    const update = (event: Event) => {
      setTechnicians((event as CustomEvent<TechnicianJSON[]>).detail);
      setError(null);
      setLoading(false);
    };
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) void refresh(); };
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(TECHNICIANS_EVENT, update);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(onFocus, 30_000);
    void refresh();
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener(TECHNICIANS_EVENT, update);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  return { technicians, error, loading, refresh: refreshTechnicians };
}
