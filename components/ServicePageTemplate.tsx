"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedImage from "@/components/AnimatedImage";
import type { Review } from "@/lib/reviews";

/* ─── Droplet bullet icon (matches real site) ─── */
const DropletIcon = () => (
  <svg width="12" height="18" viewBox="0 0 12 18" fill="none" className="flex-shrink-0 mt-0.5">
    <path d="M6 5V17C2.686 17 0 14.314 0 11C0 7.686 2.686 5 6 5Z" fill="#2F63CC" />
    <path d="M12 11C12 14.314 9.314 17 6 17V5C9.314 5 12 7.686 12 11Z" fill="#97B1E5" />
  </svg>
);

/* ─── Shared image placeholder ─── */
function ImgBox({ label, aspect = "aspect-[4/3]", className = "", src, objectFit = "object-cover", }: { label: string; aspect?: string; className?: string; src?: string; objectFit?: string }) {
  return (
    <div className={`relative ${aspect} w-full overflow-hidden ${className} rounded-xl border-2 border-transparent hover:border-accent transition-all duration-300 shadow-md hover:shadow-xl`}>
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />
      
      {src ? (
        <Image src={src} alt={label} fill className={`${objectFit} transition-transform duration-500 hover:scale-105`} />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative text-center px-4 space-y-1 z-10">
            <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
            <p className="text-[12px] text-neutral-300">Add photo manually</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── FAQ Accordion ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-neutral-200 bg-white cursor-pointer list-none"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="font-semibold text-neutral-900 text-base leading-snug">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-[#2F63CC] flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />}
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

/* ─── Mini service icon SVGs for request quote card section ─── */
const ShowerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M8 14h16M8 14c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#001F97" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 16v4M13 16v6M16 16v4M19 16v6M22 16v4" stroke="#2F63CC" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SystemIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <rect x="8" y="8" width="7" height="7" rx="1" fill="#001F97" />
    <rect x="17" y="8" width="7" height="7" rx="1" fill="#2F63CC" />
    <rect x="8" y="17" width="7" height="7" rx="1" fill="#2F63CC" />
    <rect x="17" y="17" width="7" height="7" rx="1" fill="#001F97" />
  </svg>
);

const WarrantyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <circle cx="16" cy="12" r="3" fill="#2F63CC" />
    <path d="M8 22c0-3 3.582-5 8-5s8 2 8 5" stroke="#001F97" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11 25h10" stroke="#2F63CC" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LeakIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M16 8c0 0-6 5-6 10a6 6 0 0012 0c0-5-6-10-6-10z" stroke="#001F97" strokeWidth="1.8" fill="#2F63CC" fillOpacity="0.3" />
  </svg>
);

const TileIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <rect x="8" y="8" width="6" height="6" rx="1" fill="#001F97" />
    <rect x="18" y="8" width="6" height="6" rx="1" fill="#2F63CC" />
    <rect x="8" y="18" width="6" height="6" rx="1" fill="#2F63CC" />
    <rect x="18" y="18" width="6" height="6" rx="1" fill="#001F97" />
    <line x1="16" y1="8" x2="16" y2="26" stroke="white" strokeWidth="1" />
    <line x1="8" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1" />
  </svg>
);

const PropertyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#EEF2FF" />
    <path d="M16 8l8 6v10H8V14l8-6z" fill="#2F63CC" fillOpacity="0.3" stroke="#001F97" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="13" y="18" width="6" height="6" fill="#001F97" />
  </svg>
);

const pillarIcons: Record<string, React.ReactNode[]> = {
  "shower-regrouting": [<ShowerIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />],
  "leaking-shower-repair": [<LeakIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />],
  "tile-regrouting": [<TileIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />],
  "real-estate-property-services": [<PropertyIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />],
  "small-tiling-jobs": [<TileIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />],
};

const serviceImageMap: Record<string, { hero?: string; fail?: string; fix?: string }> = {
  "shower-regrouting": {
    hero: "/img3.jpeg",
    fail: "/img27.jpeg",
    fix: "/img12.jpeg",
  },
  "shower-base-repair": {
    hero: "/img29.jpg",
    fail: "/img30.jpg",
    fix: "/img31.jpg",
  },
  "tile-regrouting": {
    hero: "/img10.jpeg",
    fail: "/img16.jpeg",
    fix: "/img19.avif",
  },
  "leaking-shower-repair": {
    hero: "/img32.jpg",
    fail: "/img33.jpg",
    fix: "/img34.jpg",
  },
  "small-tiling-jobs": {
    hero: "/img19.avif",
    fail: "/img9.jpeg",
    fix: "/img36.jpeg",
  },
};

