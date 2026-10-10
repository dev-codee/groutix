"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Check,
  Droplets,
  ShieldCheck,
  MapPin,
  Star,
  Grid2x2,
  ShowerHead,
  Building2,
  Layers,
  Home,
  AlertTriangle,
  ChevronDown,
  Search,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ServiceBreadcrumb from "@/components/ServiceBreadcrumb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import ReviewCard from "@/components/ReviewCard";
import { useContact } from "@/components/SiteContentProvider";
import { faqJsonLd } from "@/lib/seo";
import type { Review, BusinessRating } from "@/lib/reviews";
import ServiceSuburbChecker from "@/components/ServiceSuburbChecker";

/* Used only for the BreadcrumbList / Service JSON-LD. Change if the live domain differs. */
const SITE_URL = "https://groutix.com";

/* ─── Image placeholder (same ImgBox as the homepage) ─── */
function ImgBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
  showBeforeAfterBadges = false,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
  showBeforeAfterBadges?: boolean;
}) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-[#F5A623] transition-all duration-300`}
      style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] z-10 pointer-events-none" />

      {showBeforeAfterBadges && (
        <>
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-white/10">
              Before
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
            <span className="bg-[#001F97]/90 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-white/20">
              After
            </span>
          </div>
        </>
      )}

      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative z-10 flex h-full items-center justify-center text-center px-4">
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
              <p className="text-[12px] text-neutral-300">Add photo manually</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section heading block (eyebrow + H2 + optional intro), homepage sizes ─── */
