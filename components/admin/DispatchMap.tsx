"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Maximize2, Minimize2 } from "lucide-react";
import { mapRouteGroups } from "@/lib/scheduleDays";
import type { MapPosition } from "@/lib/mapGeocode";
import type { Lead } from "@/components/admin/types";

export interface DispatchMapItem {
  lead: Lead;
  type: "inspection" | "job";
  time: string;
  proposed?: boolean;
  unassigned?: boolean;
  date?: string;
  color?: string;
  stopNumber?: number;
  appointmentId?: string;
}
interface DispatchMapProps {
  items: DispatchMapItem[];
  hqAddress: string;
  selectedLeadId: string | null;
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
  onSelectLead: (id: string) => void;
  children?: ReactNode;
}
const HQ_CENTER: Leaflet.LatLngTuple = [-37.6988298, 144.9004405];
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const point = (position: MapPosition): Leaflet.LatLngTuple => [position.lat, position.lng];
function pinIcon(L: typeof Leaflet, text: string, color: string, selected = false) {
  return L.divIcon({
    className: "dispatch-pin",
    html: `<div style="width:30px;height:36px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${color};border:3px solid ${selected ? "#0f172a" : "white"};box-shadow:0 2px 5px #0005"><span style="display:flex;align-items:center;justify-content:center;width:24px;height:30px;transform:rotate(45deg);color:white;font:800 12px system-ui">${escapeHtml(text)}</span></div>`,
    iconSize: [30, 40], iconAnchor: [15, 40], tooltipAnchor: [0, -38],
  });
}

