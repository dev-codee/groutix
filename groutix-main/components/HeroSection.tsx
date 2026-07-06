"use client";
import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import QuoteForm from "./QuoteForm";

/* ─── Shared image placeholder ─── */
function ImgBox({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1">
        <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] text-neutral-300">Add photo manually</p>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative bg-[#001F97] overflow-hidden pt-[73px]">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      <div className="relative z-10 max-w-[1460px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left: Headline + CTAs */}
          <div className="space-y-6 text-white">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-black tracking-tight leading-tight capitalize">
                Australia&apos;s largest &amp; most trusted{" "}
                <span className="text-[#97B1E5]">shower regrouting</span>{" "}
                specialists
              </h1>
              <p className="text-white/75 text-base sm:text-[18px] max-w-xl leading-relaxed pt-2">
                Fixing leaking and unsightly showers with permanent, warranty-backed solutions — without the need for full bathroom renovations.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:70238094"
                className="flex items-center justify-center space-x-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-black px-7 py-3.5 rounded-sm shadow-lg transition-all duration-200 text-base"
              >
                <Phone className="h-4 w-4" />
                <span>7023 8094</span>
              </a>
              <Link
                href="/contact"
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-7 py-3.5 rounded-sm transition-all duration-200 text-base"
              >
                Get a Free Quote Online
              </Link>
            </div>

            {/* 3 trust badges row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {[
                { stat: "Australia&apos;s Largest", sub: "Shower Regrouting Specialists" },
                { stat: "10-Year", sub: "Waterproof Warranty" },
                { stat: "5,000+", sub: "Jobs Completed" },
              ].map((b, i) => (
                <div key={i} className="bg-white/8 border border-white/15 rounded-sm px-4 py-3">
                  <p className="text-base font-black text-white" dangerouslySetInnerHTML={{ __html: b.stat }} />
                  <p className="text-[13px] text-white/60 mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quote Form */}
          <div className="w-full">
            <QuoteForm />
          </div>

        </div>
      </div>
    </section>
  );
}
