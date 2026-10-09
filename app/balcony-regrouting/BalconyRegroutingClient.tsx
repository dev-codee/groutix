"use client";

import React from "react";
import Link from "next/link";
import { Phone, ShieldCheck, CheckCircle2, Award } from "lucide-react";
import { motion } from "framer-motion";
import BalconyDeepDiveSection from "@/components/BalconyDeepDiveSection";
import CtaBanner from "@/components/CtaBanner";
import TrustedMarquee from "@/components/TrustedMarquee";
import AnimatedSection from "@/components/AnimatedSection";

export default function BalconyRegroutingClient() {
  return (
    <main className="pt-[110px] lg:pt-[125px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0a1647] via-[#101d63] to-[#1a2a8c] py-16 lg:py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 text-[#FBBC04] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Melbourne Balcony Specialists · 10-Year Waterproof Warranty</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Balcony Regrouting &amp; <span className="text-[#FBBC04]">Leak Repairs</span> Melbourne
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/85 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Stop balcony leaks before they cause structural concrete and ceiling damage. Waterproof epoxy regrouting and sealed perimeter joints, no retiling needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-[#FBBC04] hover:bg-[#e0a703] text-[#101d63] font-black text-base px-8 py-4 rounded-md transition-all active:scale-95 shadow-lg"
            >
              Get Free Balcony Assessment
            </Link>
            <a
              href="tel:+61370238094"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white hover:bg-white/10 font-bold text-base px-6 py-3.5 rounded-md border border-white/40 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>+61 3 7023 8094</span>
            </a>
          </motion.div>

          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left border-t border-white/15">
            {[
              "10-Year Waterproof Warranty",
              "Epoxy Grout Technology",
              "No Tile Removal Required",
              "Servicing Greater Melbourne",
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[#FBBC04] shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Balcony Wireframe Section */}
      <BalconyDeepDiveSection />

      {/* Trusted Marquee */}
      <TrustedMarquee />

      {/* Why Balconies Leak in Melbourne */}
      <AnimatedSection className="py-16 lg:py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-[1080px] mx-auto px-5 sm:px-10 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2a8c]">
              Why Melbourne Balconies Are Prone to Leaking
            </h2>
            <p className="text-neutral-600 text-base leading-relaxed">
              Outdoor tiled areas endure extreme seasonal shifts, baking UV heat followed by heavy rainfall. Here is why conventional cement grout fails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#3b5bf0] flex items-center justify-center font-bold">1</div>
              <h3 className="text-lg font-bold text-neutral-900">Thermal Expansion &amp; Contraction</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Balcony slabs expand under Melbourne summer sun and contract in winter. Rigid cement grout hairline fractures and cracks over time.
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#3b5bf0] flex items-center justify-center font-bold">2</div>
              <h3 className="text-lg font-bold text-neutral-900">Efflorescence &amp; Water Trapping</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Water seeps beneath the tiles and leaches free lime from the mortar bed, creating unsightly white powdery deposits on tile surfaces.
              </p>
            </div>
            <div className="bg-white p-7 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#3b5bf0] flex items-center justify-center font-bold">3</div>
              <h3 className="text-lg font-bold text-neutral-900">Structural Damage Below</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                If unaddressed, water migrates into plasterboard ceilings, concrete reinforcement (spalling), timber framing, and neighbouring units.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection className="py-16 lg:py-24 bg-white border-t border-neutral-200">
        <div className="max-w-[880px] mx-auto px-5 sm:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2a8c]">
              Balcony Regrouting Questions
            </h2>
            <p className="text-neutral-600 text-base">
              Common questions from Melbourne property owners and strata managers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Can a leaking balcony really be repaired without removing tiles?",
                a: "Yes. In the majority of cases where the issue is failed grout, cracked joints, or perimeter silicone separation, complete tile removal is completely unnecessary. We remove all failed grout and sealants, deep-clean the channels, and pack waterproof epoxy grout into every joint."
              },
              {
                q: "What is epoxy grout and why is it better for balconies?",
                a: "Epoxy grout is a resin-based formula that is 100% waterproof, non-porous, and resistant to UV, efflorescence, mould, and chemical weathering. Unlike standard cement grout, it does not absorb rain or shrink in temperature extremes."
              },
              {
                q: "How long does a balcony regrout take?",
                a: "Most residential apartment and townhouse balconies are completed within 1 to 2 days, minimising any disruption to you or your tenants."
              },
              {
                q: "What warranty do you offer?",
                a: "All eligible full balcony regrouting and sealing jobs by Groutix are covered by our 10-year waterproof warranty."
              }
            ].map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-lg p-5 bg-neutral-50/50 open:bg-white transition-colors">
                <summary className="font-bold text-neutral-900 cursor-pointer text-base sm:text-lg list-none flex items-center justify-between gap-4">
                  <span>{faq.q}</span>
                  <span className="text-primary font-bold text-xl group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed border-t border-neutral-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA Banner */}
      <AnimatedSection>
        <CtaBanner />
      </AnimatedSection>
    </main>
  );
}
