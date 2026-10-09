"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Star,
  Droplets,
  ShieldCheck,
  Building2,
  ChevronDown,
  AlertTriangle,
  Grid2x2,
  Home,
  PaintBucket,
  Waves,
  CircleDot,
  Check,
  Users,
  FileText,
  Clock,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import AnimatedSection from "@/components/AnimatedSection";
import ReviewCard from "@/components/ReviewCard";
import { useContact } from "@/components/SiteContentProvider";
import { faqJsonLd } from "@/lib/seo";
import type { Review, BusinessRating } from "@/lib/reviews";

/* ─────────────────────────────────────────
   CONTENT (from Groutix_Balcony_Leak_Repair_Page_Content.docx)
───────────────────────────────────────── */

const SIGNS = [
  { Icon: Droplets, title: "White Chalky Stains", desc: "On tiles or walls. This is efflorescence. It means water moves through the surface." },
  { Icon: CircleDot, title: "Mould or Dark Grout", desc: "Mould or dark stains in grout lines that return after cleaning." },
  { Icon: Grid2x2, title: "Hollow Sounding Tiles", desc: "Tiles that sound hollow when tapped. Builders call these drummy tiles." },
  { Icon: Home, title: "Ceiling Water Stains", desc: "Water stains on the ceiling of the room below your balcony." },
  { Icon: PaintBucket, title: "Bubbling or Peeling Paint", desc: "Paint that bubbles or peels on walls under the balcony." },
  { Icon: Waves, title: "Pooling Water", desc: "Water that pools for hours after rain instead of draining away." },
];

const CAUSES = [
  { title: "Failed Waterproof Membrane", desc: "Under the tiles. The Victorian Building Authority found this defect in real apartment inspections across Victoria." },
  { title: "Cracked or Missing Grout", desc: "Lets water pass straight through." },
  { title: "Split Movement Joints", desc: "Buildings shift with heat and cold. Joints must flex. Old ones crack instead." },
  { title: "Poor Drainage", desc: "Water should run off within minutes. Pooled water always finds a way in." },
  { title: "Worn Sealant", desc: "Around edges, drains and balustrade posts." },
  { title: "UV Damage", desc: "Harsh sun breaks down cheap sealants year after year." },
];

const INSPECTION_STEPS = [
  "We check grout lines, joints, drains and edges up close.",
  "We tap tiles to find hollow drummy spots.",
  "We test moisture levels to map where water travels.",
  "We trace stains back to the entry point, not just the visible damage.",
];

const REPAIR_OPTIONS = [
  {
    tag: "Right when grout failed, membrane holds",
    title: "Epoxy Regrouting With No Tile Removal",
    desc: "We cut out old grout and lay waterproof epoxy grout. It stands up to UV, mould and stains. Your tiles stay exactly where they are.",
    bar: "border-t-[#001F97]",
    pill: "bg-[#001F97]/10 text-[#001F97]",
  },
  {
    tag: "Right for early leaks and tired seals",
    title: "Waterproof Sealing Treatment",
    desc: "We renew silicone joints and seal vulnerable edges. This stops small problems before they grow.",
    bar: "border-t-[#2F63CC]",
    pill: "bg-[#2F63CC]/10 text-[#2F63CC]",
  },
  {
    tag: "Right when the membrane has failed",
    title: "Full Rebuild With New Membrane and Tiles",
    desc: "We lift tiles, repair the base and lay a new membrane to AS 4654. Then we retile. This is the lasting fix for major failure.",
    bar: "border-t-[#FBBC04]",
    pill: "bg-[#FBBC04]/20 text-[#8a6400]",
  },
];

const WEATHER_CARDS = [
  { title: "Cement grout", desc: "Standard cement grout soaks up water." },
  { title: "Cheap sealants", desc: "They peel under UV." },
  { title: "Rigid repairs", desc: "They crack when the building moves." },
];

const PROCESS_STEPS = [
  { title: "Free inspection", desc: "We visit, check the signs and trace the source." },
  { title: "Fixed quote", desc: "You approve a written price before we start. No surprises." },
  { title: "Repair day", desc: "We regrout, reseal or rebuild based on the diagnosis." },
  { title: "Test and tidy", desc: "We check our work and leave the place clean." },
];

