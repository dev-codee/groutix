import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ predictions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ predictions: [] });

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", key);
  url.searchParams.set("components", "country:au");
  url.searchParams.set("types", "address");

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    const predictions = (data.predictions || []).map((p: { description: string }) => p.description);
    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
