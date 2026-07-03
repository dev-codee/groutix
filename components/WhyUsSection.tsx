import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

/* ─── Droplet bullet icon ─── */
const DropletIcon = () => (
  <svg width="12" height="18" viewBox="0 0 12 18" fill="none" className="flex-shrink-0 mt-0.5">
    <path d="M6 5V17C2.686 17 0 14.314 0 11C0 7.686 2.686 5 6 5Z" fill="#2F63CC" />
    <path d="M12 11C12 14.314 9.314 17 6 17V5C9.314 5 12 7.686 12 11Z" fill="#97B1E5" />
  </svg>
);

/* ─── Shared image placeholder ─── */
function ImgBox({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-neutral-300">Add photo manually</p>
      </div>
    </div>
  );
}

export default function WhyUsSection() {
  const points = [
    "Australia's largest dedicated shower regrouting specialist",
    "Proven systems refined over decades",
    "High performance grout options available",
    "10-year waterproof warranty for peace of mind",
    "Specialist technicians – not general tilers or handymen",
    "Obligation-free quotes with no hidden fees",
    "Professional, ethical and friendly service",
  ];

  return (
    <div className="bg-white">
      {/* ═══════════════════════════════════════════════════════════
          SECTION: Leaking Showers Start With Grout Problems
          Layout: Left = image, Right = text (matching reference)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 border-t border-neutral-100">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image */}
          <ImgBox label="Leaking Showers Section Image" />
          {/* Right: Text */}
          <div className="space-y-5">
            <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
              Leaking Showers <span className="text-[#001F97]">Start</span><br />
              With <span className="text-[#001F97]">Grout</span> Problems
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed text-sm sm:text-[16px]">
              <p>
                Leaking showers are rarely caused by cracked tiles. In most cases, water escapes through failed grout, broken seals or gaps around junctions and penetrations. Once moisture gets behind the tiles, it can travel unseen, leading to mould growth, timber rot and structural damage over time.
              </p>
              <p className="font-semibold text-neutral-800">
                Ignoring these early warning signs often results in more expensive repairs down the line. That&apos;s why identifying and fixing grout-related issues early is the most effective way to protect your bathroom, your home and your investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: Why Choose Us?
          Dark navy bg, left text + bullet list, right image
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#001F97] py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-[40px] font-bold text-white leading-tight">
              Why <span className="text-[#97B1E5]">Choose GROUTIX?</span>
            </h2>
            <p className="text-white/75 text-sm sm:text-[16px] leading-relaxed">
              Here&apos;s why homeowners and property managers across Australia trust GROUTIX for their shower regrouting and repair needs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {points.map((point, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <DropletIcon />
                  <p className="text-sm text-white/85 leading-relaxed font-medium">{point}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <a href="tel:70238094" className="inline-flex items-center gap-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors">
                Request A Quote
              </Link>
            </div>
          </div>
          {/* Right: Image */}
          <div>
            <ImgBox label="Why Choose Us Section Image" />
          </div>
        </div>
      </section>
    </div>
  );
}
