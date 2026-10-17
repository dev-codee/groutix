"use client";

// Shared building blocks for the redesigned (V2) pages, so the homepage and the
// service pages look the same. Only V2 pages import this file.

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import HeroContactBadges from "@/components/HeroContactBadges";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { BUSINESS, GOOGLE_REVIEW_COUNT_LABEL } from "@/lib/seo";
import type { BusinessRating, Review } from "@/lib/reviews";

/* ── Tokens (same values as HomePageV2) ── */
export const heroWrap = "mx-auto w-full max-w-[1248px] px-5";
export const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-20 xl:px-28";
export const eyebrow = "mb-2.5 text-[13px] font-bold uppercase tracking-[2px] text-[#2F63CC]";
export const h2 = "text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.15] tracking-[-0.01em] text-slate-900 [text-wrap:balance]";
export const lead = "mt-3 text-[17px] leading-relaxed text-slate-600";
export const box = "rounded-lg border border-slate-200 bg-white";
export const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-bold transition-colors";
export const btnNavy = `${btn} bg-[#001F97] text-white hover:bg-[#00167A]`;
export const btnGold = `${btn} bg-[#FBBC04] text-[#0F172A] hover:bg-[#E5AA00]`;
export const btnLine = `${btn} border border-slate-300 bg-white text-[#001F97] hover:border-[#001F97]`;
export const btnGhost = `${btn} border-[1.5px] border-white/70 text-white hover:bg-white/10`;
export const inlineLink = "font-bold text-[#2F63CC] underline hover:text-[#001F97]";
export const cardTitle = "text-lg font-bold text-slate-900";
export const cardText = "mt-2 text-base leading-relaxed text-slate-600";

