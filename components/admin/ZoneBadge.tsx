"use client";

import { MapPin } from "lucide-react";
import { resolveArea, zoneDayName, ZONE_COLOR, ZONE_SHORT } from "@/lib/scheduling";
import { useZoneRules } from "@/lib/useZoneRules";

/** Compact zone badge, reusable anywhere a lead's area is shown. */
export function ZoneBadge({ address }: { address?: string | null }) {
  const rules = useZoneRules();
  const area = address ? resolveArea(address, rules) : null;
  if (!area) return null;
  const c = ZONE_COLOR[area.zone];
  const day = zoneDayName(area.zone, rules);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${c.bg} ${c.text}`}
      title={area.label}
    >
      <MapPin className="w-2.5 h-2.5" />
      {ZONE_SHORT[area.zone]}
      {day && <span className="font-normal opacity-70">· {day}</span>}
    </span>
  );
}
