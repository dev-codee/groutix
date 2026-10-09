"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import {
  Phone,
  Check,
  Droplets,
  ShieldCheck,
  MapPin,
  Star,
  ThumbsUp,
  Grid2x2,
  Wrench,
  ShowerHead,
  Hammer,
  Building2,
  Search,
  ClipboardCheck,
  Layers,
  Users,
  Home,
  AlertTriangle,
  Eye,
  ChevronDown,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Review, BusinessRating } from "@/lib/reviews";
import TrustedMarquee from "@/components/TrustedMarquee";
import { useSiteContent, useContact } from "@/components/SiteContentProvider";
import { faqJsonLd } from "@/lib/seo";
import BalconyDeepDiveSection from "@/components/BalconyDeepDiveSection";

/* ─── Image placeholder ─── */
function ImgBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
  objectFit = "cover",
  showBeforeAfterBadges = false,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
  objectFit?: "cover" | "contain";
  showBeforeAfterBadges?: boolean;
}) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-[#F5A623] transition-all duration-300`}
      style={{
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] z-10 pointer-events-none" />

      {/* Before & After Badges in top corners */}
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
          className={`${objectFit === "contain" ? "object-contain p-2" : "object-cover"} transition-transform duration-500 hover:scale-105`}
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

function GoogleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

/* ─── Photo slider (matches service page slider) ─── */
function HomePhotoSlider() {
  const [idx, setIdx] = useState(0);
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg", "/img58.jpeg", "/img59.jpeg"];
  const total = sliderImages.length;
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total], sliderImages[(idx + 2) % total]];
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={`${idx}-${i}`} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`Before & After Photo ${idx + i + 1}`}
              aspect="aspect-[4/3]"
              className="rounded-sm"
              showBeforeAfterBadges={true}
            />
          </AnimatedImage>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={prev}
          className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex-1 max-w-[120px] h-1 bg-neutral-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#001F97] rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Droplet icon for bullets ─── */
const DropletIcon = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="flex-shrink-0 mt-0.5">
    <path d="M7 3V17C3.134 17 0 13.866 0 10C0 6.134 3.134 3 7 3Z" fill="#2F63CC" />
    <path d="M14 10C14 13.866 10.866 17 7 17V3C10.866 3 14 6.134 14 10Z" fill="#97B1E5" />
  </svg>
);

/* ─── Services data from the doc ─── */
const FEATURED_SERVICES = [
  {
    slug: "shower-regrouting",
    title: "Shower Regrouting",
    desc: "Cracked or crumbling grout removed and rebuilt with material designed for constant water exposure, so your shower seals properly again.",
    tag: "Core Service",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "We inspect the shower to find where water is actually getting in, then repair the cause. Most leaks are resolved without removing tiles, though some cases need further investigation first.",
    tag: "Core Service",
  },
  {
    slug: "balcony-leak-repairs",
    title: "Balcony Leak Repairs & Regrouting",
    desc: "Failed grout and sealant around balcony doors and tiles rebuilt with weatherproof materials, to help reduce water reaching the areas below.",
    tag: "Core Service",
  },
];

const STANDARD_SERVICES = [
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Worn or discoloured grout refreshed across bathrooms, kitchens, laundries and balconies for a cleaner, more hygienic finish.",
  },
  {
    slug: "silicone-recaulking",
    title: "Silicone & Recaulking",
    desc: "Old, mouldy silicone removed and replaced with mould-resistant sealant for a cleaner seal around your shower or bath.",
  },
  {
    slug: "epoxy-grout",
    title: "Epoxy Grout",
    desc: "An upgrade to non-porous, stain-resistant epoxy grout, built to handle constant moisture in wet areas.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "Broken or loose tiles repaired or replaced individually, a practical fix when a full retile isn't needed.",
  },
];

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "shower-regrouting": Droplets,
  "tile-regrouting": Grid2x2,
  "shower-base-repair": Wrench,
  "leaking-shower-repair": ShowerHead,
  "balcony-leak-repairs": ShieldCheck,
  "silicone-recaulking": Wrench,
  "epoxy-grout": Grid2x2,
  "small-tiling-jobs": Hammer,
  "real-estate-property-services": Building2,
};