function SectionHead({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      {eyebrow && <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">{eyebrow}</p>}
      <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">{title}</h2>
      {intro && <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">{intro}</p>}
    </div>
  );
}

const CTA_BTN =
  "inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95";

const inlineLink = "text-accent font-bold hover:underline";

/* ─── Content (from the Groutix Epoxy Grout content doc) ─── */
const WHAT_IS = [
  { Icon: Layers, title: "Resin, Not Cement", desc: "Epoxy grout is a two part resin grout, not a cement one." },
  { Icon: Droplets, title: "Does Not Absorb Water", desc: "Once it sets, it does not soak up water." },
  {
    Icon: ShieldCheck,
    title: "Resists Stains and Mould",
    desc: "There is nothing inside the joint for mould to grow in.",
  },
];

const BENEFITS = [
  "Stain resistant.",
  "Non porous.",
  "Handles grease and cleaning products better.",
  "Colour stays even.",
];

const TRADE_OFFS = [
  "Costs more upfront than cement.",
  "Sets quickly, so it needs skilled application.",
  "Not right for every outdoor or stone surface. We check first.",
];

const WORKS_BEST: { Icon: React.ComponentType<{ className?: string }>; title: string; link?: string }[] = [
  { Icon: ShowerHead, title: "Showers and bathrooms", link: "/shower-regrouting" },
  { Icon: Grid2x2, title: "Kitchens and splashbacks" },
  { Icon: Droplets, title: "Laundries" },
  { Icon: Layers, title: "Busy floors" },
  { Icon: Building2, title: "Commercial kitchens and food areas" },
  { Icon: Home, title: "Rentals and property managers" },
];

const COLOURS = ["Match the Existing", "Refresh with a New Colour", "Choose a Contrast"];

const MYTHS = [
  { myth: "Epoxy replaces waterproofing.", truth: "It does not. It seals the joint. It is not a membrane." },
  { myth: "It never needs cleaning.", truth: "Dirt can still sit on the surface. A gentle clean keeps it fresh." },
  { myth: "You can put it over old grout.", truth: "No. The old grout is removed first." },
  { myth: "All epoxy jobs are the same.", truth: "It sets fast, so the result depends on who applies it." },
];

const PROCESS = [
  { title: "Inspect and Match", desc: "Check the joints, tiles and colour." },
  { title: "Remove the Old Grout", desc: "All old grout is taken out, not covered." },
  {
    title: "Apply the Epoxy",
    desc: "Small batches, applied and cleaned off the same day, before it sets.",
  },
  {
    title: "Cure and Recheck",
    desc: "The epoxy cures before water. We tell you the exact wait before we start.",
  },
];

const CARE = ["Wait for the cure.", "Use gentle cleaners.", "Wipe dirt off the surface early."];

const COST_FACTORS = ["Area", "Tile size and joint width", "Colour and product", "Condition of the old grout"];

const WHY: { Icon: React.ComponentType<{ className?: string }>; title: string; desc?: string }[] = [
  { Icon: Search, title: "Honest Advice", desc: "Including where epoxy is not right." },
  { Icon: Layers, title: "Full Removal" },
  { Icon: ClipboardCheck, title: "Colour Matched" },
  { Icon: ShieldCheck, title: "10 Year Warranty", desc: "On eligible work." },
];

const BEFORE_AFTER = ["Shower", "Kitchen splashback", "Laundry floor", "Colour change"];

const RELATED = [
  { title: "Shower Regrouting", href: "/shower-regrouting" },
  { title: "Tile Regrouting", href: "/tile-regrouting" },
  { title: "Silicone and Recaulking", href: "/silicone-recaulking" },
  { title: "Balcony Leak Repairs", href: "/balcony-leak-repairs" },
];

const MELBOURNE_METRO = [
  "South Melbourne", "Richmond", "Carlton", "Fitzroy", "Brunswick",
  "St Kilda", "Prahran", "Toorak", "Hawthorn", "Camberwell",
  "Box Hill", "Glen Waverley", "Dandenong", "Cranbourne", "Frankston", "Mornington",
];
const ALSO_SERVICING = ["Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"];

/* `link` is only used to render an in-text link on the page. The `a` string stays plain text for the FAQPage schema. */
const EPOXY_FAQS: { q: string; a: string; link?: { text: string; href: string } }[] = [
  { q: "What is epoxy grout?", a: "A two part resin grout. Once set, it does not absorb water." },
  {
    q: "Is epoxy grout better than cement grout?",
    a: "In wet areas, usually, because it does not absorb water or stain easily. It costs more and needs skilled application. See shower regrouting for the shower detail.",
    link: { text: "shower regrouting", href: "/shower-regrouting" },
  },
  { q: "Can you put epoxy over my existing grout?", a: "No. The old grout is removed first so the epoxy bonds." },
  {
    q: "Does epoxy grout need sealing?",
    a: "Not like cement grout does. We tell you how to care for it.",
  },
  {
    q: "Will epoxy grout still get dirty?",
    a: "Dirt can sit on the surface, but it scrubs off. Mould has nothing to grow in inside the joint.",
  },
  {
    q: "What colours does epoxy grout come in?",
    a: "Many. We can match your current colour or change it.",
  },
  {
    q: "Can epoxy grout be used outdoors?",
    a: "Sometimes. Direct sun can affect how epoxy sets, so we check first. For balconies, see balcony leak repairs.",
    link: { text: "balcony leak repairs", href: "/balcony-leak-repairs" },
  },
  {
    q: "How long does epoxy grout last?",
    a: "Done properly, it holds up well in wet areas. Eligible completed work is backed by our 10 year waterproof warranty.",
  },
  {
    q: "How long before I can use the area?",
    a: "It depends on the product. We tell you the exact wait before we start.",
  },
  {
    q: "How much does epoxy grout cost in Melbourne?",
    a: "It depends on the area, tile size, colour and condition. We quote after we see it.",
  },
];

/* Renders an FAQ answer, turning the optional phrase into an internal link. */
function FaqAnswer({ a, link }: { a: string; link?: { text: string; href: string } }) {
  if (!link || !a.includes(link.text)) return <>{a}</>;
  const [before, ...rest] = a.split(link.text);
  return (
    <>
      {before}
      <Link href={link.href} className={inlineLink}>
        {link.text}
      </Link>
      {rest.join(link.text)}
    </>
  );
}

/* ─── FAQ accordion item (same as the homepage's DiagnosticFaqItem) ─── */
function FaqItem({ q, a, link }: { q: string; a: string; link?: { text: string; href: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-neutral-200 bg-white cursor-pointer list-none rounded-sm"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="font-semibold text-neutral-900 text-base leading-snug">{q}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180 text-[#2F63CC]" : "text-neutral-400"}`}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p
              className="px-5 pb-4 text-base text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <FaqAnswer a={a} link={link} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* ─── Small stars row ─── */
function Stars({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${className} text-[#FBBC04] fill-[#FBBC04]`} />
      ))}
    </div>
  );
}

