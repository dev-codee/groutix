"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ZONE_RULES, sanitizeZoneRules, type ZoneRules } from "@/lib/zoneRules";

// Shared client cache of the manager-configured zone rules. Every admin component
// (slot pickers, dispatch, the Service Zones view) reads the same copy, and saving
// from Settings → Service Zones pushes the new rules to all of them.

const EVENT = "groutix:zone-rules";
let cached: ZoneRules | null = null;
let inflight: Promise<ZoneRules> | null = null;

function load(): Promise<ZoneRules> {
  if (!inflight) {
    inflight = fetch("/api/admin/settings/zone-rules", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        cached = sanitizeZoneRules(d.rules);
        return cached;
      })
      .catch(() => {
        inflight = null; // allow a retry on next mount
        return cached ?? DEFAULT_ZONE_RULES;
      });
  }
  return inflight;
}

/** Push freshly saved rules to every mounted consumer. */
export function publishZoneRules(rules: ZoneRules) {
  cached = rules;
  inflight = Promise.resolve(rules);
  window.dispatchEvent(new CustomEvent<ZoneRules>(EVENT, { detail: rules }));
}

export function useZoneRules(): ZoneRules {
  const [rules, setRules] = useState<ZoneRules>(cached ?? DEFAULT_ZONE_RULES);
  useEffect(() => {
    let alive = true;
    load().then((r) => alive && setRules(r));
    const onUpdate = (e: Event) => setRules((e as CustomEvent<ZoneRules>).detail);
    window.addEventListener(EVENT, onUpdate);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onUpdate);
    };
  }, []);
  return rules;
}
