import type { RoadLeg } from "./dispatchWorklist";

const cache = new Map<string, { until: number; value: RoadLeg | null }>();
const pending = new Map<string, Promise<RoadLeg | null>>();
let unavailableUntil = 0;
let unavailableReason = "";
export function roadDistanceNotice(): string {
  if (!process.env.GOOGLE_PLACES_API_KEY) return "Google routing is not configured. Values marked ~ are suburb estimates.";
  return Date.now() < unavailableUntil ? unavailableReason : "";
}
/** Directional, address-based driving distance. Never substitute straight-line data as a road result. */
export async function drivingLeg(from: string, to: string): Promise<RoadLeg | null> {
  if (!from.trim() || !to.trim()) return null;
  if (from.trim().toLowerCase() === to.trim().toLowerCase()) return { km: 0, minutes: 0 };
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || Date.now() < unavailableUntil) return null;
  const key = JSON.stringify([from.trim().toLowerCase(), to.trim().toLowerCase()]);
  const saved = cache.get(key);
  if (saved && saved.until > Date.now()) return saved.value;
  if (pending.has(key)) return pending.get(key)!;
  const task = (async () => {
    let value: RoadLeg | null = null;
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", from); url.searchParams.set("destinations", to);
      url.searchParams.set("key", apiKey); url.searchParams.set("mode", "driving"); url.searchParams.set("region", "au");
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const data = await response.json();
        if (["REQUEST_DENIED", "OVER_QUERY_LIMIT", "OVER_DAILY_LIMIT"].includes(data.status)) {
          unavailableUntil = Date.now() + 60_000;
          unavailableReason = data.status === "REQUEST_DENIED"
            ? "Google routing is blocked for the configured key. Enable Distance Matrix API access; values marked ~ are suburb estimates."
            : "Google routing quota is temporarily unavailable. Values marked ~ are suburb estimates.";
        }
        const element = data.rows?.[0]?.elements?.[0];
        if (data.status === "OK" && element?.status === "OK" && Number.isFinite(element.distance?.value) && element.distance.value >= 0 && Number.isFinite(element.duration?.value) && element.duration.value >= 0) {
          value = { km: element.distance.value / 1000, minutes: Math.ceil(element.duration.value / 60) };
        }
      }
    } catch { /* A provider failure is represented as unavailable, never as a road distance. */ }
    if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
    cache.set(key, { value, until: Date.now() + (value ? 30 * 60_000 : 60_000) });
    return value;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