export default function EpoxyGroutPage({
  reviews = [],
  rating,
}: {
  reviews?: Review[];
  rating?: BusinessRating;
}) {
  const { tel, mailto } = useContact();
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const reviewCount = rating?.count ?? 290;

  /* Reviews 2 and 3: real reviews that mention epoxy (never invented). Review 1 (Kirat Singh) is fixed. */
  const epoxyReviews = reviews
    .filter((r) => {
      const s = JSON.stringify(r).toLowerCase();
      return s.includes("epoxy") && !s.includes("kirat");
    })
    .slice(0, 2);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Epoxy grouting",
    name: "Epoxy Grout Melbourne",
    areaServed: { "@type": "City", name: "Melbourne" },
    provider: { "@type": "LocalBusiness", name: "Groutix", url: SITE_URL },
    url: `${SITE_URL}/epoxy-grout`,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Epoxy Grout", item: `${SITE_URL}/epoxy-grout` },
    ],
  };

  return (
    <>
      <Navbar />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(EPOXY_FAQS)) }} />

        {/* ══════════════ SECTION 1, HERO (copy left, quote form right) ══════════════ */}
        <section className="relative overflow-hidden pt-[110px] lg:pt-[125px]" id="quote-form">
          <div className="absolute inset-0">
            <Image src="/img101.jpeg" alt="Epoxy grout hero background" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 flex flex-col">
            <div className="mx-auto flex w-full max-w-[1460px] flex-1 items-start justify-center px-6 py-6 pb-16 lg:px-10 lg:py-8 lg:pb-20">
              <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_540px] lg:gap-12">
                <div className="space-y-4 text-white lg:pt-2 text-center lg:text-left flex flex-col items-center lg:items-start">
                  <ServiceBreadcrumb service="Epoxy Grout" />
                  <p className="text-[13px] font-bold text-[#FBBC04] uppercase tracking-[0.2em]">Groutix</p>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                    className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)] text-center lg:text-left mx-auto lg:mx-0"
                  >
                    Epoxy Grout Melbourne
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg text-center lg:text-left mx-auto lg:mx-0"
                  >
                    Groutix removes old cement grout and replaces it with epoxy grout. It is a resin grout that does
                    not absorb water and resists stains and mould. We tell you honestly where epoxy is the right
                    choice and where it is not.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
                    className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1 w-full"
                  >
                    <a
                      href="https://www.google.com/maps/place/Groutix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-16 items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm px-5 py-3 hover:bg-white/20 transition-colors"
                    >
                      <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.18 3.665-9.15z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.14C3.25 21.32 7.31 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.14z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.68 1.27 6.59l4.01 3.14c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                      <span className="text-2xl font-black text-white">5.0</span>
                      <div className="flex flex-col">
                        <Stars />
                        <span className="text-[13px] text-white/80">{reviewCount}+ Google Reviews</span>
                      </div>
                    </a>
                    <a
                      href="tel:+61370238094"
                      className="flex h-16 items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm px-5 py-3 hover:bg-white/20 transition-colors text-white font-bold"
                    >
                      <Phone className="h-4 w-4" /> (03) 7023 8094
                    </a>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  className="w-full"
                >
                  {/* Service defaults to Epoxy Grout (see note on HeroQuoteForm in the hand-off) */}
                  <HeroQuoteForm defaultService="Epoxy Grout" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ SECTION 2, TRUST STATS ══════════════ */}
        <AnimatedSection className="bg-white py-12 lg:py-16">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <p className="text-center text-[13px] font-bold text-accent uppercase tracking-[0.2em] mb-8">
              Trusted Across Victoria
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { Icon: Droplets, value: "8,000+", label: "Bathrooms Restored", sub: "Across Melbourne & regional Victoria", stars: false, href: "" },
                { Icon: Star, value: "5.0/5", label: "Google Rating", sub: `Based on ${reviewCount}+ Google reviews`, stars: true, href: "https://www.google.com/maps/place/Groutix" },
                { Icon: ShieldCheck, value: "10 Year", label: "Waterproof Warranty", sub: "On eligible completed work", stars: false, href: "" },
              ].map(({ Icon, value, label, sub, stars, href }, i) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex flex-col items-center text-center gap-3 px-6 py-8 rounded-xl border border-neutral-200 bg-neutral-50 h-full"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-secondary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="text-3xl font-black leading-none text-neutral-900">{value}</p>
                    {stars && <Stars />}
                    <p className="text-base font-bold text-neutral-900">{label}</p>
                    <p className="text-[13px] text-neutral-500">{sub}</p>
                  </motion.div>
                );
                return href ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  <div key={label}>{card}</div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 3, WHAT IS EPOXY GROUT ══════════════ */}
        <AnimatedSection className="bg-white pb-16 pt-4 lg:pb-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="The Basics"
              title="What Is Epoxy Grout?"
              intro="Epoxy grout is a two part resin grout, not a cement one. Once it sets, it does not soak up water."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {WHAT_IS.map(({ Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{title}</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-neutral-600 text-base leading-relaxed max-w-3xl mx-auto">
              Dirt can still sit on the surface, but it scrubs off. There is nothing inside the joint for mould to
              grow in.
            </p>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 4, BENEFITS AND TRADE-OFFS ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="The Honest Picture"
              title="Benefits and Trade-offs"
              intro="Epoxy is not the answer to everything. Here is the honest picture."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="space-y-3">
                <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Benefits</p>
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={b}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="bg-white border border-neutral-200 rounded-sm p-5 flex items-center gap-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white flex-shrink-0">
                      <Check className="h-5 w-5" />
                    </span>
                    <p className="font-bold text-neutral-900 text-base">{b}</p>
                  </motion.div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-amber-700">Trade-offs</p>
                {TRADE_OFFS.map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="bg-white border border-neutral-200 border-t-4 border-t-[#FBBC04] rounded-sm p-5 flex items-center gap-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <p className="font-bold text-neutral-900 text-base">{t}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="text-center text-neutral-600 text-base">
              For the full shower comparison, see{" "}
              <Link href="/shower-regrouting" className={inlineLink}>
                shower regrouting
              </Link>
              .
            </p>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 5, WHERE EPOXY GROUT WORKS BEST ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Where It Fits" title="Where Epoxy Grout Works Best" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WORKS_BEST.map(({ Icon, title, link }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 flex items-center gap-4 hover:border-accent hover:shadow-md transition-all"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg leading-snug">
                    {link ? (
                      <Link href={link} className="hover:text-primary transition-colors">
                        {title}
                      </Link>
                    ) : (
                      title
                    )}
                  </h3>
                </motion.div>
              ))}
            </div>
            <div className="max-w-4xl mx-auto border-l-4 border-accent pl-5 py-4 pr-5 bg-accent/5 rounded-r-sm space-y-2">
              <h3 className="font-bold text-neutral-900 text-lg">Where We Are Careful</h3>
              <p className="text-neutral-700 text-base leading-relaxed">
                Outdoors in direct sun, and some natural or polished stone, need a closer look first. For balconies,
                see{" "}
                <Link href="/balcony-leak-repairs" className={inlineLink}>
                  balcony leak repairs
                </Link>
                .
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 6, EPOXY GROUT COLOURS ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="Colour"
              title="Epoxy Grout Colours"
              intro="Epoxy comes in many colours. We match your current grout or change it."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COLOURS.map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-black text-base flex-shrink-0">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-neutral-900 text-lg">{c}</h3>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-neutral-600 text-base leading-relaxed max-w-3xl mx-auto">
              Colours look different on screen and on the wall, so we show you a sample before we start.
            </p>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 7, MYTHS ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Clearing It Up" title="Myths About Epoxy Grout" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {MYTHS.map((m, i) => (
                <motion.div
                  key={m.myth}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-3"
                >
                  <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-sm">
                    Myth
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">&ldquo;{m.myth}&rdquo;</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{m.truth}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 8, OUR EPOXY GROUT PROCESS (steps left, photo right) ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div className="space-y-6">
                <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Our Process</p>
                <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                  Our Epoxy Grout Process
                </h2>

                <div className="space-y-8 pt-4">
                  {PROCESS.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-black text-base flex-shrink-0">
                          {i + 1}
                        </div>
                        {i < PROCESS.length - 1 && <div className="w-0.5 flex-1 bg-primary/20 mt-2" />}
                      </div>
                      <div className="pb-4">
                        <h3 className="font-bold text-neutral-900 text-lg mb-2">{step.title}</h3>
                        <p className="text-neutral-600 text-base leading-relaxed">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-l-4 border-accent pl-4 py-2 bg-accent/5 rounded-r-sm">
                  <p className="text-neutral-700 text-base leading-relaxed">
                    Eligible work is backed by our 10 year waterproof warranty.
                  </p>
                </div>

                <Link href="/contact" className={CTA_BTN}>
                  Book Your Free Quote
                </Link>
              </div>

              <div>
                <AnimatedImage>
                  <ImgBox
                    label="Real Groutix technician applying epoxy grout"
                    aspect="aspect-[3/4]"
                    className="rounded-sm"
                  />
                </AnimatedImage>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 9, LOOKING AFTER EPOXY GROUT ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Aftercare" title="Looking After Epoxy Grout" />
            <div className="max-w-4xl mx-auto border-l-4 border-accent pl-5 py-4 pr-5 bg-accent/5 rounded-r-sm">
              <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                Epoxy does not need sealing the way cement grout does. A gentle clean is usually enough.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CARE.map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 flex items-center gap-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white flex-shrink-0">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg leading-snug">{c}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 10, WHAT DOES EPOXY GROUT COST? ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="Pricing"
              title="What Does Epoxy Grout Cost?"
              intro="Epoxy costs more upfront than cement because the material and the application are more demanding. We quote after we see the job."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {COST_FACTORS.map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6"
                >
                  <h3 className="font-bold text-neutral-900 text-lg">{c}</h3>
                </motion.div>
              ))}
            </div>
            <div className="max-w-4xl mx-auto bg-white border border-neutral-200 border-l-4 border-l-accent rounded-sm px-5 py-4 space-y-1">
              <h3 className="font-bold text-neutral-900 text-lg">A Clear Quote First</h3>
              <p className="text-neutral-600 text-base leading-relaxed">
                For shower prices, see{" "}
                <Link href="/shower-regrouting" className={inlineLink}>
                  shower regrouting
                </Link>
                .
              </p>
            </div>
            <div className="text-center">
              <Link href="/contact" className={CTA_BTN}>
                Get a Free Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 11, LANDLORDS, AGENTS AND COMMERCIAL ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="For Property Professionals"
              title="Landlords, Agents and Commercial"
              intro="Easy to clean grout suits rentals and commercial kitchens."
            />
            <div className="bg-primary rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white flex-shrink-0">
                  <Home className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-white text-lg">Most jobs are completed in a single visit</p>
                  <p className="text-white/80 text-base">Scheduled around tenants and trading hours.</p>
                </div>
              </div>
              <Link
                href="/real-estate-property-services"
                className="bg-[#FBBC04] hover:bg-white text-primary font-bold px-6 py-3 rounded-sm text-base transition-colors duration-200 active:scale-95 flex-shrink-0 shadow-sm"
              >
                Discuss a Property Job
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 12, WHY CHOOSE GROUTIX ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Why Groutix" title="Why Choose Groutix" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {WHY.map((w, i) => (
                <motion.div
                  key={w.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-3"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary">
                    <w.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{w.title}</h3>
                  {w.desc && <p className="text-neutral-600 text-base leading-relaxed">{w.desc}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 13, BEFORE AND AFTER ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Real Work" title="Before and After" />
            {/* Needs real photos: pass `src` to each ImgBox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BEFORE_AFTER.map((label, i) => (
                <AnimatedImage key={label} delay={i * 0.1}>
                  <ImgBox
                    label={`Before and after: ${label.toLowerCase()}`}
                    aspect="aspect-[4/3]"
                    className="rounded-sm"
                    showBeforeAfterBadges={true}
                  />
                </AnimatedImage>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 14, CUSTOMER FEEDBACK ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Reviews" title="Customer Feedback" />
            <div className="flex items-center justify-center gap-3">
              <Stars className="h-5 w-5" />
              <span className="font-bold text-neutral-900">Customer Reviews</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Review 1: real review from the homepage */}
              <div className="bg-white border border-neutral-200 rounded-sm p-6 flex flex-col gap-4">
                <span className="self-start text-[11px] font-bold uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 px-3 py-1 rounded-sm">
                  Epoxy Regrouting
                </span>
                <Stars />
                <p className="text-neutral-700 text-base leading-relaxed flex-1">
                  &ldquo;Bathroom looks amazing after epoxy regrouting. Johnny did a great job. Highly professional
                  and polite.&rdquo;
                </p>
                <p className="font-bold text-primary text-base">Kirat Singh</p>
              </div>
              {/* Reviews 2 and 3: real Google reviews that mention epoxy, pulled from the reviews prop.
                  Nothing is shown until real ones exist. */}
              {epoxyReviews.map((r, i) => (
                <ReviewCard key={i} review={r} className="w-full" />
              ))}
            </div>

            <div className="text-center">
              <a
                href="https://www.google.com/maps/place/Groutix"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-bold hover:underline"
              >
                Read More Verified Reviews on Google →
              </a>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 15, RELATED SERVICES ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Related Services" title="Related Services" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {RELATED.map((s, i) => (
                <motion.div
                  key={s.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link
                    href={s.href}
                    className="group border border-neutral-200 rounded-sm p-6 hover:border-accent hover:shadow-md transition-all flex flex-col justify-between gap-6 bg-white h-full"
                  >
                    <h3 className="font-bold text-neutral-900 text-lg group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <span className="text-[15px] font-bold text-accent group-hover:underline">Learn more →</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 16, SERVICE AREAS (same chips + checker as homepage) ══════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="Service Areas"
              title="Which Melbourne Suburbs Do We Apply Epoxy Grout In?"
              intro={
                <>
                  Coverage can vary by suburb, so it&apos;s best to confirm your area before booking. See all{" "}
                  <Link href="/locations" className={inlineLink}>
                    locations
                  </Link>
                  .
                </>
              }
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-lg">Melbourne Metro</h3>
                <span className="text-xs text-neutral-500 font-medium">Click any suburb to check coverage</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MELBOURNE_METRO.map((suburb) => {
                  const isSelected = selectedSuburb.toLowerCase() === suburb.toLowerCase();
                  return (
                    <button
                      key={suburb}
                      type="button"
                      onClick={() => {
                        setSelectedSuburb(suburb);
                        document.getElementById("suburb-checker")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`text-[13px] rounded-lg px-3.5 py-2 font-medium transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white border-2 border-primary"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:border-primary hover:text-primary hover:bg-neutral-50"
                      }`}
                    >
                      <MapPin className="w-3 h-3 opacity-60" />
                      {suburb}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-lg">Also Servicing</h3>
                <span className="text-xs text-accent font-medium">Regional Victoria &amp; Surrounds</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALSO_SERVICING.map((area) => {
                  const isSelected = selectedSuburb.toLowerCase() === area.toLowerCase();
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedSuburb(area);
                        document.getElementById("suburb-checker-widget")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`text-[13px] rounded-lg px-3.5 py-2 font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-accent text-white border-2 border-accent"
                          : "bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white"
                      }`}
                    >
                      <MapPin className="w-3 h-3 opacity-70" />
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <ServiceSuburbChecker />
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 17, EPOXY GROUT FAQs ══════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24" id="faq">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight text-center">
                Epoxy Grout FAQs
              </h2>
              <ul className="space-y-3">
                {EPOXY_FAQS.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} link={faq.link} />
                ))}
              </ul>
              <div className="text-center pt-4">
                <Link href="/contact" className={CTA_BTN}>
                  Still Have Questions? Get a Free Quote
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════ SECTION 18, FINAL CTA ══════════════ */}
        <AnimatedSection className="bg-primary py-16 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl lg:text-[42px] font-black text-white leading-tight">Get Your Free Quote Today</h2>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed">
              Call{" "}
              <a href={tel} className="underline hover:text-accent font-bold">
                (03) 7023 8094
              </a>
              , email{" "}
              <a href={mailto || "mailto:info@groutix.com"} className="underline hover:text-accent font-bold">
                info@groutix.com
              </a>
              .
            </p>
            <p className="text-white/70 text-base">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p>
            <p className="text-white/80 text-base max-w-2xl mx-auto">
              Honest advice and workmanship you can rely on.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              <Link
                href="/contact"
                className="text-white hover:text-white/80 font-bold text-base sm:text-lg transition-colors active:scale-95"
              >
                Request A Quote
              </Link>
              <a
                href="tel:+61370238094"
                className="inline-flex items-center gap-2.5 border-[1.5px] border-white/80 hover:border-white text-white font-bold px-6 py-3 rounded-lg text-base sm:text-lg transition-all active:scale-95"
              >
                <Phone className="h-4 w-4 fill-white text-white" /> (03) 7023 8094
              </a>
            </div>
          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
