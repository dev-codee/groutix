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
                Shower Regrouting &amp; Leak Repairs in St Kilda
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Most of St Kilda lives in flats, so a cracked shower floor or a tired balcony is rarely just your problem. It&apos;s the ceiling of the unit below. We regrout showers and balconies across St Kilda, Elwood and St Kilda East without pulling up your tiles, and back eligible shower work with a 10-year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
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
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 6. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in St Kilda
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a St Kilda flat, a leaking shower usually shows up next door or downstairs before you notice it in your own bathroom. We find where the water is getting out, fix the grout and seals, and tell you straight if it&apos;s a membrane problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Drummy Tiles", text: "Loose or hollow-sounding tiles near the shower." },
                { title: "Swollen Skirting", text: "Swollen skirting or damp carpet outside the hob." },
                { title: "Musty Smell", text: "A musty smell in the bathroom that won't clear." },
                { title: "Stain Downstairs", text: "A stain on the ceiling of the unit below." },
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
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Regrouting Is a Surface Repair</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                It isn&apos;t a new waterproofing membrane. Current building rules (NCC 2022) require shower walls to be waterproofed to at least 1,800 mm. If yours wasn&apos;t, or it has broken down, we&apos;ll say so. Read more on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 7. OTHER SERVICES ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile, Epoxy and Silicone Work in St Kilda
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Tile Regrouting", text: "Kitchen splashbacks, laundry floors and bathroom floors outside the shower.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Epoxy Grout", text: "Denser and more stain resistant, for busy showers and wet floors.", href: "/epoxy-grout", label: "Epoxy grout" },
                { title: "Silicone Replacement", text: "Mouldy or peeling silicone stripped right back and replaced.", href: "/silicone-recaulking", label: "Silicone and recaulking" },
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
                    className="block h-full space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6 transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
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

        {/* ═════════ 8. LANDLORDS (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Landlords, Agents and Owners Corporations in St Kilda
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Six in ten St Kilda homes are rented, so a lot of the work here is booked by landlords, property managers and strata managers.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Booked Around Tenants", text: "We fit the job around your tenants and keep the bathroom out of action for as little time as possible." },
                { title: "Plain-English Cause", text: "We explain what failed in plain words you can pass on to your agent or owners corporation." },
                { title: "Honest Scope", text: "If it's a membrane or plumbing problem, we say so before you pay for a regrout." },
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
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Who Pays for a Balcony Leak?</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                It depends on your plan of subdivision. In Victoria the balcony tiles and membrane often belong to the lot, which makes the repair the lot owner&apos;s job, but not in every building. Check your plan or ask your strata manager.
              </p>
            </div>
            <div className="mx-auto max-w-3xl rounded-sm bg-[#1a2a8c] p-8 text-center text-white">
              <h3 className="text-xl font-bold">Managing a St Kilda rental or apartment block?</h3>
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

        {/* ═════════ 9. AREAS WE COVER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around St Kilda
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover all of St Kilda 3182, plus Elwood, St Kilda East and St Kilda West.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="elwood" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Elwood 3184</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Elwood</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Elwood was built on the old Elster Creek swamp, and some of Melbourne&apos;s best interwar flats sit along Brighton Road, Marine Parade and the streets around Point Ormond. Many have balconies facing the bay, and that&apos;s where grout wears hardest: joints washed out at the edges, white salts in the lines, and water creeping under the door sill. Inside, 1930s bathrooms often still have their original floor tiles, which can usually be regrouted rather than replaced. We regrout and reseal balconies, showers and bathroom floors across Elwood, from Ormond Road to Glen Huntly Road. If a leaking balcony needs a membrane repair instead, we&apos;ll say so up front.
                </p>
              </div>
              <div id="st-kilda-east" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">St Kilda East 3183</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in St Kilda East</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Around Hotham Street and Alma Road, many of the big villas east of St Kilda Road were split into flats long ago, so bathrooms have often been added or redone more than once. We regrout showers, bathroom floors and laundries in St Kilda East and match the grout colour to what&apos;s already there wherever we can.
                </p>
              </div>
              <div id="st-kilda-west" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">St Kilda West 3182</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in St Kilda West</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Between Fitzroy Street and Beaconsfield Parade, St Kilda West has late Deco flats with curved corner balconies, like the blocks on Cowderoy Street. Curves and small balconies mean plenty of edge joints, and that&apos;s where grout and silicone give out first.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Balaclava", href: "/locations/melbourne/balaclava" },
                { name: "Albert Park", href: "/locations/melbourne/albert-park" },
                { name: "Middle Park", href: "/locations/melbourne/middle-park" },
                { name: "South Melbourne", href: "/locations/melbourne/south-melbourne" },
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
        {/* ═════════ 10. WHY GROUTIX (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why St Kilda Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "No Tile Removal", text: "On most regrouting jobs. Your tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google." },
                { title: "Straight Answers", text: "If it's a membrane or plumbing problem, we say so before you pay for a regrout." },
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

        {/* ═════════ 11. COST ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in St Kilda?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                The price depends on a few things. We give you a fixed quote once we&apos;ve seen the job.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Size", text: "How big the shower, balcony or floor is." },
                { title: "Condition", text: "How far the grout and silicone have failed." },
                { title: "Grout Type", text: "Cement grout with sealer, or epoxy grout." },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6 text-center"
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

        {/* ═════════ 12. FAQ (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                St Kilda Regrouting FAQs
              </h2>
            </div>
            <ul className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* ═════════ 13. FINAL CTA (navy) ═════════ */}
        <section className="bg-[#0d1030] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-5 px-4 text-center text-white sm:px-6">
            <h2 className="text-3xl font-black leading-tight lg:text-[42px]">
              Cracked Shower Floor or a Balcony Leak in St Kilda?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover St Kilda, Elwood and St Kilda East.
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
