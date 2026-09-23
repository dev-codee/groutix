"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Layers, Navigation2 } from "lucide-react";
import type { Lead } from "@/components/admin/types";

export interface DispatchMapItem {
  lead: Lead;
  type: "inspection" | "job";
  time: string;
}

interface DispatchMapProps {
  items: DispatchMapItem[];
  hqAddress: string;
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
}

const HQ_CENTER = { lat: -37.6988298, lng: 144.9004405 };

let loaderPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (!loaderPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    loaderPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("routes"),
    ]).then(() => google);
  }
  return loaderPromise;
}

function fullAddress(lead: Lead): string {
  return `${lead.address || lead.city || "Melbourne"}, VIC, Australia`;
}

function fmtApptTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${String(m).padStart(2, "0")} ${period}`;
}

function pinIcon(g: typeof google, color: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 11.2 15 25 15 25s15-13.8 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
    <circle cx="15" cy="15" r="10.5" fill="white"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new g.maps.Size(30, 40),
    anchor: new g.maps.Point(15, 40),
    labelOrigin: new g.maps.Point(15, 15),
  };
}

function homeIcon(g: typeof google): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#0F172A"/>
    <circle cx="17" cy="17" r="12" fill="white"/>
    <path d="M17 9.5l7.5 6v9.5h-5v-6h-5v6h-5V15.5z" fill="#0F172A"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new g.maps.Size(34, 44),
    anchor: new g.maps.Point(17, 44),
  };
}

// Bubble label styling injected once — hides the InfoWindow's default chrome
// (close button, tail, shadow) so labels read as plain floating pills, like
// the reference design.
let bubbleStyleInjected = false;
function ensureBubbleStyle() {
  if (bubbleStyleInjected || typeof document === "undefined") return;
  bubbleStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .dispatch-map-bubble .gm-style-iw-d { overflow: hidden !important; }
    .dispatch-map-bubble .gm-style-iw-c { padding: 0 !important; border-radius: 10px !important; box-shadow: 0 2px 8px rgba(15,23,42,0.18) !important; }
    .dispatch-map-bubble .gm-style-iw-t::after { display: none !important; }
    .dispatch-map-bubble button.gm-ui-hover-effect { display: none !important; }
  `;
  document.head.appendChild(style);
}

