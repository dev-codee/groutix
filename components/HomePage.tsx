"use client";
import React, { useState } from "react";import Image from "next/image";import Link from "next/link";
import { Phone, Check, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";

/* ─── Image placeholder ─── */
function ImgBox({
  label,
  aspect = "aspect-[4/3]",
  className = "",
  src,
}: {
  label: string;
  aspect?: string;
  className?: string;
  src?: string;
}) {
  return (
    <div className={`relative ${aspect} w-full overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={label} fill className="object-cover" />
      ) : (
        <>
          <div className="absolute inset-0 bg-neutral-100 border border-neutral-200" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="relative z-10 flex h-full items-center justify-center text-center px-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
              <p className="text-[10px] text-neutral-300">Add photo manually</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Droplet icon for bullets ─── */
const DropletIcon = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="flex-shrink-0 mt-0.5">
    <path d="M7 3V17C3.134 17 0 13.866 0 10C0 6.134 3.134 3 7 3Z" fill="#2F63CC"/>
    <path d="M14 10C14 13.866 10.866 17 7 17V3C10.866 3 14 6.134 14 10Z" fill="#97B1E5"/>
  </svg>
);

/* ─── FAQ item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-neutral-900 text-sm sm:text-base leading-snug">{q}</span>
        {open
          ? <ChevronUp className="h-5 w-5 text-[#2F63CC] flex-shrink-0" />
          : <ChevronDown className="h-5 w-5 text-neutral-400 flex-shrink-0" />}
      </button>
      {open && <p className="pb-5 text-sm text-neutral-600 leading-relaxed">{a}</p>}
    </div>
  );
}

const FAQS = [
  {
    q: "How Long Does Shower Regrouting Take?",
    a: "Most shower regrouting jobs are completed within a single day, depending on the condition of the grout and any required repair work. Your technician will give you a more precise timeframe during the quote.",
  },
  {
    q: "Do I Need To Remove My Tiles?",
    a: "In most cases, no. Our services are designed to fix grout and sealing issues without removing tiles. We remove the failed grout and apply new, high performance grout specifically designed for wet areas.",
  },
  {
    q: "Will The New Grout Match My Existing Tiles?",
    a: "We carry a wide range of grout colours to match or complement your existing tiles. Our technician will help you select the best colour during the quote.",
  },
  {
    q: "How Long Before I Can Use My Shower?",
    a: "We recommend waiting 24–48 hours before using your shower after regrouting to allow the grout and sealant to fully cure.",
  },
  {
    q: "Do You Offer A Warranty?",
    a: "Yes. Every full shower regrout completed by GROUTIX is backed by our 10-year waterproof warranty, giving you peace of mind that the job is done properly.",
  },
];

const SERVICES = [
  {
    slug: "shower-regrouting",
    title: "Shower Regrouting",
    desc: "Shower regrouting is our core specialty. We remove failing grout and regrout the shower using durable, moisture-resistant grout designed specifically for wet areas.",
  },
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Our tile regrouting service refreshes tired or stained grout lines throughout bathrooms, laundries, kitchens, balconies and other tiled surfaces.",
  },
  {
    slug: "shower-base-repair",
    title: "Shower Base Repair",
    desc: "We repair cracked and leaking shower bases to restore the waterproof floor without full demolition.",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "Leaking showers require more than sealant. We identify where water is escaping, repair compromised grout and seals and fully regrout to stop the leak at the source.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "For loose, cracked or damaged tiles, we provide small tiling repairs that integrate seamlessly with existing finishes.",
  },
  {
    slug: "real-estate-property-services",
    title: "Real Estate & Property Services",
    desc: "We partner with residential property managers, mum-and-dad investors, strata companies and commercial owners to provide fast, reliable maintenance solutions.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ══════════════════════════════════════
            SECTION 1 — HERO
            Left: title + desc + 2 buttons + 3 badges
            Right: Quote Form
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-[73px] min-h-[calc(100vh-73px)]">
          <div className="absolute inset-0">
            <Image src="/main pic.avif" alt="Homepage hero background" fill className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,31,151,0.92),rgba(15,57,193,0.8),rgba(0,16,56,0.95))]" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:40px_40px] opacity-80" />
          <div className="relative z-10 max-w-[1460px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-start">

              {/* Left */}
              <div className="space-y-6 text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#97B1E5] block" />
                  10-year waterproof warranty
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight leading-tight max-w-3xl">
                  Australia&apos;s most trusted <span className="text-[#97B1E5]">shower restoration</span> specialists
                </h1>
                <p className="text-white/80 text-sm sm:text-[17px] max-w-2xl leading-relaxed">
                  Leading shower regrouting, base repair and leaking shower fixes with high-performance waterproof systems that keep your bathroom dry and beautiful.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="tel:70238094"
                    className="inline-flex items-center justify-center gap-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-black px-7 py-3.5 rounded-full text-sm transition-all"
                  >
                    <Phone className="h-4 w-4" /> 7023 8094
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-7 py-3.5 rounded-full text-sm transition-all"
                  >
                    Get a Free Quote Online
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-white/10">
                  {[
                    "Specialists in shower regrouting and leaking shower repair",
                    "10-year waterproof warranty for total peace of mind",
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-3xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                      <Check className="h-4 w-4 text-[#97B1E5] flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-white/85 leading-snug">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Quote Form */}
              <div className="w-full max-w-[540px] self-start">
                <QuoteForm />
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — TRUSTED ACROSS AUSTRALIA
        ══════════════════════════════════════ */}
        <section className="bg-white py-10 border-b border-neutral-100">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 flex flex-col items-center gap-6">
            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">TRUSTED ACROSS AUSTRALIA</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14 opacity-50 grayscale">
              {["Nelson Alexander","Ardex","Barry Plant","Biggin & Scott","Harcourts","LJ Hooker","Ray White","McGrath"].map(l => (
                <span key={l} className="text-sm font-black tracking-wider text-neutral-600 uppercase">{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 3 — FIX YOUR SHOWER
            Left: Heading + desc
            Right: Image
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Fix Your Shower Without a{" "}
                <span className="text-[#001F97]">Full Renovation</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Our proven process stops leaks at the source, improving hygiene and restoring the look of your shower – all without the cost or disruption of a full bathroom renovation. We regrout, reseal and repair showers using systems designed specifically for wet areas.
              </p>
              <a
                href="#quote-form"
                className="inline-flex items-center gap-2 bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors"
              >
                Request A Quote
              </a>
            </div>
            <div>
              <ImgBox src="/Image.avif" label="Fix Your Shower Image" aspect="aspect-[4/3]" className="rounded-sm" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 4 — OUR SERVICES
        ══════════════════════════════════════ */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Our <span className="text-[#001F97]">Services</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                GROUTIX provides specialist tile and grout services for residential and commercial properties across Australia. Our team is solely focused on tile and grout — not general tiling or renovations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="group border border-neutral-200 rounded-sm p-6 hover:border-[#001F97] hover:shadow-md transition-all flex flex-col justify-between gap-6 bg-white"
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-neutral-900 text-lg group-hover:text-[#001F97] transition-colors">{s.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-[#2F63CC] group-hover:underline">Learn more →</span>
                </Link>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/contact" className="bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                Request A Quote
              </Link>
              <a href="tel:70238094" className="bg-[#F3F4F6] hover:bg-neutral-200 text-neutral-900 font-bold px-6 py-3 rounded-sm text-sm transition-colors flex items-center gap-2">
                <Phone className="h-4 w-4" /> Get In Touch
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 5 — LEAKING SHOWERS START WITH GROUT PROBLEMS
            Left: Image
            Right: Heading + 3 problem badges
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Image */}
            <div>
              <ImgBox src="/Image-1v2.avif" label="Leaking Shower Image" aspect="aspect-[4/3]" className="rounded-sm" />
            </div>
            {/* Right */}
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Leaking Showers Start{" "}
                <span className="text-[#001F97]">With Grout Problems</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Cracked, porous or deteriorated grout allows water to penetrate behind shower tiles. Once moisture gets behind the tiles it can travel unseen, causing damage that goes far beyond the bathroom.
              </p>
              <div className="space-y-4">
                {[
                  { title: "STRUCTURAL DAMAGE", desc: "Water behind tiles weakens structural elements over time, leading to expensive repairs." },
                  { title: "MOULD GROWTH", desc: "Trapped moisture creates the perfect conditions for mould growth, affecting indoor air quality." },
                  { title: "TIMBER ROT", desc: "Water seeping into floors and walls causes timber framing and flooring to rot." },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white border border-neutral-200 rounded-sm p-4">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#001F97] text-white rounded-full">
                      <span className="text-xs font-black">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#001F97] uppercase tracking-widest mb-1">{b.title}</p>
                      <p className="text-sm text-neutral-600 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 6 — A PERMANENT SOLUTION
        ══════════════════════════════════════ */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 max-w-4xl">
            <div className="max-w-4xl space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                A Permanent Solution,{" "}
                <span className="text-[#001F97]">Not a Temporary Patch</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                At GROUTIX, we don&apos;t apply surface sealants or cosmetic fixes that fail months later. Our technicians remove failed grout, repair affected areas and regrout the shower using high performance cement-based systems designed specifically for wet areas.
              </p>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Each job we undertake follows a proven, repeatable process refined over decades and is backed by our industry-leading 10-year waterproof warranty.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 7 — GAIN PEACE OF MIND CTA BANNER
        ══════════════════════════════════════ */}
        <section className="bg-[#001F97] py-14 px-6 lg:px-10">
          <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight max-w-2xl">
              Gain peace of mind and confidence that your shower has been repaired properly the first time.
            </h2>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/contact" className="bg-white text-[#001F97] hover:bg-neutral-100 font-black px-6 py-3 rounded-sm text-sm transition-colors">
                Request A Quote
              </Link>
              <a href="tel:70238094" className="flex items-center gap-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 8 — CLIENT REVIEWS & TESTIMONIALS
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900">
              Client Reviews <span className="text-[#001F97]">&amp; Testimonials</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Jody Lansdowne", suburb: "Posted on Google", stars: 5, review: "Outstanding work! Very happy with the job and service. I would recommend these guys. Very tidy." },
                { name: "Veronica", suburb: "Posted on Google", stars: 5, review: "I have had 2 showers re-grouted (floor and walls) and am really happy with the end result. The entire bathrooms look so good." },
                { name: "Lars Madsen", suburb: "Posted on Google", stars: 5, review: "Carlos did a really good job of our ensuite. Come up as if newly tiled. Not bad for a 23 year old bathroom. Great work." },
              ].map((r, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <svg key={j} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{r.name}</p>
                    <p className="text-[11px] text-neutral-400">{r.suburb}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 9 — GROUTIX GUARANTEE
            Left: Text + 2 images
            Right: Big image
        ══════════════════════════════════════ */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                GROUTIX <span className="text-[#001F97]">Guarantee</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Every shower regrouting job completed by GROUTIX is backed by our industry-leading 10-year waterproof warranty. We stand behind our work because our systems are designed to last — and because we believe you deserve a solution that holds up over time.
              </p>
              <div className="flex gap-3">
                <Link href="/contact" className="bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                  Request A Quote
                </Link>
                <a href="tel:70238094" className="flex items-center gap-2 border border-neutral-300 hover:border-[#001F97] text-neutral-900 font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                  <Phone className="h-4 w-4" /> 7023 8094
                </a>
              </div>
            </div>
            <div>
              <ImgBox src="/home-page-2.jpeg" label="Guarantee Image" aspect="aspect-[3/4]" className="rounded-sm" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 10 — WHY CHOOSE US?
            Left: Heading + checklist
            Right: Image
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
                Why <span className="text-[#001F97]">Choose Us?</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                Here&apos;s why homeowners and property managers across Australia trust GROUTIX.
              </p>
              <ul className="space-y-3">
                {[
                  "Australia's largest dedicated shower regrouting specialist",
                  "Proven systems refined over decades",
                  "High performance grout options available",
                  "10-year waterproof warranty for peace of mind",
                  "Specialist technicians – not general tilers or handymen",
                  "Obligation-free quotes with no hidden fees",
                  "Professional, ethical and friendly service",
                  "Trusted by homeowners, strata managers & commercial clients nationwide",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <DropletIcon />
                    <span className="text-sm text-neutral-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ImgBox src="/Image-2.avif" label="Why Choose Us Image" aspect="aspect-[4/3]" className="rounded-sm" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 11 — FREQUENTLY ASKED QUESTIONS
        ══════════════════════════════════════ */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 max-w-3xl">
            <div className="max-w-3xl space-y-8">
              <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900">
                Frequently Asked <span className="text-[#001F97]">Questions</span>
              </h2>
              <div className="divide-y divide-neutral-200 border-t border-neutral-200">
                {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 12 — REQUEST AN OBLIGATION FREE QUOTE
            Left/center: heading + buttons
            (This is a blue banner with CTAs)
        ══════════════════════════════════════ */}
        <section className="bg-[#3D68D8] py-14 px-6 lg:px-10">
          <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              Request An <span className="text-white/80">Obligation Free Quote</span>
            </h2>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/contact" className="bg-white text-[#001F97] hover:bg-neutral-100 font-black px-6 py-3 rounded-sm text-sm transition-colors">
                Get In Touch
              </Link>
              <a href="tel:70238094" className="flex items-center gap-2 bg-[#001F97] hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors border border-white/20">
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
