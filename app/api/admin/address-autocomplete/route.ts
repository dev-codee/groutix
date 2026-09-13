import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  // Try new Places API (v1) first — supports keys that have "Places API (New)" enabled
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
        includedPrimaryTypes: ["geocode", "premise", "street_address"],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const predictions = (data.suggestions || [])
        .map((s: { placePrediction?: { text?: { text?: string } } }) =>
          s.placePrediction?.text?.text
        )
        .filter(Boolean) as string[];

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

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      const predictions = (data.predictions || []).map(
        (p: { description: string }) => p.description
      );
      return NextResponse.json({ predictions });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ predictions: [] });
}
