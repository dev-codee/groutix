import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { geocodeMapAddresses } from "@/lib/mapGeocode";

export const runtime = "nodejs";

// Authenticated, key-free geocoding for the dispatch map.
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

  const results = await geocodeMapAddresses(addresses);
  return NextResponse.json({ results });
}