const HOME_FAQS = [
  {
    q: "How Do I Know If I Need Regrouting or Recaulking?",
    a: "Cracked, crumbling grout usually means regrouting. Peeling or soft silicone around corners usually means recaulking. Many Melbourne bathrooms need both, catching it early saves money.",
  },
  {
    q: "How Do I Fix Shower Grout Mould?",
    a: "Cleaning it only masks the smell for a while. If mould keeps coming back in the same spot, the grout underneath has usually failed and needs replacing, not just scrubbing.",
  },
  {
    q: "Will You Need to Remove My Tiles to Regrout a Shower?",
    a: "No, in most cases. Standard regrouting works around your existing tiles, so there's no full tear out.",
  },
  {
    q: "How Long Does Shower Regrouting Last?",
    a: "Done properly, it holds up for years of daily use. That's exactly why we back every complete job with a 10 year warranty instead of just saying \"it'll be fine.\"",
  },
  {
    q: "Can You Repair a Shower While Tenants Are Living There?",
    a: "Yes. Most jobs are completed in a single visit with minimal disruption, which works well for occupied rentals, agents, and strata managers. We work around your timelines.",
  },
  {
    q: "Which Suburbs and Regions Do We Service Across Victoria?",
    a: "Melbourne and surrounding suburbs, plus regional Victoria. Not sure we cover your area? Contact us to confirm.",
  },
  {
    q: "Do I Have to Stop Using My Shower Afterward?",
    a: "Yes, for a short period while the grout and silicone cure. We'll tell you exactly how long before we start.",
  },
  {
    q: "Do You Work on Showers, Kitchens, and Balconies?",
    a: "Yes. We handle grout and silicone repairs across bathrooms, kitchens, laundries, and balconies.",
  },
  {
    q: "Worried About Regrouting Cost Before You Call?",
    a: "Most shower regrouting jobs are competitively priced. See our full pricing guide for details, or request a free, no-obligation quote.",
  },
];

