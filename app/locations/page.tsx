import React from "react";
import Link from "next/link";
import { Phone, Check, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";

/* ─── Image placeholder ─── */
function ImgBox({ label, aspect = "aspect-[4/3]", className = "" }: { label: string; aspect?: string; className?: string }) {
  return (
    <div className={`relative ${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="relative text-center px-4 space-y-1">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-neutral-300">Add photo manually</p>
      </div>
    </div>
  );
}

const SERVICES = [
  {
    slug: "shower-regrouting",
    title: "Shower Regrouting",
    desc: "Shower regrouting is our core specialty. We remove failing grout and regrout the shower using durable, moisture-resistant grout designed specifically for wet areas.",
  },
  {
    slug: "shower-base-repair",
    title: "Shower Base Repair",
    desc: "We repair cracked and leaking shower bases to restore the waterproof floor without full demolition.",
  },
  {
    slug: "tile-regrouting",
    title: "Tile Regrouting",
    desc: "Our tile regrouting service refreshes tired or stained grout lines throughout bathrooms, laundries, kitchens, balconies and other tiled areas.",
  },
  {
    slug: "leaking-shower-repair",
    title: "Leaking Shower Repair",
    desc: "Leaking showers require more than sealant. We identify where water is escaping, repair compromised grout and seals and fully regrout the shower to restore complete waterproof integrity.",
  },
  {
    slug: "small-tiling-jobs",
    title: "Small Tiling Jobs",
    desc: "For loose, cracked or damaged tiles, we provide small tiling repairs that integrate seamlessly with existing finishes. This service is ideal when isolated tiles need replacement without disturbing the entire bathroom.",
  },
  {
    slug: "real-estate-property-services",
    title: "Real Estate & Property Services",
    desc: "We partner with residential property managers, mum-and-dad investors, strata companies and commercial owners to provide fast, reliable maintenance solutions.",
  },
];

const TESTIMONIALS = [
  { name: "Kevin Hyde", review: "Great service, prompt, quick turn around quality job 👍", suburb: "4 days ago" },
  { name: "D&R V", review: "We are incredibly happy with their grouting job. The grouting guy team has given us a fantastic customer service. And we..", suburb: "1 week ago" },
  { name: "Katia Vardakis", review: "I recently engaged The Grout Guy to carry out grout and silicone repairs to my bathroom, and I was very pleased with the quality of their work..", suburb: "1 week ago" },
  { name: "June Stuart", review: "Our shower was leaking, we got a quote on Friday and the job was booked in for the following Tuesday at 7am. Demitrio arrived on time he did a great job, he..", suburb: "1 week ago" },
];

export default function MelbournePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ══════════════════════════════════════
            PART 1 — HERO
            Left: h1 + desc + 2 buttons
            Below: 3 icon-badge cards (Sydney, Proven, 10-year)
            Right: Harbourside/Bridge Bridge image
        ══════════════════════════════════════ */}
        <section className="relative bg-[#001F97] overflow-hidden pt-[73px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
          <div className="relative z-10 max-w-[1460px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">

              {/* Left Column */}
              <div className="p-8 lg:p-16 flex flex-col justify-center text-white space-y-6">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                  Shower Regrouting &amp; Leaking Shower Repair Experts Melbourne
                </h1>
                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  Leaking showers and deteriorating grout are common problems in homes and apartments across Victoria. GROUTIX provides specialist shower repair and professional regrouting services in Melbourne, designed to stop leaks, restore tiled wet areas and prevent further water damage without the need for full bathroom renovations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="tel:70238094"
                    className="inline-flex items-center justify-center gap-2 bg-white text-[#001F97] font-black px-7 py-3.5 rounded-sm text-sm hover:bg-neutral-100 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#001F97]" /> 7023 8094
                  </a>
                  <Link
                    href="#quote-form"
                    className="inline-flex items-center justify-center bg-white text-[#001F97] font-black px-7 py-3.5 rounded-sm text-sm hover:bg-neutral-100 transition-colors"
                  >
                    Request A Quote
                  </Link>
                </div>
              </div>

              {/* Right Column: Bridge/Location Image */}
              <div className="relative min-h-[350px] lg:min-h-full">
                <ImgBox label="Melbourne Location Bridge Image" aspect="h-full w-full absolute inset-0" className="border-0" />
              </div>

            </div>

            {/* Bottom 3 icon badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-white/20">
              {[
                { label: "Melbourne-based shower regrouting specialists", icon: "🇦🇺" },
                { label: "Proven solutions for leaking showers and grout failure", icon: "🚿" },
                { label: "Backed by a 10-year waterproof warranty", icon: "🛡️" },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-[#2F63CC]/90 text-white p-6 border-r border-white/10 last:border-r-0">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-sm font-bold leading-snug">{badge.label}</span>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            TRUSTED ACROSS AUSTRALIA (Client logos)
        ══════════════════════════════════════ */}
        <section className="bg-white py-8 border-b border-neutral-100">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-center gap-8 lg:gap-14 opacity-60 grayscale">
            {["LOVE & CO", "McGrath", "PPM Perth Property Management", "Professionals", "Ray White", "RMA rental management australia", "RP REAL PROPERTY WA"].map(l => (
              <span key={l} className="text-xs font-black tracking-wider text-neutral-500 uppercase">{l}</span>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            PART 2 — OUR SERVICE AREA
            Left: Map container with absolute layout
            Right: Headings and description text
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left: Map Container with Overlay */}
            <div className="relative">
              <ImgBox label="Melbourne Service Area Map" aspect="aspect-[4/3]" className="rounded-sm" />
              <div className="absolute bottom-4 left-4 right-4 bg-[#001F97] text-white p-6 rounded-sm shadow-xl z-10">
                <p className="text-sm sm:text-base font-bold leading-relaxed">
                  With clear communication and proven repair systems, we ensure every project is completed to the highest professional standard.
                </p>
              </div>
            </div>

            {/* Right: Text description */}
            <div className="space-y-6 text-neutral-800">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight">Our Service Area</h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                <span className="font-bold text-[#001F97]">Melbourne</span> is home to Australia&apos;s biggest housing stock and some of its toughest bathroom challenges. From Federation cottages in Fitzroy and Carlton to art deco apartments in St Kilda, brick homes across the Eastern suburbs and modern family estates spreading through outer Melbourne, every era brings its own grout and silicone problems. Add the humidity, temperature fluctuations, and the sheer pace of modern living, and you have a state where bathrooms work harder than almost anywhere else in the country.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                GROUTIX covers the Melbourne metropolitan area and the wider Victorian region. We handle full tile regrouting and leaking shower repairs without ripping out tiles or sending you into a renovation. The tiles stay where they are. The shower stays in place. Only the failed grout and silicone get replaced — most jobs finished in a single day.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Melbourne homes have a real bathroom challenge. The state&apos;s climate drives mould straight into grout lines, and silicone seals crack along every shower edge after just a few wet seasons. In high-rise apartments, even a small failure in the silicone lets water track down through the slab to the unit below. We&apos;ve stopped countless of these problems before they became strata disputes.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Every quote is free, every job is properly warranted, and our team works around your schedule. We treat heritage terraces, brick veneers, and modern apartments with the same standard of care. If your grout is grey, your shower is leaking, or your bathroom is past its best, book your local GROUTIX specialist in Melbourne today.
              </p>
              <Link href="#suburbs" className="inline-flex items-center text-sm font-bold text-[#2F63CC] hover:underline">
                Find Your Suburb →
              </Link>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════
            PART 3 — OUR SERVICES
            Blue header, showing grid of cards
        ══════════════════════════════════════ */}
        <section className="bg-[#2F63CC] py-16 lg:py-24 text-white">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="space-y-3 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-[42px] font-bold">Our Services</h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                GROUTIX provides specialist tile and grout services for residential and commercial properties across Victoria. Our team is solely focused on precision, durability and long term performance, delivering results that general trades cannot match.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-neutral-800">
              {SERVICES.map((s, idx) => (
                <div
                  key={s.slug}
                  className="bg-white rounded-sm p-6 hover:shadow-lg transition-all flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <span className="text-2xl">
                      {idx === 0 ? "🚿" : idx === 1 ? "🧱" : idx === 2 ? "💧" : idx === 3 ? "🔨" : "🏢"}
                    </span>
                    <h3 className="font-bold text-neutral-900 text-lg">{s.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
                  </div>
                  <Link href={`/${s.slug}`} className="text-sm font-bold text-[#2F63CC] hover:underline">
                    Learn more →
                  </Link>
                </div>
              ))}
              {/* Last column is a premium photo block */}
              <div className="relative rounded-sm overflow-hidden min-h-[250px] lg:min-h-full">
                <ImgBox label="Shower Renovation Service Image" aspect="h-full w-full absolute inset-0" className="border-0" />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            PART 4 — CLIENT REVIEWS & TESTIMONIALS
            Google review styling matching fourth screenshot
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900">
                Client <span className="text-[#2F63CC]">Reviews &amp; Testimonials</span>
              </h2>
              <p className="text-neutral-600 font-bold text-sm sm:text-base">
                Here&apos;s Why Melbourne Customers Choose GROUTIX.
              </p>
            </div>

            {/* Trust rating block */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-[#4285F4] font-black text-xl tracking-tight">G<span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span>g<span className="text-[#34A853]">l</span>e</span>
                <span className="text-sm font-bold text-neutral-500">Excellent</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-[#FBBC05] fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-neutral-400 font-bold">4.8 | 364 reviews</span>
              </div>
              <Link href="#quote-form" className="bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-6 py-2.5 rounded-sm text-xs transition-colors">
                Write a review
              </Link>
            </div>

            {/* Testimonials List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {TESTIMONIALS.map((r, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{r.name}</p>
                          <p className="text-[10px] text-neutral-400">{r.suburb}</p>
                        </div>
                      </div>
                      <span className="text-[#4285F4] font-black text-xs">G</span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} className="h-3 w-3 text-[#FBBC05] fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">&ldquo;{r.review}&rdquo;</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold block pt-2">Read more</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SLIDER SECTION — REQUEST AN OBLIGATION FREE QUOTE
            Left: Heading
            Right: Action buttons
            Below: 4-image slide view
        ══════════════════════════════════════ */}
        <section className="bg-[#F3F4F6] py-16 lg:py-20">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-3xl lg:text-[38px] font-bold text-neutral-900 leading-tight">
                Request An<br />
                <span className="text-[#001F97]">Obligation Free Quote</span>
              </h2>
              <div className="flex gap-3 flex-shrink-0">
                <a href="#quote-form" className="bg-[#2F63CC] hover:bg-[#264FA3] text-white font-bold px-5 py-2.5 rounded-sm text-sm transition-colors">
                  Request A Quote
                </a>
                <a href="tel:1300844897" className="flex items-center gap-2 bg-[#001F97] hover:bg-[#2F63CC] text-white font-bold px-5 py-2.5 rounded-sm text-sm transition-colors">
                  <Phone className="h-4 w-4" /> 1300 844 897
                </a>
              </div>
            </div>
            {/* 4-image display row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ImgBox
                  key={i}
                  label={`Shower Regrouting Photo ${i + 1}`}
                  aspect="aspect-[3/4]"
                  className="rounded-sm"
                />
              ))}
            </div>
            {/* Arrows navigation + slider visual bar */}
            <div className="flex items-center gap-3 pt-2">
              <button className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="h-9 w-9 rounded-sm bg-[#001F97] hover:bg-[#2F63CC] text-white flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <div className="h-1 bg-neutral-200 w-24 relative overflow-hidden rounded-full">
                <div className="absolute left-0 top-0 h-full bg-[#001F97] w-1/4" />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            FREQUENTLY ASKED QUESTIONS
            Left: FAQ Title
            Right: Accordion list items
        ══════════════════════════════════════ */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-[1460px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-[40px] font-bold text-neutral-900 leading-tight">
                Frequently Asked<br />
                <span className="text-[#2F63CC]">Questions</span>
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "How Long Does Shower Regrouting Take?", a: "Most shower regrouting jobs are completed within a single day, depending on the condition of the grout and any required repair work." },
                { q: "Do I Need To Remove My Shower Tiles?", a: "In most cases, no. Our services are designed to fix grout and sealing issues without removing tiles." },
                { q: "Can You Regrout Shower Floors As Well As Walls?", a: "Yes, we handle both floor and wall tile regrouting in shower cubicles and all wet areas." },
              ].map((faq, i) => (
                <div key={i} className="border border-neutral-100 bg-[#F8FAFC] rounded-sm p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-neutral-200">
                  <span className="font-bold text-neutral-800 text-sm leading-snug">{faq.q}</span>
                  <div className="w-8 h-8 rounded-sm bg-[#001F97] text-white flex items-center justify-center flex-shrink-0 text-lg font-bold">
                    +
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            REQUEST AN OBLIGATION FREE QUOTE BANNER
            (Footer CTA part from any service page)
        ══════════════════════════════════════ */}
        <section className="bg-[#3D68D8] py-14 px-6 lg:px-10">
          <div className="max-w-[1460px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              Request An <span className="text-white/80">Obligation Free Quote</span>
            </h2>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="#quote-form" className="bg-white text-[#001F97] hover:bg-neutral-100 font-black px-6 py-3 rounded-sm text-sm transition-colors">
                Request A Quote
              </Link>
              <a href="tel:70238094" className="flex items-center gap-2 bg-[#001F97] hover:bg-[#001579] text-white font-bold px-6 py-3 rounded-sm text-sm transition-colors border border-white/20">
                <Phone className="h-4 w-4" /> 7023 8094
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            FINAL FORM SECTION — REQUEST A QUOTE
        ══════════════════════════════════════ */}
        <section id="quote-form" className="relative overflow-hidden bg-[#001F97]">
          {/* Bathroom Background Image Placeholder covering entire section */}
          <div className="absolute inset-0 bg-neutral-700 flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center px-4 relative">
              Bathroom Background Image<br />
              <span className="font-normal normal-case tracking-normal text-neutral-500">Add photo manually</span>
            </p>
          </div>
          {/* Blue overlay */}
          <div className="absolute inset-0 bg-[#001F97]/65" />

          {/* Foreground content */}
          <div className="relative z-10 max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Heading overlay (request a quote aligned at the top) */}
            <div className="relative min-h-[150px] lg:min-h-[600px] flex items-start pt-[50px] pr-[50px] pl-8 pb-8">
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Request A Quote
              </h2>
            </div>

            {/* Right: Quote Form Wrapper with padding */}
            <div className="p-8 lg:p-12 xl:p-16 flex items-center justify-center">
              <div className="w-full max-w-xl">
                <QuoteForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
