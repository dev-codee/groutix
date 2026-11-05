import { NextRequest, NextResponse } from "next/server";
import { getAddressSuggestions } from "@/lib/addressSuggestions";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ predictions: [] });
  return NextResponse.json(await getAddressSuggestions(input.slice(0, 250), process.env.GOOGLE_PLACES_API_KEY), {
    headers: { "Cache-Control": "no-store" },
  });
}
