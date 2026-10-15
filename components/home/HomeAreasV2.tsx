"use client";

// Service areas block for the new homepage.
// - Availability comes from the same live lookup as before (/api/suburb-check).
// - The map is Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, the key the dispatch and
//   tracking maps already use). It only loads when the section scrolls into view.
// - Searched suburbs are placed using the coordinates in lib/scheduling (SUBURBS),
//   falling back to Google's geocoder for anything not in that list.

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { LocateFixed } from "lucide-react";
import { useContact } from "@/components/SiteContentProvider";
import { BASE_LOCATION, SUBURBS } from "@/lib/scheduling";

const REGIONS: [string, string][] = [
  ["Melbourne", "/locations/melbourne"],
  ["Geelong", "/locations/geelong"],
  ["Ballarat", "/locations/ballarat"],
  ["Frankston", "/locations/frankston"],
  ["Lilydale", "/locations/lilydale"],
  ["Yarra Glen", "/locations/yarra-glen"],
  ["Kilmore", "/locations/kilmore"],
];
// Caulfield has no suburb page yet, so it points to the Melbourne hub until it does.
const POPULAR: [string, string][] = [
  ["St Kilda", "/locations/melbourne/st-kilda"],
  ["Brighton", "/locations/melbourne/brighton"],
  ["South Yarra", "/locations/melbourne/south-yarra"],
  ["Albert Park", "/locations/melbourne/albert-park"],
  ["Malvern", "/locations/melbourne/malvern"],
  ["Toorak", "/locations/melbourne/toorak"],
  ["Caulfield", "/locations/melbourne"],
  ["South Melbourne", "/locations/melbourne/south-melbourne"],
  ["Hawthorn", "/locations/melbourne/hawthorn"],
  ["Bentleigh", "/locations/melbourne/bentleigh"],
  ["Essendon", "/locations/melbourne/essendon"],
  ["Brunswick", "/locations/melbourne/brunswick"],
];

const SERVICE_RADIUS_M = 50_000;
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let mapsPromise: Promise<typeof google> | null = null;
function loadMaps(key: string): Promise<typeof google> {
  if (!mapsPromise) {
    setOptions({ key, v: "weekly" });
    mapsPromise = Promise.all([importLibrary("maps"), importLibrary("geocoding")])
      .then(() => google)
      .catch((err) => {
        mapsPromise = null;
        throw err;
      });
  }
  return mapsPromise;
}

type Result = { available: boolean; suburb: string } | { error: true };
type LatLng = { lat: number; lng: number };

const pill =
  "inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-[15px] font-medium text-slate-900 transition-colors hover:border-[#001F97] hover:text-[#001F97]";