/* ─── Fail section badges by service ─── */
const failSectionBadges: Record<string, string[]> = {
  "shower-regrouting": ["UNPLEASANT ODOURS", "MOULD GROWTH", "DAMAGE BEYOND BATHROOM"],
  "leaking-shower-repair": ["WATER DAMAGES WALLS", "STRUCTURAL ROT", "MOULD & HYGIENE ISSUES"],
  "tile-regrouting": ["STAINED GROUT LINES", "WATER SEEPAGE", "LOOSE TILES"],
  "real-estate-property-services": ["TENANT COMPLAINTS", "PROPERTY VALUE DROP", "EXPENSIVE ROT"],
  "small-tiling-jobs": ["CRACKED MEMBRANES", "DRUMMY TILES", "MOISTURE INTRUSION"],
};

/* ─── Image slider component (Image 2 style) ─── */
function PhotoSlider({ serviceTitle }: { serviceTitle: string }) {
  const [idx, setIdx] = useState(0);
  const total = 4;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);
  
  const sliderImages = ["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg"];
  const visibleImages = [sliderImages[idx], sliderImages[(idx + 1) % total]];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {visibleImages.map((img, i) => (
          <AnimatedImage key={i} delay={i * 0.1}>
            <ImgBox
              src={img}
              label={`${serviceTitle} Photo ${idx + i + 1}`}
              aspect="aspect-[4/3]"
              className="rounded-sm"
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

/* ─── Detailed Quote Form (Image 3 style) ─── */
function DetailedQuoteForm() {
  const [sent, setSent] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [heard, setHeard] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", enquiry: "", message: "",
  });

  const toggleArr = (arr: string[], val: string, setter: (a: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); };

  const inputCls = "w-full border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:outline-none focus:border-[#001F97] bg-white placeholder:text-neutral-400 transition-colors";
  const chipBtn = (label: string, arr: string[], setter: (a: string[]) => void) => (
    <button
      key={label}
      type="button"
      onClick={() => toggleArr(arr, label, setter)}
      className={`px-3 py-1.5 text-sm border rounded-sm font-medium transition-colors ${
        arr.includes(label)
          ? "bg-[#001F97] text-white border-[#001F97]"
          : "bg-[#F3F4F6] text-neutral-700 border-neutral-300 hover:border-[#001F97]"
      }`}
    >
      {label}
    </button>
  );

  if (sent) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-50 border border-emerald-200 p-8 text-center rounded-sm"
    >
      <div className="text-xl font-black text-emerald-700 mb-2">Request Received!</div>
      <p className="text-base text-emerald-600">We'll contact you within 1 business hour.</p>
    </motion.div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 bg-white p-6 shadow-lg border border-neutral-200">
      <div className="grid grid-cols-2 gap-3">
        <input required name="firstName" value={form.firstName} onChange={handle} className={inputCls} placeholder="First Name" />
        <input required name="lastName" value={form.lastName} onChange={handle} className={inputCls} placeholder="Last Name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input required type="email" name="email" value={form.email} onChange={handle} className={inputCls} placeholder="Email" />
        <input required name="phone" value={form.phone} onChange={handle} className={inputCls} placeholder="Phone" />
      </div>
      <input name="address" value={form.address} onChange={handle} className={inputCls} placeholder="Address" />
      <div className="grid grid-cols-2 gap-3">
        <input name="city" value={form.city} onChange={handle} className={inputCls} placeholder="City" />
        <div className="relative">
          <select name="state" value={form.state} onChange={handle} className={`${inputCls} appearance-none pr-8`}>
            <option value="">Select State</option>
            {["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-neutral-800 mb-2">What area/s are you looking to have serviced? *</p>
        <div className="flex flex-wrap gap-2">
          {["Main Bathroom", "Guest Bathroom", "Ensuite Bathroom", "Toilet", "Kitchen", "Laundry", "Balcony", "Other"].map((a) =>
            chipBtn(a, areas, setAreas)
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-neutral-800 mb-2">Is your enquiry about:</p>
        <div className="relative">
          <select name="enquiry" value={form.enquiry} onChange={handle} className={`${inputCls} appearance-none pr-8`}>
            <option value="">Shower cubicle only</option>
            <option>Full bathroom regrouting</option>
            <option>Leaking shower repair</option>
            <option>Tile regrouting</option>
            <option>Small tiling job</option>
            <option>Property maintenance</option>
            <option>Other</option>
          </select>
          <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>
      <textarea
        name="message"
        rows={3}
        value={form.message}
        onChange={handle}
        className={`${inputCls} resize-none`}
        placeholder="Tell us more about how we can help."
      />
      <div>
        <p className="text-sm font-bold text-neutral-800 mb-2">Where have you heard about us? *</p>
        <div className="flex flex-wrap gap-2">
          {["TV", "Radio", "Billboard", "Sponsorship", "Vehicle", "Flyer", "Friend or Family", "Real Estate Agent", "Other"].map((h) =>
            chipBtn(h, heard, setHeard)
          )}
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold py-3.5 text-base tracking-wide transition-colors active:scale-95"
      >
        Submit Request
      </button>
    </form>
  );
}

const formatText = (text: string) => {
  const parts = text.split(/(\[y\].*?\[\/y\]|\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('[y]') && part.endsWith('[/y]')) {
      return (
        <span key={index} className="text-accent font-semibold">
          {part.slice(3, -4)}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export default function ServicePageTemplate({
  title,
  slug = "shower-regrouting",
  h1Desc,
  failHeading,
  failHeadingBlue,
  failText,
  fixHeading,
  fixHeadingBlue,
  fixText,
  pillars,
  processIntro,
  steps,
  workWithUsText,
  workWithUsBullets,
  guaranteeText,
  faqs,
  reviews,
  fixBlueBoxText,
  workWithUsBlueBoxText,
  processBlueText,
}: {
  title: string;
  slug?: string;
  h1Desc: string;
  failHeading: string;
  failHeadingBlue: string;
  failText: string;
  fixHeading: string;
  fixHeadingBlue: string;
  fixText: string;
  pillars: { title: string; desc: string }[];
  processIntro: string;
  steps: { title: string; desc: string }[];
  workWithUsText: string;
  workWithUsBullets: string[];
  guaranteeText: string;
  faqs: { q: string; a: string }[];
  reviews: Review[];
  fixBlueBoxText?: string;
  workWithUsBlueBoxText?: string;
  processBlueText?: string;
}) {
  const icons = pillarIcons[slug] ?? [<SystemIcon key={0} />, <SystemIcon key={1} />, <WarrantyIcon key={2} />];
  const failBadges = failSectionBadges[slug] ?? ["UNPLEASANT ODOURS", "MOULD GROWTH", "DAMAGE BEYOND BATHROOM"];

  return (
    <>
      <Navbar />
      <main className="pt-[73px]">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-[#001F97] text-white relative"
        >
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 pt-16 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 pt-2"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-sm">
                {icons[0]}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-tight tracking-tight capitalize">
                {title} Services
              </h1>
              <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-xl">
                {h1Desc}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="tel:70238094"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#001F97] hover:bg-accent hover:text-[#001F97] font-black px-6 py-3.5 rounded-sm text-base transition-all active:scale-95 border-2 border-accent"
                >
                  <Phone className="h-4 w-4" />
                  7023 8094
                </a>
                <a
                  href="#quote-form"
                  className="inline-flex items-center justify-center bg-white text-[#001F97] hover:bg-accent hover:text-[#001F97] font-black px-6 py-3.5 rounded-sm text-base transition-all active:scale-95 border-2 border-accent"
                >
                  Request A Quote
                </a>
              </div>
            </motion.div>
            <AnimatedImage className="w-full" delay={0.3}>
              <ImgBox src={serviceImageMap[slug]?.hero} label={`${title} Hero Image`} aspect={slug === "leaking-shower-repair" ? "aspect-square" : "aspect-[4/3]"} className="rounded-sm shadow-lg bg-white/5 border-white/10" />
            </AnimatedImage>
          </div>

          <div className="absolute left-0 right-0 bottom-0 transform translate-y-1/2 px-6 lg:px-10 z-10">
            <div className="max-w-[1460px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: `Specialists in tile and bathroom ${title.toLowerCase()}`, icon: icons[0] },
                { title: "Long-lasting solutions for worn or damaged areas", icon: icons[1] },
                { title: "Backed by a 10 year waterproof warranty", icon: icons[2] },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-white border border-neutral-200 rounded-sm p-5 shadow-lg flex items-center gap-4 text-neutral-900 hover:border-accent transition-colors relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-accent/10 rounded-sm">
                    {badge.icon}
                  </div>
                  <p className="text-sm sm:text-base font-bold leading-snug">{badge.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <AnimatedSection className="bg-white pt-24 pb-12 border-b border-neutral-100">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-6 text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-black text-neutral-400 uppercase tracking-widest"
            >
              TRUSTED ACROSS AUSTRALIA
            </motion.p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-50 grayscale">
              {["Nelson Alexander", "Ardex", "Barry Plant", "Harcourts", "LJ Hooker", "Ray White"].map((l, i) => (
                <motion.span
                  key={l}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-base font-black tracking-wider text-neutral-500 uppercase"
                >
                  {l}
                </motion.span>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <AnimatedImage className="relative w-full">
              <ImgBox src={serviceImageMap[slug]?.fail} label="WHEN GROUT FAILS IMAGE" aspect="aspect-[4/3]" className="rounded-sm" />
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute top-4 right-4 bg-[#001F97] text-white px-3 py-1.5 text-sm font-black uppercase tracking-wider flex items-center gap-1.5 rounded-sm"
              >
                <span>🧱</span> WALL DAMAGE
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-[20%] left-[-20px] bg-[#001F97] text-white px-3 py-1.5 text-sm font-black uppercase tracking-wider flex items-center gap-1.5 rounded-sm shadow-md"
              >
                <span>🦠</span> MOULD GROWTH
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-4 right-4 bg-[#001F97] text-white px-3 py-1.5 text-sm font-black uppercase tracking-wider flex items-center gap-1.5 rounded-sm"
              >
                <span>🏠</span> HIDDEN LEAKS
              </motion.div>
            </AnimatedImage>
            <div className="space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight"
              >
                {failHeading} <span className="text-accent">{failHeadingBlue}</span>
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[16px]"
              >
                {failText.split("\n\n").map((para, i) => <p key={i}>{formatText(para)}</p>)}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-3 pt-4"
              >
                {failBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2.5 rounded-sm">
                    <div className="w-5 h-5 flex items-center justify-center bg-[#001F97] text-white rounded-full flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-[12px] font-bold text-neutral-800 tracking-wider">{badge}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-5"
              >
                <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
                  {fixHeading} <span className="text-accent">{fixHeadingBlue}</span>
                </h2>
                <div className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[16px]">
                  {fixText.split("\n\n").map((para, i) => <p key={i}>{formatText(para)}</p>)}
                </div>
              </motion.div>
              <AnimatedImage className="relative w-full">
                <ImgBox src={serviceImageMap[slug]?.fix} label="SPECIALIST FIX IMAGE" aspect={slug === "leaking-shower-repair" ? "aspect-square" : "aspect-[4/3]"} className="rounded-sm" />
                <motion.div
                  initial={{ opacity: 0, y: 10, x: 10 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-[-20px] right-4 left-4 lg:left-auto lg:right-[-20px] lg:w-[350px] bg-[#001F97] text-white p-6 shadow-xl z-10 rounded-sm"
                >
                  <p className="text-base font-bold leading-relaxed">
                    {fixBlueBoxText ?? "By removing failing grout and replacing it with durable materials designed for wet environments, we stop water penetration and restore the shower without removing tiles or undertaking a full bathroom renovation."}
                  </p>
                </motion.div>
              </AnimatedImage>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[#3D68D8] py-8 px-6 lg:px-10">
          <div className="max-w-[1460px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-black text-white"
            >
              Request A Quote
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-3"
            >
              <a href="#quote-form" className="bg-white text-[#001F97] font-bold px-5 py-2.5 rounded-sm text-base hover:bg-accent hover:text-[#001F97] transition-colors active:scale-95 border-2 border-accent">
                Request A Quote
              </a>
              <a href="tel:70238094" className="flex items-center gap-2 bg-[#001F97] text-white font-bold px-5 py-2.5 rounded-sm text-base hover:bg-[#2F63CC] transition-colors border border-white/20 active:scale-95">
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[#F3F4F6] pb-16 px-6 lg:px-10">
          <div className="max-w-[1460px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {pillars.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="bg-white border border-neutral-200 p-6 rounded-sm flex flex-col gap-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-[#EEF2FF] rounded-sm">
                    {icons[i]}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base mb-2">{p.title}</h3>
                    <p className="text-base text-neutral-600 leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-between">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
                  Our <span className="text-accent">Process</span>
                </h2>
                <p className="text-neutral-600 text-base sm:text-base leading-relaxed max-w-xl">
                  {processIntro}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="lg:text-left"
              >
                <p className="text-[#2F63CC] text-lg font-bold leading-relaxed max-w-md">
                  {processBlueText ?? "Each project is approached methodically, ensuring grout failure is addressed properly rather than covered up."}
                </p>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#F8FAFC] border border-neutral-100 p-6 rounded-sm space-y-4 flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center h-8 w-8 bg-[#001F97] text-white font-black text-base">
                      {i + 1}
                    </div>
                    <h3 className="font-bold text-neutral-900 text-lg leading-snug">{step.title}</h3>
                    <p className="text-base text-neutral-500 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="pt-2">
                    <ImgBox label={`Step ${i + 1} Image`} aspect="aspect-[16/10]" className="rounded-sm" src={i === 0 ? "/img24.jpeg" : i === 1 ? "/img25.jpeg" : "/img26.jpeg"} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight"
            >
              Client Reviews <span className="text-accent">& Testimonials</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-neutral-200 rounded-sm p-6 space-y-3 hover:border-accent hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <svg key={j} className="h-5 w-5 text-accent fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-base text-neutral-600 leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{r.name}</p>
                    <p className="text-[13px] text-neutral-400">{r.suburb}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-white text-neutral-800 py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedImage className="relative">
              <ImgBox src="/img6.avif" label="What You Get Image" aspect="aspect-[4/3]" className="rounded-sm" />
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-[-20px] right-4 left-4 lg:left-auto lg:right-[-20px] lg:w-[350px] bg-[#001F97] text-white p-6 shadow-xl z-10 rounded-sm"
              >
                <p className="text-base font-bold leading-relaxed">
                  {workWithUsBlueBoxText ?? "With experienced technicians, specialist materials and a structured repair process, you can trust that your leaking shower is fixed properly."}
                </p>
              </motion.div>
            </AnimatedImage>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl lg:text-[40px] font-bold leading-tight">
                What You Get When You <span className="text-accent">Work With Us</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-base leading-relaxed">{workWithUsText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {workWithUsBullets.map((bullet, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <DropletIcon />
                    <p className="text-base text-neutral-600 leading-relaxed font-semibold">{bullet}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
                GROUTIX <span className="text-accent">Guarantee</span>
              </h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[18px]">
                {guaranteeText.split("\n\n").map((para, i) => <p key={i}>{formatText(para)}</p>)}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 pt-2"
              >
                <a href="tel:70238094" className="inline-flex items-center gap-2 bg-[#001F97] hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95">
                  <Phone className="h-4 w-4" /> 7023 8094
                </a>
                <a href="#quote-form" className="inline-flex items-center gap-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95">
                  Request A Quote
                </a>
              </motion.div>
            </motion.div>
            <AnimatedImage className="relative">
              <ImgBox src="/img11.jpeg" label="Guarantee Image" aspect="aspect-[4/3]" className="rounded-sm" />
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-[-20px] left-4 bg-[#001F97] text-white p-6 shadow-xl z-10 w-[190px] text-center border-t-4 border-[#2F63CC]"
              >
                <div className="flex items-start justify-center gap-2">
                  <p className="text-[4rem] font-black leading-none">10</p>
                  <p className="text-[13px] font-black uppercase tracking-[0.6em] mt-2" style={{ writingMode: "vertical-rl" }}>
                    YEAR
                  </p>
                </div>
                <p className="text-[13px] font-black uppercase tracking-widest mt-2">DOUBT</p>
                <p className="text-[13px] font-black uppercase tracking-widest">FREE</p>
                <p className="text-[13px] font-black uppercase tracking-widest mt-2">GUARANTEE</p>
              </motion.div>
            </AnimatedImage>
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-[#F3F4F6] py-16 lg:py-20">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-[38px] font-bold text-neutral-900 leading-tight"
              >
                Request An<br />
                <span className="text-accent">Obligation Free Quote</span>
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 flex-shrink-0"
              >
                <a href="#quote-form" className="bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-5 py-2.5 rounded-sm text-base transition-colors active:scale-95">
                  Request A Quote
                </a>
                <a href="tel:70238094" className="flex items-center gap-2 bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-5 py-2.5 rounded-sm text-base transition-colors active:scale-95">
                  <Phone className="h-4 w-4" /> 7023 8094
                </a>
              </motion.div>
            </div>
            <PhotoSlider serviceTitle={title} />
          </div>
        </AnimatedSection>

        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10">
            <div className="space-y-6 max-w-3xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight"
              >
                Frequently Asked <span className="text-accent">Questions</span>
              </motion.h2>
              <ul className="divide-y divide-neutral-200 border border-neutral-200 p-0">
                {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
              </ul>
            </div>
          </div>
        </AnimatedSection>

        <section id="quote-form" className="relative overflow-hidden bg-[#001F97]">
          <div className="absolute inset-0">
            <Image src="/img28.jpeg" alt="Request Quote Background" fill className="object-cover" />
            <div className="absolute inset-0 bg-[#001F97]/60" />
          </div>
          <div className="relative z-10 max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative min-h-[200px] lg:min-h-[600px] flex items-start pt-[50px] pr-[50px] pl-8 pb-8"
            >
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Request A Quote
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 lg:p-12 xl:p-16 flex items-center justify-center"
            >
              <div className="w-full max-w-xl">
                <HeroQuoteForm />
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
