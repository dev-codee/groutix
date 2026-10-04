import { NextRequest, NextResponse } from "next/server";
import { resolveArea, SUBURBS, distanceKm, BASE_LOCATION } from "@/lib/scheduling";
import { getZoneRules } from "@/lib/zoneRulesServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || req.nextUrl.searchParams.get("suburb")?.trim() || "";

  const zoneRules = await getZoneRules();

  if (!query) {
    // Group catalogued suburbs from CRM / DB by region
    const classified = SUBURBS.map((s) => {
      const km = distanceKm(BASE_LOCATION, s);
      const isExcluded = zoneRules.coastalExcluded.includes(s.name);
      const isServiced = !isExcluded && km <= zoneRules.maxRadiusKm;
      return { name: titleCase(s.name), km, isServiced };
    }).filter((s) => s.isServiced);

    const melbourneMetro = [
      "South Melbourne", "Richmond", "Carlton", "Fitzroy", "Brunswick",
      "St Kilda", "Prahran", "Toorak", "Hawthorn", "Camberwell",
      "Box Hill", "Glen Waverley", "Dandenong", "Cranbourne", "Frankston", "Mornington"
    ];

    const regional = [
      "Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"
    ];

    return NextResponse.json(
      {
        melbourneMetro,
        regional,
        totalCatalogued: classified.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const area = resolveArea(query, zoneRules);
  const isAvailable = Boolean(area.serviced && area.zone !== "outside" && area.zone !== "coastal");

  return NextResponse.json(
    {
      available: isAvailable,
      suburb: area.suburb ? titleCase(area.suburb) : titleCase(query),
      zone: area.zone,
      distanceKm: area.distanceKm != null ? Math.round(area.distanceKm * 10) / 10 : null,
      label: area.label,
      message: isAvailable
        ? `Yes! We service ${area.suburb ? titleCase(area.suburb) : titleCase(query)}.`
        : `This suburb is currently not in our standard automated area. Please mail or contact us to know if we can service your area.`,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