/* ───────────── Map ───────────── */
function ServiceMap({ target }: { target: (LatLng & { label: string; ok: boolean }) | null }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const pin = useRef<google.maps.Marker | null>(null);
  const me = useRef<google.maps.Marker | null>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!MAPS_KEY);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  // Load Google Maps only once the map is near the viewport.
  useEffect(() => {
    const el = box.current;
    if (!el || !MAPS_KEY) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showMe = useCallback((pos: GeolocationPosition) => {
    if (!map.current) return;
    const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (!me.current) {
      me.current = new google.maps.Marker({
        map: map.current,
        position: p,
        title: "Your location",
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2F63CC", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
    } else me.current.setPosition(p);
    map.current.panTo(p);
    map.current.setZoom(12);
  }, []);

  useEffect(() => {
    if (!visible || !MAPS_KEY) return;
    let cancelled = false;
    loadMaps(MAPS_KEY)
      .then((g) => {
        if (cancelled || !box.current || map.current) return;
        map.current = new g.maps.Map(box.current, {
          center: { lat: -37.83, lng: 144.96 },
          zoom: 9,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        new g.maps.Circle({
          map: map.current,
          center: BASE_LOCATION,
          radius: SERVICE_RADIUS_M,
          strokeColor: "#2F63CC",
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: "#2F63CC",
          fillOpacity: 0.08,
          clickable: false,
        });
        new g.maps.Marker({ map: map.current, position: BASE_LOCATION, title: "Groutix base, Gowanbrae" });
        setReady(true);
        // Centre on the visitor only if they've already allowed location for this site (no surprise prompt).
        navigator.permissions?.query({ name: "geolocation" as PermissionName })
          .then((st) => { if (st.state === "granted") navigator.geolocation.getCurrentPosition(showMe, () => {}); })
          .catch(() => {});
      })
      .catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [visible, showMe]);

  // Move to the searched suburb.
  useEffect(() => {
    if (!ready || !map.current || !target) return;
    const p = { lat: target.lat, lng: target.lng };
    if (!pin.current) pin.current = new google.maps.Marker({ map: map.current, position: p, title: target.label });
    else {
      pin.current.setPosition(p);
      pin.current.setTitle(target.label);
    }
    map.current.panTo(p);
    map.current.setZoom(13);
  }, [ready, target]);

  const locate = () => {
    if (!navigator.geolocation) return setLocError("Your browser can't share its location.");
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); showMe(pos); },
      () => { setLocating(false); setLocError("Location is turned off for this site. Search your suburb instead."); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-slate-300 bg-[#E3E6EC] lg:min-h-[560px]">
      <div ref={box} className="absolute inset-0" role="region" aria-label="Map of the Groutix service area" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-600">
          {failed ? "Map unavailable right now. Use the suburb checker to confirm your area." : "Loading map…"}
        </div>
      )}
      {ready && (
        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          <button type="button" onClick={locate} disabled={locating}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#001F97] shadow-[0_2px_10px_rgba(15,23,42,0.18)] hover:bg-slate-50 disabled:opacity-70">
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
            {locating ? "Finding you…" : "Show my location"}
          </button>
          {locError && <span className="max-w-[260px] rounded-lg bg-white px-3 py-2 text-xs text-slate-700 shadow">{locError}</span>}
        </div>
      )}
    </div>
  );
}

/* ───────────── Section body ───────────── */
export default function HomeAreasV2() {
  const { phone, tel } = useContact();
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [target, setTarget] = useState<(LatLng & { label: string; ok: boolean }) | null>(null);

  const locateQuery = async (q: string, suburb: string): Promise<LatLng | null> => {
    const known = SUBURBS.find((s) => s.name === suburb.toLowerCase()) || SUBURBS.find((s) => s.name === q.toLowerCase());
    if (known) return { lat: known.lat, lng: known.lng };
    if (!MAPS_KEY) return null;
    try {
      const g = await loadMaps(MAPS_KEY);
      const { results } = await new g.maps.Geocoder().geocode({ address: `${q}, VIC, Australia`, componentRestrictions: { country: "AU" } });
      const loc = results[0]?.geometry.location;
      return loc ? { lat: loc.lat(), lng: loc.lng() } : null;
    } catch {
      return null;
    }
  };

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      document.getElementById("area-q")?.focus();
      return;
    }
    setChecking(true);
    try {
      const r = await fetch(`/api/suburb-check?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const suburb: string = d.suburb || q;
      const ok = Boolean(d.available);
      setResult({ available: ok, suburb });
      const p = await locateQuery(q, suburb);
      if (p) setTarget({ ...p, label: suburb, ok });
    } catch {
      setResult({ error: true });
    } finally {
      setChecking(false);
    }
  };

  const goToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-8">
      <ServiceMap target={target} />

      <div className="flex flex-col gap-7">
        {/* Suburb checker */}
        <div id="suburb-checker-widget" className="rounded-2xl border border-slate-200 bg-[#F4F6FB] p-6 sm:p-7">
          <form onSubmit={check} noValidate>
            <label htmlFor="area-q" className="mb-2.5 block text-[17px] font-medium text-slate-900">
              Check your suburb or postcode
            </label>
            <div className="flex gap-3">
              <input
                id="area-q"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                placeholder="e.g. 3182"
                autoComplete="address-level2"
                className="h-14 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15"
              />
              <button type="submit" disabled={checking}
                className="h-14 shrink-0 rounded-lg bg-[#001F97] px-7 text-[17px] font-bold text-white hover:bg-[#00167A] disabled:opacity-70">
                {checking ? "Checking…" : "Check"}
              </button>
            </div>
          </form>
          <div aria-live="polite" className="mt-3 min-h-6 text-[15px]">
            {result && "available" in result && result.available && (
              <p className="font-medium text-emerald-800">
                ✓ Yes — we service {result.suburb}.{" "}
                <a href="#quote-form" onClick={goToForm} className="text-[#001F97] underline">Get a quote →</a>
              </p>
            )}
            {result && "available" in result && !result.available && (
              <p className="font-medium text-amber-800">
                {result.suburb} isn&apos;t in our standard area, but we may still cover it.{" "}
                <a href="#quote-form" onClick={goToForm} className="text-[#001F97] underline">Send your details</a> or call{" "}
                <a href={tel} className="text-[#001F97] underline">{phone}</a>.
              </p>
            )}
            {result && "error" in result && (
              <p className="text-amber-800">
                We couldn&apos;t check that just now. Please try again or call <a href={tel} className="text-[#001F97] underline">{phone}</a>.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-slate-900">Regions</h3>
          <div className="flex flex-wrap gap-2.5">{REGIONS.map(([n, h]) => <Link key={n} href={h} className={pill}>{n}</Link>)}</div>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-bold text-slate-900">Popular suburbs</h3>
          <div className="flex flex-wrap gap-2.5">{POPULAR.map(([n, h]) => <Link key={n} href={h} className={pill}>{n}</Link>)}</div>
        </div>
        <Link href="/locations" className="text-lg font-bold text-[#001F97] underline">All service areas →</Link>
      </div>
    </div>
  );
}
