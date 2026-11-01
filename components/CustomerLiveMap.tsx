"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import type { CustomerTrackingView } from "@/lib/customerTracking";

export default function CustomerLiveMap({ location }: { location: NonNullable<CustomerTrackingView["location"]> }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const latestPosition = useRef<Leaflet.LatLngTuple>([location.lat, location.lng]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    latestPosition.current = [location.lat, location.lng];
    marker.current?.setLatLng(latestPosition.current);
    map.current?.panTo(latestPosition.current);
  }, [location.lat, location.lng]);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      const position = latestPosition.current;
      map.current = L.map(container.current, { scrollWheelZoom: false }).setView(position, 14);
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        referrerPolicy: "strict-origin",
        attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileerror", () => { if (!cancelled) setFailed(true); })
        .on("tileload", () => { if (!cancelled) setFailed(false); })
        .addTo(map.current);
      marker.current = L.circleMarker(position, {
        radius: 10, color: "#ffffff", weight: 3, fillColor: "#0b238d", fillOpacity: 1,
      }).addTo(map.current).bindTooltip("Your Groutix specialist");
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  const mapsUrl = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=14/${location.lat}/${location.lng}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="relative isolate">
        <div ref={container} className="h-[360px] w-full sm:h-[430px]" aria-label="Live map showing your specialist's latest location" />
        {failed && (
          <div role="status" className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
            <MapPin className="h-10 w-10 text-primary" />
            <p className="text-sm text-slate-600">The map is temporarily unavailable. Open your specialist&apos;s latest location using the link below.</p>
          </div>
        )}
      </div>
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block bg-white px-4 py-3 text-center text-sm font-bold text-primary hover:bg-slate-50">Open latest location in OpenStreetMap</a>
    </div>
  );
}