const COST_FACTORS = [
  { title: "Size", desc: "Size of the balcony and tiled area." },
  { title: "What Failed", desc: "Grout, seals or membrane." },
  { title: "Access", desc: "A high rise apartment costs more to set up than a ground floor home." },
  { title: "Repair Tier", desc: "Regrout, seal or full rebuild." },
];

const STRATA_POINTS = [
  { Icon: FileText, title: "Written Reports", desc: "With photos for committee and insurance records." },
  { Icon: ShieldCheck, title: "Australian Standards", desc: "Work to Australian Standards, AS 3740 and AS 4654." },
  { Icon: Clock, title: "Building Approved Hours", desc: "Jobs scheduled in building approved hours." },
  { Icon: UserCheck, title: "One Contact", desc: "From first call to final check." },
];

const WHY_POINTS = [
  { title: "10 Year Warranty", desc: "On our workmanship." },
  { title: "5.0 Star Google Rating", desc: "" },
  { title: "Leak and Grout Specialists", desc: "This is all we do." },
  { title: "Free Inspections", desc: "Fixed written quotes." },
  { title: "Real Reviews", desc: "From real Melbourne customers." },
  { title: "Finished Work Walkthrough", desc: "Every job ends with a walkthrough. We show you the finished work before we leave." },
];

const RELATED = [
  {
    title: "Shower Regrouting",
    desc: "Leak coming from the bathroom instead? Same grout experts, same no tile removal approach.",
    href: "/shower-regrouting",
  },
  {
    title: "Leaking Shower Repair",
    desc: "We trace any leak to its source before we fix it.",
    href: "/leaking-shower-repair",
  },
  {
    title: "Efflorescence and Mould in Grout Lines",
    desc: "White stains and black spots signal water where it should not be.",
    href: "",
  },
];

const BALCONY_FAQS = [
  {
    q: "How much does balcony leak repair cost in Melbourne?",
    a: "It depends on size, cause and repair type. A simple regrout costs far less than a full membrane rebuild. Access matters too. High rise jobs cost more than ground floor ones. We inspect free and give a fixed written quote. You know the price before we start.",
  },
  {
    q: "Can a leaking balcony be repaired without removing tiles?",
    a: "Yes, in many cases. When the membrane under the tiles still holds, epoxy regrouting and resealing fix the leak. Tiles stay in place. But a failed membrane needs tiles lifted for a rebuild. Our free inspection shows which one you need.",
  },
  {
    q: "What causes balcony tiles to leak?",
    a: "Failed waterproof membranes cause most balcony leaks. Cracked grout, split movement joints and poor drainage add to the problem. UV damage wears out cheap sealants. Melbourne heat and rain speed up the wear. Most leaks come from a mix of these causes.",
  },
  {
    q: "How long does a balcony leak repair take?",
    a: "Most regrout and reseal jobs finish in one day. Larger balconies can take two. A full rebuild with a new membrane takes longer. Your written quote states the timeframe upfront so you can plan around it. We tidy up before we leave.",
  },
  {
    q: "Do you service apartment balconies?",
    a: "Yes. We repair balconies in apartments, townhouses and houses across Melbourne. High rise or ground floor, the process stays the same. We also work with strata managers and supply written reports for committees. One call books your free inspection.",
  },
  {
    q: "Who fixes a leaking balcony, a plumber, waterproofer or grout specialist?",
    a: "It depends where the leak starts. Plumbers fix broken pipes. For leaks through grout, tiles and seals, a leak repair specialist is the right call. Failed membranes need licensed waterproofers. We diagnose the source first, then apply the right fix.",
  },
  {
    q: "Is a balcony leak covered by strata insurance?",
    a: "In Victoria, balcony membranes often count as common property. The owners corporation may then claim on strata insurance. Your plan of subdivision and policy wording decide each case. Our written reports with photos support insurance claims. Ask us for one after inspection.",
  },
];

/* ─────────────────────────────────────────
   SMALL SHARED PIECES (same look as the homepage)
───────────────────────────────────────── */

