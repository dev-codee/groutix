import { NextRequest, NextResponse } from "next/server";
import { isCompletePropertyAddress } from "@/lib/propertyAddress";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;

  // Try Google first when configured. If it is unavailable or rejects the
  // request, Photon (OpenStreetMap) provides a lightweight server-side fallback.
  if (key) {
  // Try new Places API (v1) first
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["au"],
        includedPrimaryTypes: ["premise", "street_address"],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const predictions = (data.suggestions || [])
        .map((s: { placePrediction?: { text?: { text?: string } } }) =>
          s.placePrediction?.text?.text
        )
        .filter((value: unknown): value is string => typeof value === "string" && isCompletePropertyAddress(value));

      if (predictions.length > 0) {
        return NextResponse.json({ predictions });
      }
    }
  } catch {
    // fall through to legacy API
  }

  // Fallback: legacy Places Autocomplete API
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", key);
    url.searchParams.set("components", "country:au");
    url.searchParams.set("types", "address");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "OK") {
      const predictions = (data.predictions || []).map(
        (p: { description: string }) => p.description
      ).filter((value: string) => isCompletePropertyAddress(value));
      if (predictions.length) return NextResponse.json({ predictions });
    }
  } catch {
    // continue to the provider fallback below
  }
  }

  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", input);
    url.searchParams.set("lat", "-37.8136");
    url.searchParams.set("lon", "144.9631");
    url.searchParams.set("limit", "5");
    url.searchParams.set("lang", "en");
    const res = await fetch(url, { headers: { "User-Agent": "GroutixAddressAutocomplete/1.0 (groutix.com)" }, signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      const predictions = (data.features || []).map((feature: { properties?: Record<string, string> }) => {
        const p = feature.properties || {};
        if (!p.housenumber || !p.street) return "";
        const street = [p.housenumber, p.street || p.name].filter(Boolean).join(" ");
        return [street, p.suburb || p.city || p.locality, p.state, p.postcode].filter(Boolean).join(", ");
      }).filter((value: string) => isCompletePropertyAddress(value) && /victoria|vic|australia/i.test(value));
      if (predictions.length) return NextResponse.json({ predictions: [...new Set(predictions)].slice(0, 5), attribution: "OpenStreetMap contributors" });
    }
  } catch {
    // Suggestions remain optional; allow free-form address entry if both providers fail.
  }

  return NextResponse.json({ predictions: [] });
}
