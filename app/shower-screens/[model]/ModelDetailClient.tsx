"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Phone,
  Check,
  Sliders,
  ShieldCheck,
  Ruler,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import type { ShowerScreenModel } from "@/lib/showerScreensData";
import CtaBanner from "@/components/CtaBanner";
import AnimatedSection from "@/components/AnimatedSection";
import { useContact } from "@/components/SiteContentProvider";

/* ────── Image Placeholder Component ────── */
function ImgBox({ label, aspect = "aspect-[16/9]" }: { label: string; aspect?: string }) {
  return (
    <div
      className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-lg shadow-sm`}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-accent z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-accent z-10 pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1.5 z-10">
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs text-neutral-300">Picture space - add manually</p>
      </div>
    </div>
  );
}

export default function ModelDetailClient({
  model,
  allModels,
}: {
  model: ShowerScreenModel;
  allModels: ShowerScreenModel[];
}) {
  const { phone, tel } = useContact();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const otherModels = allModels.filter((m) => m.id !== model.id);

  const MODEL_FAQS = [
    {
      q: `What is the lead time for ${model.name}?`,
      a: "Following your on-site laser measurement, custom fabrication takes approximately 7 to 10 business days. Our mobile installation team then fits your screen on-site in a single visit.",
    },
    {
      q: `Can ${model.name} be customized to non-standard bathroom sizes?`,
      a: "Yes! Every single screen is custom-built to your exact bathroom dimensions. Our expert technicians measure on-site to guarantee a 100% precision fit, even for non-plumb walls or unique shower bases.",
    },
    {
      q: `Is the Nano4-Glass ceramic coating recommended for ${model.name}?`,
      a: "We highly recommend the optional Nano4-Glass coating. It bonds molecularly to the glass surface, repelling water, soap scum, and limescale, which reduces cleaning effort by up to 90%.",
    },
  ];

  return (
    <main className="pt-[73px] bg-neutral-50 text-neutral-900 min-h-screen">
      {/* ────── Breadcrumb Header ────── */}
      <div className="bg-neutral-900 text-neutral-300 py-3.5 border-b border-neutral-800">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 flex items-center flex-wrap gap-2 text-xs sm:text-sm">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          <Link href="/services" className="hover:text-white transition-colors">
            Services
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          <Link href="/shower-screens" className="hover:text-white transition-colors">
            Shower Screens
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-accent font-semibold truncate max-w-[200px] sm:max-w-none">
            {model.name}
          </span>
        </div>
      </div>

      {/* ────── Hero Section ────── */}
      <section className="relative bg-primary text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,214,79,0.15),_transparent_50%)] pointer-events-none" />
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent tracking-wide uppercase">
              {model.category} Series
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
              {model.name}
            </h1>
            <p className="text-accent text-lg sm:text-xl font-bold">{model.tagline}</p>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
              {model.summary}
            </p>

            {/* Highlights pill tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {model.highlights.map((h, i) => (
                <span
                  key={i}
                  className="bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded border border-white/20"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href={`/contact?enquiry=${encodeURIComponent(model.name)}`}
                className="bg-accent hover:bg-accent/90 text-primary font-black px-8 py-3.5 rounded shadow-md transition-all duration-200 text-base tracking-wide border-2 border-accent text-center"
              >
                Get a Quote for This Model
              </Link>
              <a
                href={tel}
                className="flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded transition-all duration-200 text-base tracking-wide"
              >
                <Phone className="h-4 w-4" />
                Call {phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ImgBox label={`${model.name} Hero Showcase Image`} aspect="aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* ────── Main Product Content & Specifications ────── */}
      <AnimatedSection className="py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Detailed Narrative & Features */}
          <div className="lg:col-span-7 space-y-10">
            {/* Overview */}
            <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900">Overview &amp; Design Philosophy</h2>
              <div className="space-y-4 text-neutral-700 text-base leading-relaxed">
                {model.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Feature List */}
            <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <Check className="h-6 w-6 text-accent" /> Key Features &amp; Options
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {model.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-neutral-700 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Groutix Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-lg border border-neutral-200 text-center space-y-2">
                <Ruler className="h-7 w-7 text-primary mx-auto" />
                <h4 className="font-bold text-sm text-neutral-900">Laser Precision</h4>
                <p className="text-xs text-neutral-600">On-site laser measurements ensure 100% exact fit.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-neutral-200 text-center space-y-2">
                <ShieldCheck className="h-7 w-7 text-primary mx-auto" />
                <h4 className="font-bold text-sm text-neutral-900">AS/NZS 2208 Glass</h4>
                <p className="text-xs text-neutral-600">Australian certified safety glass for maximum strength.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-neutral-200 text-center space-y-2">
                <Sparkles className="h-7 w-7 text-primary mx-auto" />
                <h4 className="font-bold text-sm text-neutral-900">Nano4 Shield</h4>
                <p className="text-xs text-neutral-600">Optional ceramic coating for water-repelling ease.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Technical Specifications Table & Quote Box */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-sm space-y-6 sticky top-[95px]">
              <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
                <Sliders className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-neutral-900">Technical Specifications</h3>
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-600 w-1/3">Glass Type</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{model.specs.glass}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-neutral-600">Hardware &amp; Finishes</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{model.specs.frameFinishes}</td>
                    </tr>
                    <tr className="bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-600">Door Operation</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{model.specs.doorAction}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-neutral-600">Dimensions &amp; Fit</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{model.specs.dimensions}</td>
                    </tr>
                    <tr className="bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-neutral-600">Protective Coating</td>
                      <td className="px-4 py-3 text-neutral-900 font-medium">{model.specs.coating}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Direct Enquiry Box */}
              <div className="bg-primary text-white p-6 rounded-lg space-y-4">
                <h4 className="font-bold text-lg">Interested in {model.name}?</h4>
                <p className="text-white/80 text-sm">
                  Book a free on-site measurement or request a quick estimate from your bathroom dimensions.
                </p>
                <Link
                  href={`/contact?enquiry=${encodeURIComponent(model.name)}`}
                  className="block w-full bg-accent hover:bg-accent/90 text-primary font-black py-3 px-4 rounded text-center text-sm tracking-wide transition-colors"
                >
                  Request a Free Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ────── Other Models in Our Range ────── */}
      <AnimatedSection className="py-16 bg-white border-t border-b border-neutral-200">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-neutral-900">
                Explore Other <span className="text-accent">Shower Screen Models</span>
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base mt-1">
                Compare {model.name} with our other frameless, semi-frameless, and sliding systems.
              </p>
            </div>
            <Link
              href="/shower-screens"
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> View All 6 Models
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherModels.map((other) => (
              <div
                key={other.id}
                className="bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden flex flex-col group hover:shadow-md hover:border-primary transition-all"
              >
                <ImgBox label={other.imageLabel} aspect="aspect-[16/9]" />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase bg-primary text-white px-2 py-0.5 rounded">
                      {other.category}
                    </span>
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-primary transition-colors">
                      {other.name}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-2">{other.summary}</p>
                  </div>
                  <Link
                    href={`/shower-screens/${other.id}`}
                    className="inline-flex items-center gap-1.5 text-accent group-hover:text-primary font-bold text-xs uppercase tracking-wider pt-2"
                  >
                    <span>View Specifications</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ────── Model FAQs ────── */}
      <AnimatedSection className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-accent font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
            </div>
            <h2 className="text-3xl font-black text-neutral-900">
              Questions About <span className="text-accent">{model.name}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {MODEL_FAQS.map((faq, index) => {
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
