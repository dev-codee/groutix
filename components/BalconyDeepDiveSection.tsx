"use client";

import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

export default function BalconyDeepDiveSection() {
  return (
    <section className="bg-white py-16 lg:py-24 px-5 sm:px-10 border-t border-neutral-100" id="balcony">
      <div className="max-w-[1080px] mx-auto space-y-9">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-block text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#3b5bf0] bg-[#eef1fb] rounded-full px-3.5 py-1.5">
            Balcony Specialists
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#1a2a8c] leading-tight">
            Balcony Regrouting &amp; Leak Repairs in Melbourne
          </h2>
          <p className="text-neutral-600 text-base sm:text-[16.5px] leading-relaxed max-w-[820px] mx-auto">
            Melbourne&apos;s heavy rain and temperature swings are brutal on balcony tiling. Once grout cracks, water
            seeps through the joints, causing white efflorescence staining, mould growth, tile lifting and even damage
            to the concrete or framing below. Our balcony regrouting removes the failed grout and replaces it with
            waterproof epoxy grout and sealed perimeter joints, no retiling required.
          </p>
        </div>

        {/* 2-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1, Warning Signs */}
          <div className="border border-[#f0e2b6] rounded-[14px] p-7 bg-[#fffdf5] shadow-xs">
            <h3 className="text-[19px] font-bold text-[#1a2a8c] mb-4">
              5 Signs Your Balcony Needs Regrouting
            </h3>
            <ul className="space-y-3.5">
              {[
                "White chalky staining (efflorescence) on tiles",
                "Cracked, crumbling or missing grout",
                "Water stains on the ceiling below the balcony",
                "Loose or “drummy” sounding tiles",
                "Persistent mould in grout lines despite cleaning",
              ].map((sign, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14.5px] text-[#5b6478] leading-snug">
                  <span className="shrink-0 w-[22px] h-[22px] rounded-full bg-[#fff3d6] text-[#b07d10] font-extrabold text-[13px] flex items-center justify-center mt-0.5">
                    !
                  </span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2, Fix Steps */}
          <div className="border border-[#e2e6f0] rounded-[14px] p-7 bg-[#fbfcff] shadow-xs">
            <h3 className="text-[19px] font-bold text-[#1a2a8c] mb-4">
              How We Fix a Leaking Balcony
            </h3>
            <ol className="space-y-3.5">
              {[
                { title: "Inspect & assess", desc: "check the balcony surface and moisture levels." },
                { title: "Remove failed grout", desc: "grind out old grout and deep-clean the joints." },
                { title: "Epoxy regrout", desc: "waterproof epoxy grout colour-matched to your tiles." },
                { title: "Seal perimeters", desc: "new silicone to perimeters and expansion joints." },
              ].map((step, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-[14.5px] text-[#5b6478] leading-snug">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[#1a2a8c] text-white font-bold text-[14px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">
                    <strong className="text-[#12182b] font-semibold">{step.title}</strong>, {step.desc}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* CTA Band */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-[#1a2a8c] rounded-[14px] p-7 sm:p-8 text-white shadow-md">
          <div className="flex-1 min-w-[240px] text-center md:text-left">
            <h3 className="text-[19px] font-bold text-white leading-tight">
              Stop balcony leaks before they become structural repairs.
            </h3>
            <p className="text-[13.5px] text-[#c9d4f2] mt-1.5">
              Free assessment · 10-year waterproof warranty · No retiling needed
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-neutral-100 text-[#1a2a8c] font-bold text-[15px] px-7 py-3.5 rounded-[10px] transition-all active:scale-95 shadow-sm"
            >
              Get My Balcony Assessed
            </Link>
            <a
              href="tel:+61370238094"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-white hover:bg-white/10 font-bold text-[15px] px-5 py-3 rounded-[10px] border border-white/45 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>(03) 7023 8094</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