export function DispatchMap({ items, hqAddress, selectedLeadId, onSelectLead }: DispatchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerByLeadIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const bubblesRef = useRef<google.maps.InfoWindow[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Init map once.
  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;
    ensureBubbleStyle();
    loadGoogleMaps(apiKey)
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        const map = new g.maps.Map(containerRef.current, {
          center: HQ_CENTER,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
        });
        mapRef.current = map;
        directionsRendererRef.current = new g.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: { strokeColor: "#10B981", strokeWeight: 4, strokeOpacity: 0.9 },
        });
        trafficLayerRef.current = new g.maps.TrafficLayer();
        setReady(true);
      })
      .catch((err) => {
        console.error("Google Maps failed to load:", err);
        if (!cancelled) setError("Failed to load Google Maps. Check the API key and enabled APIs.");
      });
    return () => { cancelled = true; };
  }, [apiKey]);

  // Traffic layer toggle.
  useEffect(() => {
    if (!ready || !trafficLayerRef.current || !mapRef.current) return;
    trafficLayerRef.current.setMap(showTraffic ? mapRef.current : null);
  }, [showTraffic, ready]);

  // Map / Satellite toggle.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setMapTypeId(mapType);
  }, [mapType, ready]);

  // Rebuild markers, bubbles and the route whenever the stop list changes.
  // Selection highlighting is handled by a separate, cheaper effect below so
  // clicking between appointments doesn't re-fetch directions every time.
  useEffect(() => {
    if (!ready || !mapRef.current || !apiKey) return;
    const g = window.google;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerByLeadIdRef.current.clear();
    bubblesRef.current.forEach((b) => b.close());
    bubblesRef.current = [];
    directionsRendererRef.current?.set("directions", null);

    const addStopMarker = (position: google.maps.LatLng | google.maps.LatLngLiteral, idx: number, item: DispatchMapItem) => {
      const color = item.type === "inspection" ? "#EF4444" : "#3B82F6";
      const marker = new g.maps.Marker({
        position,
        map,
        icon: pinIcon(g, color),
        label: { text: String(idx + 1), color: "#0F172A", fontWeight: "800", fontSize: "12px" },
        title: `${idx + 1}. ${item.lead.name || "Customer"} · ${fmtApptTime(item.time)}`,
        zIndex: 100 + idx,
      });
      marker.addListener("click", () => onSelectLead(item.lead.id));
      markersRef.current.push(marker);
      markerByLeadIdRef.current.set(item.lead.id, marker);

      const bubble = new g.maps.InfoWindow({
        content: `<div style="font:600 11px/1.3 system-ui,sans-serif;padding:5px 9px;white-space:nowrap;color:#0F172A;">
          <span style="color:${color};font-weight:800;">${idx + 1}.</span> ${item.lead.name || "Customer"}
          <div style="font-weight:500;color:#64748B;font-size:10px;">${fmtApptTime(item.time)}</div>
        </div>`,
        disableAutoPan: true,
        headerDisabled: true,
        pixelOffset: new g.maps.Size(0, -6),
      });
      bubble.open({ map, anchor: marker });
      // The InfoWindow's outer container gets a class only after it renders.
      g.maps.event.addListenerOnce(bubble, "domready", () => {
        const iw = document.querySelector(".gm-style-iw-c")?.closest(".gm-style-iw-a") as HTMLElement | null;
        iw?.classList.add("dispatch-map-bubble");
      });
      bubblesRef.current.push(bubble);
    };

    const addHomeMarker = (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
      const marker = new g.maps.Marker({
        position,
        map,
        icon: homeIcon(g),
        title: `Base — ${hqAddress}`,
        zIndex: 2000,
      });
      markersRef.current.push(marker);
    };

    if (items.length === 0) {
      addHomeMarker(HQ_CENTER);
      map.setCenter(HQ_CENTER);
      map.setZoom(12);
      return;
    }

    const directionsService = new g.maps.DirectionsService();
    const waypoints = items.slice(0, -1).map((item) => ({ location: fullAddress(item.lead), stopover: true }));
    const destination = fullAddress(items[items.length - 1].lead);

    directionsService.route(
      {
        origin: hqAddress,
        destination,
        waypoints,
        optimizeWaypoints: false,
        travelMode: g.maps.TravelMode.DRIVING,
      },
      (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status !== "OK" || !result) {
          setError(`Couldn't plot the route (${status}). Showing base location only.`);
          addHomeMarker(HQ_CENTER);
          map.setCenter(HQ_CENTER);
          map.setZoom(12);
          return;
        }
        setError(null);
        directionsRendererRef.current?.setDirections(result);

        const legs = result.routes[0].legs;
        const bounds = new g.maps.LatLngBounds();
        addHomeMarker(legs[0].start_location);
        bounds.extend(legs[0].start_location);

        legs.forEach((leg: google.maps.DirectionsLeg, i: number) => {
          const item = items[i];
          if (!item) return;
          addStopMarker(leg.end_location, i, item);
          bounds.extend(leg.end_location);
        });

        map.fitBounds(bounds, 64);
      }
    );
  }, [ready, items, hqAddress, onSelectLead, apiKey]);

  // Highlight + pan to whichever marker is selected (from a map click or from
  // the timeline) without rebuilding the route.
  useEffect(() => {
    if (!ready || !selectedLeadId) return;
    const g = window.google;
    const marker = markerByLeadIdRef.current.get(selectedLeadId);
    if (!marker) return;
    marker.setAnimation(g.maps.Animation.BOUNCE);
    marker.setZIndex(1000);
    const pos = marker.getPosition();
    if (pos) mapRef.current?.panTo(pos);
    const timer = setTimeout(() => marker.setAnimation(null), 1400);
    return () => clearTimeout(timer);
  }, [selectedLeadId, ready]);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-center p-6">
        <div className="max-w-xs space-y-2">
          <Navigation2 className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-xs font-bold text-slate-500">Live map isn&apos;t configured yet</div>
          <div className="text-[11px] text-slate-400">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the interactive dispatch map.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Map / Satellite toggle — top-left */}
      <div className="absolute top-3 left-3 z-10 bg-white rounded-lg shadow-sm border border-slate-200 flex overflow-hidden text-[11px] font-bold">
        <button type="button" onClick={() => setMapType("roadmap")}
          className={`px-3 py-1.5 flex items-center gap-1 cursor-pointer ${mapType === "roadmap" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
          <Layers className="w-3 h-3" />Map
        </button>
        <button type="button" onClick={() => setMapType("satellite")}
          className={`px-3 py-1.5 cursor-pointer ${mapType === "satellite" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
          Satellite
        </button>
      </div>

      {/* Traffic toggle — top-right */}
      <label className="absolute top-3 right-3 z-10 bg-white rounded-lg shadow-sm border border-slate-200 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
        <input type="checkbox" checked={showTraffic} onChange={(e) => setShowTraffic(e.target.checked)} className="cursor-pointer" />
        Traffic
      </label>

      {error && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm max-w-md text-center">
          {error}
        </div>
      )}
    </div>
  );
}
