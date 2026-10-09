"use client";

import Image from "next/image";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import type { Review } from "@/lib/reviews";
import { useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Droplets,
  Grid2x2,
  Home,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { faqJsonLd } from "@/lib/seo";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const phone = "(03) 7023 8094";
const tel = "tel:+61370238094";
const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";

/* Shared class strings (sizes + colours match the home page) */
const lead = "text-base leading-relaxed text-neutral-600 sm:text-lg";
const card =
  "rounded-xl border border-[#e2e6f0] bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#FBBC04] hover:shadow-lg";
const cardTitle = "text-lg font-bold text-neutral-900";
const cardText = "mt-2 text-base leading-relaxed text-neutral-600";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover active:scale-95";
const btnGold =
  "inline-flex max-w-full items-center justify-center gap-2 rounded-lg bg-[#FBBC04] px-6 py-3 text-center text-base font-bold text-primary transition-colors hover:bg-white active:scale-95";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-white/70 px-6 py-3 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10 active:scale-95";
const inlineLink = "font-bold text-accent underline hover:text-primary";

/* ─────────────────────────────────────────────
   Content
───────────────────────────────────────────── */
const warningSigns: Array<{ Icon: ComponentType<{ className?: string }>; title: string; text: string }> = [
  { Icon: Zap, title: "Cracked or Crumbling Grout", text: "Grout that is cracked or crumbles when you touch it" },
  { Icon: Grid2x2, title: "Dark Grout After Cleaning", text: "Grout that stays dark even after cleaning" },
  { Icon: Droplets, title: "Returning Mould", text: "Mould that comes back weeks after you scrub it" },
  { Icon: Wrench, title: "Tired Silicone", text: "Silicone that has peeled, yellowed or turned soft" },
  { Icon: Home, title: "Damp Patch Nearby", text: "A damp patch on a wall or ceiling near the bathroom" },
  { Icon: Waves, title: "Pooling Water", text: "Water that pools on the shower floor after you turn it off" },
];

const comparisonRows: Array<[string, string, string]> = [
  ["Water resistance", "Porous, absorbs water over time", "Non porous, built for wet areas"],
  ["Mould resistance", "Weaker, mould can grow in the pores", "Stronger, nothing to hold moisture"],
  ["Flexibility", "Can crack with movement", "Handles movement better"],
  ["Best for", "Dry areas like splashbacks", "Showers and wet areas"],
];

const fixOptions = [
  {
    pill: "Regrout",
    pillClass: "bg-primary/10 text-primary",
    title: "Tiles solid, membrane intact",
    text: "The problem sits in the grout or silicone. This covers most jobs we see.",
  },
  {
    pill: "Retile",
    pillClass: "bg-[#3b5bf0]/10 text-[#3b5bf0]",
    title: "Cracked, chipped or hollow tiles",
    text: "Individual tiles are cracked, chipped or sound hollow when tapped. A hollow sound can mean the tile has come loose.",
  },
  {
    pill: "Rebuild",
    pillClass: "bg-[#FBBC04]/20 text-[#8a6400]",
    title: "Failed waterproof membrane",
    text: "Water has been getting through. Regrouting cannot fix that. It only delays the problem.",
  },
];

const processSteps = [
  {
    title: "Assess the Shower",
    text: "We inspect the grout, silicone and surrounding tiles before recommending any work.",
  },
  {
    title: "Remove and Prepare",
    text: "Damaged grout and old silicone are fully removed and the area is prepared. The amount of work depends on what we find.",
  },
  {
    title: "Regrout and Finish",
    text: "New grout and sealant are applied and finished so the surface is sealed properly again.",
  },
  {
    title: "Cure and Warranty",
    text: "Your shower is ready to use once the grout and silicone have cured.",
  },
];

const priceFactors = [
  { title: "Shower Size", text: "More grout lines mean more labour." },
  { title: "Tile Size", text: "Mosaic tiles have far more grout lines than large tiles." },
  { title: "Condition", text: "Heavy mould or crumbling grout needs more preparation." },
  { title: "Grout Type", text: "Epoxy costs more upfront than cement." },
];

const included = [
  "On site inspection",
  "Full removal of old grout",
  "Waterproof epoxy application",
  "Silicone resealing at corners and joints",
  "Written warranty",
  "No tile removal for a standard regrout",
  "Clear quote before work starts",
];

const diyMistakes = [
  { title: "Old Grout Left Behind", text: "Old grout is left in the joint, so mould grows back through the new grout." },
  { title: "Wrong Grout Type", text: "Cement grout is used in a shower, where it was never meant to last." },
  { title: "Used Too Soon", text: "The shower is used again before the grout and silicone have cured." },
];

/* Each photo needs a caption with suburb + problem, e.g. "Brighton: mouldy cement grout".
   Leave caption as "" until real captions are supplied (nothing is rendered when empty). */
const beforeAfterPhotos = [
  { src: "/img12.jpeg", caption: "" },
  { src: "/img13.jpeg", caption: "" },
  { src: "/img14.jpeg", caption: "" },
  { src: "/img15.jpeg", caption: "" },
];

const relatedProblems = [
  { label: "Leaking shower or damp walls", href: "/leaking-shower-repair", link: "Leaking Shower Repair" },
  { label: "Peeling or mouldy silicone", href: "/silicone-recaulking", link: "Silicone and Recaulking" },
  { label: "Balcony leaks", href: "/balcony-leak-repairs", link: "Balcony Leak Repairs and Regrouting" },
  { label: "Bathrooms, kitchens, laundries", href: "/tile-regrouting", link: "Tile Regrouting" },
];

const innerSuburbs = [
  "South Yarra", "Toorak", "Malvern", "Armadale", "Prahran", "Hawthorn", "Camberwell",
  "Brighton", "St Kilda", "Richmond", "Albert Park", "Windsor", "Elwood", "Port Melbourne",
];
const regionalSuburbs = ["Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"];

const faqs: Array<{ q: string; a: ReactNode; plain: string }> = [
  {
    q: "What is shower regrouting?",
    a: "Removing old, damaged grout and replacing it with new grout. Your tiles stay in place.",
    plain: "Removing old, damaged grout and replacing it with new grout. Your tiles stay in place.",
  },
  {
    q: "How much does shower regrouting cost in Melbourne?",
    a: "Most standard single showers cost about $550 to $1,500. Shower size, tile type, condition and grout type change the price. We quote after we see it.",
    plain:
      "Most standard single showers cost about $550 to $1,500. Shower size, tile type, condition and grout type change the price. We quote after we see it.",
  },
  {
    q: "How long does shower regrouting last?",
    a: "Done properly, it holds up for years of daily use. Epoxy generally outlasts cement in a wet area. That is why complete jobs carry a 10 year warranty.",
    plain:
      "Done properly, it holds up for years of daily use. Epoxy generally outlasts cement in a wet area. That is why complete jobs carry a 10 year warranty.",
  },
  {
    q: "How often should I regrout my shower?",
    a: "There is no fixed date. Regrout when you see cracking, staining or returning mould.",
    plain: "There is no fixed date. Regrout when you see cracking, staining or returning mould.",
  },
  {
    q: "What causes shower grout to fail?",
    a: "Age, movement and constant water. Melbourne’s changing weather adds strain, especially on cement grout.",
    plain: "Age, movement and constant water. Melbourne’s changing weather adds strain, especially on cement grout.",
  },
  {
    q: "Do I need to remove my tiles to regrout a shower?",
    a: "No, in most cases. Only the old grout is removed. Tile work is needed only if tiles are cracked or loose.",
    plain: "No, in most cases. Only the old grout is removed. Tile work is needed only if tiles are cracked or loose.",
  },
  {
    q: "Will regrouting fix a leaking shower?",
    a: (
      <>
        If the leak comes from failed grout or silicone, yes. If the membrane has failed, it needs more. See{" "}
        <Link className={inlineLink} href="/leaking-shower-repair">
          leaking shower repair
        </Link>
        .
      </>
    ),
    plain:
      "If the leak comes from failed grout or silicone, yes. If the membrane has failed, it needs more. See leaking shower repair.",
  },
  {
    q: "Can regrouting work on an old bathroom?",
    a: "Yes, if the tiles and waterproof membrane are sound.",
    plain: "Yes, if the tiles and waterproof membrane are sound.",
  },
  {
    q: "Is DIY regrouting worth it?",
    a: "It can work for small jobs. Most fail because old grout is not fully removed or the shower is used too early.",
    plain: "It can work for small jobs. Most fail because old grout is not fully removed or the shower is used too early.",
  },
  {
    q: "How do I fix shower grout mould?",
    a: "Surface mould can often be cleaned. Mould that keeps returning usually means the grout has failed and needs replacing.",
    plain:
      "Surface mould can often be cleaned. Mould that keeps returning usually means the grout has failed and needs replacing.",
  },
  {
    q: "Can you match my existing grout colour?",
    a: "Epoxy grout comes in many colours, so a close match is usually possible.",
    plain: "Epoxy grout comes in many colours, so a close match is usually possible.",
  },
];

/* ─────────────────────────────────────────────
   Small building blocks
───────────────────────────────────────────── */
function Section({ alt = false, children }: { alt?: boolean; children: ReactNode }) {
  return (
    <section className={`px-6 py-16 lg:px-10 lg:py-24 ${alt ? "bg-[#eef1f8]" : "bg-white"}`}>
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center gap-10">{children}</div>
    </section>
  );
}

function SecHead({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
      {eyebrow && <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
      <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">{title}</h2>
      {children}
    </div>
  );
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-xl border border-l-4 border-[#e2e6f0] border-l-[#FBBC04] bg-white p-6 text-left">
      <h3 className={cardTitle}>{title}</h3>
      <p className={cardText}>{children}</p>
    </div>
  );
}

function GoogleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function Stars({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={`${className} fill-[#FBBC04] text-[#FBBC04]`} />
      ))}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border bg-white transition-all ${
        open ? "border-[#FBBC04]/60 shadow-md" : "border-[#e2e6f0]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-semibold leading-snug text-neutral-900">{question}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180 text-primary" : "text-neutral-400"}`}
        />
      </button>
      {open && <div className="px-5 pb-5 text-left text-base leading-relaxed text-neutral-600">{answer}</div>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#e2e6f0] bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary";
const labelClass = "mb-1 mt-3 block text-[12.5px] font-bold uppercase tracking-wide text-neutral-500";

function SuburbChecker() {
  const [suburb, setSuburb] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ available: boolean; suburb: string; message?: string } | null>(null);
  const [error, setError] = useState("");

  const check = async (event: FormEvent) => {
    event.preventDefault();
    const q = suburb.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/suburb-check?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setResult({
        available: Boolean(data.available ?? data.inServiceArea),
        suburb: data.suburb || q,
        message: data.message,
      });
      // TODO: also send fullName + phoneNum to your lead / CRM endpoint here if you want them captured.
    } catch {
      setError("We couldn’t check that suburb right now. Please call us and we’ll confirm it.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-1.5 rounded-2xl border border-[#e2e6f0] bg-white p-8 text-center shadow-sm sm:p-9">
      <h3 className="text-xl font-bold text-neutral-900">Check If We Service Your Suburb</h3>
      <p className="max-w-md text-base leading-relaxed text-neutral-600">
        Not listed above, or not sure? Enter your suburb or postcode and we’ll confirm coverage.
      </p>
      <form onSubmit={check} aria-label="Check suburb coverage" className="mt-4 w-full max-w-sm text-left">
        <label htmlFor="suburb-field" className={`${labelClass} mt-0`}>Suburb or Postcode</label>
        <input id="suburb-field" required value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Frankston or 3199" className={inputClass} />
        <label htmlFor="suburb-name" className={labelClass}>Full Name</label>
        <input id="suburb-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
        <label htmlFor="suburb-phone" className={labelClass}>Phone Number</label>
        <input id="suburb-phone" type="tel" required value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} placeholder="04XX XXX XXX" className={inputClass} />
        <button type="submit" disabled={loading} className={`${btnPrimary} mt-4 w-full disabled:opacity-60`}>
          {loading ? "Checking…" : "Check My Suburb"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-5 w-full max-w-sm rounded-lg border p-4 text-left text-sm leading-relaxed ${
            result.available ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-bold">
            {result.available ? `Yes, we service ${result.suburb}.` : `${result.suburb} is outside our standard area.`}
          </p>
          <p className="mt-1">
            {result.message ||
              (result.available
                ? "Request a free quote and we’ll take it from there."
                : "Please contact us and we’ll confirm if we can come to your location.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/contact" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover">
              Get a Free Quote
            </Link>
            <a href={tel} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-900 hover:bg-neutral-50">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </a>
          </div>
        </div>
      )}
      {error && <p className="mt-4 max-w-sm text-sm text-neutral-600">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function ShowerRegroutingPage({ reviews }: { reviews: Review[] }) {
  const stats: Array<{
    Icon: ComponentType<{ className?: string }>;
    value: string;
    label: string;
    sub: string;
    stars?: boolean;
    href?: string;
  }> = [
    { Icon: Droplets, value: "8,000+", label: "Bathrooms Restored", sub: "Across Melbourne & regional Victoria" },
    { Icon: GoogleIcon, value: "5.0/5", label: "Google Rating", sub: "Based on 290+ Google reviews", stars: true, href: googleReviewsUrl },
    { Icon: ShieldCheck, value: "10 Year", label: "Waterproof Warranty", sub: "On every complete shower regrout" },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* ═══ 1. HERO ═══ */}
        <section id="quote-form" className="relative overflow-hidden pt-[110px] lg:pt-[125px]">
          <Image src="/img101.jpeg" alt="Tiled bathroom shower" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto max-w-[1460px] px-6 py-8 pb-16 lg:px-10 lg:pb-20">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_520px] xl:grid-cols-[minmax(0,1fr)_540px] lg:gap-12">
              <div className="space-y-5 text-center text-white lg:pt-2 lg:text-left">
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">Groutix</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">
                Shower Regrouting Melbourne
              </h1>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                Groutix removes failed shower grout and rebuilds it with waterproof epoxy. Your tiles stay in place. Every complete shower regrout comes with a 10 year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-16 items-center gap-3 rounded-sm border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="5.0 stars, 290 plus Google reviews for Groutix"
                >
                  <GoogleIcon className="h-6 w-6 flex-shrink-0" />
                  <span className="text-2xl font-black text-white">5.0</span>
                  <span>
                    <span className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />)}
                    </span>
                    <span className="text-[13px] text-white/80">290+ Google Reviews</span>
                  </span>
                </a>
                <a href={tel} className="flex h-16 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                  <Phone className="h-4 w-4" /> {phone}
                </a>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-white/85 lg:justify-start">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Eligible repairs: 10-year warranty</span>
              </div>
              </div>
              <div className="w-full"><HeroQuoteForm /></div>
            </div>
          </div>
        </section>

        {/* ═══ 2. TRUST STATS ═══ */}
        <section className="border-b border-[#e2e6f0] bg-white px-6 py-12 lg:px-10 lg:py-16">
          <div className="mx-auto max-w-[920px]">
            <p className="mb-8 text-center text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Trusted Across Victoria</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {stats.map(({ Icon, value, label, sub, stars, href }) => {
                const inner = (
                  <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-[#e2e6f0] bg-white px-6 py-8 text-center">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef1f8] text-secondary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="text-3xl font-black leading-none text-neutral-900">{value}</p>
                    {stars && <Stars />}
                    <p className="text-base font-bold text-neutral-900">{label}</p>
                    <p className="text-[13px] text-neutral-500">{sub}</p>
                  </div>
                );
                return href ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {inner}
                  </a>
                ) : (
                  <div key={label}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ 3. SIGNS ═══ */}
        <Section>
          <SecHead eyebrow="Signs To Check" title={<>Does Your Shower <span className="text-accent">Need Regrouting?</span></>}>
            <p className={lead}>Check your shower for these signs. If you spot two or more, get it looked at soon.</p>
          </SecHead>
          <div className="grid w-full gap-5 md:grid-cols-3">
            {warningSigns.map(({ Icon, title, text }) => (
              <div key={title} className={card}>
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#eef1f8] text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className={cardTitle}>{title}</h3>
                <p className={cardText}>{text}</p>
              </div>
            ))}
          </div>
          <p className={`${lead} max-w-3xl text-center`}>
            One sign is worth a look. Several together can mean water has moved past the grout. If you notice damp walls or ceiling stains, see our{" "}
            <Link className={inlineLink} href="/leaking-shower-repair">leaking shower repair</Link> page.
          </p>
        </Section>

        {/* ═══ 4. WHAT CAUSES GROUT TO FAIL ═══ */}
        <Section alt>
          <SecHead eyebrow="Why Grout Fails" title={<>What Causes Shower Grout to Fail in <span className="text-accent">Melbourne Homes?</span></>}>
            <p className={lead}>
              Grout is not decoration. It works with the waterproof membrane under your tiles to keep water where it belongs.
            </p>
          </SecHead>
          <div className="grid w-full gap-5 md:grid-cols-3">
            <div className={card}>
              <h3 className={cardTitle}>Melbourne’s Weather</h3>
              <p className={cardText}>
                Warm days and cold nights make tiles move slightly. Cement grout cannot flex with that movement for long. It cracks, and water gets in.
              </p>
            </div>
            <div className={card}>
              <h3 className={cardTitle}>Older Bathrooms</h3>
              <p className={cardText}>
                Many homes in suburbs like Malvern, Toorak and Camberwell have bathrooms that are decades old.
              </p>
            </div>
            <div className={card}>
              <h3 className={cardTitle}>Wet Area Standards</h3>
              <p className={cardText}>
                Some were built before Australian Standard AS 3740 tightened the rules for wet area waterproofing. In those showers, the grout and silicone do more of the work than they should.
              </p>
            </div>
          </div>
        </Section>

        {/* ═══ 5. EPOXY VS CEMENT ═══ */}
        <Section>
          <SecHead eyebrow="Choosing Grout" title={<>Epoxy Grout vs <span className="text-accent">Cement Grout</span></>}>
            <p className={lead}>Most showers use one of two grout types. The difference matters.</p>
          </SecHead>

          <div className="w-full min-w-0 max-w-[900px] rounded-2xl border border-[#e2e6f0] bg-white shadow-sm">
            <table className="w-full table-fixed text-left text-sm sm:text-base">
              <thead className="bg-[#eef1f8] text-[12px] font-bold uppercase tracking-wide text-neutral-500 sm:tracking-widest">
                <tr>
                  <th className="px-2 py-4 sm:px-6"><span className="sr-only">Feature</span></th>
                  <th className="px-2 py-4 sm:px-6">Cement grout</th>
                  <th className="px-2 py-4 sm:px-6">Epoxy grout</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, cement, epoxy]) => (
                  <tr key={label} className="border-t border-[#e2e6f0]">
                    <th scope="row" className="break-words px-2 py-4 font-bold text-neutral-900 sm:px-6">{label}</th>
                    <td className="break-words px-2 py-4 text-neutral-600 sm:px-6">{cement}</td>
                    <td className="break-words px-2 py-4 font-semibold text-primary sm:px-6">{epoxy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-[900px] space-y-4 text-center">
            <p className={lead}>Cement grout soaks up water, soap and dirt. Mould then grows in those pores, even when you clean often.</p>
            <p className={lead}>
              Epoxy grout is a resin. It does not absorb water. It costs more to install and takes more skill to apply, but it is made for constant moisture.{" "}
              <Link className={inlineLink} href="/epoxy-grout">Learn more on our epoxy grout page.</Link>
            </p>
          </div>

          <div className="grid w-full max-w-[900px] gap-5 md:grid-cols-2">
            <Callout title="Why a Rushed Cement Regrout Fails Again">
              Cement grout works well in dry spots. It was never built for daily water contact. A quick cement regrout in a shower often looks fine for a while, then cracks and discolours again.
            </Callout>
            <Callout title="Why Isn’t Epoxy Used More Often?">
              Epoxy is harder to apply and sets faster, so it needs more experience to finish cleanly. Some tradespeople stay with cement because it is quicker for them, not because it suits your shower.
            </Callout>
          </div>
        </Section>

        {/* ═══ 6. OLD OR ORIGINAL BATHROOM ═══ */}
        <Section alt>
          <SecHead eyebrow="Older Homes" title={<>Can You Regrout an <span className="text-accent">Old or Original Bathroom?</span></>} />
          <div className="grid w-full gap-5 md:grid-cols-3">
            <div className={`${card} border-t-4 border-t-primary`}>
              <h3 className={cardTitle}>Yes, in Most Cases</h3>
              <p className={cardText}>Age alone does not rule it out. The condition underneath matters.</p>
            </div>
            <div className={`${card} border-t-4 border-t-[#3b5bf0]`}>
              <h3 className={cardTitle}>Tiles Stay, Grout Goes</h3>
              <p className={cardText}>
                If your tiles are solid and the membrane has not failed, regrouting works on a bathroom from any decade. The tiles stay. Only the grout and silicone are replaced.
              </p>
            </div>
            <div className={`${card} border-t-4 border-t-[#FBBC04]`}>
              <h3 className={cardTitle}>We Check First</h3>
              <p className={cardText}>
                If the membrane has failed, regrouting will not fix that for long. We check before we quote.
              </p>
            </div>
          </div>
        </Section>

        {/* ═══ 7. REGROUT, RETILE OR REBUILD ═══ */}
        <Section>
          <SecHead eyebrow="Honest Advice" title={<>Regrout, Retile or <span className="text-accent">Rebuild?</span></>}>
            <p className={lead}>Not every shower needs the same fix. A good tradesperson tells you the truth, not the biggest job.</p>
          </SecHead>
          <div className="grid w-full gap-5 md:grid-cols-3">
            {fixOptions.map((o) => (
              <div key={o.pill} className={`${card} flex flex-col gap-2`}>
                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${o.pillClass}`}>
                  {o.pill}
                </span>
                <h3 className={cardTitle}>{o.title}</h3>
                <p className="text-base leading-relaxed text-neutral-600">{o.text}</p>
              </div>
            ))}
          </div>
          <Link href="/leaking-shower-repair" className={inlineLink}>
            Read about leaking shower repair →
          </Link>
        </Section>

        {/* ═══ 8. OUR REGROUTING PROCESS ═══ */}
        <section className="bg-[#eef1f8] px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-x-14">
            {/* intro */}
            <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Our Process</p>
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Our Regrouting <span className="text-accent">Process</span>
              </h2>
              <p className={lead}>
                Every job starts with understanding what’s actually happening, not a quick surface fix. The exact work can vary depending on the condition of your shower.
              </p>
            </div>

            {/* photo */}
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#e2e6f0] bg-neutral-100 lg:aspect-auto lg:h-full lg:min-h-[420px]">
                <Image src="/img42.jpeg" alt="Groutix technician regrouting a shower" fill className="object-cover" />
              </div>
            </div>

            {/* steps */}
            <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2">
              {processSteps.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-shrink-0 flex-col items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                      {i + 1}
                    </span>
                    {i < processSteps.length - 1 && (
                      <span className="mt-1 min-h-6 w-0.5 flex-1 bg-gradient-to-b from-[#FBBC04] to-[#FBBC04]/20" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-lg font-bold text-neutral-900">{step.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-neutral-600">{step.text}</p>
                  </div>
                </div>
              ))}
              <p className="border-l-2 border-[#FBBC04] pl-3 text-base font-semibold leading-relaxed text-neutral-600">
                Eligible complete shower regrouting work is backed by a 10-year waterproof warranty.
              </p>
              <Link href="/contact" className={`${btnPrimary} self-start`}>
                Book Your Free Quote
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 9. COST ═══ */}
        <Section>
          <SecHead eyebrow="Pricing" title={<>What Does Shower Regrouting Cost <span className="text-accent">in Melbourne?</span></>}>
            <p className={lead}>This is the question we get asked most.</p>
            <p className={lead}>
              A standard single shower regrout and reseal in Melbourne typically costs about $550 to $1,500. Simple jobs with little damage sit near the low end. Larger showers, mosaic tiles, heavy mould and epoxy grout sit near the high end. The final price depends on your shower, so we quote after we see it.
            </p>
          </SecHead>

          <div className="flex w-full max-w-[900px] flex-wrap items-center gap-6 rounded-[20px] bg-primary px-8 py-8 sm:px-10">
            <div className="min-w-0 flex-1 basis-full text-left sm:basis-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#FBBC04]">Typical Melbourne range</p>
              <p className="mt-1 text-3xl font-extrabold leading-tight text-white sm:text-4xl">$550 to $1,500</p>
              <p className="mt-2 text-base text-white/75">For a standard single shower. We quote after we see it.</p>
            </div>
            <Link href="/contact" className={btnGold}>
              Get a Free Quote
            </Link>
          </div>

          <h3 className="text-center text-xl font-bold text-neutral-900 lg:text-2xl">What Changes the Price</h3>
          <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((f) => (
              <div key={f.title} className={card}>
                <h4 className={cardTitle}>{f.title}</h4>
                <p className={cardText}>{f.text}</p>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[900px]">
            <Callout title="Regrouting vs a Full Bathroom Rebuild">
              Regrouting early is usually far cheaper than waiting for water damage. A failed membrane can turn a small job into a full shower rebuild, which can run into the thousands of dollars.
            </Callout>
          </div>
        </Section>

        {/* ═══ 10. WHAT'S INCLUDED ═══ */}
        <Section alt>
          <SecHead eyebrow="Included" title={<>What’s Included in <span className="text-accent">Every Groutix Regrout</span></>} />
          <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item} className={`${card} flex items-start gap-3`}>
                <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef1f8] text-primary">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-base font-bold leading-snug text-neutral-900">{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ 11. DIY ═══ */}
        <Section>
          <SecHead eyebrow="DIY" title={<>Is DIY Shower Regrouting <span className="text-accent">Worth It?</span></>}>
            <p className={lead}>DIY can work for a small job with no deeper damage. Most DIY jobs fail for the same reasons:</p>
          </SecHead>
          <div className="grid w-full gap-5 md:grid-cols-3">
            {diyMistakes.map((m) => (
              <div key={m.title} className={card}>
                <h3 className={cardTitle}>{m.title}</h3>
                <p className={cardText}>{m.text}</p>
              </div>
            ))}
          </div>
          <p className={`${lead} max-w-3xl text-center`}>
            If you see damage past the grout, such as a stain on a ceiling below, get a professional to check first. Regrouting over a hidden leak only hides it for a while.
          </p>
        </Section>

        {/* ═══ 12. BEFORE & AFTER ═══ */}
        <Section alt>
          <SecHead eyebrow="Real Work" title={<>Before and After: <span className="text-accent">Real Regrouting Results</span></>}>
            <p className={lead}>Real jobs completed across Melbourne homes, not stock photos.</p>
          </SecHead>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfterPhotos.map((photo, i) => (
              <figure key={photo.src}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#e2e6f0] bg-neutral-100">
                  <Image
                    src={photo.src}
                    alt={photo.caption || `Shower regrouting result ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Before
                  </span>
                  <span className="absolute right-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    After
                  </span>
                </div>
                {photo.caption && <figcaption className="mt-2 text-sm text-neutral-500">{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>

        {/* ═══ 13. CUSTOMER REVIEWS ═══ */}
        <Section>
          <SecHead eyebrow="Customer Feedback" title={<>What Our Customers <span className="text-accent">Say</span></>}>
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SecHead>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-[#FBBC04] text-[#FBBC04]" />
              ))}
            </div>
            <span className="font-bold text-neutral-900">Customer Reviews</span>
          </div>
          <div className="review-marquee-wrap w-full min-w-0 overflow-hidden">
            <div className="review-marquee flex w-max px-6 lg:px-10">
              {[...reviews, ...reviews].map((review, i) => (
                <ReviewCard key={`${review.name}-${i}`} review={review} className="mr-6 w-[85vw] shrink-0 sm:w-[360px]" />
              ))}
            </div>
          </div>
          <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
            Read More Verified Reviews on Google <span className="font-extrabold text-[#FBBC04]">→</span>
          </a>
          <div className="flex w-full flex-col items-center justify-between gap-6 rounded-xl border border-[#e2e6f0] bg-white p-8 text-center md:flex-row md:text-left">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Have a shower or grout problem that needs attention?</h3>
              <p className="mt-1 text-base text-neutral-600">Tell us what’s happening and we’ll help you understand the right next step.</p>
            </div>
            <Link href="/contact" className={`${btnPrimary} flex-shrink-0`}>
              Get a Quote
            </Link>
          </div>
        </Section>

        {/* ═══ 14. TEAM ═══ */}
        <Section alt>
          <SecHead eyebrow="The People Behind The Work" title={<>Meet the Groutix <span className="text-accent">Team</span></>}>
            <p className={lead}>
              The same small team handles your job from inspection through to the finished work. Here’s who you’ll actually deal with.
            </p>
          </SecHead>
          <div className="flex w-full flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#c9d1e6] bg-white p-9 text-center">
            <p className="text-sm text-neutral-500">Group photo of Johnny and the team</p>
            <p className="text-xs text-neutral-400">Add photo manually</p>
          </div>
          <div className="grid w-full max-w-3xl gap-5 md:grid-cols-2">
            {["Johnny", ""].map((name, i) => (
              <div key={i} className="flex min-h-[120px] items-center gap-5 rounded-xl border border-dashed border-[#c9d1e6] bg-white p-6 text-left">
                <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent bg-neutral-100">
                  <Users className="h-8 w-8 text-neutral-300" />
                </span>
                <h3 className="text-xl font-bold text-neutral-900">{name}</h3>
              </div>
            ))}
          </div>
          <Link href="/contact" className={btnPrimary}>
            Talk to Our Team
          </Link>
        </Section>

        {/* ═══ 15. LANDLORDS, AGENTS, PROPERTY MANAGERS ═══ */}
        <Section>
          <SecHead eyebrow="For Property Professionals" title={<>Landlords, Agents and <span className="text-accent">Property Managers</span></>}>
            <p className={lead}>
              Homeowners call us when a shower starts to fail. Landlords and property managers call us before a new tenant moves in. Agents call us before a sale, because buyers notice mouldy grout fast.
            </p>
          </SecHead>
          <div className="flex w-full flex-wrap items-center gap-5 rounded-[20px] bg-primary px-8 py-7">
            <span className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <Home className="h-6 w-6" />
            </span>
            <p className="min-w-0 flex-1 basis-full text-left text-lg font-bold leading-snug text-white sm:basis-0">
              Most jobs are completed in a single visit, scheduled around tenants.
            </p>
            <Link href="/real-estate-property-services" className={`${btnGold} flex-shrink-0`}>
              Discuss a Property Job
            </Link>
          </div>
        </Section>

        {/* ═══ 16. RELATED PROBLEMS ═══ */}
        <Section alt>
          <SecHead eyebrow="Related Services" title={<>Related <span className="text-accent">Problems</span></>} />
          <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProblems.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex flex-col rounded-2xl border border-[#e2e6f0] bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#FBBC04]/60 hover:shadow-lg"
              >
                <h3 className={cardTitle}>{r.label}</h3>
                <span className="mt-auto border-t border-[#e2e6f0] pt-4 text-sm font-bold text-primary group-hover:underline">
                  {r.link} →
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {/* ═══ 17. WHERE WE WORK ═══ */}
        <Section>
          <SecHead eyebrow="Service Areas" title={<>Which Melbourne Suburbs <span className="text-accent">Do We Regrout?</span></>}>
            <p className={lead}>
              We regrout showers across inner and bayside Melbourne, including South Yarra, Toorak, Malvern, Armadale, Prahran, Hawthorn, Camberwell, Brighton, St Kilda, Richmond, Albert Park, Windsor, Elwood and Port Melbourne. We also service Geelong, Ballarat, Frankston, Lilydale, Yarra Glen and Kilmore. Not sure about your suburb? Use the suburb checker or see our{" "}
              <Link className={inlineLink} href="/locations">locations page</Link>.
            </p>
          </SecHead>

          <div className="flex w-full max-w-[820px] flex-col gap-6">
            <div>
              <p className="mb-3 text-center text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-neutral-500">Inner &amp; Bayside Melbourne</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {innerSuburbs.map((s, i) => (
                  <span
                    key={s}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-[13.5px] ${
                      i === 0 ? "border-primary bg-primary font-bold text-white" : "border-[#e2e6f0] bg-white font-semibold text-neutral-800"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-center text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-neutral-500">Also Servicing</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {regionalSuburbs.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full border border-[#e2e6f0] bg-white px-4 py-2 text-[13.5px] font-semibold text-neutral-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <SuburbChecker />
        </Section>

        {/* ═══ 18. FAQ ═══ */}
        <Section alt>
          <SecHead title={<>Frequently Asked <span className="text-accent">Questions</span></>} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.plain })))) }}
          />
          <div className="flex w-full max-w-[760px] flex-col gap-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} question={f.q} answer={f.a} />
            ))}
          </div>
          <Link href="/contact" className={btnPrimary}>
            Still Have Questions? Get a Free Quote
          </Link>
        </Section>

        {/* ═══ 19. FINAL CTA ═══ */}
        <section className="relative overflow-hidden bg-primary px-6 py-16 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-black leading-tight text-white lg:text-[42px]">Get Your Free Quote Today</h2>
            <p className="text-base leading-relaxed text-white/90 sm:text-lg">
              Call <a href={tel} className="font-bold underline hover:text-accent">{phone}</a>, email{" "}
              <a href="mailto:info@groutix.com" className="font-bold underline hover:text-accent">info@groutix.com</a>, or request a quote online.
            </p>
            <p className="text-base text-white/70">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p>
            <p className="max-w-2xl text-base text-white/80">Honest advice and workmanship you can rely on.</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link href="/contact" className={btnGold}>
                Request A Quote
              </Link>
              <a href={tel} className={btnOutline}>
                <Phone className="h-4 w-4" /> {phone}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