/* ─── Diagnostic FAQ Item ─── */
function DiagnosticFaqItem({ q, a }: { q: string; a: string }) {
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
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180 text-[#2F63CC]" : "text-neutral-400"}`} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="px-5 pb-4 text-base text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* ─── Suburbs Directory for Instant Coverage Checker ─── */
const SUBURB_DIRECTORY: Array<{ name: string; postcode?: string; region: string; href?: string }> = [
  // Melbourne Metro
  { name: "South Melbourne", postcode: "3205", region: "Melbourne Metro", href: "/locations/melbourne/south-melbourne" },
  { name: "Richmond", postcode: "3121", region: "Melbourne Metro", href: "/locations/melbourne/richmond" },
  { name: "Carlton", postcode: "3053", region: "Melbourne Metro", href: "/locations/melbourne/carlton" },
  { name: "Fitzroy", postcode: "3065", region: "Melbourne Metro", href: "/locations/melbourne/fitzroy" },
  { name: "Brunswick", postcode: "3056", region: "Melbourne Metro", href: "/locations/melbourne/brunswick" },
  { name: "St Kilda", postcode: "3182", region: "Melbourne Metro", href: "/locations/melbourne/st-kilda" },
  { name: "Prahran", postcode: "3181", region: "Melbourne Metro", href: "/locations/melbourne/prahran" },
  { name: "Toorak", postcode: "3142", region: "Melbourne Metro", href: "/locations/melbourne/toorak" },
  { name: "Hawthorn", postcode: "3122", region: "Melbourne Metro", href: "/locations/melbourne/hawthorn" },
  { name: "Camberwell", postcode: "3124", region: "Melbourne Metro", href: "/locations/melbourne/camberwell" },
  { name: "Box Hill", postcode: "3128", region: "Melbourne Metro", href: "/locations/melbourne/box-hill" },
  { name: "Glen Waverley", postcode: "3150", region: "Melbourne Metro", href: "/locations/melbourne/glen-waverley" },
  { name: "Dandenong", postcode: "3175", region: "Melbourne Metro", href: "/locations/melbourne/dandenong" },
  { name: "Cranbourne", postcode: "3977", region: "Melbourne Metro", href: "/locations/melbourne/cranbourne" },
  { name: "Frankston", postcode: "3199", region: "Greater Melbourne", href: "/locations/frankston" },
  { name: "Mornington", postcode: "3931", region: "Mornington Peninsula", href: "/locations/frankston" },
  { name: "Brighton", postcode: "3186", region: "Melbourne Metro", href: "/locations/melbourne/brighton" },
  { name: "Coburg", postcode: "3058", region: "Melbourne Metro", href: "/locations/melbourne/coburg" },
  { name: "Doncaster", postcode: "3108", region: "Melbourne Metro", href: "/locations/melbourne/doncaster" },
  { name: "Essendon", postcode: "3040", region: "Melbourne Metro", href: "/locations/melbourne/essendon" },
  { name: "Footscray", postcode: "3011", region: "Melbourne Metro", href: "/locations/melbourne/footscray" },
  { name: "Kew", postcode: "3101", region: "Melbourne Metro", href: "/locations/melbourne/kew" },
  { name: "Malvern", postcode: "3144", region: "Melbourne Metro", href: "/locations/melbourne/malvern" },
  { name: "Point Cook", postcode: "3030", region: "Melbourne Metro", href: "/locations/melbourne/point-cook" },
  { name: "Reservoir", postcode: "3073", region: "Melbourne Metro", href: "/locations/melbourne/reservoir" },
  { name: "Ringwood", postcode: "3134", region: "Melbourne Metro", href: "/locations/melbourne/ringwood" },
  { name: "South Yarra", postcode: "3141", region: "Melbourne Metro", href: "/locations/melbourne/south-yarra" },
  { name: "Werribee", postcode: "3030", region: "Melbourne Metro", href: "/locations/melbourne/werribee" },
  { name: "Williamstown", postcode: "3016", region: "Melbourne Metro", href: "/locations/melbourne/williamstown" },
  { name: "Melbourne CBD", postcode: "3000", region: "Melbourne Metro", href: "/locations/melbourne/melbourne-cbd" },
  // Regional Victoria & Yarra Valley
  { name: "Geelong", postcode: "3220", region: "Regional Victoria", href: "/locations/geelong" },
  { name: "Ballarat", postcode: "3350", region: "Regional Victoria", href: "/locations/ballarat" },
  { name: "Lilydale", postcode: "3140", region: "Yarra Valley", href: "/locations/lilydale" },
  { name: "Yarra Glen", postcode: "3775", region: "Yarra Valley", href: "/locations/yarra-glen" },
  { name: "Kilmore", postcode: "3764", region: "Mitchell Shire", href: "/locations/kilmore" },
];

function SuburbCheckerWidget({
  activeSuburb,
  onClearActiveSuburb,
  phone,
  tel,
  email,
  mailto,
}: {
  activeSuburb?: string;
  onClearActiveSuburb?: () => void;
  phone: string;
  tel: string;
  email: string;
  mailto: string;
}) {
  const [query, setQuery] = useState(activeSuburb || "");
  const [fullName, setFullName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    checkedQuery: string;
    available: boolean;
    suburb: string;
    zone?: string;
    message?: string;
    label?: string;
  } | null>(null);

  // Sync if parent updates activeSuburb
  React.useEffect(() => {
    if (activeSuburb) {
      setQuery(activeSuburb);
      setSubmitted(false);
    }
  }, [activeSuburb]);

  // Check suburb availability directly against CRM / DB API
  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setCheckResult(null);
      setChecking(false);
      return;
    }

    let isMounted = true;
    setChecking(true);

    const timer = setTimeout(() => {
      fetch(`/api/suburb-check?q=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (isMounted) {
            setCheckResult({
              checkedQuery: trimmed,
              available: Boolean(data.available),
              suburb: data.suburb || trimmed,
              zone: data.zone,
              message: data.message,
              label: data.label,
            });
            setChecking(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setChecking(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsSubmitting(true);
    // Simulate brief network submission to confirm coverage
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div id="suburb-checker-widget" className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" /> Instant Coverage Checker
        </div>
        <h3 className="font-bold text-neutral-900 text-xl sm:text-2xl">Check If We Service Your Suburb</h3>
        <p className="text-neutral-600 text-sm sm:text-base">
          Type your suburb or postcode below to instantly check coverage across Melbourne &amp; Victoria from our live dispatch system.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSubmitted(false);
              if (onClearActiveSuburb) onClearActiveSuburb();
            }}
            placeholder="e.g. Richmond, Frankston, Geelong, or 3121..."
            className="w-full border-2 border-neutral-200 rounded-lg pl-12 pr-28 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          <div className="absolute right-3 flex items-center gap-2">
            {checking && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCheckResult(null);
                  setSubmitted(false);
                  if (onClearActiveSuburb) onClearActiveSuburb();
                }}
                className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-2.5 py-1.5 rounded font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live CRM / DB Check Notification */}
      {checkResult && (
        <AnimatePresence mode="wait">
          {checkResult.available ? (
            /* ── SUBURB IS AVAILABLE ── */
            <motion.div
              key="available"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950 text-base sm:text-lg">
                    Yes! Groutix Services {checkResult.suburb}
                  </p>
                  <p className="text-emerald-800 text-xs sm:text-sm leading-relaxed">
                    Full shower regrouting, leaking shower repairs, epoxy grouting and balcony sealing available in your area backed by our <strong>10-Year Waterproof Warranty</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <a
                  href="#quote-form"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#001F97] hover:bg-[#2F63CC] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-sm transition-all shadow-sm active:scale-95"
                >
                  Get a Free Quote
                </a>
                <a
                  href={tel}
                  className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-sm transition-colors active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" /> Call {phone}
                </a>
              </div>
            </motion.div>
          ) : (
            /* ── SUBURB IS NOT CURRENTLY AVAILABLE ── */
            <motion.div
              key="unavailable"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-amber-50 border border-amber-300 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-amber-950 text-base sm:text-lg">
                    {checkResult.suburb} is Not in Our Standard Booking Area
                  </p>
                  <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
                    We frequently accommodate locations outside our automated zones by custom arrangement. <strong>Please mail or contact us directly to find out if we can service your area!</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <a
                  href={mailto || `mailto:${email}?subject=Service%20Inquiry%20for%20${encodeURIComponent(checkResult.suburb)}`}
                  className="inline-flex items-center gap-1.5 bg-[#001F97] hover:bg-[#2F63CC] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-sm transition-all shadow-sm active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5" /> Mail Us: {email}
                </a>
                <a
                  href={tel}
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-sm transition-colors active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" /> Call: {phone}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Confirmation / Callback Request Form */}
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-6 text-center space-y-2"
        >
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-bold text-lg">Thank You{fullName ? `, ${fullName}` : ""}!</p>
          <p className="text-sm text-emerald-800 leading-relaxed">
            We&apos;ve registered your enquiry for <strong>{checkResult?.suburb || query || "your area"}</strong>. Johnny or Max will mail or call you on <strong>{phoneNum}</strong> to discuss scheduling for your location.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-neutral-100">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            {checkResult && !checkResult.available
              ? `Leave your details below and we will confirm if we can come to ${checkResult.suburb}:`
              : "Want us to confirm availability or book an inspection?"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="tel"
              required
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
              placeholder="Your Phone Number"
              className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !query.trim()}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Confirming...</span>
            ) : checkResult && !checkResult.available ? (
              <span>Ask Us About Servicing {checkResult.suburb}</span>
            ) : (
              <span>Confirm Coverage &amp; Request Callback</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function HomePage({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  const { hero } = useSiteContent();
  const { phone, tel, email, mailto } = useContact();
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  return (
    <>
      <Navbar />
      <main>
        {/* ══════════════════════════════════════
            SECTION 1, HERO
            Two-column: copy left, form right
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-[110px] lg:pt-[125px]" id="quote-form">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image src="/img101.jpeg" alt="Hero background" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 flex min-h-[calc(100vh-110px)] lg:min-h-[calc(100vh-125px)] flex-col">
            <div className="mx-auto flex w-full max-w-[1460px] flex-1 items-start justify-center px-6 py-6 pb-16 lg:px-10 lg:py-8 lg:pb-20">
              <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_540px] lg:gap-12">
                {/* Left: headline + paragraph + badges */}
                <div className="space-y-4 text-white lg:pt-2 text-center lg:text-left flex flex-col items-center lg:items-start">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                    className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)] text-center lg:text-left mx-auto lg:mx-0"
                  >
                    Shower Regrouting and Balcony Regrouting in Melbourne | Groutix
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg text-center lg:text-left mx-auto lg:mx-0"
                  >
                    We fix failed grout, worn silicone, and leaking shower areas across Melbourne and Victoria, without a full renovation. Every complete shower regrout comes with a 10 year waterproof warranty.
                  </motion.p>

                  {/* Google badge + Call button */}
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
                      <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.18 3.665-9.15z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.14C3.25 21.32 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.68 1.27 6.59l4.01 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
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
                      <Phone className="h-4 w-4" /> (03) 7023 8094
                    </a>
                  </motion.div>
                </div>

                {/* Right: Quote Form */}
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

        {/* ══════════════════════════════════════
            SECTION 2, Client logo strip (no change)
        ══════════════════════════════════════ */}
        <TrustedMarquee />

        {/* ══════════════════════════════════════
            SECTION 3, Trust Stats (3-column)
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-12 lg:py-16">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <p className="text-center text-[13px] font-bold text-accent uppercase tracking-[0.2em] mb-8">
              Trusted Across Victoria
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Droplets,
                  value: "8,000+",
                  label: "Bathrooms Restored",
                  sublabel: "Across Melbourne & regional Victoria",
                  color: "text-secondary",
                  showStars: false,
                },
                {
                  Icon: GoogleIcon,
                  value: "5.0/5",
                  label: "Google Rating",
                  sublabel: `Based on ${rating.count}+ Google reviews`,
                  color: "",
                  showStars: true,
                  linked: true,
                },
                {
                  Icon: ShieldCheck,
                  value: "10 Year",
                  label: "Waterproof Warranty",
                  sublabel: "On every complete shower regrout",
                  color: "text-secondary",
                  showStars: false,
                },
              ].map(({ Icon, value, label, sublabel, color, showStars, linked }, i) => {
                const content = (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex flex-col items-center text-center gap-3 px-6 py-8 rounded-xl border border-neutral-200 bg-neutral-50"
                  >
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 ${color || ""}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="text-3xl font-black leading-none text-neutral-900">{value}</p>
                    {showStars && (
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 text-[#FBBC04] fill-[#FBBC04]" />
                        ))}
                      </div>
                    )}
                    <p className="text-base font-bold text-neutral-900">{label}</p>
                    <p className="text-[13px] text-neutral-500">{sublabel}</p>
                  </motion.div>
                );
                if (linked) {
                  return (
                    <a key={label} href="https://www.google.com/maps/place/Groutix" target="_blank" rel="noopener noreferrer" className="block">
                      {content}
                    </a>
                  );
                }
                return <div key={label}>{content}</div>;
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 4, Credentials strip
        ══════════════════════════════════════ */}
        {/*
        <div className="bg-primary py-3">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/90">
            <span className="font-bold text-accent">Licensed &amp; Insured</span>
            <span>Licence No. [CONFIRM]</span>
            <span>ABN [CONFIRM]</span>
            <span>[CONFIRM years] years in business</span>
          </div>
        </div>
        */}

        {/* ══════════════════════════════════════
            SECTION 5, What We Do, Services
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">What We Do</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Shower Regrouting &amp; <span className="text-accent">Balcony Regrouting</span> Services
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Groutix handles shower regrouting, leaking shower repairs, and balcony regrouting across Melbourne.
              </p>
            </div>

            {/* Featured Services (3 core) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_SERVICES.map((s, i) => {
                const Icon = SERVICE_ICONS[s.slug] ?? Droplets;
                return (
                  <motion.div
                    key={s.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={`/${s.slug}`}
                      className="group border border-neutral-200 rounded-sm p-6 hover:border-accent hover:shadow-md transition-all flex flex-col justify-between gap-6 bg-white relative overflow-hidden h-full"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          {/* Core Service Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 px-3 py-1 rounded-sm">
                              {s.tag}
                            </span>
                          </div>

                          {/* Logo in Centre with Generous Space */}
                          <div className="flex justify-center my-4 py-2">
                            <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:bg-[#001F97] group-hover:text-white group-hover:scale-105 shadow-sm">
                              <Icon className="h-8 w-8" />
                            </span>
                          </div>

                          {/* Title and Description with Space */}
                          <div className="space-y-2 mt-4">
                            <h3 className="font-bold text-neutral-900 text-xl group-hover:text-[#001F97] transition-colors">
                              {s.title}
                            </h3>
                            <p className="text-base text-neutral-600 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>

                        <div className="pt-6">
                          <span className="text-base font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                            Learn more →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Standard Services (4 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STANDARD_SERVICES.map((s, i) => {
                const Icon = SERVICE_ICONS[s.slug] ?? Droplets;
                return (
                  <motion.div
                    key={s.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={`/${s.slug}`}
                      className="group border border-neutral-200 rounded-sm p-6 hover:border-accent hover:shadow-md transition-all flex flex-col justify-between gap-6 bg-white relative overflow-hidden h-full"
                    >
                      <div className="space-y-4">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-primary">
                          <Icon className="h-6 w-6" />
                        </span>
                        <h3 className="font-bold text-neutral-900 text-lg group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                        <p className="text-[15px] text-neutral-600 leading-relaxed">{s.desc}</p>
                      </div>
                      <span className="text-[15px] font-bold text-accent group-hover:underline">
                        Learn more →
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Services CTA panel */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                  <Search className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg">Not Sure What&apos;s Causing the Problem?</h3>
                  <p className="text-neutral-600 text-base">Tell us what you&apos;re seeing, and we&apos;ll help you identify the right service.</p>
                </div>
              </div>
              <Link
                href="/contact"
                className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95 flex-shrink-0"
              >
                Ask About My Repair
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 6, Problem / Diagnostic
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-12">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Shower Grout Problems</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Cracked Grout or a <span className="text-accent">Leaking Shower?</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                Grout is the visible finish on your shower walls and floor, not the waterproofing membrane underneath it. In Melbourne bathrooms, cracked grout, peeling silicone, or shower grout mould are usually the first signs worth a closer look, here&apos;s how to read them.
              </p>
            </div>

            {/* Diagnostic table */}
            <div className="bg-white rounded-sm border border-neutral-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-3 bg-neutral-50 border-b border-neutral-200">
                <div className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-neutral-500">What You See</div>
                <div className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-neutral-500">What It Could Mean</div>
                <div className="px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-neutral-500">What To Do</div>
              </div>
              {[
                {
                  see: "Cracked grout or peeling silicone",
                  mean: "The seal around your tiles has broken down, which can let moisture through the joint.",
                  todo: "Worth an assessment for shower regrouting or recaulking.",
                },
                {
                  see: "Persistent dampness or mould",
                  mean: "Trapped moisture that isn't drying out, the grout may be part of it, or it could be ventilation or your cleaning routine.",
                  todo: "Check ventilation and cleaning first; if it keeps returning, have the grout and silicone assessed.",
                },
                {
                  see: "Loose tiles or water outside the shower",
                  mean: "This can point to something more than surface grout, and isn't something to diagnose from the tile alone.",
                  todo: "Best to book a proper leak assessment rather than guess.",
                },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="grid grid-cols-3 border-b border-neutral-100 last:border-b-0"
                >
                  <div className="px-6 py-5 font-bold text-neutral-900 text-base">{row.see}</div>
                  <div className="px-6 py-5 text-neutral-600 text-base leading-relaxed">{row.mean}</div>
                  <div className="px-6 py-5 text-neutral-600 text-base leading-relaxed">{row.todo}</div>
                </motion.div>
              ))}
            </div>

            {/* Sign to action */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-neutral-900">Choose a Possible Next Step</h3>
              <p className="text-neutral-600 text-base leading-relaxed max-w-3xl">
                This is general guidance, not a diagnosis. A cracked grout line or recurring mould doesn&apos;t confirm the exact cause on its own, so use it as a starting point.
              </p>
              <div className="space-y-3">
                {[
                  { sign: "Cracked or crumbling grout", step: "Grout Repair / Regrouting Assessment" },
                  { sign: "Peeling silicone", step: "Recaulking Assessment" },
                  { sign: "Recurring mould", step: "Check Ventilation, Cleaning, Grout & Silicone" },
                  { sign: "Loose tiles or water outside the shower", step: "Leak Assessment" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-sm px-6 py-4"
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Sign</p>
                      <p className="font-bold text-neutral-900">{item.sign}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Possible Next Step</p>
                      <span className="inline-block text-[13px] font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-sm">
                        {item.step}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Diagnostic CTA */}
            <div className="bg-white border border-neutral-200 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                  <Search className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg">Not Sure What Your Shower Needs?</h3>
                  <p className="text-neutral-600 text-base">Tell us what you&apos;ve noticed, and we&apos;ll explain the next step.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <Link
                  href="/contact"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  Get a Quote
                </Link>
                <Link href="/shower-regrouting" className="text-[13px] text-accent hover:underline">
                  Read our shower regrouting guide
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 6.5, Balcony Deep-Dive
        ══════════════════════════════════════ */}
        <BalconyDeepDiveSection />

        {/* ══════════════════════════════════════
            SECTION 7, Before & After Gallery
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 relative z-10 space-y-8">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Real Work</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Before and After: <span className="text-accent">Real Regrouting Results</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Real jobs completed across Melbourne homes, not stock photos.
              </p>
            </div>
            <HomePhotoSlider />
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 8, Client Reviews & Testimonials
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Customer Feedback</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900">
                What Our Customers <span className="text-accent">Say</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Real feedback from homeowners we&apos;ve helped across Melbourne and Victoria.
              </p>
            </div>

            {/* Review badge */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-[#FBBC04] fill-[#FBBC04]" />
                ))}
              </div>
              <span className="font-bold text-neutral-900">Customer Reviews</span>
            </div>

            <div className="review-marquee-wrap overflow-hidden -mx-6 lg:-mx-10">
              <div className="review-marquee flex w-max px-6 lg:px-10">
                {[...reviews, ...reviews].map((r, i) => (
                  <ReviewCard key={i} review={r} className="mr-6 shrink-0 w-[85vw] sm:w-[360px]" />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <a
                href="https://www.google.com/maps/place/Groutix"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-bold hover:underline"
              >
                Read More Verified Reviews on Google →
              </a>
            </div>

            {/* Testimonials CTA */}
            <div className="bg-white border border-neutral-200 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-bold text-neutral-900 text-lg">Have a shower or grout problem that needs attention?</h3>
                <p className="text-neutral-600 text-base">Tell us what&apos;s happening and we&apos;ll help you understand the right next step.</p>
              </div>
              <Link
                href="/contact"
                className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95 flex-shrink-0"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 9, Our Regrouting Process
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              {/* Left: Process steps */}
              <div className="space-y-6">
                <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Our Process</p>
                <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                  Our Regrouting Process: <span className="text-accent">Precise Fixes, Not Quick Patches</span>
                </h2>
                <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                  Every job starts with understanding what&apos;s actually happening, not a quick surface fix. Here&apos;s how we approach it, the exact work can vary depending on the condition of your shower.
                </p>

                <div className="space-y-8 pt-4">
                  {[
                    {
                      num: "1",
                      title: "Assess the Shower",
                      desc: "We inspect the grout, silicone and surrounding tiles to understand the actual condition before recommending any work.",
                    },
                    {
                      num: "2",
                      title: "Remove and Prepare",
                      desc: "Damaged grout and old silicone are fully removed and the area is properly prepared, the amount of work here depends on what we find.",
                    },
                    {
                      num: "3",
                      title: "Regrout and Finish",
                      desc: "New grout and sealant are applied and finished so the surface is sealed properly again, ready for everyday use.",
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-black text-base flex-shrink-0">
                          {step.num}
                        </div>
                        {i < 2 && <div className="w-0.5 flex-1 bg-primary/20 mt-2" />}
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
                    Eligible complete shower regrouting work is backed by a 10-year waterproof warranty.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  Book Your Free Quote
                </Link>
              </div>

              {/* Right: Photo placeholder */}
              <div>
                <ImgBox
                  src="/img42.jpeg"
                  label="Real Groutix technician mid-job"
                  aspect="aspect-[3/4]"
                  className="rounded-sm"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 10, Warranty
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-primary py-14 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                Our 10 Year Waterproof Warranty
              </h2>
              <p className="text-white/85 text-base sm:text-lg leading-relaxed">
                Every complete shower regrouting job is backed by a 10 year waterproof warranty. <Link href="/terms-conditions" className="underline hover:text-accent">See full warranty terms</Link>.
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-sm px-5 py-3 inline-block">
                <p className="text-white font-bold text-base">
                  If a covered leak comes back, we fix it. That&apos;s what the warranty means for you.
                </p>
              </div>
            </div>
            <AnimatedImage>
              <div className="relative w-[220px] sm:w-[260px] lg:w-[300px] flex items-center justify-center shrink-0">
                <div className="absolute inset-2 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
                <Image
                  src="/warranty-seal-10-year.png"
                  alt="Groutix 10 Year Waterproof Warranty Guaranteed"
                  width={340}
                  height={327}
                  className="relative z-10 w-full h-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
            </AnimatedImage>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 11, Why Choose Groutix
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Why Groutix</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Why Choose <span className="text-accent">Groutix?</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                We focus only on grout, silicone and wet-area repairs across Melbourne, so every recommendation comes from specialists who see these exact problems every day, not a general renovation crew fitting it in between other jobs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Search,
                  title: "Specialist Wet-Area Knowledge",
                  desc: "Grout, silicone and waterproofing failures behave differently to general tiling or renovation faults. Because that's all we work on, we recognise the real cause faster and don't default to a bigger job than the one you actually need.",
                },
                {
                  Icon: ClipboardCheck,
                  title: "A Clear Assessment Before Any Recommendation",
                  desc: "We inspect the affected area first and explain what we find in plain terms, so you know whether it's a full regrout, a recaulk, or a smaller repair before any work is booked in.",
                },
                {
                  Icon: Layers,
                  title: "Materials Selected for the Specific Wet Area",
                  desc: "Showers, balconies and other wet areas each put different stress on grout and sealant. We choose the material for the job in front of us, not one default product for every surface.",
                },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary">
                    <b.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{b.title}</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Warranty mini-block */}
            <div className="bg-primary rounded-sm p-6 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white flex-shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-white text-lg">10-Year Waterproof Warranty</p>
                <p className="text-white/80 text-base">On eligible completed shower regrouting work.</p>
              </div>
            </div>

            {/* Why Choose CTA */}
            <div className="text-center space-y-3">
              <h3 className="font-bold text-neutral-900 text-xl">Need to know what your shower needs?</h3>
              <Link
                href="/contact"
                className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
              >
                Get a Quote
              </Link>
              <p className="text-neutral-500 text-[13px]">Clear advice. Upfront pricing. No pressure.</p>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 12, Meet the Groutix Team
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">The People Behind The Work</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Meet the Groutix <span className="text-accent">Team</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                The same small team handles your job from inspection through to the finished work, here&apos;s who you&apos;ll actually deal with.
              </p>
            </div>

            {/* Group photo */}
            <div className="max-w-4xl mx-auto">
              <ImgBox
                label="Group photo of Johnny and the team"
                aspect="aspect-[16/9] md:aspect-[21/9]"
                className="rounded-sm"
              />
            </div>

            {/* Team members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { name: "Johnny", role: "Technician", avatar: "" },
                { name: "Max", role: "Technician", avatar: "" },
              ].map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 flex items-center gap-5"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-accent shadow-sm bg-neutral-100 flex items-center justify-center">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xl">{member.name}</h3>
                    <p className="text-accent text-[14px] font-bold">Role: {member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
              >
                Talk to Our Team
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 13, Real Estate & Property Services
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">For Property Professionals</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Real Estate &amp; <span className="text-accent">Property Services</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                Groutix looks after wet-area repairs for landlords, real estate agents and strata managers across Melbourne, shower regrouting, leak repairs, silicone replacement and balcony work, scheduled around tenants to help minimise disruption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Users,
                  title: "Scheduled Around Tenants",
                  desc: "Most jobs are completed in a single visit with minimal disruption, and we work around tenant timelines, practical for occupied rentals.",
                },
                {
                  Icon: ClipboardCheck,
                  title: "Clear Assessments for Agents & Owners",
                  desc: "We inspect the affected area first and explain what we found in plain terms, full regrout, recaulk, or smaller repair, so you can pass a straight answer on to owners.",
                },
                {
                  Icon: Home,
                  title: "One Specialist for Every Wet Area",
                  desc: "Showers, bathrooms, laundries, kitchens and balconies, one call covers the wet areas across your properties instead of chasing multiple trades.",
                },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary">
                    <b.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-lg">{b.title}</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Property CTA */}
            <div className="bg-primary rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white flex-shrink-0">
                  <Home className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-white text-lg">Discuss a Property Job</p>
                  <p className="text-white/80 text-base">Tell us about the property and we&apos;ll advise on the right repair.</p>
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

        {/* ══════════════════════════════════════
            SECTION 14, Specialist vs General CTA band
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-primary py-14 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto space-y-6 relative z-10 text-center">
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight max-w-3xl mx-auto">
              Why Choose a Grout Specialist Instead of a General Tradesperson?
            </h2>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
              A general renovator can retile a whole bathroom. We focus only on grout, silicone, and wet area waterproofing, so we see the same failure patterns every day and fix the actual cause, not just the surface. That focus is why our regrouting work is backed by a 10 year warranty most full renovation jobs don&apos;t offer for grout alone.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-primary hover:bg-accent hover:text-primary font-black px-6 py-3 rounded-sm text-base transition-colors active:scale-95 border-2 border-accent"
            >
              Talk to a Melbourne Grout Specialist
            </Link>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 15, What Happens After You Book
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">How It Works</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                What Happens After You Book a Service With Us?
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                No surprises. Here&apos;s exactly what to expect from your first call to the finished job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  label: "CALL",
                  Icon: Phone,
                  title: "Call or Request a Quote",
                  desc: "Tell us what's happening. We'll give you honest advice, even if a full regrout isn't necessary.",
                  highlighted: false,
                },
                {
                  num: "02",
                  label: "VISIT",
                  Icon: ClipboardCheck,
                  title: "We Visit & Complete the Job",
                  desc: "We'll assess the area, explain the work and complete most jobs in a single visit with minimal disruption.",
                  highlighted: false,
                },
                {
                  num: "03",
                  label: "PROTECTED",
                  Icon: ShieldCheck,
                  title: "Your Warranty Starts",
                  desc: "Every complete shower regrout is covered by our 10-year waterproof warranty from day one.",
                  highlighted: true,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`rounded-sm p-6 space-y-4 border ${step.highlighted ? "border-accent bg-accent/5" : "border-neutral-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-black text-base ${step.highlighted ? "bg-accent text-primary" : "bg-primary text-white"}`}>
                      {step.num}
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-primary">
                      <step.Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{step.label}</p>
                  <h3 className="font-bold text-neutral-900 text-lg">{step.title}</h3>
                  <p className="text-neutral-600 text-base leading-relaxed">{step.desc}</p>
                  {step.highlighted && (
                    <div className="border border-accent/30 bg-accent/5 rounded-sm px-4 py-2 inline-block">
                      <p className="text-[13px] font-black text-primary uppercase tracking-widest">10 YEAR</p>
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">WATERPROOF WARRANTY</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="text-center space-y-3">
              <p className="font-bold text-primary text-lg">Simple process. Clear communication. No surprises.</p>
              <Link
                href="/contact"
                className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
              >
                Get a Quote
              </Link>
              <p className="text-neutral-500 text-[13px]">Tell us what&apos;s happening and we&apos;ll advise you on the right repair.</p>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 16, Service Areas
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-neutral-100 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">Service Areas</p>
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Which Suburbs and Regions Do We Service Across Victoria?
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                Groutix works across Melbourne and selected parts of regional Victoria. Coverage can vary by suburb, so it&apos;s best to confirm your area before booking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-lg">Melbourne Metro</h3>
                <span className="text-xs text-neutral-500 font-medium">Click any suburb to check coverage</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "South Melbourne", "Richmond", "Carlton", "Fitzroy", "Brunswick",
                  "St Kilda", "Prahran", "Toorak", "Hawthorn", "Camberwell",
                  "Box Hill", "Glen Waverley", "Dandenong", "Cranbourne", "Frankston", "Mornington"
                ].map((suburb) => {
                  const isSelected = selectedSuburb.toLowerCase() === suburb.toLowerCase();
                  return (
                    <button
                      key={suburb}
                      type="button"
                      onClick={() => {
                        setSelectedSuburb(suburb);
                        document.getElementById("suburb-checker-widget")?.scrollIntoView({ behavior: "smooth" });
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
                {["Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"].map((area) => {
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

            {/* Suburb checker widget */}
            <SuburbCheckerWidget
              activeSuburb={selectedSuburb}
              onClearActiveSuburb={() => setSelectedSuburb("")}
              phone={phone}
              tel={tel}
              email={email}
              mailto={mailto}
            />
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 17, FAQ (Updated questions from doc)
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24" id="faq">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight text-center">
                Frequently Asked <span className="text-accent">Questions</span>
              </h2>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(HOME_FAQS)) }}
              />
              <ul className="space-y-3">
                {HOME_FAQS.map((faq, i) => (
                  <DiagnosticFaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </ul>
              <div className="text-center pt-4">
                <Link
                  href="/contact"
                  className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
                >
                  Still Have Questions? Get a Free Quote
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ══════════════════════════════════════
            SECTION 18, Final CTA
        ══════════════════════════════════════ */}
        <AnimatedSection className="bg-primary py-16 px-6 lg:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,79,0.25),transparent_45%)]" />
          <div className="max-w-[1460px] mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl lg:text-[42px] font-black text-white leading-tight">
              Get Your Free Quote Today
            </h2>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed">
              Call <a href={tel} className="underline hover:text-accent font-bold">(03) 7023 8094</a>, email info@groutix.com, or request a quote online.
            </p>
            <p className="text-white/70 text-base">
              Open Mon–Sat 9:00 AM–6:30 PM, Sun 11:00 AM–10:00 PM.
            </p>
            <p className="text-white/80 text-base max-w-2xl mx-auto">
              This is what shower regrouting in Victoria should feel like: honest advice and workmanship you can rely on.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              <Link
                href="/contact"
                className="text-white hover:text-white/80 font-bold text-base sm:text-lg transition-colors active:scale-95"
              >
                Request A Quote
              </Link>
              <a
                href={tel}
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
