import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { geocodeAddresses } from "@/lib/geocode";

export const runtime = "nodejs";

// POST /api/admin/geocode — resolve a batch of addresses to coordinates.
//
// The dispatch map used the browser-side google.maps.Geocoder, which needs the
// Geocoding API enabled on the public Maps key. Doing it here instead lets the
// server fall back to Places Text Search when that API is not authorised, so
// pins appear either way (see lib/geocode.ts).
export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { addresses?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const addresses = Array.isArray(body.addresses)
    ? body.addresses.filter((a): a is string => typeof a === "string").slice(0, 60)
    : null;
  if (!addresses) {
    return NextResponse.json({ error: "addresses must be an array of strings" }, { status: 400 });
  }

  const results = await geocodeAddresses(addresses);
  return NextResponse.json({ results });
}
