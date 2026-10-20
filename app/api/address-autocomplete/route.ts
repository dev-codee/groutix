import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [], debug: "NO_API_KEY" });

  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const info: Record<string, unknown> = {};

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
      }),
    });

    if (debug) info.newStatus = res.status;

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
      if (debug) info.newSuggestions = 0;
    } else if (debug) {
      info.newError = await res.text();
    }
  } catch (e) {
    if (debug) info.newException = String(e);
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

    if (debug) {
      info.legacyStatus = data.status;
      info.legacyError = data.error_message || null;
    }

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      const predictions = (data.predictions || []).map(
        (p: { description: string }) => p.description
      );
      return NextResponse.json({ predictions, ...(debug ? { debug: info } : {}) });
    }
  } catch (e) {
    if (debug) info.legacyException = String(e);
  }

  return NextResponse.json({ predictions: [], ...(debug ? { debug: info } : {}) });
}
