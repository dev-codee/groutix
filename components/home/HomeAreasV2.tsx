"use client";

// Service areas block for the new homepage. Uses the same live dispatch check
// (/api/suburb-check) and the same callback lead (/api/quote) as the old homepage.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Check, Loader2, Search, TriangleAlert } from "lucide-react";
import { useContact } from "@/components/SiteContentProvider";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const REGIONS: [string, string][] = [
  ["Melbourne", "/locations/melbourne"],
  ["Geelong", "/locations/geelong"],
  ["Ballarat", "/locations/ballarat"],
  ["Frankston", "/locations/frankston"],
  ["Lilydale", "/locations/lilydale"],
  ["Yarra Glen", "/locations/yarra-glen"],
  ["Kilmore", "/locations/kilmore"],
];
const POPULAR: [string, string][] = [
  ["St Kilda", "/locations/melbourne/st-kilda"],
  ["Brighton", "/locations/melbourne/brighton"],
  ["South Yarra", "/locations/melbourne/south-yarra"],
  ["Albert Park", "/locations/melbourne/albert-park"],
  ["Malvern", "/locations/melbourne/malvern"],
  ["Toorak", "/locations/melbourne/toorak"],
  ["Hawthorn", "/locations/melbourne/hawthorn"],
  ["Bentleigh", "/locations/melbourne/bentleigh"],
  ["Essendon", "/locations/melbourne/essendon"],
  ["Brunswick", "/locations/melbourne/brunswick"],
];

type Result = { checkedQuery: string; available: boolean; suburb: string };

const chip = "inline-flex min-h-[38px] items-center rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 hover:border-[#001F97] hover:text-[#001F97]";
const input = "h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15";

