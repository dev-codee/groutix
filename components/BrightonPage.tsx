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
    q: "Do you cover my part of Bayside?",
    a: "Yes. We cover Brighton 3186, Brighton East 3187, Hampton and Hampton East 3188, Highett 3190, Sandringham 3191, and Black Rock and Beaumaris 3193, travelling from our Gowanbrae base.",
  },
  {
    q: "Can you regrout without damaging my original tiles?",
    a: "Yes, in most cases. We remove the old grout carefully along each joint and leave the tiles in place. If a tile is already cracked or loose, we'll point it out before we start so you can decide whether to replace it.",
  },
  {
    q: "Can you match my existing grout colour?",
    a: "We match the colour as closely as we can to the grout you have. Old grout fades and stains unevenly, so regrouting a whole shower or floor gives the most even finish rather than patching a few lines.",
  },
  {
    q: "Will regrouting stop my ensuite leaking into the room below?",
    a: "If water is getting through cracked grout or failed silicone, regrouting and resealing usually stops it. If the waterproofing membrane underneath has failed, regrouting alone won't, and we'll tell you that before you book the work.",
  },
  {
    q: "Is it worth regrouting before selling my Brighton home?",
    a: "Fresh grout and new silicone make a bathroom look cared for in listing photos and inspections, for a fraction of what a renovation costs. If a building inspector has flagged cracked grout or failed silicone, we can fix it before settlement.",
  },
  {
    q: "Do you repair balconies in Hampton and Beaumaris?",
    a: "Yes. We regrout and reseal balconies, terraces and outdoor tiles across Hampton, Beaumaris and the rest of Bayside. If the membrane under the tiles has failed, regrouting won't fix it, and we'll tell you that before you spend money.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/brighton#service",
      name: "Shower, tile and balcony regrouting in Brighton",
      serviceType: ["Shower regrouting", "Balcony regrouting", "Leaking shower repair", "Tile regrouting"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Brighton VIC 3186" },
        { "@type": "Place", name: "Brighton East VIC 3187" },
        { "@type": "Place", name: "Hampton VIC 3188" },
        { "@type": "Place", name: "Hampton East VIC 3188" },
        { "@type": "Place", name: "Highett VIC 3190" },
        { "@type": "Place", name: "Sandringham VIC 3191" },
        { "@type": "Place", name: "Black Rock VIC 3193" },
        { "@type": "Place", name: "Beaumaris VIC 3193" },
      ],
      url: "https://groutix.com/locations/melbourne/brighton",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Brighton", item: "https://groutix.com/locations/melbourne/brighton" },
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

export default function BrightonPage({
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
                Shower Regrouting &amp; Leak Repairs in Brighton
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Brighton bathrooms are built to last, and plenty of owners would rather keep the tiles they chose, or inherited, than rip them out. We regrout showers, bathroom floors and balconies across Brighton, Hampton and Sandringham without pulling up your tiles, and back eligible shower work with a 10-year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
              </div>
            </div>
            <div className="w-full">
              {/* [TBC] Client to supply hero image (recommended 800x600). Replace src below. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/brighton-hero.jpg"
                  alt="Shower regrouting in a Brighton family bathroom"
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
                Regrouting for Brighton&apos;s Period Homes, Townhouses and Bayside Units
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix regrouts showers, tiled floors and balconies across Brighton 3186 and the City of Bayside, working from our Gowanbrae base.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Brighton is a house suburb. Most homes are freestanding, a good share are townhouses, and about one in five is a flat. Many have been renovated once or twice, so it&apos;s common to find a newer ensuite upstairs and an older main bathroom with original or heritage-style tiles downstairs.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Good tiles usually outlast their grout. When the grout cracks or the silicone goes black, the answer is rarely a new bathroom. We cut out the failed grout, match the colour as closely as we can, and leave the tiles you chose where they are. Closer to the bay, from The Esplanade to Beach Road, balconies and outdoor tiles also take a beating from salt air and winter rain.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "57%", label: "Of Brighton Homes Are Separate Houses", sub: "ABS Census 2021" },
                { value: "73%", label: "Of Brighton Homes Are Owner-Occupied", sub: "ABS Census 2021" },
                { value: "3186 to 3193", label: "Brighton, Hampton, Sandringham and Beaumaris", sub: "All covered from our Gowanbrae base" },
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

        {/* ═════════ 4. SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Brighton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout replaces the cracked, mouldy or missing grout and the silicone in your shower, usually in one visit, with the tiles left where they are.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Many Brighton bathrooms still look good from the doorway. Up close, the floor grout is cracking, the corners are going black and the silicone has started to lift. That&apos;s the right time to regrout, before water gets under the tiles and a refresh turns into a rebuild.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over.",
                    "Grout colour matched to your existing grout wherever we can.",
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

        {/* ═════════ 5. LEAKING SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Brighton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a two-storey Brighton home, a leaking ensuite often shows up as a stain on the ceiling downstairs or swollen skirting in the hallway, long before you see water in the bathroom. We find where it&apos;s getting out, fix the grout and seals, and tell you straight if it&apos;s a membrane problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Stain Downstairs", text: "A water mark on the ceiling under the ensuite." },
                { title: "Swollen Skirting", text: "Swollen skirting or lifting floorboards outside the bathroom." },
                { title: "Drummy Tiles", text: "Loose or hollow-sounding tiles near the shower." },
                { title: "Musty Smell", text: "A musty smell in the bathroom that won't clear." },
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

        {/* ═════════ 6. BALCONY ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balcony Regrouting in Brighton and Hampton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Balconies on Brighton and Hampton townhouses and bayside units face salt air, summer sun and winter rain. When the grout gives way, water finds the membrane, then the room below. We cut out failed grout, reseal the edges and door sill, and regrout with a grout made for outdoor use, usually without lifting a tile.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "White Crusty Salts", text: "Efflorescence in the grout lines means water is moving through." },
                { title: "Cracked Edge Grout", text: "Cracked or missing grout at the door sill and along the edges." },
                { title: "Pooling Water", text: "Puddles that sit after rain instead of running to the outlet." },
                { title: "Stains Below", text: "Water marks or bubbling paint on the ceiling or wall underneath." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">When Regrouting Isn&apos;t Enough</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                If the membrane under the tiles has failed, or the balcony doesn&apos;t fall to the drain, regrouting won&apos;t fix it. We&apos;ll tell you that before you spend money. More detail on our{" "}
                <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">balcony leak repairs</Link> page.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 7. OTHER SERVICES (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tile, Epoxy and Silicone Work in Brighton
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Tile Regrouting", text: "Kitchen splashbacks, laundries, bathroom floors and tiled entries and hallways.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Epoxy Grout", text: "Denser and more stain resistant, for busy family showers and wet floors.", href: "/epoxy-grout", label: "Epoxy grout" },
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

        {/* ═════════ 8. SELLING / LEASING ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Selling, Leasing or Managing a Brighton Property?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Fresh grout and clean silicone make a bathroom look cared for, in listing photos and in a building inspection, for a fraction of what a renovation costs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Pre-Sale Refresh", text: "Regrout and reseal before the photographer comes, without the dust and weeks of a renovation." },
                { title: "Inspection Items", text: "Cracked grout or failed silicone flagged in a building report, fixed before settlement." },
                { title: "Rental Turnover", text: "Booked between tenants or around them, with the bathroom out of action for as little time as possible." },
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
              <h3 className="text-xl font-bold">Selling or managing a Bayside property?</h3>
              <p className="mt-2 text-base text-white/85">
                See how we work with agents, landlords and property managers.
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

        {/* ═════════ 9. AREAS WE COVER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Areas We Cover Around Brighton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover Brighton 3186 and Brighton East 3187, plus Hampton, Sandringham, Beaumaris and Black Rock.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div id="hampton" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Hampton 3188</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Hampton</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Between the cafes on Hampton Street and the beach at Picnic Point, Hampton mixes original family homes with newer townhouses and apartment blocks with balconies. Balcony regrouting is what Hampton people search for most. Upstairs balconies lose their edge grout first, then water works under the door sill and into the room below. We regrout and reseal balconies, showers and bathroom floors across Hampton and Hampton East, and if a balcony needs a membrane repair rather than a regrout, we&apos;ll tell you before you book.
                </p>
              </div>
              <div id="brighton-east" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Brighton East 3187</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Brighton East</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Brighton East has plenty of family homes that have been extended, with a new ensuite or a second storey added along the way. One house can have bathrooms from three different decades. We regrout each one to suit its tiles and match the grout colour wherever we can.
                </p>
              </div>
              <div id="sandringham" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Sandringham 3191</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Sandringham</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Close to the beach and the station shops, Sandringham mixes period homes with units and newer townhouses near the water. Bathrooms by the bay deal with damp sea air, so mould in the grout is usually the first sign. We regrout showers, floors and balconies across Sandringham.
                </p>
              </div>
              <div id="beaumaris" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Beaumaris and Black Rock 3193</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Beaumaris and Black Rock</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Beaumaris and Black Rock hold one of Australia&apos;s densest collections of post-war modernist houses, many with decks, terraces and tiled balconies. On these homes the outdoor tiles take the most weather, and grout that has sat in the sun for decades cracks and lets water underneath. We regrout and reseal balconies, showers and bathroom floors across both suburbs, with care for original features.
                </p>
              </div>
            </div>
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              We also cover Hampton East and Highett.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Bentleigh", href: "/locations/melbourne/bentleigh" },
                { name: "St Kilda", href: "/locations/melbourne/st-kilda" },
                { name: "Elwood", href: "/locations/melbourne/st-kilda#elwood" },
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

        {/* ═════════ 10. WHY GROUTIX ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Why Brighton Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs." },
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

        {/* ═════════ 11. COST (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                What Does Regrouting Cost in Brighton?
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

        {/* ═════════ 12. FAQ ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Brighton Regrouting FAQs
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
              Tired Grout or a Leaking Ensuite in Brighton?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover Brighton, Hampton, Sandringham and Beaumaris.
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
