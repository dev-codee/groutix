"use client";

// New homepage layout (Oct 2026 redesign). Only app/page.tsx renders this file.
// Shared pieces (Navbar, Footer, TrustedMarquee, HeroContactBadges) are reused unchanged, so every other page stays exactly as it was.
// The old layout is still in components/HomePage.tsx for a one-line rollback.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, Grid2x2, Hammer, Home as HomeIcon, Layers, Phone, Users, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustedMarquee from "@/components/TrustedMarquee";
import HeroContactBadges from "@/components/HeroContactBadges";
// Step-by-step quote form (same /api/quote data as the old HeroQuoteForm, which
// older pages still use). To roll back, import HeroQuoteForm here instead.
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { BUSINESS, faqJsonLd } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";
import { useGoogleRating } from "@/components/useGoogleRating";

/* Fill these in to show the pricing section and "Starting price" (hidden while empty). */
const PRICES: { label: string; from: string; note: string }[] = [
  // { label: "Shower regrout", from: "$000", note: "Standard cubicle" },
];

const CORE = [
  { slug: "shower-regrouting", title: "Shower Regrouting", tag: "Most booked", hot: true, img: "/shower-regrouting-tiled-interior.webp",
    alt: "Freshly regrouted shower interior with white subway tiles and a brown feature wall", desc: "Cracked or crumbling grout removed and rebuilt with waterproof epoxy, so your shower seals properly again." },
  { slug: "leaking-shower-repair", title: "Leaking Shower Repair", tag: "Leak repair", img: "/shower-regrouting-mouldy-grout-corner.webp",
    alt: "Black mould in shower grout and silicone next to a glass screen", desc: "We find where water is actually getting in, then repair the cause, usually without removing tiles." },
  { slug: "balcony-leak-repairs", title: "Balcony Leak Repairs", tag: "Outdoor", img: "/balcony-regrouting-tiles.webp",
    alt: "Balcony after leak repair and regrouting with large-format outdoor tiles", desc: "Failed grout and sealant rebuilt with weatherproof epoxy to stop water reaching the areas below." },
];
const MORE = [
  { slug: "tile-regrouting", title: "Tile Regrouting", desc: "Kitchens, laundries & floors", Icon: Grid2x2 },
  { slug: "silicone-recaulking", title: "Silicone & Recaulking", desc: "Mould-resistant reseal", Icon: Wrench },
  { slug: "epoxy-grout", title: "Epoxy Grout", desc: "Stain-resistant upgrade", Icon: Layers },
  { slug: "small-tiling-jobs", title: "Small Tiling Jobs", desc: "Cracked or loose tiles", Icon: Hammer },
];
const SYMPTOMS = [
  { title: "Cracked or crumbling grout", next: "Shower regrouting", href: "/shower-regrouting", img: "/tile-regrouting-cracked-grout-closeup.webp", alt: "Cracked and crumbling grout line between floor tiles, close-up" },
  { title: "Peeling or black silicone", next: "Recaulking", href: "/silicone-recaulking", img: "/shower-regrouting-over-bath-tiles.webp", alt: "Shower over a bath with stained grout lines and silicone edges" },
  { title: "Water outside the shower or a stain below", next: "Leak assessment", href: "/leaking-shower-repair", img: "/leaking-shower-water-damage-wall.webp", alt: "Water damage on a wall next to a bathroom" },
  { title: "Mould that keeps coming back", next: "Grout & silicone check", href: "/cracked-grout-or-a-leaking-shower", img: "/shower-regrouting-signs-black-mould.webp", alt: "Stained, mouldy grout in a shower corner" },
];
const BALCONY = [
  { title: "White chalky staining on tiles", next: "Balcony regrout", img: "/balcony-water-damage-regrouting-signs.webp", alt: "Signs of balcony water failure: staining, mould and lifting tiles" },
  { title: "Cracked or missing grout", next: "Balcony regrout", img: "/grey-shower-floor-envelope-cut-regrouting before.webp", alt: "Shower floor with cracked and missing grout around the drain, before regrouting" },
  { title: "Water stains on the ceiling below", next: "Balcony leak repair", img: "/water stains on the ceiling below.webp", alt: "Mould and water damage behind a missing bathroom tile" },
  { title: "Fixed with epoxy, no retiling", next: "How we repair balconies", img: "/balcony-regrouting-herringbone-tiles.webp", alt: "Balcony after epoxy regrouting and resealing" },
];
const JOBS = [
  { before: "/beige-shower-floor-regrouting-top-view before.webp", after: "/beige-shower-floor-regrouting-top-view after.webp", title: "Shower floor regrout" },
  { before: "/tiled-shower-floor-regrouting-wide before.webp", after: "/tiled-shower-floor-regrouting-wide after .webp", title: "Floor tile regrout" },
  { before: "/grey-shower-base-regrouting-overhead-view before .webp", after: "/grey-shower-floor-regrouting-top-view after.webp", title: "Shower base regrout" },
];
const STEPS = [
  { no: "01", k: "CALL", title: "Send Photos or Call", desc: "Tell us what's happening. You get honest advice, even if a full regrout isn't needed." },
  { no: "02", k: "VISIT", title: "We Assess & Repair", desc: "Old grout and silicone removed, joints prepared and sealed again, usually in one visit." },
  { no: "03", k: "PROTECTED", title: "Your Warranty Starts", desc: "Complete shower regrouts are covered by our 10-year waterproof warranty from day one." },
];
const COMPARE = [
  ["Fixes the leak without retiling", "✓ In most cases", "Often quotes a retile", "Surface only"],
  ["Time to finish", "Usually 1 visit", "Varies by job", "Weekend + cure time"],
  ["Warranty on the grout", "10-year waterproof", "Varies", "None"],
  ["Focus", "Grout, silicone & wet areas only", "Whole renovations", "One-off product"],
];
const FAQS = [
  { q: "Will You Need to Remove My Tiles to Regrout a Shower?", a: "No, in most cases. Standard regrouting works around your existing tiles, so there's no full tear out." },
  { q: "How Do I Know If I Need Regrouting or Recaulking?", a: "Cracked, crumbling grout usually means regrouting. Peeling or soft silicone around corners usually means recaulking. Many Melbourne bathrooms need both, and catching it early saves money." },
  { q: "How Do I Fix Shower Grout Mould?", a: "Cleaning only masks it for a while. If mould keeps coming back in the same spot, the grout underneath has usually failed and needs replacing, not just scrubbing." },
  { q: "How Long Does Shower Regrouting Last?", a: "Done properly, it holds up for years of daily use. That's why we back every complete shower regrout with a 10-year waterproof warranty." },
  { q: "Do I Have to Stop Using My Shower Afterward?", a: "Yes, for a short period while the grout and silicone cure. We'll tell you exactly how long before we start." },
  { q: "Can You Repair a Shower While Tenants Are Living There?", a: "Yes. Most jobs are completed in a single visit with minimal disruption, which works well for occupied rentals, agents and strata managers. We work around your timelines." },
  { q: "Do You Work on Showers, Kitchens, and Balconies?", a: "Yes. We handle grout and silicone repairs across bathrooms, kitchens, laundries and balconies." },
  { q: "Which Suburbs and Regions Do You Service Across Victoria?", a: "Melbourne and surrounding suburbs, plus regional Victoria. Use the suburb checker above or contact us to confirm your area." },
];

