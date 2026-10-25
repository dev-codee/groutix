"use client";

// Service areas block for the new homepage (also used on the V2 service pages).
// - Availability comes from the live lookup (/api/suburb-check).
// - The map is a no-key Google Maps embed of the business location
//   (82A Marigold Cres, Gowanbrae). It replaces the previous JS-API map, whose
//   browser key sits in a Google Cloud project that Google has disabled —
//   the embed needs no API key, so it cannot break that way again.
// - The suburb checker, regions and popular-suburb links are unchanged.

import React, { useState } from "react";
import Link from "next/link";
import { useContact } from "@/components/SiteContentProvider";

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

type Result = { available: boolean; suburb: string } | { error: true };

const pill =
  "inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-[15px] font-medium text-slate-900 transition-colors hover:border-[#001F97] hover:text-[#001F97]";

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Groutix,%2082A%20Marigold%20Cres,%20Gowanbrae%20VIC%203043&z=13&output=embed";

/* ───────────── Map (no-key embed of the business location) ───────────── */
function ServiceMap() {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-slate-300 bg-[#E3E6EC] lg:min-h-[560px]">
      <iframe
        src={MAP_EMBED_SRC}
        title="Map showing the Groutix location — 82A Marigold Cres, Gowanbrae VIC 3043"
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

/* ───────────── Section body ───────────── */
export default function HomeAreasV2() {
  const { phone, tel } = useContact();
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

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
      setResult({ available: Boolean(d.available), suburb });
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
      <ServiceMap />

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
