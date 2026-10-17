"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Star, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroContactBadges from "@/components/HeroContactBadges";
import AnimatedSection from "@/components/AnimatedSection";
import type { Review, BusinessRating } from "@/lib/reviews";
import { useGoogleRating } from "@/components/useGoogleRating";

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
    q: "Do you work in high-rise apartment buildings in South Yarra?",
    a: "Yes. Tell us your building's rules when you book, including work hours, lift bookings and where to park, and we'll plan the job around them. Most showers are regrouted in a single visit.",
  },
  {
    q: "What should I tell my building manager before a balcony job?",
    a: "The date and time, your apartment number, that the work stays on your balcony and the tiles aren't being lifted, and whether the lift needs to be booked. Some buildings also want contractor details in advance, so check when you book.",
  },
  {
    q: "Can you regrout my shower in epoxy grout?",
    a: "Yes. Epoxy is denser than cement grout, resists stains and holds its colour, which suits busy apartment bathrooms. We match the colour as closely as we can. It takes a little longer to cure, so we confirm the exact wait before we start.",
  },
  {
    q: "I rent in South Yarra and my shower grout is failing. Who arranges the repair?",
    a: "Tell your agent or landlord in writing. In Victoria, repairs to a rental are usually arranged and paid for by the rental provider. We're happy to quote for your agent.",
  },
  {
    q: "Do you cover Prahran too?",
    a: "Yes. We regrout showers, bathroom floors, laundries and balconies across Prahran 3181, from the terraces near Greville Street to the newer apartment blocks off Chapel Street.",
  },
  {
    q: "How long will my balcony or shower be out of action?",
    a: "Most showers and smaller balconies are done in a single visit. The grout and silicone then need time to cure before use, and we tell you the exact wait before we start.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/south-yarra#service",
      name: "Balcony and shower regrouting in South Yarra",
      serviceType: ["Balcony regrouting", "Shower regrouting", "Leaking shower repair", "Epoxy grouting", "Tile regrouting"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "South Yarra VIC 3141" },
        { "@type": "Place", name: "Prahran VIC 3181" },
      ],
      url: "https://groutix.com/locations/melbourne/south-yarra",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "South Yarra", item: "https://groutix.com/locations/melbourne/south-yarra" },
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

