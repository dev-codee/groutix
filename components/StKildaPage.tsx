"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Star, Check, ChevronDown, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroContactBadges from "@/components/HeroContactBadges";
import AnimatedSection from "@/components/AnimatedSection";
import type { Review, BusinessRating } from "@/lib/reviews";

/* ─── FAQ accordion item (matches site pattern) ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <li className="list-none">
      <details className="group rounded-sm border border-neutral-200 bg-white open:border-accent/50">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-neutral-900 text-base leading-snug">{q}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180 group-open:text-accent" />
        </summary>
        <p className="border-t border-neutral-100 px-5 pb-4 pt-3 text-base leading-relaxed text-neutral-600">{a}</p>
      </details>
    </li>
  );
}

const FAQS = [
  {
    q: "Do you service my part of St Kilda?",
    a: "Yes. We cover St Kilda 3182, St Kilda West, St Kilda East 3183 and Elwood 3184, travelling from our Gowanbrae base. Balaclava, Albert Park and Middle Park have their own pages, and we work there too.",
  },
  {
    q: "My balcony is leaking into the unit below. Who pays?",
    a: "It depends on your plan of subdivision. In Victoria, balcony tiles and the membrane are often part of the lot, which makes the repair the lot owner's job, but some buildings treat them as common property. Check with your strata manager. We can explain the cause in plain terms for them.",
  },
  {
    q: "Will regrouting stop my shower leaking?",
    a: "If water is getting through cracked grout or failed silicone, regrouting and resealing usually stops it. If the waterproofing membrane underneath has failed, regrouting alone won't, and we'll tell you that before you book the work.",
  },
  {
    q: "Can you regrout while my tenants are living there?",
    a: "Yes. We book around tenants, and most showers are done in a single visit. The new grout and silicone need time to cure before the shower is used, and we confirm the exact wait before we start.",
  },
  {
    q: "Is epoxy grout better for a St Kilda balcony?",
    a: "Epoxy is denser and resists water and stains better than cement grout, but exposed balconies move with heat and cold. We choose the grout and sealant after we've seen your balcony, so the repair suits how it's built.",
  },
  {
    q: "How do I stop mould coming back in my shower?",
    a: "Mould that returns soon after cleaning usually lives inside porous or cracked grout. Replacing the grout and silicone, then airing the bathroom after each shower, keeps it away far longer than bleach ever will.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/st-kilda#service",
      name: "Shower and balcony regrouting in St Kilda",
      serviceType: ["Shower regrouting", "Balcony regrouting", "Leaking shower repair", "Tile regrouting"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "St Kilda VIC 3182" },
        { "@type": "Place", name: "St Kilda West VIC 3182" },
        { "@type": "Place", name: "St Kilda East VIC 3183" },
        { "@type": "Place", name: "Elwood VIC 3184" },
      ],
      url: "https://groutix.com/locations/melbourne/st-kilda",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "St Kilda", item: "https://groutix.com/locations/melbourne/st-kilda" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function StKildaPage({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="public-page">
        {/* ═════════ 1. HERO (dark #0d1030) ═════════ */}
        <section className="relative overflow-hidden bg-[#0d1030] pt-[110px] lg:pt-[125px]">
          <div className="relative mx-auto grid max-w-[1460px] items-center gap-10 px-4 sm:px-6 py-12 pb-16 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-16 lg:pb-20">
            <div className="space-y-5 text-white">
              <p className="text-[15px] font-black uppercase tracking-[0.2em] text-[#FBBC04]">Groutix</p>
              <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">
                Shower Regrouting &amp; Leak Repairs in St Kilda
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                Most of St Kilda lives in flats, so a cracked shower floor or a tired balcony is rarely just your problem. It&apos;s the ceiling of the unit below. We regrout showers and balconies across St Kilda, Elwood and St Kilda East without pulling up your tiles, and back eligible shower work with a 10-year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <HeroContactBadges rating={rating} />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-white/85">
                <a href="/#reviews" className="inline-flex items-center gap-2 hover:text-white">
                  <span className="font-black text-lg">5.0</span>
                  <span className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />
                    ))}
                  </span>
                  <span className="underline">290+ Google Reviews</span>
                </a>
                <a
                  href="tel:+61370238094"
                  className="inline-flex items-center gap-2 border-[1.5px] border-white/80 hover:border-white text-white font-bold px-6 py-3 rounded-lg text-base transition-all active:scale-95"
                >
                  <Phone className="h-4 w-4" /> (03) 7023 8094
                </a>
              </div>
            </div>
            <div className="w-full">
              {/* [TBC] Client to supply hero image (recommended 800x600). Replace src below. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/st-kilda-hero.jpg"
                  alt="Shower and balcony regrouting in a St Kilda apartment"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═════════ 2. STATS STRIP ═════════ */}
        <AnimatedSection className="bg-white py-12 lg:py-16">
          <div className="mx-auto grid max-w-[1460px] grid-cols-1 gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-10">
            {[
              { value: "5.0/5", stars: true, label: "Google Rating", sub: "From 290+ Google reviews" },
              { value: "10 Year", stars: false, label: "Waterproof Warranty", sub: "On eligible completed shower regrouting" },
              { value: "No Tile", stars: false, label: "Removal", sub: "On most regrouting jobs" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FBBC04] hover:shadow-lg"
              >
                <p className="text-3xl font-black leading-none text-neutral-900">{s.value}</p>
                {s.stars && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />
                    ))}
                  </div>
                )}
                <p className="text-base font-bold text-neutral-900">{s.label}</p>
                <p className="text-[13px] text-neutral-500">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ═════════ 3. LOCAL INTRO ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for St Kilda&apos;s Flats, Terraces and Deco Blocks
              </h2>
              <p className="text-lg text-neutral-600">
                Groutix regrouts showers, balconies and tiled floors across St Kilda 3182, working from our Gowanbrae base throughout the City of Port Phillip.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
              <p>
                Nearly four in five St Kilda homes are flats or apartments. They range from the old mansion blocks on Fitzroy Street to post-war walk-ups and newer buildings near the Esplanade. Plenty still have their original bathroom. The tiles are often fine, but the grout and silicone on top have done decades of work.
              </p>
              <p>
                The bay doesn&apos;t help. Balconies facing the water cop wind, rain and salty air, and grout that has gone porous lets that water through to the membrane, then the slab, then someone else&apos;s ceiling. In an apartment building, a leak usually shows up downstairs first: a stain on the ceiling below, or a note from the owners corporation.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "79%", label: "Of St Kilda Homes Are Flats or Apartments", sub: "ABS Census 2021" },
                { value: "60%", label: "Of St Kilda Homes Are Rented", sub: "ABS Census 2021" },
                { value: "3182 · 3183 · 3184", label: "St Kilda, St Kilda East and Elwood", sub: "All covered from our Gowanbrae base" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-6 text-center">
                  <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                  <p className="mt-2 text-sm font-bold text-neutral-900">{s.label}</p>
                  <p className="text-[13px] text-neutral-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 4. BALCONY (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balcony Regrouting in St Kilda Apartments
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                If your St Kilda balcony is leaking into the unit below, failed grout and silicone are the first things to check, and the cheapest to fix. We cut out the old grout, reseal the edges and door sill, and regrout with a grout made for outdoor use, in most cases without lifting a tile.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Ceiling Stains Below", text: "Water marks or bubbling paint on the ceiling of the unit below." },
                { title: "White Crusty Salts", text: "Efflorescence in the grout lines means water is moving through." },
                { title: "Cracked Edge Grout", text: "Cracked or missing grout at the door threshold and along the edges." },
                { title: "Pooling Water", text: "Puddles that sit after rain instead of running to the outlet." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FBBC04] hover:shadow-lg"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">When Regrouting Isn&apos;t Enough</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                If the membrane under the tiles has failed, or the balcony doesn&apos;t fall to the drain, regrouting won&apos;t fix it. We&apos;ll tell you that before you spend money. More detail on our{" "}
                <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">balcony leak repairs</Link> page.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 5. SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in St Kilda
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout replaces the cracked, mouldy or missing grout and the silicone in your shower, usually in one visit, with the tiles left where they are.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In St Kilda the shower floor is usually where it starts. Small bathrooms in older flats get a lot of water in a tight space with not much airflow, so the floor grout and the corner silicone break down first. Black mould that comes back a week after you&apos;ve bleached it isn&apos;t dirty grout. It&apos;s failed grout.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over.",
                    "Old silicone stripped completely, because new silicone won't bond to old.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>.</>,
                    "A full clean-up before we leave.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-base text-neutral-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="text-center">
                <Link
                  href="/shower-regrouting"
                  className="inline-block bg-primary px-6 py-3 text-base font-bold text-white rounded-sm transition-colors hover:bg-primary-hover active:scale-95"
                >
                  See Our Shower Regrouting Process
                </Link>
              </d
...[truncated 16557 chars]