export default function HomeAreasV2() {
  const { phone, tel, email, mailto } = useContact();
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [name, setName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [token, setToken] = useState("");
  const captcha = useRef<TurnstileInstance>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      fetch(`/api/suburb-check?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (!live) return;
          setResult({ checkedQuery: q, available: Boolean(d.available), suburb: d.suburb || q });
          setChecking(false);
        })
        .catch(() => live && setChecking(false));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  const goToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const parts = name.trim().split(/\s+/);
    if (!query.trim()) return setError("Type your suburb or postcode first.");
    if (parts.length < 2) return setError("Please enter your first and last name.");
    if (SITE_KEY && !token) return setError("Please complete the verification below.");
    setSending(true);
    setError("");
    const form = new FormData();
    form.set("firstName", parts[0]);
    form.set("lastName", parts.slice(1).join(" "));
    form.set("phone", phoneNum.trim());
    form.set("email", emailAddr.trim());
    form.set("city", query.trim());
    form.set("service", "Coverage & Callback Request");
    form.set("sourcePage", "/#service-areas");
    form.set("message", `Please confirm coverage for ${query.trim()} and contact me about my repair.`);
    if (token) form.set("cf-turnstile-response", token);
    try {
      const r = await fetch("/api/quote", { method: "POST", body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not send your enquiry. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your enquiry. Please try again.");
      captcha.current?.reset();
      setToken("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
      {/* Schematic map */}
      <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-slate-200 bg-[#DCE5F2] lg:min-h-[440px]" role="img"
        aria-label="Service area map: Melbourne with Geelong, Ballarat, Frankston, Lilydale, Yarra Glen and Kilmore">
        <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M150 420 C 210 330, 260 300, 300 300 C 330 300, 345 330, 330 360 C 320 380, 345 400, 380 420 Z" fill="#B9CBE6" />
          <circle cx="300" cy="235" r="120" fill="#2F63CC" fillOpacity=".1" stroke="#2F63CC" strokeOpacity=".45" strokeDasharray="6 6" />
          <circle cx="300" cy="235" r="9" fill="#001F97" />
          <text x="300" y="215" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0F172A">Melbourne</text>
          <g fontSize="13" fontWeight="500" fill="#0F172A">
            <circle cx="215" cy="345" r="6" fill="#2F63CC" /><text x="200" y="335" textAnchor="end">Geelong</text>
            <circle cx="95" cy="190" r="6" fill="#2F63CC" /><text x="95" y="175" textAnchor="middle">Ballarat</text>
            <circle cx="350" cy="330" r="6" fill="#2F63CC" /><text x="362" y="334">Frankston</text>
            <circle cx="410" cy="215" r="6" fill="#2F63CC" /><text x="422" y="219">Lilydale</text>
            <circle cx="420" cy="170" r="6" fill="#2F63CC" /><text x="432" y="174">Yarra Glen</text>
            <circle cx="295" cy="75" r="6" fill="#2F63CC" /><text x="307" y="79">Kilmore</text>
            <rect x="268" y="226" width="10" height="10" fill="#FBBC04" stroke="#0F172A" />
            <text x="250" y="258" textAnchor="end" fontSize="12" fill="#334155">Base · Gowanbrae</text>
          </g>
        </svg>
        <span className="absolute bottom-3 left-3 rounded bg-slate-900/75 px-2 py-0.5 text-xs text-white">Schematic, not to scale</span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Live checker */}
        <div id="suburb-checker-widget" className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">Check If We Service Your Suburb</h3>
          <p className="mb-3.5 mt-1 text-sm text-slate-600">Type your suburb or postcode for an instant answer from our live booking system.</p>
          <label htmlFor="area-q" className="sr-only">Suburb or postcode</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="area-q" value={query} onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setSent(false);
                if (v.trim().length < 2) { setResult(null); setChecking(false); } else setChecking(true);
              }}
              placeholder="e.g. St Kilda or 3182" autoComplete="address-level2" className={`${input} pl-11 pr-10`} />
            {checking && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#2F63CC]" aria-hidden="true" />}
          </div>

          <div aria-live="polite">
            {result && result.available && (
              <div className="mt-3.5 flex gap-2.5 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <b>Yes, Groutix services {result.suburb}.</b>{" "}
                  <a href="#quote-form" onClick={goToForm} className="font-bold underline">Get a free quote →</a>
                </div>
              </div>
            )}
            {result && !result.available && (
              <div className="mt-3.5 flex gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <b>{result.suburb} isn&apos;t in our standard booking area.</b> We often cover nearby areas by arrangement. Leave your details below, email{" "}
                  <a href={mailto} className="font-bold underline">{email}</a> or call <a href={tel} className="font-bold underline">{phone}</a>.
                </div>
              </div>
            )}
          </div>

          {sent ? (
            <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
              Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&apos;ve got your request for <b>{result?.suburb || query}</b> and will call you on <b>{phoneNum}</b>.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-2.5 border-t border-slate-100 pt-4" noValidate>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {result && !result.available ? `Ask us about ${result.suburb}` : "Want us to confirm and call you back?"}
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input required aria-label="Full name" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
                <input required type="tel" aria-label="Phone number" autoComplete="tel" placeholder="Phone number" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} className={input} />
              </div>
              <input required type="email" aria-label="Email" autoComplete="email" placeholder="Email" value={emailAddr} onChange={(e) => setEmailAddr(e.target.value)} className={input} />
              {SITE_KEY && (
                <Turnstile ref={captcha} siteKey={SITE_KEY} onSuccess={setToken} onExpire={() => setToken("")}
                  onError={() => { setToken(""); setError("Verification could not load. Please refresh and try again."); }} options={{ size: "flexible" }} />
              )}
              {error && <p role="alert" className="rounded-md bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={sending}
                className="h-12 w-full rounded-lg bg-[#001F97] px-5 text-base font-bold text-white hover:bg-[#00167A] disabled:opacity-60">
                {sending ? "Sending…" : "Confirm Coverage & Request Callback"}
              </button>
            </form>
          )}
        </div>

        <div>
          <div className="mb-2.5 font-bold text-slate-900">Regions</div>
          <div className="flex flex-wrap gap-2">{REGIONS.map(([n, h]) => <Link key={h} href={h} className={chip}>{n}</Link>)}</div>
        </div>
        <div>
          <div className="mb-2.5 font-bold text-slate-900">Popular suburbs</div>
          <div className="flex flex-wrap gap-2">{POPULAR.map(([n, h]) => <Link key={h} href={h} className={chip}>{n}</Link>)}</div>
        </div>
        <Link href="/locations" className="text-[15px] font-bold text-[#2F63CC] hover:underline">View all service areas →</Link>
      </div>
    </div>
  );
}