export default function SouthYarraPage({
  reviews,
  rating,
}: {
  reviews: Review[];
  rating: BusinessRating;
}) {
  const gr = useGoogleRating();
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="public-page">
        {/* ═════════ 1. HERO (dark #0d1030) ═════════ */}
        <section className="relative overflow-hidden bg-[#0d1030] pt-[90px] lg:pt-[100px]">
          <div className="relative mx-auto grid max-w-[1460px] items-center gap-10 px-4 sm:px-6 py-8 pb-12 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-12 lg:pb-16">
            <div className="space-y-5 text-center text-white lg:text-left">
              <p className="text-[15px] font-black uppercase tracking-[0.2em] text-[#FBBC04]">Groutix</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">
                Balcony &amp; Shower Regrouting in South Yarra
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Eight in ten South Yarra homes are apartments, so a cracked balcony or a mouldy shower usually comes with a neighbour downstairs and a building manager to deal with. We regrout balconies and showers across South Yarra and Prahran without lifting your tiles, work around building rules and lift bookings, and back eligible shower work with a 10-year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
              </div>
            </div>
            <div className="w-full">
              {/* [TBC] Client to supply hero image (recommended 800x600). Replace src below. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/south-yarra-hero.jpg"
                  alt="Balcony regrouting in a South Yarra apartment"
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
              { value: `${gr.ratingLabel}/5`, stars: true, label: "Google Rating", sub: `From ${gr.countLabel} Google reviews` },
              { value: "10 Year", stars: false, label: "Waterproof Warranty", sub: "On eligible completed shower regrouting" },
              { value: "No Tile", stars: false, label: "Removal", sub: "On most regrouting jobs" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center"
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
                <p className="text-sm text-neutral-500">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ═════════ 3. LOCAL INTRO ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Regrouting for South Yarra&apos;s Towers, Deco Flats and Terraces
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix regrouts balconies, showers and tiled floors across South Yarra 3141, on both sides of Punt Road, working from our Gowanbrae base.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                South Yarra is one of Melbourne&apos;s densest suburbs. Within a few streets you&apos;ll find 1920s and 30s blocks of flats, Victorian terraces on streets like Park Street and Leopold Street, and the newer towers around the station, Chapel Street and Toorak Road.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Each one wears out differently. Older flats have tired original grout and silicone that has been patched one too many times. Newer towers have bigger balconies, more glass and plenty of movement joints, and their bathrooms get hard daily use from a young, busy, mostly renting crowd.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "79%", label: "Of South Yarra Homes Are Apartments", sub: "ABS Census 2021" },
                { value: "62%", label: "Of South Yarra Homes Are Rented", sub: "ABS Census 2021" },
                { value: "3141 · 3181", label: "South Yarra and Prahran", sub: "All covered from our Gowanbrae base" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
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
                Balcony Regrouting in South Yarra
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A leaking South Yarra balcony usually comes down to cracked or washed-out grout and tired silicone at the door sill and edges. We cut out the failed grout, reseal the junctions and regrout with a grout made for outdoor use, in most cases without lifting a tile. If the membrane underneath has failed, we&apos;ll tell you before you spend anything.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Door Sill Leaks", text: "Water tracking under the sliding door onto the carpet or timber inside." },
                { title: "Split Edge Joints", text: "Gaps where the tiles meet the wall, the balustrade or the step-down." },
                { title: "Drain and Planter Corners", text: "Stains and white salts around the floor waste and planter boxes." },
                { title: "Marks Below", text: "Stains on the underside of the balcony or the ceiling of the unit below." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              More on causes and repair options on our{" "}
              <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">
                balcony leak repairs
              </Link>{" "}
              page.
            </p>
          </div>
        </AnimatedSection>

        {/* ═════════ 5. APARTMENT BUILDINGS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Working in South Yarra Apartment Buildings
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most South Yarra jobs happen inside apartment buildings, so the logistics matter as much as the grout.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Building Rules First", text: "Tell us your building's rules when you book and we'll plan around them: work hours, lift bookings, parking and loading bay access." },
                { title: "Mess Stays Inside", text: "Old grout and silicone stay in your bathroom or on your balcony, and we clean the corridor and lift on the way out." },
                { title: "One Visit Where Possible", text: "Most showers are regrouted in a single visit, so you're not booking the lift for a week." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-neutral-50 p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Whose Job Is the Balcony?</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Check your plan of subdivision or ask your strata manager. In many Victorian buildings the balcony tiles and membrane belong to the lot owner, but some treat them as common property, which makes them the owners corporation&apos;s job.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 6. SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in South Yarra
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout swaps cracked, stained or mouldy grout and old silicone for new, usually in one visit, with your tiles left in place.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Compact apartment bathrooms with no window and a tired exhaust fan stay damp, so mould gets into the grout quickly. That&apos;s why epoxy grout is popular in South Yarra: it&apos;s denser, holds its colour and stands up to the cleaning products a busy household uses.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over.",
                    <>Your choice of <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link>, colour matched as closely as we can, or cement grout with sealer.</>,
                    "Old silicone stripped and replaced, not layered over.",
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
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 7. LEAKING SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in South Yarra
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In an apartment, the neighbour usually notices a shower leak first, as a stain on their ceiling or a damp wall behind their wardrobe. We trace where the water is escaping, repair the grout and seals, and tell you plainly if the membrane is the real problem.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Neighbour Complaint", text: "A stain or damp patch reported by the unit below or next door." },
                { title: "Damp Skirting", text: "Swollen skirting or bubbling paint just outside the bathroom." },
                { title: "Loose Tiles", text: "Floor tiles that rock or sound hollow near the shower." },
                { title: "Gaps at the Screen", text: "Black or split silicone where the screen meets the tiles." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-neutral-50 p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Grout Sits on Top of the Waterproofing</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Grout and silicone protect the membrane; they don&apos;t replace it. Under NCC 2022, shower walls must be waterproofed to at least 1,800 mm. If yours isn&apos;t, or the membrane has failed, regrouting alone won&apos;t fix the leak. More on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 8. OTHER SERVICES (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile, Silicone and Small Tiling Jobs in South Yarra
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Tile Regrouting", text: "Kitchen splashbacks, laundry floors and bathroom floors outside the shower.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Silicone Replacement", text: "Mouldy or peeling silicone around the screen, bath and vanity stripped and replaced.", href: "/silicone-recaulking", label: "Silicone and recaulking" },
                { title: "Small Tiling Jobs", text: "A loose or cracked tile replaced while we're there, matched as closely as possible.", href: "/small-tiling-jobs", label: "Small tiling jobs" },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link
                    href={c.href}
                    className="block h-full space-y-3 rounded-sm border border-neutral-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
                  >
                    <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                    <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                    <span className="inline-block font-bold text-accent">{c.label} &rarr;</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 9. LANDLORDS / INVESTORS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                For South Yarra Landlords, Investors and Renters
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Six in ten South Yarra homes are rented, so a lot of the work here is for investors and their property managers.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Between Leases", text: "Regrout and reseal between tenants so the bathroom photographs well for the next listing." },
                { title: "Around Tenants", text: "Booked to suit the tenant, with the shower back in use as soon as it has cured." },
                { title: "Renting? Tell Your Agent", text: "Report cracked grout or a leak to your agent in writing. Repairs are usually arranged by the rental provider." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-auto max-w-3xl rounded-sm bg-[#1a2a8c] p-8 text-center text-white">
              <h3 className="text-xl font-bold">Managing a South Yarra investment?</h3>
              <p className="mt-2 text-base text-white/85">
                See how we work with landlords, agents and strata managers.
              </p>
              <Link
                href="/real-estate-property-services"
                className="mt-5 inline-block rounded-sm bg-[#FBBC04] px-6 py-3 text-base font-bold text-neutral-900 transition-transform hover:scale-105"
              >
                Property Services
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 10. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover in South Yarra and Prahran
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover all of South Yarra 3141, on both sides of Punt Road, plus Prahran 3181.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="station-chapel" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">South Yarra 3141</p>
                <h3 className="text-xl font-bold text-neutral-900">Around the Station and Chapel Street</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The streets around South Yarra station, Chapel Street and Toorak Road are lined with mid and high-rise apartment blocks, most with a balcony and a compact bathroom. Balcony edge joints and shower floors wear first here. We regrout and reseal both, and fit the job around your building&apos;s access rules.
                </p>
              </div>
              <div id="west-of-punt-road" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">South Yarra 3141</p>
                <h3 className="text-xl font-bold text-neutral-900">West of Punt Road</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  On the City of Melbourne side, near Fawkner Park and the Domain, streets like Park Street and Leopold Street hold Victorian terraces and older blocks of flats. Their original bathrooms often have small tiles and a lot of grout lines, so a careful regrout makes a big difference without touching the tiles.
                </p>
              </div>
              <div id="prahran" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Prahran 3181</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Prahran</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Prahran is terrace country: rows of single-storey Victorian and Edwardian homes between Chapel Street, Greville Street and Commercial Road, plus apartment blocks built since the 1990s. Terrace bathrooms have often been redone more than once, so grout and silicone age unevenly. We regrout showers, bathroom floors and laundries across Prahran, and balconies in its newer blocks.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Toorak", href: "/locations/melbourne/toorak" },
                { name: "Windsor", href: "/locations/melbourne/windsor" },
                { name: "Malvern", href: "/locations/melbourne/malvern" },
                { name: "Richmond", href: "/locations/melbourne/richmond" },
              ].map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-bold text-neutral-700 transition-colors hover:border-accent hover:text-accent"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 11. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why South Yarra Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Apartment Ready", text: "We plan around building rules, lifts and tenants." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">
                    {c.text}{" "}
                    {c.link && (
                      <Link href={c.link.href} className="font-bold text-accent hover:underline">
                        {c.link.label}
                      </Link>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 12. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in South Yarra?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Every job is quoted after we&apos;ve seen it. These are the things that change the price.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Size", text: "How big the balcony, shower or floor is." },
                { title: "Condition", text: "How far the grout and silicone have failed." },
                { title: "Grout Type", text: "Epoxy, or cement grout with sealer." },
                { title: "Access", text: "Parking, lifts and building rules can affect timing." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6 text-center"
                >
                  <h3 className="text-lg font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-base leading-relaxed text-neutral-600">{c.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              Shower pricing is on our{" "}
              <Link href="/shower-regrouting" className="font-bold text-accent hover:underline">
                shower regrouting page
              </Link>.
            </p>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-primary px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Get a Free Quote
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 13. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                South Yarra Regrouting FAQs
              </h2>
            </div>
            <ul className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* ═════════ 14. FINAL CTA (navy) ═════════ */}
        <section className="bg-[#0d1030] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[42px]">
              Balcony or Shower Leaking in South Yarra?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover South Yarra and Prahran.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-block rounded-sm bg-[#FBBC04] px-8 py-3 text-base font-bold text-neutral-900 transition-transform hover:scale-105"
              >
                Request A Quote
              </Link>
              <a
                href="tel:+61370238094"
                className="inline-flex items-center gap-2 rounded-sm border-[1.5px] border-white/80 px-8 py-3 text-base font-bold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> (03) 7023 8094
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