/* ── Section shell ── */
export function Section({ id, alt = false, children, className = "" }: { id?: string; alt?: boolean; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-28 py-14 md:py-20 ${alt ? "bg-slate-100" : "bg-white"} ${className}`}>
      <div className={wrap}>{children}</div>
    </section>
  );
}

export function SectionHead({ k, title, children, left = false }: { k?: string; title: ReactNode; children?: ReactNode; left?: boolean }) {
  return (
    <div className={`mb-10 max-w-[800px] ${left ? "" : "mx-auto text-left md:text-center"}`}>
      {k && <p className={eyebrow}>{k}</p>}
      <h2 className={h2}>{title}</h2>
      {children}
    </div>
  );
}

export function Stars({ n = 5, className = "" }: { n?: number; className?: string }) {
  return <span className={`tracking-[1px] text-[#FBBC04] ${className}`} aria-label={`${n} out of 5 stars`}>{"★".repeat(Math.round(n))}</span>;
}

/* ── Hero with the step-by-step quote form ── */
export function ServiceHero({ title, children, rating, warrantyNote = "On every complete shower regrout", defaultService }: { title: ReactNode; children: ReactNode; rating?: BusinessRating; warrantyNote?: string; defaultService?: string }) {
  return (
    <section id="quote-form" className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(120deg,#06124F_0%,#0A1F7A_55%,#001F97_100%)] pb-12 pt-[140px] text-white lg:pb-[72px] lg:pt-[160px]">
      <div className={`${heroWrap} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_540px]`}>
        <div className="text-center lg:text-left">
          <p className="mb-4 text-[15px] font-bold tracking-[3px] text-[#FBBC04]">GROUTIX</p>
          <h1 className="mb-4 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.15] tracking-[-0.01em] [text-wrap:balance]">{title}</h1>
          <div className="mx-auto mb-6 max-w-[560px] text-[15px] lg:mx-0 leading-relaxed text-[#D6DCF5] sm:text-base">{children}</div>
          <div className="mb-7 flex flex-wrap justify-center gap-3 lg:justify-start [&>a[href^='tel:']]:hidden md:[&>a[href^='tel:']]:inline-flex">
            <HeroContactBadges rating={rating} />
          </div>
          <div className="grid grid-cols-1 items-center justify-items-center gap-5 border-t border-white/20 pt-6 lg:justify-items-start sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="flex items-center gap-3.5 text-left">
              <Image src="/groutix-official-warranty-seal.webp" alt="Groutix 10 Year Waterproof Warranty Guaranteed" width={96} height={92} priority className="h-[84px] w-[88px] shrink-0 object-contain" />
              <div>
                <b className="block text-lg font-black leading-tight">10-Year Waterproof Warranty</b>
                <span className="text-sm text-[#D6DCF5]">{warrantyNote}</span>
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
          <QuoteFormV2 defaultService={defaultService} />
        </div>
      </div>
    </section>
  );
}

/* ── Drag-to-compare photo (side-by-side before|after image) ── */
export function BeforeAfter({ src, title, alt }: { src: string; title: string; alt?: string }) {
  const name = alt || title;
  const [pos, setPos] = useState(100);
  const handle = Math.min(96, Math.max(4, pos));
  const half = (side: "before" | "after") => (
    <div className="absolute inset-y-0 w-[200%]" style={{ left: side === "before" ? "0" : "-100%" }}>
      <Image src={src} alt="" fill sizes="(min-width:768px) 50vw, 200vw" className="object-cover" />
    </div>
  );
  return (
    <figure className="m-0">
      <div className="relative aspect-square select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:aspect-[4/4.2]">
        <div className="absolute inset-0 overflow-hidden" role="img" aria-label={`${name}, before`}>{half("before")}</div>
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} role="img" aria-label={`${name}, after`}>{half("after")}</div>
        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/75 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-[#001F97]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">After</span>
        <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${handle}%` }} aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg font-black text-[#001F97] shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ left: `${handle}%` }} aria-hidden="true">↔</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Drag to compare before and after: ${name}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0" />
      </div>
      {title && <figcaption className="mt-3 font-bold text-slate-900">{title}</figcaption>}
    </figure>
  );
}

/* ── Google rating panel + auto-scrolling live reviews ── */
export function ReviewsMarquee({ reviews, rating }: { reviews: Review[]; rating?: BusinessRating }) {
  const { business } = useSiteContent();
  const value = rating?.value ?? business.rating.value;
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2.5 rounded-lg bg-[#001F97] p-7 text-white">
        <span className="flex items-center gap-2.5 font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Image src="/google-logo.svg" alt="" width={18} height={18} /></span>
          Google Rating
        </span>
        <span className="text-[60px] font-black leading-none">{value.toFixed(1)}</span>
        <Stars n={value} className="text-[22px]" />
        <span className="text-[15px] text-[#D6DCF5]">Based on {GOOGLE_REVIEW_COUNT_LABEL} Google reviews</span>
        <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={`${btnGold} mt-auto`}>Read Verified Reviews</a>
      </div>
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
  );
}

/* ── FAQ list (native details, works without JS) ── */
export function FaqList({ items, answerClassName = "" }: { items: { q: string; a: ReactNode }[]; answerClassName?: string }) {
  return (
    <div className="mx-auto grid max-w-[900px] gap-3">
      {items.map((f, i) => (
        <details key={f.q} open={i === 0} className={`${box} group`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[17px] font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="shrink-0 text-2xl font-normal text-[#2F63CC] group-open:hidden" aria-hidden="true">+</span>
            <span className="hidden shrink-0 text-2xl font-normal text-[#2F63CC] group-open:inline" aria-hidden="true">–</span>
          </summary>
          <div className={`max-w-[70ch] px-6 pb-5 text-slate-600 ${answerClassName}`}>{f.a}</div>
        </details>
      ))}
    </div>
  );
}

/* ── Simple suburb checker (live /api/suburb-check) ── */
export function SuburbCheck({ quoteHref = "/contact", title, text }: { quoteHref?: string; title?: string; text?: string }) {
  const { phone, tel } = useContact();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; suburb: string } | "error" | null>(null);
  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/suburb-check?q=${encodeURIComponent(v)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setRes({ ok: Boolean(d.available ?? d.inServiceArea), suburb: d.suburb || v });
    } catch {
      setRes("error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F4F6FB] p-6 sm:p-7">
      {title && <h3 className="text-xl font-bold text-slate-900">{title}</h3>}
      {text && <p className="mb-4 mt-1.5 text-base leading-relaxed text-slate-600">{text}</p>}
      <form onSubmit={check} noValidate>
        <label htmlFor="v2-suburb" className="mb-2.5 block text-[17px] font-medium text-slate-900">Check your suburb or postcode</label>
        <div className="flex gap-3">
          <input id="v2-suburb" value={q} onChange={(e) => { setQ(e.target.value); setRes(null); }} placeholder="e.g. Frankston or 3199" autoComplete="address-level2"
            className="h-14 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#2F63CC] focus:outline-none focus:ring-[3px] focus:ring-[#2F63CC]/15" />
          <button type="submit" disabled={busy} className="h-14 shrink-0 rounded-lg bg-[#001F97] px-7 text-[17px] font-bold text-white hover:bg-[#00167A] disabled:opacity-70">
            {busy ? "Checking…" : "Check"}
          </button>
        </div>
      </form>
      <div aria-live="polite" className="mt-3 min-h-6 text-[15px]">
        {res && res !== "error" && res.ok && (
          <p className="font-medium text-emerald-800">✓ Yes — we service {res.suburb}. <a href={quoteHref} className="text-[#001F97] underline">Get a quote →</a></p>
        )}
        {res && res !== "error" && !res.ok && (
          <p className="font-medium text-amber-800">{res.suburb} is outside our standard area. Please <a href={quoteHref} className="text-[#001F97] underline">contact us</a> or call <a href={tel} className="text-[#001F97] underline">{phone}</a> and we&apos;ll confirm if we can come to you.</p>
        )}
        {res === "error" && <p className="text-amber-800">We couldn&apos;t check that suburb right now. Please call <a href={tel} className="text-[#001F97] underline">{phone}</a> and we&apos;ll confirm it.</p>}
      </div>
    </div>
  );
}

/* ── Mobile Call / Quote bar (+ spacer so the footer isn't covered) ── */
export function MobileCallBar({ quoteHref = "#quote-form" }: { quoteHref?: string }) {
  const { tel } = useContact();
  return (
    <>
      <style>{`@media (max-width:767px){body:has(.v2-page) [data-support-chat-widget]{bottom:92px!important}}`}</style>
      <div className="h-[84px] md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2.5 border-t border-slate-200 bg-white px-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:hidden">
        <a href={tel} className={`${btn} min-h-[52px] bg-[#001F97] px-3 text-white`}><Phone className="h-4 w-4" aria-hidden="true" />Call Now</a>
        <a href={quoteHref} className={`${btn} min-h-[52px] bg-[#FBBC04] px-3 text-[#0F172A]`}>Free Quote</a>
      </div>
    </>
  );
}

/* ── Photo card (same style as the homepage "shower grout problems" cards) ──
   half: the photo is a before/after composite, so show only its left (before) half. */
export type PhotoCardData = { title: string; text?: string; img: string; alt: string; href: string; link: string; half?: boolean };

export function PhotoCard({ c, imgH = "h-[180px]", sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" }: { c: PhotoCardData; imgH?: string; sizes?: string }) {
  return (
    <Link href={c.href} className={`${box} group flex flex-col overflow-hidden text-slate-900 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
      <div className={`relative ${imgH} overflow-hidden bg-slate-200`}>
        {c.half ? (
          <div className="absolute inset-y-0 left-0 w-[200%]"><Image src={c.img} alt={c.alt} fill sizes={sizes} className="object-cover" /></div>
        ) : (
          <Image src={c.img} alt={c.alt} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={cardTitle}>{c.title}</h3>
        {c.text && <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{c.text}</p>}
        <span className="mt-auto pt-3 text-sm font-bold text-[#2F63CC] group-hover:underline">{c.link} →</span>
      </div>
    </Link>
  );
}

/* ── Final CTA box (same as the homepage final CTA) ── */
export function FinalCta({ title, lines, quoteHref = "#quote-form" }: { title: string; lines: ReactNode[]; quoteHref?: string }) {
  const { phone, tel } = useContact();
  return (
    <section className="bg-white py-14 md:py-20">
      <div className={wrap}>
        <div className="grid grid-cols-1 items-center gap-7 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
          <div>
            <h2 className={`${h2} text-white`}>{title}</h2>
            {lines.map((l, i) => <p key={i} className={`${i ? "mt-1" : "mt-3"} text-[#D6DCF5]`}>{l}</p>)}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={quoteHref} className={`${btnGold} min-h-[54px] w-full sm:w-auto`}>Request A Quote</a>
            <a href={tel} className={`${btnGhost} min-h-[54px] w-full sm:w-auto`}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
