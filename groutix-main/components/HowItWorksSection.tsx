import React from "react";
import Link from "next/link";

/* ─── Shared image placeholder ─── */
function ImgBox({ label, aspect = "aspect-[4/3]" }: { label: string; aspect?: string }) {
  return (
    <div className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center rounded-sm`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1">
        <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[12px] text-neutral-300">Add photo manually</p>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Request a Free Quote",
      description: "Fill out our quick online quote request form or call us on 7023 8094. We will discuss your issue and schedule a visit.",
    },
    {
      number: "02",
      title: "On-Site Visit & Work",
      description: "Our local trained technician inspects the shower, confirms the quote, and completes the regrouting and resealing on the spot.",
    },
    {
      number: "03",
      title: "Guaranteed Waterproof Seal",
      description: "Your shower is sealed with our commercial-grade grout and silicone, backed by our leading 10-year waterproofing warranty.",
    },
  ];

  return (
    <div className="bg-white">
      {/* ═══════════════════════════════════════════════════════════
          SECTION: Fix Your Shower Without a Full Renovation
          Layout: Left = text, Right = image (matching reference)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 border-t border-neutral-100">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
              Fix Your Shower<br />
              <span className="text-[#001F97]">Without a Full Renovation</span>
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed text-base sm:text-[18px]">
              <p>
                If your shower is leaking through the grout, looks permanently dirty or smells damp no matter how much you clean it, you&apos;re not alone. These issues are generally caused by failed grout or deteriorated seals and not necessarily the tiles themselves.
              </p>
              <p className="font-semibold text-neutral-800">
                GROUTIX specialises in restoring showers across Australia with specialist regrouting, resealing and repairing the root cause of the problem.
              </p>
            </div>
          </div>
          {/* Right: Image */}
          <div className="order-1 lg:order-2">
            <ImgBox label="Fix Your Shower Section Image" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: A Permanent Solution (Grey bg)
          Layout: Text top, wide panoramic image below
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F3F4F6] py-16 lg:py-24">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
          <div className="max-w-3xl space-y-5">
            <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
              A Permanent Solution,<br />
              <span className="text-[#001F97]">Not a Temporary Patch</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 text-neutral-600 leading-relaxed text-base sm:text-[18px]">
              <p>
                At GROUTIX, we don&apos;t apply surface sealants or cosmetic fixes that fail months later. Our technicians remove failed grout, repair affected areas and regrout the shower using high performance cement-based systems designed specifically for wet areas.
              </p>
              <p>
                Each job we undertake follows a proven, repeatable process refined over decades and is backed by our industry-leading 10-year waterproof warranty.
              </p>
            </div>
          </div>

          {/* Before & After — panoramic wide image */}
          <ImgBox label="Before & After Showcase Image" aspect="aspect-[21/8]" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: How Our Regrouting Process Works (White bg)
          3-column step cards each with their own image placeholder
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-white border-t border-neutral-100">
        <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-12">
          {/* Header */}
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
              How Our <span className="text-[#001F97]">Process Works</span>
            </h2>
            <p className="text-neutral-500 text-base sm:text-[18px]">
              We make it simple to repair and seal your leaking shower. Here is what to expect when you choose GROUTIX.
            </p>
          </div>

          {/* Steps Grid — each step has its own image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="space-y-4">
                {/* Step number */}
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#001F97] text-white font-black text-base">
                  {step.number}
                </div>
                {/* Step image placeholder */}
                <ImgBox label={`Step ${step.number} Image`} />
                <div>
                  <h3 className="font-bold text-neutral-900 text-base mb-2">{step.title}</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
