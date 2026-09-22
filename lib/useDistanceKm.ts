"use client";

import { useMemo } from "react";
import { resolveArea } from "@/lib/scheduling";
import { calculateTravel } from "@/lib/dispatch";

export function useDistanceKm(address: string | undefined): number | null {
  return useMemo(() => {
    if (!address) return null;
    try {
      const area = resolveArea(address);
      const suburb = area.suburb || area.zone;
      if (!suburb) return null;
      const travel = calculateTravel("Tullamarine", suburb);
      return travel.distanceKm > 0 ? travel.distanceKm : null;
    } catch {
      return null;
    }
  }, [address]);
}
