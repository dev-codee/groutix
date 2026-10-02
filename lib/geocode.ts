// Server-side address → coordinates lookup.
//
// Geocoding and Places are separate products in Google Cloud and a key may be
// authorised for one and not the other, so we try the Geocoding API first and
// fall back to Places Text Search. Keeping both paths here means every caller
// (dispatch map, on-the-way ETA) works whichever API the key has enabled.

export interface LatLng {
  lat: number;
  lng: number;
}

// Addresses repeat constantly — the dispatch map re-geocodes the same stops on
// every open, and leads are re-read on each poll. Cache per server instance.
const cache = new Map<string, LatLng | null>();
const CACHE_MAX = 500;

function cacheKey(address: string): string {
  return address.trim().toLowerCase();
}

function remember(key: string, value: LatLng | null): LatLng | null {
  if (cache.size >= CACHE_MAX) {
    // Cheap eviction: drop the oldest insertion.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}

async function viaGeocodingApi(address: string, apiKey: string): Promise<LatLng | null> {
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("components", "country:AU");
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== "OK" || !data.results?.[0]) {
      if (data?.status === "REQUEST_DENIED") {
        console.warn("[geocode] Geocoding API denied:", data?.error_message || "");
      }
      return null;
    }
    const loc = data.results[0].geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

async function viaPlacesSearch(address: string, apiKey: string): Promise<LatLng | null> {
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({ textQuery: address, regionCode: "AU" }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.warn("[geocode] Places text search failed:", res.status);
      return null;
    }
    const data = await res.json();
    const loc = data?.places?.[0]?.location;
    if (typeof loc?.latitude !== "number" || typeof loc?.longitude !== "number") return null;
    return { lat: loc.latitude, lng: loc.longitude };
  } catch {
    return null;
  }
}

/** Resolve one address to coordinates, or null if neither API can place it. */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const query = (address || "").trim();
  if (!query) return null;

  const key = cacheKey(query);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  if (!apiKey) {
    console.warn("[geocode] GOOGLE_PLACES_API_KEY is not set; cannot geocode.");
    return null;
  }

  const found =
    (await viaGeocodingApi(query, apiKey)) ?? (await viaPlacesSearch(query, apiKey));
  return remember(key, found);
}

/** Resolve several addresses at once, preserving input order. */
export async function geocodeAddresses(addresses: string[]): Promise<(LatLng | null)[]> {
  return Promise.all(addresses.map((a) => geocodeAddress(a)));
}