function SectionHead({
  eyebrow,
  children,
  intro,
}: {
  eyebrow?: string;
  children: React.ReactNode;
  intro?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      {eyebrow && <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">{eyebrow}</p>}
      <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">{children}</h2>
      {intro && <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">{intro}</p>}
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

function NoteLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto max-w-3xl text-center text-neutral-600 text-base sm:text-lg leading-relaxed">{children}</p>
  );
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-accent bg-accent/5 rounded-r-sm pl-5 pr-6 py-4 space-y-1">
      <h3 className="font-bold text-neutral-900 text-lg">{title}</h3>
      <p className="text-neutral-600 text-base leading-relaxed">{children}</p>
    </div>
  );
}

function InfoCard({
  title,
  desc,
  Icon,
  index = 0,
  className = "",
}: {
  title: string;
  desc?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.4 }}
      className={`bg-white border border-neutral-200 rounded-sm p-6 space-y-4 hover:border-accent hover:shadow-md transition-all ${className}`}
    >
      {Icon && (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="font-bold text-neutral-900 text-lg">{title}</h3>
      {desc ? <p className="text-neutral-600 text-base leading-relaxed">{desc}</p> : null}
    </motion.div>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
    >
      {children}
    </Link>
  );
}

function PhotoBox({ label, src, aspect }: { label: string; src?: string; aspect: string }) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden rounded-sm border-2 border-transparent hover:border-[#F5A623] transition-all duration-300`}
      style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] z-10 pointer-events-none" />
      {src ? (
        <Image src={src} alt={label} fill className="object-cover transition-transform duration-500 hover:scale-105" />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
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

function FaqItem({ q, a }: { q: string; a: string }) {
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
        <h3 className="font-semibold text-neutral-900 text-base leading-snug">{q}</h3>
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
            <p className="px-5 pb-4 text-base text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */

export default function BalconyLeakRepairPage({
  reviews = [],
  rating,
}: {
  /** Only pass genuine Google reviews that are about balcony work. */
  reviews?: Review[];
  rating: BusinessRating;
}) {
  const { tel, phone } = useContact();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Balcony Leak Repair",
    provider: { "@type": "LocalBusiness", name: "Groutix" },
    areaServed: { "@type": "AdministrativeArea", name: "Melbourne VIC" },
    url: "/balcony-leak-repairs/",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Balcony Leak Repairs", item: "/balcony-leak-repairs/" },
    ],
  };

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "/balcony-leak-repairs/",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#balcony-intro", "[data-speakable-faq]"],
    },
  };

  return (
    <>
      <Navbar />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(BALCONY_FAQS)) }} />

        {/* ══ 1. HERO: H1 + intro left, quote form right ══ */}
        <section className="relative overflow-hidden pt-[110px] lg:pt-[125px]" id="quote-form">
          <div className="absolute inset-0">
            <Image src="/img101.jpeg" alt="Balcony leak repair in Melbourne" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/55" />
          </div>

          <div className="relative z-10 flex min-h-[calc(100vh-110px)] lg:min-h-[calc(100vh-125px)] flex-col">
            <div className="mx-auto flex w-full max-w-[1460px] flex-1 items-start justify-center px-6 py-6 pb-16 lg:px-10 lg:py-8 lg:pb-20">
            <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_540px] lg:gap-12">
              <div className="space-y-5 text-white lg:pt-2 text-center lg:text-left flex flex-col items-center lg:items-start">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.02 }}
                  className="text-[13px] font-bold text-white/80 uppercase tracking-[0.2em]"
                >
                  Groutix
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                  className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]"
                >
                  Balcony Leak Repair Melbourne
                </motion.h1>
                <motion.p
                  id="balcony-intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                  className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
                >
                  Groutix repairs leaking balconies across Melbourne. We find where water gets in, then fix failed grout,
                  seals or membranes. Most jobs need no tile removal. You get a 10 year warranty and a free quote. We
                  serve homes, apartments and strata buildings.
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
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-[#FBBC04] fill-[#FBBC04]" />
                        ))}
                      </div>
                      <span className="text-[13px] text-white/80">{rating.count}+ Google Reviews</span>
                    </div>
                  </a>
                  <a
                    href={tel}
                    className="flex h-16 items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm px-5 py-3 hover:bg-white/20 transition-colors text-white font-bold"
                  >
                    <Phone className="h-4 w-4" /> {phone || "+61 3 7023 8094"}
                  </a>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="w-full"
              >
                <HeroQuoteForm />
              </motion.div>
            </div>
          </div>
          </div>
        </section>

        {/* ══ 2. STATS STRIP (3 cards) ══ */}
        <AnimatedSection className="bg-white py-12 lg:py-16 border-b border-neutral-200">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <a
                href="https://www.google.com/maps/place/Groutix"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center gap-3 px-6 py-8 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-accent transition-colors"
              >
                <GoogleIcon className="h-6 w-6" />
                <p className="text-3xl font-black leading-none text-neutral-900">5.0/5</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-[#FBBC04] fill-[#FBBC04]" />
                  ))}
                </div>
                <p className="text-base font-bold text-neutral-900">Google Rating</p>
                <p className="text-[13px] text-neutral-500">5.0 star Google rating</p>
              </a>
              <div className="flex flex-col items-center text-center gap-3 px-6 py-8 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-3xl font-black leading-none text-neutral-900">65%</p>
                <p className="text-base font-bold text-neutral-900">Of Melbourne Apartments Have Building Defects</p>
                <p className="text-[13px] text-neutral-500">Australian Apartment Advocacy, 2025 survey of 1,100 owners</p>
              </div>
              <div className="flex flex-col items-center text-center gap-3 px-6 py-8 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-3xl font-black leading-none text-neutral-900">10 Year</p>
                <p className="text-base font-bold text-neutral-900">Warranty</p>
                <p className="text-[13px] text-neutral-500">On our workmanship</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 3. SIGNS ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="Balconies rarely fail overnight. They warn you first. Here is what to look for.">
              Signs Your Balcony Needs <span className="text-accent">Leak Repair</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {SIGNS.map((s, i) => (
                <InfoCard key={s.title} index={i} Icon={s.Icon} title={s.title} desc={s.desc} />
              ))}
            </div>
            <NoteLine>Spot even one sign? Book a free inspection. Small leaks turn into big damage fast.</NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 4. CAUSES ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="Melbourne weather punishes outdoor tiles. Summer sun bakes them. Winter rain soaks them. Bay winds drive water into every gap.">
              What Causes Balconies to <span className="text-accent">Leak in Melbourne</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {CAUSES.map((c, i) => (
                <InfoCard key={c.title} index={i} title={c.title} desc={c.desc} />
              ))}
            </div>
            <NoteLine>Most leaks have more than one cause. That is why we diagnose before we repair.</NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 5. GROUT OR MEMBRANE ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="This question decides your repair. Get it wrong and the leak returns.">
              Is It the Grout or the Membrane? <span className="text-accent">How We Diagnose the Real Cause</span>
            </SectionHead>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              <Callout title="Failed grout">Needs regrouting.</Callout>
              <Callout title="Failed membrane">Needs a rebuild. Grout alone cannot fix a dead membrane.</Callout>
            </div>

            <h3 className="text-center text-xl lg:text-2xl font-bold text-neutral-900">Our inspection finds the truth.</h3>

            <div className="max-w-[760px] mx-auto space-y-3">
              {INSPECTION_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-4 bg-neutral-50 border border-neutral-200 rounded-sm px-5 py-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-black text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-neutral-600 text-base leading-relaxed pt-0.5">{step}</p>
                </motion.div>
              ))}
            </div>

            <NoteLine>
              You get a straight answer. We show you what failed and which fix suits it. Photos help. We document each
              fault so you can see it too.
            </NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 6. REPAIR OPTIONS ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="One size never fits all. We match the repair to the cause we found.">
              Balcony Leak Repair Options: <span className="text-accent">Choose the Right Fix</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {REPAIR_OPTIONS.map((o, i) => (
                <motion.div
                  key={o.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`bg-white border border-neutral-200 border-t-4 ${o.bar} rounded-sm p-6 space-y-4 hover:shadow-md transition-shadow`}
                >
                  <span className={`inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm ${o.pill}`}>
                    {o.tag}
                  </span>
                  <h3 className="font-bold text-neutral-900 text-xl">{o.title}</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{o.desc}</p>
                </motion.div>
              ))}
            </div>
            <NoteLine>
              We only recommend what your balcony needs. The inspection decides, not a sales script. Each option suits a
              different cause. Your photos and report show why we picked it.
            </NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 7. BUILT FOR MELBOURNE WEATHER ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="Indoor products die outdoors. A balcony faces full sun, cold snaps and salty bay air in one year.">
              Built for Melbourne Weather: <span className="text-accent">UV, Heat and Movement</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {WEATHER_CARDS.map((c, i) => (
                <InfoCard key={c.title} index={i} Icon={AlertTriangle} title={c.title} desc={c.desc} />
              ))}
            </div>
            <div className="max-w-[900px] mx-auto">
              <Callout title="What We Use">
                We use UV resistant epoxy grout made for outdoor use. It flexes with movement instead of cracking.
                Sealed perimeter joints block wind driven rain. Salt air near the bay eats cheap metals and sealants. We
                allow for that.
              </Callout>
            </div>
            <NoteLine>
              Think bay facing apartments in St Kilda. Think sun baked rooftops in the CBD. The fix must match the
              exposure.
            </NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 8. PROCESS (steps left, photo right) ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div className="space-y-6">
                <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Our Process</p>
                <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                  Our Balcony Leak Repair <span className="text-accent">Process</span>
                </h2>
                <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                  Simple, clean and fast. Here is how it works.
                </p>

                <div className="space-y-8 pt-4">
                  {PROCESS_STEPS.map((step, i) => (
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
                        {i < PROCESS_STEPS.length - 1 && <div className="w-0.5 flex-1 bg-primary/20 mt-2" />}
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
                    Most regrout jobs finish in a day. You can use the balcony again after.
                  </p>
                </div>

                <PrimaryButton href="#quote-form">Book Your Free Inspection</PrimaryButton>
              </div>

              <PhotoBox src="/img42.jpeg" label="Groutix technician on a balcony" aspect="aspect-[3/4]" />
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 9. COST ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead intro="No two balconies cost the same. Your price depends on:">
              Balcony Leak Repair Cost <span className="text-accent">in Melbourne</span>
            </SectionHead>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1080px] mx-auto">
              {COST_FACTORS.map((c, i) => (
                <InfoCard key={c.title} index={i} title={c.title} desc={c.desc} />
              ))}
            </div>
            <div className="max-w-[900px] mx-auto">
              <Callout title="Fixed Written Quote">
                After inspection you get a fixed written quote. The price we quote is the price you pay.
              </Callout>
            </div>
            <div className="text-center">
              <PrimaryButton href="#quote-form">Get a Free Quote</PrimaryButton>
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 10. STRATA ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="For Property Professionals"
              intro="Apartment balcony leaks raise a tough question. Who pays for the repair?"
            >
              Strata, Body Corporate <span className="text-accent">and Property Managers</span>
            </SectionHead>

            <div className="max-w-[900px] mx-auto">
              <Callout title="Who Maintains What in Victoria">
                In Victoria the owners corporation usually maintains common property. Balcony membranes often count as
                common property. Lot owners usually look after surfaces inside their lot. Your plan of subdivision
                settles each case.
              </Callout>
            </div>

            <h3 className="text-center text-xl lg:text-2xl font-bold text-neutral-900">
              We work with strata managers, committees and agents
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              {STRATA_POINTS.map((p, i) => (
                <InfoCard key={p.title} index={i} Icon={p.Icon} title={p.title} desc={p.desc} />
              ))}
            </div>

            <div className="max-w-[1080px] mx-auto bg-primary rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white flex-shrink-0">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-white text-lg">Need a report for a claim or a meeting?</p>
                  <p className="text-white/80 text-base">Just ask.</p>
                </div>
              </div>
              <Link
                href="#quote-form"
                className="bg-[#FBBC04] hover:bg-white text-primary font-bold px-6 py-3 rounded-sm text-base transition-colors duration-200 active:scale-95 flex-shrink-0 shadow-sm"
              >
                Request a Report
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 11. WITHOUT REMOVING TILES ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead>
              Can a Leaking Balcony Be Fixed <span className="text-accent">Without Removing Tiles?</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              <div className="bg-white border border-neutral-200 border-t-4 border-t-[#001F97] rounded-sm p-6 space-y-4">
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm bg-[#001F97]/10 text-[#001F97]">
                  Yes, in many cases
                </span>
                <p className="text-neutral-600 text-base leading-relaxed">
                  When the membrane is sound and only grout or seals failed, regrouting and resealing fix it. Tiles stay
                  down.
                </p>
              </div>
              <div className="bg-white border border-neutral-200 border-t-4 border-t-[#FBBC04] rounded-sm p-6 space-y-4">
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm bg-[#FBBC04]/20 text-[#8a6400]">
                  When tiles must come up
                </span>
                <p className="text-neutral-600 text-base leading-relaxed">
                  A failed membrane or damaged base needs a rebuild. We tell you upfront. Paying for a surface fix on a
                  dead membrane wastes money.
                </p>
              </div>
            </div>
            <NoteLine>No myths. No pressure. Just an honest diagnosis.</NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 12. WHY GROUTIX ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead eyebrow="Why Groutix">
              Why Melbourne Homeowners <span className="text-accent">Choose Groutix</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {WHY_POINTS.map((w, i) => (
                <motion.div
                  key={w.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-3"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{w.title}</h3>
                  {w.title === "5.0 Star Google Rating" ? (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 text-[#FBBC04] fill-[#FBBC04]" />
                      ))}
                    </div>
                  ) : null}
                  {w.desc ? <p className="text-neutral-600 text-base leading-relaxed">{w.desc}</p> : null}
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 13. REVIEWS (only genuine balcony reviews) ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead>
              What Melbourne Customers Say <span className="text-accent">About Our Balcony Work</span>
            </SectionHead>

            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[720px] mx-auto">
                {reviews.slice(0, 2).map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
              </div>
            ) : null}

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

        {/* ══ 14. TEAM ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead
              eyebrow="The People Behind The Work"
              intro="Our technicians are licensed and insured. They are Melbourne locals who repair balconies every day."
            >
              Meet Your Balcony <span className="text-accent">Repair Team</span>
            </SectionHead>

            <div className="max-w-4xl mx-auto">
              <PhotoBox label="Team photo" aspect="aspect-[16/9] md:aspect-[21/9]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { name: "Johnny", role: "Technician" },
                { name: "Max", role: "Technician" },
              ].map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 flex items-center gap-5"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-accent shadow-sm bg-neutral-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xl">{m.name}</h3>
                    <p className="text-accent text-[14px] font-bold">Role: {m.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 15. RELATED ISSUES ══ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <SectionHead>
              Related Issues <span className="text-accent">We Fix</span>
            </SectionHead>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
              {RELATED.map((r, i) => {
                const body = (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-bold text-neutral-900 text-lg group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-neutral-600 text-base leading-relaxed">{r.desc}</p>
                    </div>
                    {r.href ? <span className="text-base font-bold text-accent group-hover:underline">Learn more →</span> : null}
                  </>
                );
                const cls =
                  "group border border-neutral-200 rounded-sm p-6 bg-white flex flex-col justify-between gap-6 h-full transition-all";
                return (
                  <motion.div
                    key={r.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    {r.href ? (
                      <Link href={r.href} className={`${cls} hover:border-accent hover:shadow-md`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <NoteLine>
              Not sure where your leak starts? Call us. We trace it free. You can also see our{" "}
              <Link href="/#balcony" className="text-accent font-bold hover:underline">
                balcony regrouting
              </Link>{" "}
              overview.
            </NoteLine>
          </div>
        </AnimatedSection>

        {/* ══ 16. FAQ ══ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24" id="faq">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="space-y-6 max-w-3xl mx-auto" data-speakable-faq>
              <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight text-center">
                Balcony Leak Repair <span className="text-accent">FAQs</span>
              </h2>
              <ul className="space-y-3">
                {BALCONY_FAQS.map((f, i) => (
                  <FaqItem key={i} q={f.q} a={f.a} />
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* ══ 17. FINAL CTA ══ */}
        <AnimatedSection className="bg-primary py-16 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl lg:text-[42px] font-black text-white leading-tight">
              Book Your Free Balcony Inspection
            </h2>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              For balcony leak repairs across Melbourne, call{" "}
              <a href="tel:+61370238094" className="underline hover:text-accent font-bold">
                +61 3 7023 8094
              </a>{" "}
              now. Or request a quote online.
            </p>
            <p className="text-white/70 text-base">Free inspection. Fixed quote. 10 year warranty.</p>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <Link
                href="/contact"
                className="bg-[#FBBC04] hover:bg-white text-primary font-black px-6 py-3 rounded-sm text-base sm:text-lg transition-colors active:scale-95"
              >
                Request A Quote
              </Link>
              <a
                href="tel:+61370238094"
                className="inline-flex items-center gap-2.5 border-[1.5px] border-white/80 hover:border-white text-white font-bold px-6 py-3 rounded-lg text-base sm:text-lg transition-all active:scale-95"
              >
                <Phone className="h-4 w-4 fill-white text-white" /> +61 3 7023 8094
              </a>
            </div>
          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
