import { formatGooglePropertyAddress, formatPhotonPropertyAddress, isCompleteAddressSuggestion } from "./propertyAddress";

type Suggestions = { predictions: string[]; attribution?: string; unavailable?: boolean; message?: string };
const detailsCache = new Map<string, { address: string; expires: number }>();
const timeout = () => AbortSignal.timeout(4000);
const complete = (values: string[]) => [...new Set(values.filter(isCompleteAddressSuggestion))].slice(0, 5);

function preserveTypedUnit(input: string, address: string): string {
  const unit = input.trim().match(/^(?:(?:unit|apartment|apt|flat|shop|suite)\s+([a-z0-9-]+)\s*[,/]\s*|([a-z0-9-]+)\s*\/\s*)(\d+[a-z]?)\s+/i);
  const number = address.match(/^(\d+[a-z]?)\s+/i);
  return unit && number && unit[3].toLowerCase() === number[1].toLowerCase()
    ? `${unit[1] || unit[2]}/${address}` : address;
}

async function googleAddress(placeId: string, key: string, legacy: boolean): Promise<string> {
  const cacheId = `${legacy ? "legacy" : "new"}:${placeId}`;
  const cached = detailsCache.get(cacheId);
  if (cached && cached.expires > Date.now()) return cached.address;
  try {
    let response: Response;
    if (legacy) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId); url.searchParams.set("fields", "address_components");
      url.searchParams.set("key", key); url.searchParams.set("language", "en");
      response = await fetch(url, { signal: timeout() });
    } else {
      response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "addressComponents" }, signal: timeout(),
      });
    }
    if (!response.ok) return "";
    const data = await response.json();
    const address = formatGooglePropertyAddress(legacy ? data.result || {} : data);
    if (address) {
      if (detailsCache.size >= 500) detailsCache.delete(detailsCache.keys().next().value!);
      detailsCache.set(cacheId, { address, expires: Date.now() + 60 * 60 * 1000 });
    }
    return address;
  } catch { return ""; }
}

/** Return complete property suggestions; never substitute the broad city for a suburb. */
export async function getAddressSuggestions(input: string, key?: string): Promise<Suggestions> {
  let providerAvailable = false;
  if (key) {
    try {
      const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
        body: JSON.stringify({ input, includedRegionCodes: ["au"], includedPrimaryTypes: ["premise", "street_address"], languageCode: "en" }), signal: timeout(),
      });
      if (response.ok) {
        providerAvailable = true;
        const data = await response.json();
        const candidates = (data.suggestions || []).slice(0, 5) as { placePrediction?: { placeId?: string; text?: { text?: string } } }[];
        const predictions = complete((await Promise.all(candidates.map(async candidate => {
          const place = candidate.placePrediction;
          const text = place?.text?.text || "";
          return isCompleteAddressSuggestion(text) ? text : place?.placeId ? googleAddress(place.placeId, key, false) : "";
        }))).map(address => preserveTypedUnit(input, address)));
        if (predictions.length) return { predictions, attribution: "Google" };
      }
    } catch { /* try the next supported provider */ }
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.set("input", input); url.searchParams.set("key", key);
      url.searchParams.set("components", "country:au"); url.searchParams.set("types", "address");
      const response = await fetch(url, { signal: timeout() });
      if (response.ok) {
        const data = await response.json();
        if (["OK", "ZERO_RESULTS"].includes(data.status)) providerAvailable = true;
        if (data.status === "OK") {
          const candidates = (data.predictions || []).slice(0, 5) as { description?: string; place_id?: string }[];
          const predictions = complete((await Promise.all(candidates.map(candidate => {
            const text = candidate.description || "";
            return isCompleteAddressSuggestion(text) ? text : candidate.place_id ? googleAddress(candidate.place_id, key, true) : "";
          }))).map(address => preserveTypedUnit(input, address)));
          if (predictions.length) return { predictions, attribution: "Google" };
        }
      }
    } catch { /* try the fallback */ }
  }
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", input); url.searchParams.set("lat", "-37.8136"); url.searchParams.set("lon", "144.9631");
    url.searchParams.set("limit", "5"); url.searchParams.set("lang", "en");
    const response = await fetch(url, { headers: { "User-Agent": "GroutixAddressAutocomplete/1.0 (groutix.com)" }, signal: timeout() });
    if (response.ok) {
      providerAvailable = true;
      const data = await response.json();
      const predictions = complete((data.features || []).map((feature: { properties?: Record<string, string> }) => preserveTypedUnit(input, formatPhotonPropertyAddress(feature.properties || {}))));
      if (predictions.length) return { predictions, attribution: "OpenStreetMap contributors" };
    }
  } catch { /* Keep manual entry available when providers cannot respond. */ }
  return { predictions: [], unavailable: !providerAvailable,
    message: providerAvailable ? "No complete address matches found. Include your street number and suburb." : "Address suggestions are temporarily unavailable. Please enter your full street address, suburb, state and postcode." };
}