const heroWrap = "mx-auto w-full max-w-[1248px] px-5";
const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-20 xl:px-28";
const eyebrow = "mb-2.5 text-[13px] font-bold uppercase tracking-[2px] text-[#2F63CC]";
const h2 = "text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.15] tracking-[-0.01em] text-slate-900 [text-wrap:balance]";
const lead = "mt-3 text-[17px] leading-relaxed text-slate-600";
const box = "rounded-lg border border-slate-200 bg-white";
const btn = "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 text-base font-bold transition-colors";

/* Drag-to-compare slider. Each job has a separate before and after photo;
   dragging reveals the after photo over the before photo. */
function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  // Starts with the full "before" photo; dragging left reveals the "after".
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const layer = (src: string) => (
    <div className="absolute inset-0">
      <Image src={src} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
    </div>
  );
  return (
    <figure className="m-0">
      <div className="relative aspect-square select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:aspect-[4/4.2]">
        <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${title}, before`}>{layer(before)}</div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${title}, after`}>{layer(after)}</div>
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
        <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${handle}%` }} aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-black text-[#001F97] shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ left: `${handle}%` }} aria-hidden="true">↔</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Drag to compare before and after: ${title}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>
      <figcaption className="mt-3 font-bold text-slate-900">{title}</figcaption>
    </figure>
  );
}

function SectionHead({ k, title, sub }: { k: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-[760px] text-left md:text-center">
      <p className={eyebrow}>{k}</p>
      <h2 className={h2}>{title}</h2>
      {sub && <p className={lead}>{sub}</p>}
    </div>
  );
}

function Stars({ n = 5, className = "" }: { n?: number; className?: string }) {
  return <span className={`tracking-[1px] text-[#FBBC04] ${className}`} aria-label={`${n} out of 5 stars`}>{"★".repeat(Math.round(n))}</span>;
}

