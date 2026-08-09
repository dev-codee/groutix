"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Ruler,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Phone,
  ArrowRight,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { SHOWER_SCREEN_MODELS, type ShowerScreenModel } from "@/lib/showerScreensData";
import CtaBanner from "@/components/CtaBanner";
import AnimatedSection from "@/components/AnimatedSection";
import { useContact } from "@/components/SiteContentProvider";

/* ────── Image Placeholder Component ────── */
function ImgBox({ label, aspect = "aspect-[4/3]" }: { label: string; aspect?: string }) {
  return (
    <div
      className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm`}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1 z-10">
        <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] text-neutral-300">Picture space — add manually</p>
      </div>
    </div>
  );
}

/* ────── FAQ Data ────── */
const FAQS = [
  {
    q: "How does the custom shower screen process work?",
    a: "We begin with a free initial consultation and quote. Once approved, our experienced technician visits your home to conduct precise laser measurements. Your screen is then custom-fabricated and installed on-site by our skilled professionals for a perfect fit.",
  },
  {
    q: "What is the difference between frameless, semi-frameless, and sliding screens?",
    a: "Frameless screens use thick 10mm toughened glass secured with minimal metal brackets for a sleek, luxury look. Semi-frameless screens (like Neptune & Optima) feature a perimeter frame for strength while keeping glass edges clean. Sliding screens (like Momentum & Frameless Sliders) glide along top/bottom tracks, ideal for saving space in compact bathrooms.",
  },
  {
    q: "Can I request frosted or obscured glass for privacy?",
    a: "Yes! Most of our models (including Bespoke Frameless, Neptune, and SwiftCloset) offer frosted, low-iron, or obscured cathedral glass options to provide your desired level of privacy and light diffusion.",
  },
  {
    q: "What is the optional Nano4-Glass ceramic coating?",
    a: "Nano4-Glass is an advanced ultra-thin ceramic hydrophobic coating applied to the glass surface. It repels water, soap scum, grime, and mineral buildup, making your screen drastically easier to clean while protecting it against permanent glass staining.",
  },
  {
    q: "Are all your shower screens compliant with Australian Standards?",
    a: "Absolutely. All glass supplied by Groutix is manufactured in accordance with AS/NZS 2208 safety glass standards, ensuring maximum strength, durability, and safety for your home.",
  },
];

export default function ShowerScreensClient() {
  const { phone, tel } = useContact();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const categories = ["All", "Frameless", "Semi-Frameless", "Sliding", "Wardrobes"];

  const filteredModels =
    filterCategory === "All"
      ? SHOWER_SCREEN_MODELS
      : SHOWER_SCREEN_MODELS.filter((m) => m.category === filterCategory);

  return (
    <main className="pt-[73px] bg-neutral-50 text-neutral-900 min-h-screen">
      {/* ────── Hero Section ────── */}
      <section className="relative bg-primary text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,214,79,0.15),_transparent_50%)] pointer-events-none" />
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Premium Glass &amp; Installation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              Custom Shower Screens <span className="text-accent">&amp; Enclosures</span>
            </h1>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed max-w-2xl font-normal">
              Bespoke frameless, semi-frameless, and sliding shower screens custom-measured and installed across Victoria. Built with Australian toughened safety glass for lasting elegance and effortless maintenance.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#models"
                className="bg-accent hover:bg-accent/90 text-primary font-black px-8 py-3.5 rounded shadow-md transition-all duration-200 text-base tracking-wide border-2 border-accent"
              >
                Explore Screen Models
              </a>
              <a
                href={tel}
                className="flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded transition-all duration-200 text-base tracking-wide"
              >
                <Phone className="h-4 w-4" />
                Call {phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ImgBox label="Hero Shower Screen Showcase Image" aspect="aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* ────── Key Value Pillars ────── */}
      <section className="py-12 bg-white border-b border-neutral-200">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Ruler className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Custom On-Site Laser Fits</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Every screen is custom-measured on-site by our Melbourne specialists for a guaranteed, flawless alignment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">AS/NZS Toughened Glass</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Crafted from 10mm or 6mm certified Australian toughened safety glass for ultimate strength and peace of mind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Optional Nano4-Glass Protection</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Optional ceramic coating repels water spots, soap scum, and hard water stains for effortless cleaning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────── 6-Model Product Catalog Grid ────── */}
      <AnimatedSection className="py-16 lg:py-24" id="models">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight">
                Our Shower Screen <span className="text-accent">Range</span>
              </h2>
              <p className="text-neutral-600 text-base mt-2 max-w-2xl">
                Explore our six distinct screen systems and wardrobe doors. Click any model to view its dedicated specifications page.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 bg-neutral-200/60 p-1.5 rounded-lg">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                    filterCategory === cat
                      ? "bg-primary text-white shadow-sm"
                      : "text-neutral-700 hover:bg-white/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col group hover:shadow-xl hover:border-primary transition-all duration-300"
              >
                {/* Image Placeholder */}
                <Link href={`/shower-screens/${model.id}`} className="relative block">
                  <ImgBox label={model.imageLabel} aspect="aspect-[4/3]" />
                  <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded shadow">
                    {model.category}
                  </span>
                </Link>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/shower-screens/${model.id}`}>
                      <h3 className="font-bold text-xl text-neutral-900 group-hover:text-primary transition-colors">
                        {model.name}
                      </h3>
                    </Link>
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {model.tagline}
                    </p>
                    <p className="text-sm text-neutral-600 leading-relaxed pt-1">{model.summary}</p>
                  </div>

                  {/* Highlight badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {model.highlights.map((h, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-100 text-neutral-700 text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/shower-screens/${model.id}`}
                    className="w-full mt-4 bg-neutral-900 hover:bg-primary text-white font-bold py-3 px-4 rounded text-sm tracking-wide transition-colors flex items-center justify-center gap-2 group-hover:shadow"
                  >
                    <span>View Specifications &amp; Details</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ────── Side-by-Side Model Comparison Table ────── */}
      <AnimatedSection className="py-16 bg-white border-t border-b border-neutral-200">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-neutral-900">
              Model <span className="text-accent">Comparison Matrix</span>
            </h2>
            <p className="text-neutral-600 text-base">
              Compare key specifications across our screen models to choose the perfect system for your bathroom project.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Model Series</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Glass Thickness</th>
                  <th className="p-4 font-bold">Door Operation</th>
                  <th className="p-4 font-bold">Nano4 Coating</th>
                  <th className="p-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {SHOWER_SCREEN_MODELS.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                    <td className="p-4 font-bold text-neutral-900">
                      <Link href={`/shower-screens/${m.id}`} className="hover:text-primary hover:underline">
                        {m.name}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-neutral-600">{m.category}</td>
                    <td className="p-4 text-neutral-700">{m.specs.glass.split(" ")[0]}</td>
                    <td className="p-4 text-neutral-700">{m.specs.doorAction.split(" ")[0]}</td>
                    <td className="p-4 text-emerald-600 font-semibold">Optional</td>
                    <td className="p-4">
                      <Link
                        href={`/shower-screens/${m.id}`}
                        className="text-accent font-bold text-xs uppercase tracking-wider hover:underline"
                      >
                        View Page &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedSection>

      {/* ────── FAQs Section ────── */}
      <AnimatedSection className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-accent font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="h-4 w-4" /> Got Questions?
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900">
              Shower Screen <span className="text-accent">FAQs</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-base text-neutral-900 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronDown className="h-5 w-5 text-accent shrink-0" /> : <ChevronRight className="h-5 w-5 text-neutral-400 shrink-0" />}
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ────── CTA Banner ────── */}
      <CtaBanner />
    </main>
  );
}
