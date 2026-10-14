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
    q: "Can you regrout the tiled verandah on my Albert Park terrace?",
    a: "Yes, where the joints have washed out or cracked. We regrout the joints and re-fix the odd loose tile as a small tiling job. Full restoration of original encaustic or tessellated Victorian tiles is specialist heritage work, and we'll tell you if yours needs it.",
  },
  {
    q: "My upstairs balcony leaks into the front room. What's the usual cause?",
    a: "Usually failed grout and silicone at the door sill, the walls or the balustrade posts. Sometimes it's the waterproofing membrane under the tiles. We check which before we quote, so you only pay for the repair you need.",
  },
  {
    q: "Is balcony waterproofing repair the same as regrouting?",
    a: "No. Regrouting replaces the grout and seals on top of the tiles. Waterproofing repair fixes or replaces the membrane underneath. If the membrane is sound, a regrout and reseal stops the leak; if it has failed, we'll say so before you spend money.",
  },
  {
    q: "Can you get to my place during the Grand Prix?",
    a: "Road closures and parking limits around Albert Park Lake make access harder in the weeks around the Australian Grand Prix. Book early, tell us your street, and we'll plan the job around the closure dates.",
  },
  {
    q: "Do you cover all of Albert Park?",
    a: "Yes. We cover Albert Park 3206, from Bridport Street and St Vincent Gardens to Beaconsfield Parade. Middle Park and South Melbourne have their own pages, and we work there too.",
  },
  {
    q: "Why does my terrace bathroom grout keep going mouldy?",
    a: "Older terrace bathrooms are often small, with little airflow, so steam lingers. Once grout cracks or turns porous, mould grows inside it and bleach only lightens the surface. Fresh grout and silicone, plus a good exhaust fan, keep it away.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/albert-park#service",
      name: "Balcony, verandah and shower regrouting in Albert Park",
      serviceType: ["Balcony regrouting", "Balcony leak repair", "Shower regrouting", "Leaking shower repair", "Tile regrouting"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: { "@type": "Place", name: "Albert Park VIC 3206" },
      url: "https://groutix.com/locations/melbourne/albert-park",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Albert Park", item: "https://groutix.com/locations/melbourne/albert-park" },
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

export default function AlbertParkPage({
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
        <section className="relative overflow-hidden bg-[#0d1030] pt-[90px] lg:pt-[100px]">
          <div className="relative mx-auto grid max-w-[1460px] items-center gap-10 px-4 sm:px-6 py-8 pb-12 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-12 lg:pb-16">
            <div className="space-y-5 text-center text-white lg:text-left">
              <p className="text-[15px] font-black uppercase tracking-[0.2em] text-[#FBBC04]">Groutix</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">
                Balcony, Verandah &amp; Shower Regrouting in Albert Park
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Albert Park is terrace country, and terraces have three places where grout gives up first: the upstairs balcony, the tiled front verandah and a bathroom often tucked at the back. We regrout all three across Albert Park 3206 without lifting your tiles, and back eligible shower work with a 10-year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
              </div>
            </div>
            <div className="w-full">
              {/* [TBC] Client to supply hero image (recommended 800x600). Replace src below. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/albert-park-hero.jpg"
                  alt="Balcony regrouting on an Albert Park terrace"
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
                Regrouting for Albert Park&apos;s Victorian Terraces
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix regrouts balconies, verandahs, showers and tiled floors across Albert Park 3206 in the City of Port Phillip, working from our Gowanbrae base.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Six in ten Albert Park homes are terraces or semis, many on heritage-protected streets between the lake and the beach. The houses are well over a century old. Their bathrooms, balconies and verandahs have usually been redone at least once since, and that&apos;s where the grout and silicone wear out.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Being this close to the bay matters too. Upstairs balconies and front verandahs take the sea breeze, winter rain and summer sun, and once the grout cracks, water gets under the tiles and into the room or hallway below.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "62%", label: "Of Albert Park Homes Are Terraces or Semis", sub: "ABS Census 2021" },
                { value: "61%", label: "Of Albert Park Homes Are Owner-Occupied", sub: "ABS Census 2021" },
                { value: "3206", label: "Albert Park, From the Lake to the Beach", sub: "Covered from our Gowanbrae base" },
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
                Balcony Regrouting in Albert Park
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Most leaking balconies on Albert Park terraces and bayside apartments start with failed grout and silicone where the tiles meet the door sill, the walls and the balustrade. We cut out the old grout, reseal the junctions and regrout with a grout made for outdoor use, usually without lifting a tile.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Damp Front Room", text: "A stain on the ceiling of the room under the balcony." },
                { title: "Washed-Out Joints", text: "Grout lines that are sandy, missing or growing moss." },
                { title: "Balustrade Post Bases", text: "Gaps and rust stains where the posts meet the tiles." },
                { title: "Cracked Door Sill", text: "Cracked grout or silicone where the balcony meets the door." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Balcony Regrouting or Waterproofing Repair?</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Regrouting replaces the grout and seals on top of the tiles. Waterproofing repair fixes or replaces the membrane underneath. If the membrane is sound, a regrout and reseal is all you need; if it has failed, we&apos;ll tell you before you spend money. More on{" "}
                <Link href="/balcony-leak-repairs" className="font-bold text-accent hover:underline">balcony leak repairs</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 5. VERANDAHS ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Tiled Verandahs, Paths and Courtyards
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Many Albert Park terraces have a tiled front verandah or path, and plenty have a tiled courtyard out the back. When the joints wash out, tiles start to rock and water gets underneath.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Front Verandahs", text: "Washed-out or cracked joints regrouted so the tiles stay put." },
                { title: "Paths and Steps", text: "The odd loose tile re-fixed as a small tiling job, matched as closely as we can." },
                { title: "Rear Courtyards", text: "Outdoor tiles regrouted with a grout made for outdoor use." },
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
            <p className="mx-auto max-w-3xl text-center text-base text-neutral-600">
              Original encaustic and tessellated Victorian tiles need a heritage tile specialist for full restoration. We&apos;ll tell you if yours do. More on{" "}
              <Link href="/tile-regrouting" className="font-bold text-accent hover:underline">tile regrouting</Link>.
            </p>
          </div>
        </AnimatedSection>

        {/* ═════════ 6. SHOWER (alt bg) ═════════ */}
        <AnimatedSection className="bg-[#eef1f8] py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Shower Regrouting in Albert Park
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout replaces cracked, mouldy or missing grout and the old silicone, usually in one visit, with your tiles left in place.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In terrace homes the bathroom is often at the back of the house, or upstairs under a sloping ceiling, with a small window and not much airflow. Steam lingers, mould moves into the grout, and the silicone along the base goes black first. Regrouting before water gets under the tiles saves the bathroom.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-white p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to depth, not painted over.",
                    "Old silicone stripped and replaced, because new silicone won't bond to old.",
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

        {/* ═════════ 7. LEAKING SHOWER ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Leaking Shower Repair in Albert Park
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a two-storey terrace, an upstairs shower leak shows up downstairs: a stain on the hallway ceiling, a damp patch by the stairs or swollen timber at the bathroom door. We find where the water is escaping, fix the grout and seals, and tell you straight if it&apos;s a membrane or plumbing problem.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Hallway Ceiling Stain", text: "A brown mark on the ceiling under the upstairs bathroom." },
                { title: "Swollen Door Frame", text: "Timber at the bathroom door swelling or lifting." },
                { title: "Drummy Tiles", text: "Floor tiles that sound hollow or rock underfoot." },
                { title: "Musty Bathroom", text: "A damp smell that stays after the room has aired." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Regrouting Doesn&apos;t Replace a Membrane</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Grout and silicone keep water off the waterproofing; they aren&apos;t the waterproofing. Under NCC 2022, shower walls must be waterproofed to at least 1,800 mm. If yours wasn&apos;t, or the membrane has failed, we&apos;ll say so. More on{" "}
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
                Kitchen, Laundry, Epoxy and Silicone Work
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Kitchen and Laundry Tiles", text: "Splashbacks and laundry floors regrouted without retiling.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Epoxy Grout", text: "Denser and more stain resistant, for showers and wet floors that work hard.", href: "/epoxy-grout", label: "Epoxy grout" },
                { title: "Silicone Replacement", text: "Mouldy or peeling silicone around the bath, screen and vanity stripped and replaced.", href: "/silicone-recaulking", label: "Silicone and recaulking" },
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

        {/* ═════════ 9. WHERE WE WORK ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Where We Work in Albert Park
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover all of Albert Park 3206, from the lake to Beaconsfield Parade.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div id="bridport-street" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Albert Park 3206</p>
                <h3 className="text-xl font-bold text-neutral-900">Around Bridport Street</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The streets around Bridport Street&apos;s shops and cafes are lined with single and double-storey Victorian terraces. Upstairs balconies, front verandahs and compact bathrooms are where the grout fails first, often all in the one house.
                </p>
              </div>
              <div id="st-vincent-gardens" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Albert Park 3206</p>
                <h3 className="text-xl font-bold text-neutral-900">Around St Vincent Gardens</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  The terraces facing St Vincent Gardens sit in one of Albert Park&apos;s best-kept heritage pockets, and the gardens are registered with the National Trust. Original features matter here, so we regrout carefully around them and leave the tiles in place.
                </p>
              </div>
              <div id="beaconsfield-parade" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Albert Park 3206</p>
                <h3 className="text-xl font-bold text-neutral-900">Beaconsfield Parade and the Beach</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Along Beaconsfield Parade, near Kerferd Road pier, homes and apartments face the bay head-on. Balconies here get more salt, wind and sun than anywhere else in the suburb, so edge joints and door sills need checking more often.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-neutral-50 p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Booking Around the Grand Prix</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Road closures and parking limits around Albert Park Lake make access harder in the weeks around the Australian Grand Prix. Book early, tell us your street, and we&apos;ll plan the job around the closure dates.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Middle Park", href: "/locations/melbourne/middle-park" },
                { name: "South Melbourne", href: "/locations/melbourne/south-melbourne" },
                { name: "St Kilda", href: "/locations/melbourne/st-kilda" },
                { name: "South Yarra", href: "/locations/melbourne/south-yarra" },
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
                Why Albert Park Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Built for Terraces", text: "Balconies, verandahs and bathrooms in older homes, regrouted without lifting tiles." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: "5.0 From 290+ Reviews", text: "Rated by Melbourne customers on Google." },
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
                What Does Regrouting Cost in Albert Park?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We quote every job after we&apos;ve seen it. These are the things that change the price.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "The Area", text: "A balcony, a verandah, a shower or a whole floor." },
                { title: "Condition", text: "How far the grout and silicone have failed." },
                { title: "Grout Type", text: "Cement grout with sealer, or epoxy grout." },
                { title: "Access", text: "Stairs, upstairs balconies and parking near the lake." },
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
                Albert Park Regrouting FAQs
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
              Leaking Balcony or Tired Shower in Albert Park?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover all of Albert Park 3206.
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
