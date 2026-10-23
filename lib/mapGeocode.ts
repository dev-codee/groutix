// Key-free geocoding for OSM maps. Keep Google coordinates out of this map.
import { locate } from "./routePlanning";

export interface MapPosition { lat: number; lng: number; approximate?: boolean }
const cache = new Map<string, { value: MapPosition | null; expires: number }>();
const pending = new Map<string, Promise<MapPosition | null>>();
let queue: Promise<unknown> = Promise.resolve();

async function lookup(address: string): Promise<MapPosition | null> {
  try {
    const url = new URL(process.env.MAP_GEOCODER_URL || "https://photon.komoot.io/api/");
    url.searchParams.set("q", address);
    url.searchParams.set("limit", "3");
    url.searchParams.set("lang", "en");
    url.searchParams.set("lat", "-37.81");
    url.searchParams.set("lon", "144.96");
    const response = await fetch(url, {
      headers: { "User-Agent": "GroutixCRM/1.0 (+https://groutix.com)", Accept: "application/json" },
      next: { revalidate: 2592000 },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      for (const feature of data.features || []) {
        const [lng, lat] = feature.geometry?.coordinates || [];
        if (feature.properties?.countrycode?.toUpperCase() !== "AU" ||
            !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        // A street/suburb match is useful, but must never look like an exact house pin.
        return { lat, lng, approximate: !feature.properties?.housenumber };
      }
    }
  } catch { /* Fall back to the local suburb catalogue when unavailable. */ }
  const suburb = locate(address);
  return suburb ? { lat: suburb.lat, lng: suburb.lng, approximate: true } : null;
}

export function geocodeMapAddress(address: string): Promise<MapPosition | null> {
  const query = address.trim();
  if (!query) return Promise.resolve(null);
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
  const existing = pending.get(key);
  if (existing) return existing;
  // Serialize lookups and coalesce duplicate addresses across dashboard requests.
  const result = queue.then(async () => {
    const value = await lookup(query);
    if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
    cache.set(key, { value, expires: Date.now() + (value && !value.approximate ? 86400000 : 300000) });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return value;
  });
  queue = result.catch(() => null);
  pending.set(key, result);
  void result.finally(() => pending.delete(key));
  return result;
}

export function geocodeMapAddresses(addresses: string[]): Promise<(MapPosition | null)[]> {
  return Promise.all(addresses.map(geocodeMapAddress));
}
