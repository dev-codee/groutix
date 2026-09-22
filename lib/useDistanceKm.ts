"use client";

import { useState, useEffect } from "react";

const cache = new Map<string, number | null>();

export function useDistanceKm(address: string | undefined): number | null {
  const [km, setKm] = useState<number | null>(() =>
    address ? (cache.get(address) ?? null) : null
  );

  useEffect(() => {
    if (!address) return;
    if (cache.has(address)) {
      setKm(cache.get(address) ?? null);
      return;
    }
    fetch(`/api/admin/geocode-distance?address=${encodeURIComponent(address)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const val = data?.km ?? null;
        cache.set(address, val);
        setKm(val);
      })
      .catch(() => {
        cache.set(address, null);
      });
  }, [address]);

  return km;
}