export function DispatchMap({ items, hqAddress, selectedLeadId, selectedItemId, onSelectItem, onSelectLead, children }: DispatchMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const hasInteractedRef = useRef(false);
  const fitAllRef = useRef<(() => void) | null>(null);
  const focusedSelectionRef = useRef<string | null>(null);
  const libraryRef = useRef<typeof Leaflet | null>(null);
  const markersRef = useRef<{ marker: Leaflet.Marker; item: DispatchMapItem; index: number }[]>([]);
  const callbacksRef = useRef({ onSelectItem, onSelectLead, selectedItemId, selectedLeadId });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const itemsKey = JSON.stringify(items.map((i) => [i.lead.id, i.lead.name, i.lead.address, i.lead.city, i.type, i.time, i.proposed, i.unassigned, i.date, i.color, i.appointmentId, i.stopNumber]));

  useEffect(() => {
    callbacksRef.current = { onSelectItem, onSelectLead, selectedItemId, selectedLeadId };
  }, [onSelectItem, onSelectLead, selectedItemId, selectedLeadId]);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let map: Leaflet.Map | undefined;
    const container = containerRef.current;
    // Capture gestures before Leaflet handles them. Programmatic map movements
    // also fire zoom/move events, so those events cannot identify user intent.
    const preserveViewport = (event: Event) => {
      if (event instanceof KeyboardEvent && !["+", "=", "-", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      hasInteractedRef.current = true;
      const { selectedItemId, selectedLeadId } = callbacksRef.current;
      focusedSelectionRef.current = JSON.stringify([selectedItemId, selectedLeadId]);
      map?.stop();
    };
    const gestureEvents = ["pointerdown", "wheel", "keydown"];
    gestureEvents.forEach((event) => container?.addEventListener(event, preserveViewport, { capture: true, passive: true }));
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      libraryRef.current = L;
      map = L.map(containerRef.current, { center: HQ_CENTER, zoom: 11, zoomControl: false });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileerror", () => {
        if (!cancelled) setError("Map tiles could not load. Check your internet connection.");
      }).on("load", () => { if (!cancelled) setError(null); }).addTo(map);
      observer = new ResizeObserver(() => map?.invalidateSize({ pan: false }));
      observer.observe(containerRef.current);
      setReady(true);
    }).catch(() => { if (!cancelled) { setError("The map could not load. Refresh to try again."); setLoading(false); } });
    return () => {
      cancelled = true;
      gestureEvents.forEach((event) => container?.removeEventListener(event, preserveViewport, true));
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = libraryRef.current;
    if (!ready || !map || !L) return;
    const controller = new AbortController();
    const layers = L.layerGroup().addTo(map);
    markersRef.current = [];
    setLoading(true);
    setNotice(null);
    const base = L.marker(HQ_CENTER, { icon: pinIcon(L, "H", "#0f172a"), title: `Base — ${hqAddress}` }).addTo(layers);
    base.bindTooltip("Base", { direction: "top" });
    const positions: (MapPosition | null)[] = items.map(() => null);
    let basePosition = HQ_CENTER;
    let routeLayers: Leaflet.Polyline[] = [];
    const fitAll = () => {
      const bounds = L.latLngBounds([basePosition, ...positions.filter((p): p is MapPosition => !!p).map(point)]);
      map.fitBounds(bounds, { padding: [65, 65], maxZoom: positions.some(Boolean) ? 15 : 12, animate: false });
    };
    fitAllRef.current = fitAll;
    const fit = () => { if (!hasInteractedRef.current) fitAll(); };
    fit();
    const renderRoutes = () => {
      routeLayers.forEach((line) => layers.removeLayer(line));
      routeLayers = mapRouteGroups(items, positions).map((group) => L.polyline([basePosition, ...group.positions.map(point), basePosition], {
        color: group.color, weight: 3, opacity: 0.75, dashArray: "6 8", interactive: false,
      }).addTo(layers));
    };
    const fetchBatch = async (addresses: string[]) => {
      const response = await fetch("/api/admin/geocode", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      if (!Array.isArray(data.results) || data.results.length !== addresses.length) throw new Error("Invalid coordinates");
      return data.results as (MapPosition | null)[];
    };
    const addStop = (position: MapPosition, index: number) => {
      const item = items[index];
      const color = item.proposed ? "#16a34a" : item.type === "inspection" ? "#2563eb" : "#059669";
      const label = item.proposed ? "NEW" : item.unassigned ? (item.type === "inspection" ? "I" : "J") : String(item.stopNumber || index + 1);
      const current = callbacksRef.current;
      const selected = current.selectedItemId ? item.appointmentId === current.selectedItemId : item.lead.id === current.selectedLeadId;
      const title = `${item.lead.name || "Customer"} · ${item.unassigned ? "Unassigned" : `${item.date || ""} ${item.time}`} ${position.approximate ? "· Approximate location" : ""}`;
      const marker = L.marker(point(position), { icon: pinIcon(L, label, color, selected), title, zIndexOffset: selected ? 2200 : index })
        .bindTooltip(escapeHtml(title), { permanent: true, direction: "top", className: "dispatch-label" })
        .on("click", () => {
          const callbacks = callbacksRef.current;
          if (item.appointmentId && callbacks.onSelectItem) callbacks.onSelectItem(item.appointmentId);
          else callbacks.onSelectLead(item.lead.id);
        }).addTo(layers);
      markersRef.current.push({ marker, item, index });
    };
    const load = async () => {
      // Small batches display pins progressively while public geocoding is throttled.
      const addresses = [hqAddress, ...items.map((i) => `${i.lead.address || i.lead.city || "Melbourne"}, VIC, Australia`)];
      for (let offset = 0; offset < addresses.length; offset += 5) {
        const results = await fetchBatch(addresses.slice(offset, offset + 5));
        if (controller.signal.aborted) return;
        results.forEach((position, index) => {
          if (offset + index === 0) {
            if (position) { basePosition = point(position); base.setLatLng(basePosition); }
          } else {
            const itemIndex = offset + index - 1;
            positions[itemIndex] = position;
            if (position) addStop(position, itemIndex);
          }
        });
        renderRoutes();
        fit();
      }
      const missing = positions.filter((p) => !p).length;
      const approximate = positions.filter((p) => p?.approximate).length;
      setNotice([missing ? `${missing} address(es) could not be placed.` : "", approximate ? `${approximate} pin(s) show approximate locations.` : ""].filter(Boolean).join(" ") || null);
    };
    void load().catch(() => {
      if (!controller.signal.aborted) setNotice("Some addresses could not load. Refresh to try again.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); layers.remove(); markersRef.current = []; fitAllRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable content key prevents rebuilds during lead polling
  }, [ready, itemsKey, hqAddress]);

  useEffect(() => {
    const L = libraryRef.current;
    if (!L) return;
    let selectedMarker: Leaflet.Marker | undefined;
    markersRef.current.forEach(({ marker, item, index }) => {
      const selected = selectedItemId ? item.appointmentId === selectedItemId : item.lead.id === selectedLeadId;
      const color = item.proposed ? "#16a34a" : item.type === "inspection" ? "#2563eb" : "#059669";
      const label = item.proposed ? "NEW" : item.unassigned ? (item.type === "inspection" ? "I" : "J") : String(item.stopNumber || index + 1);
      marker.setIcon(pinIcon(L, label, color, selected)).setZIndexOffset(selected ? 2200 : index);
      if (selected) selectedMarker = marker;
    });
    const selectionKey = JSON.stringify([selectedItemId, selectedLeadId]);
    if (selectedMarker && focusedSelectionRef.current !== selectionKey) {
      mapRef.current?.panTo(selectedMarker.getLatLng());
      focusedSelectionRef.current = selectionKey;
    }
    if (!selectedItemId && !selectedLeadId) focusedSelectionRef.current = null;
  }, [selectedItemId, selectedLeadId, loading]);

  const toggleFullscreen = () => {
    const action = document.fullscreenElement ? document.exitFullscreen() : wrapperRef.current?.requestFullscreen();
    action?.catch(() => setNotice("Fullscreen is unavailable in this browser."));
  };
  return (
    <div ref={wrapperRef} className="relative isolate w-full h-full bg-slate-100">
      <div ref={containerRef} className="relative z-0 w-full h-full" aria-label="Schedule dispatch map" />
      <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-4rem)] rounded-lg bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm">
        {loading ? "Locating stops…" : "Dashed lines show stop order · not driving directions"}
      </div>
      <button type="button" onClick={() => fitAllRef.current?.()} title="Fit all stops" aria-label="Fit all stops"
        className="absolute top-14 right-3 z-10 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
        <LocateFixed className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="absolute top-3 right-3 z-10 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
      {(error || notice) && <div role="status" className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-700 shadow-sm">{error || notice}</div>}
      {children}
    </div>
  );
}
