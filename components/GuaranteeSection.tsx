import React from "react";
import { Phone } from "lucide-react";

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

export default function GuaranteeSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Text */}
        <div className="space-y-5">
          <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
            GROUTIX <span className="text-[#001F97]">Guarantee</span>
          </h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed text-sm sm:text-[16px]">
            <p>
              Every job completed by GROUTIX is backed by our industry-leading 10-year waterproof warranty. If water penetrates through our workmanship, we fix it with no questions asked.
            </p>
            <p className="font-semibold text-neutral-800">
              Combined with our proven processes, specialist materials and experienced grout specialists, our guarantee gives you complete confidence that your shower repair is built to last, not just look good on day one.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <a
              href="tel:70238094"
              className="inline-flex items-center gap-2 bg-[#001F97] hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors"
            >
              <Phone className="h-4 w-4" /> 7023 8094
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors"
            >
              Request A Quote
            </a>
          </div>
        </div>
        {/* Right: Image (NOT a badge — match reference site which has an image here) */}
        <div>
          <ImgBox label="Guarantee Section Image" />
        </div>
      </div>
    </section>
  );
}
