"use client";

import Link from "next/link";
import { Phone, Star, ChevronDown, ShieldCheck, Clock3, SearchCheck, Sparkles, BadgeCheck, Droplets, Ruler, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedSection from "./AnimatedSection";
import { useGoogleRating } from "./useGoogleRating";
import type { Review, BusinessRating } from "../lib/reviews";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  FAQ accordion                                                       */
/* ------------------------------------------------------------------ */
function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#e8eaf3] rounded-2xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
      >
        <span className="font-semibold text-[#1a1f4d] text-[15px] sm:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#2F63CC] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 sm:px-6 pb-5 text-[#4a4f6e] text-[15px] leading-relaxed">{a}</p>}
    </div>
  );
}

function Faqs({ items }: { items: { question: string; answer: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <FaqItem
          key={i}
          q={f.question}
          a={f.answer}
          open={openIdx === i}
          onToggle={() => setOpenIdx(openIdx === i ? null : i)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dynamic Google rating badge (for CTAs)                              */
/* ------------------------------------------------------------------ */
function RatingBadge({ ratingLabel, countLabel, dark = false }: { ratingLabel: string; countLabel: string; dark?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Rated ${ratingLabel} on Google`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#f5b301] text-[#f5b301]" />
        ))}
      </div>
      <span className={`text-sm font-semibold ${dark ? "text-white/90" : "text-[#1a1f4d]"}`}>
        {ratingLabel} · {countLabel} Google reviews
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function OurProcessPage({ reviews, rating }: { reviews: Review[]; rating: BusinessRating }) {
  const { ratingLabel, countLabel } = useGoogleRating();

  const STEPS = [
    {
      n: "01",
      icon: SearchCheck,
      title: "Free inspection & moisture test",
      time: "About 30 minutes",
      body: "We look before we quote. A technician inspects your grout, silicone and tiles, then runs a moisture-meter test to find exactly where water is escaping. You get an honest diagnosis on the spot — and a fixed written quote that lists what's included, how long it takes, and the warranty period. No obligation.",
      included: ["Moisture-meter diagnosis", "Fixed written quote", "Inclusions in writing"],
      photo: "technician inspecting a shower with a moisture meter",
      alt: "Technician performing a moisture test during a free shower inspection in Melbourne",
    },
    {
      n: "02",
      icon: Sparkles,
      title: "Old grout & silicone fully removed",
      time: "The thorough part",
      body: "This is where cheap jobs cut corners. We mechanically cut out all the old, porous grout — never grout over the top (new grout over old typically cracks within 6–12 months). Every failed silicone joint is stripped back, the area is vacuumed and deep-cleaned so the new work bonds properly.",
      included: ["Full grout removal — never grout-over-grout", "All failed silicone stripped", "Deep clean & vacuum first"],
      photo: "technician mechanically cutting out old shower grout",
      alt: "Old shower grout being mechanically removed before regrouting in Melbourne",
    },
    {
      n: "03",
      icon: Droplets,
      title: "Regrout with waterproof epoxy grout",
      time: "Colour-matched on the day",
      body: "We regrout with waterproof epoxy grout — the same class of product (e.g. Mapei Kerapoxy-type) Melbourne's specialist shower sealers use. It resists stains and mould, and never needs sealing. Colour-matched to your tiles. Internal corners and wall-to-floor junctions get flexible sanitary-grade silicone, never grout — grout in corners cracks and absorbs moisture.",
      included: ["Waterproof epoxy grout, colour-matched", "Silicone — not grout — at every corner", "Tap penetrations resealed"],
      photo: "fresh waterproof epoxy grout being applied to shower tiles",
      alt: "Waterproof epoxy grout being applied to shower tiles in Melbourne",
    },
    {
      n: "04",
      icon: BadgeCheck,
      title: "Seal, detail & clean up",
      time: "Finished properly",
      body: "Cement-based grout gets a penetrating sealer (epoxy grout needs none). We detail every edge, protect your shower screen and fittings throughout, and leave the bathroom clean — no dust, no mess, no half-finished joints.",
      included: ["Penetrating sealer on cement grout", "Screen & fittings protected", "Full clean-up before we leave"],
      photo: "technician detailing shower edges and sealing joints",
      alt: "Shower edges being sealed and detailed after regrouting in Melbourne",
    },
    {
      n: "05",
      icon: ShieldCheck,
      title: "Cure, aftercare & 10-year warranty",
      time: "Light use typically within 24–48 hours",
      body: "Your technician tells you exactly when the shower is ready — typically light use within 24–48 hours with epoxy grout. You also get simple aftercare (pH-neutral cleaner, squeegee, ventilation) and our 10-year waterproof warranty on every complete shower regrout, backed by your automatic rights under Australian Consumer Law.",
      included: ["Clear 'ready to use' timing", "Aftercare guide", "10-year waterproof warranty"],
      photo: "finished regrouted shower — clean, fresh grout lines",
      alt: "Finished regrouted shower in Melbourne with a 10-year waterproof warranty",
    },
  ];

  const faqs = [
    {
      question: "How long does it take to regrout a shower?",
      answer:
        "Most standard showers are finished in a single visit — the inspection takes about 30 minutes and the regrout itself usually takes a few hours depending on size. Balconies and whole bathrooms can take longer, and your fixed quote states the timeframe in writing.",
    },
    {
      question: "Can you put new grout over old grout?",
      answer:
        "No — not properly. New grout bonds only to the surface of old grout and typically cracks within 6–12 months. A proper regrout means cutting out all the old, porous grout first, which is exactly what our process does.",
    },
    {
      question: "Will regrouting fix my leaking shower?",
      answer:
        "Yes, if the leak comes from failed grout or silicone on sound tiles with an intact waterproofing membrane — that's the most common cause. It won't fix a failed membrane or a plumbing leak. Our free inspection includes a moisture test so we diagnose the real cause before we quote, and we'll tell you honestly if regrouting isn't the right fix.",
    },
    {
      question: "Do I need to remove my tiles to fix a leaking shower?",
      answer:
        "No. We never remove tiles to regrout — the whole point of the process is fixing the leak without demolition. Your shower screen also stays in place in most cases; we mask and protect it during the work.",
    },
    {
      question: "How soon can I use my shower after regrouting?",
      answer:
        "With epoxy grout, light use is typically fine within 24–48 hours. Cement-based grout needs longer plus sealing time. Your technician confirms the exact timing before leaving, so there's no guessing.",
    },
    {
      question: "Is epoxy grout better than normal grout for showers?",
      answer:
        "For showers, yes. Epoxy grout is waterproof, resists stains and mould, and never needs sealing. Standard cement grout is porous, needs a penetrating sealer, and should be resealed every year or two. That's why we regrout showers with epoxy as standard.",
    },
    {
      question: "Should shower corners be grout or silicone?",
      answer:
        "Silicone. Internal corners move slightly with the building, so grout there cracks and absorbs moisture — it's one of the most common leak causes we see. We use flexible sanitary-grade silicone at every internal corner and wall-to-floor junction.",
    },
    {
      question: "Do I need to seal the grout after regrouting?",
      answer:
        "Epoxy grout needs no sealer at all. If any cement-based grout is used, we apply a penetrating sealer as part of the job — that's included, not an extra.",
    },
    {
      question: "How much does it cost to regrout a shower in Melbourne?",
      answer:
        "It depends on shower size and condition, so we give you a fixed written quote after a free inspection — including materials, what's covered, how long it takes, and the warranty period. As a guide, regrouting costs a fraction of a full bathroom renovation, with no demolition and no retiling.",
    },
    {
      question: "Do you offer a warranty on regrouting?",
      answer:
        "Yes — a 10-year waterproof warranty on every complete shower regrout (full terms in our terms & conditions). On top of that, Australian Consumer Law automatically guarantees our services are done with due care and skill, fit for purpose, and completed within a reasonable time.",
    },
  ];

  /* Schema: FAQPage + HowTo + BreadcrumbList */
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How shower regrouting works — the Groutix process",
    description:
      "Groutix's 5-step shower regrouting process in Melbourne: free inspection and moisture test, full grout and silicone removal, waterproof epoxy regrout, sealing and clean-up, then curing, aftercare and a 10-year waterproof warranty. No tile removal.",
    totalTime: "P1D",
    step: STEPS.map((s) => ({
      "@type": "HowToStep",
      name: `Step ${s.n}: ${s.title}`,
      text: `${s.body} Included: ${s.included.join("; ")}.`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
      { "@type": "ListItem", position: 2, name: "Our Process", item: "https://groutix.com/our-process" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />

      {/* ============================ HERO — simple, centred ============================ */}
      <section className="bg-white pt-[140px] lg:pt-[160px] pb-12 lg:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#2F63CC] text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase mb-4">
              Groutix · Melbourne
            </p>
            <h1 className="text-[#001F97] text-3xl sm:text-4xl lg:text-[2.9rem] font-extrabold leading-[1.12] tracking-tight mb-5">
              Our Shower Regrouting Process in Melbourne
            </h1>
            <p className="text-[#4a4f6e] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-6">
              How does regrouting actually work? Five steps: a free inspection with a moisture test,
              full removal of old grout and silicone, a waterproof epoxy regrout, sealing and clean-up —
              then curing guidance and a 10-year waterproof warranty. No tiles removed. Most showers
              finished in a single visit.
            </p>
            <div className="mb-6"><RatingBadge ratingLabel={ratingLabel} countLabel={countLabel} /></div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+61370238094"
                className="inline-flex items-center justify-center gap-2 bg-[#001F97] hover:bg-[#002bb5] text-white font-bold rounded-xl px-8 py-4 transition shadow-[0_12px_28px_-10px_rgba(0,31,151,0.5)]"
              >
                <Phone className="w-5 h-5" /> (03) 7023 8094
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#001F97]/20 hover:border-[#001F97] text-[#001F97] font-bold rounded-xl px-8 py-4 transition"
              >
                Get a free quote <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================ QUICK ANSWER (AEO) ============================ */}
      <section className="bg-white py-10 lg:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="rounded-3xl border-2 border-[#2F63CC]/20 bg-gradient-to-br from-[#f6f8ff] to-white p-6 sm:p-8 shadow-[0_12px_40px_-16px_rgba(0,31,151,0.18)]">
              <h2 className="text-[#001F97] text-xl sm:text-2xl font-bold mb-3">How does regrouting work, in short?</h2>
              <p className="text-[#4a4f6e] text-[15px] sm:text-base leading-relaxed">
                Regrouting replaces the failed grout and silicone that let water escape behind your tiles.
                The old grout is cut out completely, joints are cleaned, and new waterproof epoxy grout is
                applied — with flexible silicone (not grout) at every internal corner, because corners move
                and grout there cracks. Done to the waterproofing heights in{" "}
                <span className="font-semibold text-[#001F97]">AS 3740</span>, the Australian Standard for
                domestic wet areas, a regrouted shower typically lasts many years with basic care.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ PROCESS STEPS — with parallel images ============================ */}
      <section id="steps" className="relative bg-[#f6f8ff] py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2F63CC_0%,transparent_40%)] opacity-[0.06]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-6">
            <p className="text-[#2F63CC] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3">How it works</p>
            <h2 className="text-[#001F97] text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              From first call to 10-year warranty
            </h2>
            <p className="text-[#4a4f6e] text-[15px] sm:text-base max-w-2xl mx-auto">
              No vague promises — this is the exact sequence your technician follows on every job.
            </p>
          </AnimatedSection>

          <AnimatedSection className="flex flex-wrap justify-center gap-2.5 mb-14">
            {[
              { icon: Sparkles, t: "5 clear steps" },
              { icon: Clock3, t: "Most done in 1 visit" },
              { icon: ShieldCheck, t: "10-year warranty" },
            ].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 bg-white border border-[#2F63CC]/25 rounded-full px-4 py-2 text-sm font-semibold text-[#001F97] shadow-sm">
                <c.icon className="w-4 h-4 text-[#2F63CC]" /> {c.t}
              </span>
            ))}
          </AnimatedSection>

          <div className="space-y-10 lg:space-y-16">
            {STEPS.map((s, i) => {
              const flip = i % 2 === 1;
              return (
                <AnimatedSection key={s.n}>
                  <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
                    {/* text */}
                    <div className={flip ? "lg:order-2" : "lg:order-1"}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#001F97] to-[#2F63CC] text-white font-extrabold text-xl flex items-center justify-center shadow-[0_10px_25px_-8px_rgba(0,31,151,0.5)] shrink-0">
                          {s.n}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2F63CC]">Step {s.n}</p>
                          <h3 className="text-[#001F97] text-xl sm:text-2xl font-bold leading-snug">{s.title}</h3>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F63CC] bg-[#2F63CC]/10 rounded-full px-3 py-1.5 mb-4">
                        <Clock3 className="w-3.5 h-3.5" /> {s.time}
                      </span>
                      <p className="text-[#4a4f6e] text-[15px] leading-relaxed mb-5">{s.body}</p>
                      <div className="flex flex-wrap gap-2">
                        {s.included.map((inc) => (
                          <span
                            key={inc}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#001F97] bg-white border border-[#2F63CC]/25 rounded-full px-3 py-1.5 shadow-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2F63CC]" /> {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* image placeholder — parallel to the step */}
                    <div className={flip ? "lg:order-1" : "lg:order-2"}>
                      <figure className="rounded-3xl overflow-hidden border border-[#e4e9f7] shadow-[0_16px_44px_-16px_rgba(0,31,151,0.22)] bg-white">
                        <div className="aspect-[4/3] bg-[#eef3ff] flex items-center justify-center text-center px-6">
                          <p className="text-[#6b7194] text-sm max-w-sm">
                            [PHOTO — Step {s.n}: {s.photo}. Replace with a real Groutix job photo.
                            Alt: &ldquo;{s.alt}&rdquo;]
                          </p>
                        </div>
                      </figure>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* CTA under steps — with dynamic reviews */}
          <AnimatedSection className="mt-14">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001F97] to-[#2F63CC] p-8 sm:p-10 text-center shadow-[0_20px_50px_-16px_rgba(0,31,151,0.5)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#ffffff_0%,transparent_40%)] opacity-10" aria-hidden />
              <div className="relative">
                <div className="mb-4"><RatingBadge ratingLabel={ratingLabel} countLabel={countLabel} dark /></div>
                <h3 className="text-white text-xl sm:text-2xl font-extrabold mb-2">
                  Start with Step 01 — it&apos;s free
                </h3>
                <p className="text-[#d6defc] text-[15px] max-w-xl mx-auto mb-6">
                  Book a free inspection and moisture test. Know exactly what&apos;s wrong, what it costs,
                  and how long it takes — before you commit to anything.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="tel:+61370238094"
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#001F97] font-bold rounded-xl px-7 py-3.5 hover:bg-[#eef3ff] transition shadow-lg"
                  >
                    <Phone className="w-5 h-5" /> (03) 7023 8094
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold rounded-xl px-7 py-3.5 transition"
                  >
                    Get a free quote <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ WHEN IT WORKS / DOESN'T ============================ */}
      <section className="bg-white py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10">
            <p className="text-[#2F63CC] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3">Honest advice</p>
            <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold mb-3">
              When regrouting works — and when it doesn&apos;t
            </h2>
            <p className="text-[#4a4f6e] text-[15px] sm:text-base max-w-2xl mx-auto">
              The honest answer most tradies skip. Regrouting is the right fix for most leaking showers —
              but not all of them. Here&apos;s how we tell the difference before you spend a dollar.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-5">
            <AnimatedSection>
              <div className="h-full rounded-3xl border-2 border-[#2F63CC]/30 bg-gradient-to-br from-[#eef3ff] to-white p-6 sm:p-8">
                <h3 className="text-[#001F97] text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2F63CC]" /> Regrouting is the right fix when
                </h3>
                <ul className="space-y-3 text-[#33415c] text-[15px] leading-relaxed">
                  <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Grout is cracked, crumbling, stained or mouldy</li>
                  <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Silicone around the base, corners or taps has failed</li>
                  <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Tiles are sound and firmly fixed (no widespread drummy tiles)</li>
                  <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> The waterproofing membrane underneath is intact</li>
                  <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> The leak appeared gradually as grout wore down</li>
                </ul>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.08}>
              <div className="h-full rounded-3xl border-2 border-[#e2b93b]/40 bg-gradient-to-br from-[#fffdf4] to-white p-6 sm:p-8">
                <h3 className="text-[#8a6d1a] text-lg font-bold mb-4 flex items-center gap-2">
                  <SearchCheck className="w-5 h-5" /> We&apos;ll tell you if you need more when
                </h3>
                <ul className="space-y-3 text-[#33415c] text-[15px] leading-relaxed">
                  <li className="flex gap-2.5"><span className="text-[#b98f1f] font-bold">!</span> The waterproofing membrane has failed (moisture test shows it)</li>
                  <li className="flex gap-2.5"><span className="text-[#b98f1f] font-bold">!</span> Large areas of tiles are loose or drummy</li>
                  <li className="flex gap-2.5"><span className="text-[#b98f1f] font-bold">!</span> Water is coming from plumbing, not the tile surface</li>
                  <li className="flex gap-2.5"><span className="text-[#b98f1f] font-bold">!</span> Structural movement keeps cracking new work</li>
                </ul>
                <p className="mt-4 text-sm text-[#6b7194]">
                  If regrouting won&apos;t solve it, we say so at the inspection — before any quote, not after.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ============================ NO TILE REMOVAL ============================ */}
      <section className="relative bg-[#001F97] py-14 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2F63CC_0%,transparent_60%)] opacity-50" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="mb-4"><RatingBadge ratingLabel={ratingLabel} countLabel={countLabel} dark /></div>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold mb-4">
              No tiles removed. No demolition. No retiling.
            </h2>
            <p className="text-[#d6defc] text-[15px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
              The most common question we hear: <em className="text-white not-italic font-semibold">&ldquo;Do you need to remove my tiles?&rdquo;</em>{" "}
              No — the entire process works around your existing tiles, and your shower screen stays in place
              in most cases (we mask and protect it). That&apos;s why regrouting costs a fraction of a full
              renovation, with none of the dust, downtime or retiling.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+61370238094"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#001F97] font-bold rounded-xl px-7 py-3.5 hover:bg-[#eef3ff] transition shadow-lg"
              >
                <Phone className="w-5 h-5" /> (03) 7023 8094
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold rounded-xl px-7 py-3.5 transition"
              >
                Get a free quote
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ EPOXY EXPLAINER ============================ */}
      <section className="bg-white py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <AnimatedSection>
              <p className="text-[#2F63CC] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3">Step 03, in depth</p>
              <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold mb-4">
                Why we regrout showers with epoxy grout
              </h2>
              <p className="text-[#4a4f6e] text-[15px] sm:text-base leading-relaxed mb-4">
                Standard cement grout is porous — it absorbs water, stains, grows mould, and needs a
                penetrating sealer plus resealing every year or two. Epoxy grout is a different material
                entirely: waterproof through its full depth, highly stain-resistant, and hostile to mould.
              </p>
              <ul className="space-y-2.5 text-[#33415c] text-[15px]">
                <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Waterproof — no sealer needed, ever</li>
                <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Resists stains, soap scum and mould regrowth</li>
                <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Colour-matched to your existing tiles</li>
                <li className="flex gap-2.5"><span className="text-[#2F63CC] font-bold">✓</span> Backed by our 10-year waterproof warranty</li>
              </ul>
              <p className="mt-4 text-sm text-[#6b7194]">
                Related service: <Link href="/epoxy-grout" className="text-[#2F63CC] font-semibold underline underline-offset-2">epoxy grout regrouting</Link> in detail.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.08}>
              <figure className="rounded-3xl overflow-hidden border border-[#e4e9f7] shadow-[0_16px_44px_-16px_rgba(0,31,151,0.22)]">
                <div className="aspect-[4/3] bg-[#eef3ff] flex items-center justify-center text-center px-6">
                  <p className="text-[#6b7194] text-sm max-w-sm">
                    [PHOTO: before / after shower regrout — replace with a real Groutix job photo.
                    Alt: "Before and after shower regrouting in Melbourne — mouldy grout replaced with epoxy grout"]
                  </p>
                </div>
              </figure>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ============================ TIMELINE STRIP ============================ */}
      <section className="bg-[#f6f8ff] py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold">How long does it all take?</h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: SearchCheck, top: "~30 min", sub: "Free inspection & moisture test" },
              { icon: Clock3, top: "1 visit", sub: "Most showers regrouted same day" },
              { icon: Droplets, top: "24–48 hrs", sub: "Typical wait before light shower use" },
              { icon: ShieldCheck, top: "10 years", sub: "Waterproof warranty on complete regrouts" },
            ].map((s, i) => (
              <AnimatedSection key={i} delay={i * 0.06}>
                <div className="bg-white rounded-3xl border border-[#e4e9f7] p-5 text-center h-full shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-[#001F97]/10 to-[#2F63CC]/10 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-[#001F97]" />
                  </div>
                  <p className="text-[#001F97] text-xl font-extrabold">{s.top}</p>
                  <p className="text-[#6b7194] text-[13px] mt-1">{s.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ TRUST / STANDARDS ============================ */}
      <section className="bg-white py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10">
            <p className="text-[#2F63CC] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3">Why trust us</p>
            <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold mb-3">
              Done to Australian standards — and guaranteed by law
            </h2>
            <p className="text-[#4a4f6e] text-[15px] sm:text-base max-w-2xl mx-auto">
              A warranty is only as good as the work behind it. Here&apos;s what backs every Groutix regrout.
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Ruler,
                title: "AS 3740 waterproofing heights",
                body: "We work to the heights in AS 3740, the Australian Standard for waterproofing domestic wet areas — shower walls protected to at least 1,800 mm, as the NCC 2022 requires.",
              },
              {
                icon: BadgeCheck,
                title: "Licensed-trade standards",
                body: "Waterproofing is regulated work in Victoria. We follow the requirements of the state's building and plumbing regulator on every job.",
              },
              {
                icon: ShieldCheck,
                title: "10-year waterproof warranty",
                body: "Every complete shower regrout carries our 10-year waterproof warranty. Full terms are in our terms & conditions — ask us anything before you book.",
              },
              {
                icon: Star,
                title: "Your ACCC consumer guarantees",
                body: "Australian Consumer Law automatically guarantees our services are performed with due care and skill, are fit for purpose, and are completed within a reasonable time.",
              },
            ].map((c, i) => (
              <AnimatedSection key={i} delay={i * 0.06}>
                <div className="h-full bg-[#f6f8ff] rounded-3xl border border-[#e4e9f7] p-6 hover:border-[#2F63CC]/40 hover:shadow-lg transition">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#001F97] to-[#2F63CC] flex items-center justify-center mb-4 shadow-md shadow-[#001F97]/20">
                    <c.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-[#001F97] font-bold text-[15px] mb-2">{c.title}</h3>
                  <p className="text-[#4a4f6e] text-sm leading-relaxed">{c.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection className="text-center mt-8">
            <div className="mb-3"><RatingBadge ratingLabel={ratingLabel} countLabel={countLabel} /></div>
            <p className="text-[#6b7194] text-sm">
              Warranty terms: <Link href="/terms-conditions" className="text-[#2F63CC] font-semibold underline underline-offset-2">terms &amp; conditions</Link>
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ SERVICE LINKS ============================ */}
      <section className="bg-[#f6f8ff] py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold mb-3">
              The same process, across every service
            </h2>
            <p className="text-[#4a4f6e] text-[15px] sm:text-base max-w-2xl mx-auto">
              Inspection, removal, regrout, seal, warranty — adapted to each job type.
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: "/shower-regrouting", t: "Shower Regrouting", d: "The core service — leaking and mouldy showers fixed without retiling." },
              { href: "/leaking-shower-repair", t: "Leaking Shower Repair", d: "Diagnosis-first leak repair, from grout failure to full reseals." },
              { href: "/balcony-leak-repairs", t: "Balcony Leak Repairs", d: "Balcony regrouting and leak repair, including efflorescence treatment." },
              { href: "/tile-regrouting", t: "Tile Regrouting", d: "Whole-room and floor regrouts for bathrooms, laundries and kitchens." },
              { href: "/epoxy-grout", t: "Epoxy Grout", d: "Waterproof epoxy grout upgrades for showers and wet areas." },
              { href: "/silicone-recaulking", t: "Silicone Recaulking", d: "Failed silicone stripped and replaced at every joint and corner." },
            ].map((c, i) => (
              <AnimatedSection key={c.href} delay={i * 0.05}>
                <Link
                  href={c.href}
                  className="group block h-full bg-white rounded-3xl border border-[#e4e9f7] p-6 hover:border-[#2F63CC]/50 hover:shadow-[0_16px_40px_-14px_rgba(0,31,151,0.25)] hover:-translate-y-0.5 transition-all"
                >
                  <h3 className="text-[#001F97] font-bold text-[16px] mb-1.5 group-hover:text-[#2F63CC] transition flex items-center gap-2">
                    {c.t} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  <p className="text-[#6b7194] text-sm leading-relaxed">{c.d}</p>
                </Link>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection className="text-center mt-8">
            <p className="text-[#4a4f6e] text-[15px]">
              Servicing Melbourne and regional Victoria — see{" "}
              <Link href="/locations/melbourne" className="text-[#2F63CC] font-semibold underline underline-offset-2">
                all service areas
              </Link>
              .
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section id="faq" className="bg-white py-14 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8">
            <p className="text-[#2F63CC] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3">FAQ</p>
            <h2 className="text-[#001F97] text-2xl sm:text-3xl font-extrabold mb-3">
              Process questions, answered straight
            </h2>
            <p className="text-[#4a4f6e] text-[15px] sm:text-base">
              The questions Melbourne customers actually ask us — and the answers we give on every job.
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <Faqs items={faqs} />
          </AnimatedSection>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="relative bg-[#001F97] py-14 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2F63CC_0%,transparent_55%)] opacity-60" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="mb-4"><RatingBadge ratingLabel={ratingLabel} countLabel={countLabel} dark /></div>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold mb-4">
              See the process on your own shower — free inspection
            </h2>
            <p className="text-[#d6defc] text-[15px] sm:text-base max-w-xl mx-auto mb-8">
              Book a free inspection and moisture test. You&apos;ll know exactly what&apos;s wrong, what it
              costs, and how long it takes — before you commit to anything.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+61370238094"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#001F97] font-bold rounded-xl px-8 py-4 hover:bg-[#eef3ff] transition shadow-lg"
              >
                <Phone className="w-5 h-5" /> (03) 7023 8094
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold rounded-xl px-8 py-4 transition"
              >
                Request a free quote <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  );
}