export default function HomePageV2({ reviews, rating }: { reviews: Review[]; rating: BusinessRating }) {
  const gr = useGoogleRating();
  const { business } = useSiteContent();
  const { phone, tel } = useContact();

  return (
    <>
      <Navbar />
      <main className="public-page home-v2">
        {/* Lift the floating support chat above the mobile call bar (homepage only) */}
        <style>{`@media (max-width:767px){body:has(.home-v2) [data-support-chat-widget]{bottom:92px!important}}`}</style>

        {/* ── HERO + QUOTE FORM ── */}
        <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(120deg,#06124F_0%,#0A1F7A_55%,#001F97_100%)] pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
          <Image src="/Shower regrouting cover .webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#06124F_0%,#0A1F7A_55%,#001F97_100%)] opacity-90" />
          <div className={`${heroWrap} relative grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#FBBC04] sm:text-[13px] sm:tracking-[1.5px]">Groutix · Melbourne Wet-Area Specialists</p>
              <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">
                #1 Shower Regrouting &amp; Leak Repairs in Melbourne
              </h1>
              <p className="mx-auto mb-6 max-w-[560px] text-[15px] lg:mx-0 leading-relaxed text-[#D6DCF5] sm:text-base">
                We remove failed grout and rebuild it with waterproof epoxy, so your shower or balcony stops leaking. Most jobs are finished in a single visit.
              </p>
              <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
                <HeroContactBadges rating={rating} />
              </div>
              <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 lg:justify-items-start sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="flex items-center gap-3.5 text-left">
                  <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
                  <div>
                    <b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b>
                    <span className="text-sm text-[#D6DCF5]">On every complete shower regrout</span>
                  </div>
                </div>
                <div className="sm:border-l sm:border-white/25 sm:pl-6">
                  <b className="block text-[28px] font-black leading-none">8,000+</b>
                  <b className="block text-base font-bold">Bathrooms Restored</b>
                  <span className="text-sm text-[#D6DCF5]">Across Melbourne &amp; regional Victoria</span>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[560px] lg:max-w-none lg:self-start">
              <QuoteFormV2 />
            </div>
          </div>
        </section>

        {/* ── TRUSTED (unchanged component) ── */}
        <TrustedMarquee />

        {/* ── AT A GLANCE ── */}
        <section className="bg-slate-100 py-14">
          <div className={wrap}>
            <div className={`${box} grid grid-cols-1 items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10`}>
              <div>
                <p className={eyebrow}>Groutix at a glance</p>
                <h2 className="mb-3 text-[26px] font-bold text-slate-900">What Does Groutix Do?</h2>
                <p className="max-w-[62ch] leading-[1.7] text-slate-600">
                  Groutix is a Melbourne wet-area specialist that repairs failed grout and silicone in showers, bathrooms and balconies. We regrout with waterproof epoxy instead of retiling, finish most jobs in one visit, and back complete shower regrouts with a 10-year waterproof warranty.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  ["Service area", "Melbourne + regional VIC"],
                  ["Warranty", "10-year waterproof"],
                  ["Typical job", "Single visit"],
                  ["Google rating", `${rating.value.toFixed(1)} from ${gr.countLabel} reviews`],
                  ...(PRICES[0] ? [["Starting price", `From ${PRICES[0].from}`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="border-l-[3px] border-[#001F97] pl-3.5">
                    <dt className="text-[13px] text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{v}</dd>
                  </div>
                ))}
                {/* Hours get their own full-width row, one line per day */}
                <div className="col-span-2 border-l-[3px] border-[#001F97] pl-3.5">
                  <dt className="text-[13px] text-slate-500">Hours</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">
                    {business.hours.split("|").map((line) => (
                      <span key={line} className="block">{line.trim()}</span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="What we do" title="Shower, Balcony & Grout Repair Services" sub="Fix the cause of the leak, not the whole bathroom." />
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {CORE.map((s) => (
                <Link key={s.slug} id={s.slug === "balcony-leak-repairs" ? "balcony-service" : undefined} href={`/${s.slug}`} className={`${box} group flex flex-col overflow-hidden text-slate-900`}>
                  <div className="relative h-[375px]">
                    <Image src={s.img} alt={s.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 p-6">
                    <span className={`self-start rounded px-2 py-1 text-xs font-bold ${s.hot ? "bg-[#FFF4D1] text-[#7A5600]" : "bg-[#EEF3FF] text-[#001F97]"}`}>{s.tag}</span>
                    <h3 className="text-[22px] font-bold text-slate-900">{s.title}</h3>
                    <p className="text-[15px] text-slate-600">{s.desc}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3.5">
                      <span className="text-[15px] font-bold text-[#2F63CC] group-hover:underline">Learn more →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MORE.map(({ slug, title, desc, Icon }) => (
                <Link key={slug} href={`/${slug}`} className={`${box} group flex items-start gap-4 p-5 text-slate-900 transition hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span>
                    <b className="block text-[17px]">{title}</b>
                    <span className="block text-sm text-slate-600">{desc}</span>
                    <span className="mt-2 block text-sm font-bold text-[#2F63CC] group-hover:underline">Learn more →</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── SYMPTOMS ── */}
        <section id="shower-grout-problems" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="Shower grout problems" title="What Are You Seeing in Your Shower?" sub="Pick the closest sign and we'll point you to the right repair." />
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:gap-6">
              {SYMPTOMS.map((s) => (
                <Link key={s.title} href={s.href} className={`${box} group flex flex-col overflow-hidden text-slate-900 transition hover:-translate-y-0.5 hover:border-[#2F63CC]`}>
                  <div className="relative h-[263px]"><Image src={s.img} alt={s.alt} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                  <div className="p-5">
                    <b className="block text-[17px] leading-snug">{s.title}</b>
                    <span className="mt-2 block text-sm font-bold text-[#2F63CC]">Likely: {s.next} →</span>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-center text-sm text-slate-500">General guidance, not a diagnosis. An inspection confirms the cause.</p>
          </div>
        </section>

        {/* ── BALCONY ── */}
        <section id="balcony" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="Balcony specialists" title="Balcony Regrouting & Leak Repairs in Melbourne"
              sub="Melbourne's rain and temperature swings crack balcony grout, and water then seeps through to the slab and the ceiling below. We regrout with waterproof epoxy and reseal the edges, with no retiling." />
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:gap-6">
              {BALCONY.map((b) => (
                <Link key={b.title} href="/balcony-leak-repairs" className={`${box} group flex flex-col overflow-hidden text-slate-900 transition hover:-translate-y-0.5 hover:border-[#2F63CC]`}>
                  <div className="relative h-[263px]"><Image src={b.img} alt={b.alt} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                  <div className="p-5">
                    <b className="block text-[17px] leading-snug">{b.title}</b>
                    <span className="mt-2 block text-sm font-bold text-[#2F63CC]">{b.next} →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/balcony-leak-repairs" className="font-bold text-[#2F63CC] hover:underline">Read more about balcony leak repairs in Melbourne →</Link>
            </div>
          </div>
        </section>

        {/* ── REAL JOBS ── */}
        <section id="before-after" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={eyebrow}>Real work</p>
                <h2 className={h2}>Before and After: Real Regrouting Results</h2>
                <p className={lead}>Real jobs completed across Melbourne homes, not stock photos. Drag the slider to see the after.</p>
              </div>
              <Link href="/shower-regrouting" className={`${btn} border border-slate-300 bg-white text-[#001F97] hover:border-[#001F97]`}>See more jobs</Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {JOBS.map((j) => <BeforeAfter key={j.title} before={j.before} after={j.after} title={j.title} />)}
            </div>
          </div>
        </section>

        {/* ── REVIEWS (live Google reviews from lib/reviews) ── */}
        <section id="reviews" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="Customer feedback" title="What Our Customers Say" />
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="flex flex-col gap-2.5 rounded-lg bg-[#001F97] p-7 text-white">
                <span className="flex items-center gap-2.5 font-medium">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Image src="/google-logo.svg" alt="" width={18} height={18} /></span>
                  Google Rating
                </span>
                <span className="text-[60px] font-black leading-none">{rating.value.toFixed(1)}</span>
                <Stars n={rating.value} className="text-[22px]" />
                <span className="text-[15px] text-[#D6DCF5]">Based on {gr.countLabel} Google reviews</span>
                <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={`${btn} mt-auto bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00]`}>Read Verified Reviews</a>
              </div>
              {/* Auto-scrolling review line: uses the site's existing .review-marquee styles (pauses on hover, swipeable on phones) */}
              <div className="review-marquee-wrap min-w-0 overflow-hidden rounded-lg [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
                <div className="review-marquee flex w-max py-1" style={{ ["--marquee-duration" as string]: `${Math.max(30, reviews.length * 8)}s` }}>
                  {[...reviews, ...reviews].map((r, i) => (
                    <blockquote key={`${r.name}-${i}`} aria-hidden={i >= reviews.length || undefined}
                      className={`${box} m-0 mr-5 flex w-[82vw] shrink-0 flex-col gap-3.5 p-6 sm:w-[340px]`}>
                      <div className="flex items-center gap-3">
                        {r.photoUri ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.photoUri} alt="" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF3FF] font-bold text-[#001F97]">{r.name.charAt(0).toUpperCase()}</span>
                        )}
                        <span className="min-w-0">
                          <b className="block truncate text-slate-900">{r.name}</b>
                          <span className="text-[13px] text-slate-500">{r.suburb}</span>
                        </span>
                        <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="ml-auto shrink-0" />
                      </div>
                      <Stars n={r.stars} />
                      <p className="line-clamp-6 text-[15px] leading-[1.65] text-slate-700">&ldquo;{r.review}&rdquo;</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROCESS + WARRANTY ── */}
        <section id="how-it-works" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="How it works" title="Quote to Warranty in 3 Simple Steps" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.05fr)]">
              {STEPS.map((s) => (
                <div key={s.no} className={`${box} p-7`}>
                  <div className="text-[40px] font-black leading-none text-[#2F63CC]">{s.no}</div>
                  <div className="mb-1.5 mt-2.5 text-xs font-bold tracking-[2px] text-slate-500">{s.k}</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-slate-600">{s.desc}</p>
                </div>
              ))}
              <div id="warranty" className="flex flex-col items-center gap-2.5 rounded-lg bg-[#001F97] p-6 text-center text-white">
                <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={140} height={135} className="h-[135px] w-[140px] object-contain" />
                <b className="text-xl font-black">10 Year Waterproof Warranty</b>
                <p className="text-sm text-[#D6DCF5]">If a covered leak comes back, we fix it.</p>
                <Link href="/terms-conditions" className="text-sm font-bold text-[#FBBC04] hover:underline">See warranty terms →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY A SPECIALIST ── */}
        <section id="why-groutix" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="Why Groutix" title="Why Choose a Grout Specialist Instead of a General Tradesperson?"
              sub="We focus only on grout, silicone and wet-area waterproofing, so we fix the cause and not just the surface." />
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="px-5 py-4 font-medium text-slate-500"><span className="sr-only">Comparison</span></th>
                    <th scope="col" className="bg-[#001F97] px-5 py-4 font-bold text-white">Groutix specialist</th>
                    <th scope="col" className="px-5 py-4 font-bold text-slate-900">General renovator</th>
                    <th scope="col" className="px-5 py-4 font-bold text-slate-900">DIY kit</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([row, us, reno, diy]) => (
                    <tr key={row} className="border-t border-slate-200">
                      <th scope="row" className="px-5 py-4 text-left font-bold text-slate-900">{row}</th>
                      <td className="bg-[#EEF3FF] px-5 py-4 font-bold text-[#001F97]">{us}</td>
                      <td className="px-5 py-4 text-slate-600">{reno}</td>
                      <td className="px-5 py-4 text-slate-600">{diy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-7 text-center">
              <a href="#quote-form" className={`${btn} bg-[#001F97] text-white hover:bg-[#00167A]`}>Talk to a Melbourne Grout Specialist</a>
            </div>
          </div>
        </section>

        {/* ── PROPERTY MANAGERS ── */}
        <section id="property-services" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-2`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For property professionals</p>
              <h2 className={`${h2} text-white`}>Real Estate &amp; Property Services</h2>
              <p className="mb-6 mt-3.5 text-[17px] text-[#D6DCF5]">
                Wet-area repairs for landlords, agents and strata managers across Melbourne, scheduled around tenants.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#quote-form" className={`${btn} bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00]`}>Discuss a Property Job</a>
                <Link href="/real-estate-property-services" className={`${btn} border-[1.5px] border-white/70 text-white hover:bg-white/10`}>Property services →</Link>
              </div>
            </div>
            <ul className="grid gap-3.5">
              {[
                { Icon: Users, t: "Scheduled Around Tenants", d: "Most jobs completed in a single visit with minimal disruption." },
                { Icon: ClipboardCheck, t: "Clear Assessments for Owners", d: "Plain-English findings you can pass straight on." },
                { Icon: HomeIcon, t: "One Specialist for Every Wet Area", d: "Showers, laundries, kitchens and balconies." },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex gap-3.5 rounded-lg border border-white/20 bg-white/[0.08] px-5 py-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#FBBC04]" aria-hidden="true" />
                  <span><b className="block text-[17px]">{t}</b><span className="text-sm text-[#D6DCF5]">{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── PRICING (shows once PRICES is filled in) ── */}
        {PRICES.length > 0 && (
          <section id="pricing" className="scroll-mt-28 bg-white py-14 md:py-20">
            <div className={wrap}>
              <SectionHead k="Upfront pricing" title="How Much Does Shower Regrouting Cost in Melbourne?" sub="Typical starting prices. Your exact quote depends on size, grout condition and access." />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {PRICES.map((p) => (
                  <div key={p.label} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                    <div className="font-medium text-slate-600">{p.label}</div>
                    <div className="my-2 text-[30px] font-black tabular-nums text-slate-900">From {p.from}</div>
                    <span className="text-sm text-slate-500">{p.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SERVICE AREAS (live suburb check) ── */}
        <section id="service-areas" className="scroll-mt-28 bg-white py-14 md:py-20">
          <div className={wrap}>
            <h2 className="mb-8 text-[clamp(26px,3vw,42px)] font-bold leading-tight tracking-[-0.01em] text-slate-900 lg:whitespace-nowrap">
              Areas We Service Across Melbourne &amp; Victoria
            </h2>
            <HomeAreasV2 />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={wrap}>
            <SectionHead k="FAQs" title="Frequently Asked Questions" />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
            <div className="mx-auto grid max-w-[900px] gap-3">
              {FAQS.map((f, i) => (
                <details key={f.q} open={i === 0} className={`${box} group`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[17px] font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="shrink-0 text-2xl font-normal text-[#2F63CC] group-open:hidden" aria-hidden="true">+</span>
                    <span className="hidden shrink-0 text-2xl font-normal text-[#2F63CC] group-open:inline" aria-hidden="true">–</span>
                  </summary>
                  <p className="max-w-[70ch] px-6 pb-5 text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/faq" className="font-bold text-[#2F63CC] hover:underline">More questions →</Link>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="bg-white pb-14 md:pb-20">
          <div className={wrap}>
            <div className="grid grid-cols-1 items-center gap-7 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
              <div>
                <h2 className={`${h2} text-white`}>Stop the Leak Before It Becomes a Renovation</h2>
                <p className="mt-3 text-[#D6DCF5]">Free quote · Most jobs in one visit · 10-year waterproof warranty</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#quote-form" className={`${btn} min-h-[54px] w-full bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00] sm:w-auto`}>Request A Quote</a>
                <a href={tel} className={`${btn} min-h-[54px] w-full border-[1.5px] border-white/70 text-white hover:bg-white/10 sm:w-auto`}>
                  <Phone className="h-4 w-4" aria-hidden="true" />{phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* ── MOBILE CALL BAR ── */}
      <div className="h-[84px] md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2.5 border-t border-slate-200 bg-white px-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:hidden">
        <a href={tel} className={`${btn} min-h-[52px] bg-[#001F97] px-3 text-white`}><Phone className="h-4 w-4" aria-hidden="true" />Call Now</a>
        <a href="#quote-form" className={`${btn} min-h-[52px] bg-[#FBBC04] px-3 text-[#0F172A]`}>Free Quote</a>
      </div>
    </>
  );
}

