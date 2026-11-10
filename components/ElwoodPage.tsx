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
    q: "Do I need owners corporation approval to regrout my bathroom?",
    a: "In most cases, no. Regrouting and resealing inside your own lot is surface work, not structural work, so it usually needs no owners corporation involvement. Work that touches the waterproofing membrane, the slab or common property is different, and that is where your plan of subdivision and your building rules come in. If your job sits in that second group we will tell you before we start.",
  },
  {
    q: "My balcony is leaking into the unit below. Who pays, me or the owners corporation?",
    a: "It genuinely depends on your building. In Victoria, responsibility follows where the leak starts and what your plan of subdivision says about the boundary between your lot and common property, and even court decisions have read similar plans differently. What settles it is finding the source first. Send us photos and we will document what we find in writing, which is what your owners corporation or committee needs either way. If it is failed grout and seals, we can fix it. If the membrane has failed, we will say so before you spend money.",
  },
  {
    q: "Will regrouting stop my shower leaking into the flat below?",
    a: "If the water is getting through cracked grout, grout that has fallen out, or silicone that has lifted, then yes. Elwood bathrooms are stacked one above the other, so a failed shower up top usually shows up as a stain on the ceiling below. If the waterproofing membrane under the tiles has failed, regrouting alone will not stop it, and we will tell you that before you book, not after you have paid.",
  },
  {
    q: "Is grout cleaning enough, or do I need regrouting?",
    a: "If your grout is sound and the problem is surface mould or staining, a proper clean may be all you need, and we will say so. Cleaning cannot fix grout that is cracked, missing, or soft and powdery, because water is already getting past it. That is when regrouting is the right job. We do not sell cleaning, so the advice costs you nothing.",
  },
  {
    q: "Can you regrout a shower over a bath?",
    a: "Yes, and it is one of the most common jobs in Elwood flats, where the shower over the bath is often the only bathing option in the home. The wall to bath junction and the corners take the most movement and water, so the silicone there matters as much as the grout. We strip both back and rebuild them.",
  },
  {
    q: "How long will my only bathroom be out of action?",
    a: "Most Elwood regrouts are finished in a single visit, which matters when the flat has one small bathroom. Your technician will confirm on the day exactly when the shower or bath can be used again, because epoxy and cement grout set differently. We also clean up fully before we leave, stairs, landings and all.",
  },
  {
    q: "The grout in my flat was redone recently and it is failing again. Why?",
    a: "The usual reason is that the new grout went over the old grout, a surface skim that cracks and falls out within a year or so. The other causes are silicone that was applied over old silicone, and movement in older buildings that needs proper movement joints. We cut failed grout out to full depth and strip old silicone completely, so the new work bonds and lasts.",
  },
  {
    q: "How much does it cost to regrout a shower in Elwood?",
    a: "It depends on the size of the shower, how far the grout and silicone have failed, and whether you choose cement grout with sealer or epoxy grout. Small flat bathrooms are often at the simpler end of the range. Send us two or three photos through our quote form and we will give you a fixed quote for your bathroom, with no obligation.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/elwood#service",
      name: "Shower, tile and balcony regrouting in Elwood",
      serviceType: ["Shower regrouting", "Balcony regrouting", "Leaking shower repair", "Tile regrouting", "Regrout and reseal", "Silicone replacement"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Elwood VIC 3184" },
      ],
      url: "https://groutix.com/locations/melbourne/elwood",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Elwood", item: "https://groutix.com/locations/melbourne/elwood" },
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

export default function ElwoodPage({
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
                Shower Regrouting &amp; Leak Repairs in Elwood
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Elwood is a suburb of flats, from art deco blocks near Shelley Street to walk up apartments and period homes around Ormond Road. In most of them the tiles are still good and the grout is not. We regrout showers, bathroom floors and balconies across Elwood without pulling up your tiles, and back eligible shower work with a 10 year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
              </div>
            </div>
            <div className="w-full">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/white-subway-sea-border-bath-shower-regrouting-after.webp"
                  alt="Shower over bath with fresh grout and subway tiles regrouted by Groutix"
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
                Regrouting for Elwood&apos;s Art Deco Flats, Walk Up Blocks and Period Homes
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix regrouts showers, tiled floors and balconies across Elwood 3184 in the City of Port Phillip, working from our Gowanbrae base.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Elwood sits on the bay about eight kilometres south of the city, between St Kilda and Brighton, with Point Ormond at one end, the Ormond Road village at its heart and the Elwood Canal running through it. Almost three quarters of its homes are flats or apartments, many of them interwar art deco and Moderne blocks like Windemere in Shelley Street, built in 1936, alongside post war walk ups and a smaller share of period houses.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Those bathrooms have usually been working for decades. The tiles in a 1930s Elwood bathroom are often original and worth keeping, but the grout between them has a working life, and the salt air and humidity off the bay shorten it. Grout breaks down faster, silicone perishes earlier, and by the time the corners are black and the floor grout is falling out, the fix is a regrout, not a renovation.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "72%", label: "Of Elwood Homes Are Flats or Apartments", sub: "ABS Census 2021" },
                { value: "15,153", label: "Elwood Residents", sub: "ABS Census 2021" },
                { value: "3184", label: "Elwood, City of Port Phillip", sub: "All covered from our Gowanbrae base" },
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
                Shower Regrouting in Elwood
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout replaces the cracked, mouldy or missing grout and the silicone in your shower, usually in one visit, with the tiles left where they are.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Elwood bathrooms are compact. Many flats have one small bathroom, often with the shower over the bath, so there is no second shower to fall back on while work is done. Owners tell us the same story: bits of grout missing on the floor, grout falling and mould in the corners that cleaning will not shift. That is failed grout and perished silicone, and in a stacked building it is also how water starts travelling to the flat below.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to full depth along every joint, never grouted over.",
                    "Grout colour matched to your existing grout wherever we can, including heritage tiles worth keeping.",
                    "Old silicone stripped completely, because new silicone will not bond to old, and mould grows inside perished silicone.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link> for the longest lasting finish.</>,
                    "A full clean up before we leave, stairs and landings included. Regrouting is grinding work, and we treat your building like our own.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-base text-neutral-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{i + 1}</span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
                <Image
                  src="/white-kitkat-shower-corner-regrouting-after.webp"
                  alt="Corner shower with fresh white grout in a compact bathroom regrouted by Groutix"
                  fill
                  className="object-cover"
                />
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
                Leaking Shower Repair in Elwood
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In Elwood&apos;s stacked blocks, bathrooms sit one above the other and share the same risers, so a leaking shower rarely stays your problem alone. It shows up in the flat below, as a ceiling stain, damp on the back of a wall, or a musty smell in a wardrobe. We find where the water is getting out, fix the grout and seals if that is the cause, and tell you straight if it is a membrane problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Stain on the Ceiling Below", text: "The downstairs neighbour or your own tenant reports a spreading water mark." },
                { title: "Damp on the Back of the Wall", text: "Dampness or bubbling paint on the wall behind the shower, often in a bedroom." },
                { title: "Meter That Never Stops", text: "A water bill that jumps, or a meter still turning when every tap is off." },
                { title: "Musty Wardrobe Smell", text: "A musty smell in the wardrobe or room that shares a wall with the bathroom." },
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
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                One Elwood confusion is worth clearing up. The suburb was built on drained swampland around Elster Creek and the Elwood Canal, and its low lying streets have a long flood history. Ground floor damp near the canal is not always a shower leak, and a shower leak is not always the cause of a damp wall. Chasing the wrong source wastes everyone&apos;s money, so we check where the water is actually coming from before recommending any repair. If a leak from your shower is reaching the ceiling below, our guide on{" "}
                <Link href="/guides/shower-leaking-into-ceiling-below" className="font-bold text-accent hover:underline">a shower leaking through the ceiling</Link>{" "}
                explains the first steps and who pays.
              </p>
            </div>
            <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-sm">
              <Image
                src="/white-wall-corner-shower-grey-floor-after.webp"
                alt="Regrouted corner shower with clean grout lines and new silicone by Groutix"
                fill
                className="object-cover"
              />
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Regrouting Is Not Waterproofing, and We Will Say So</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Some companies will happily regrout a shower whose waterproofing membrane has failed, and the leak comes back, into your flat or the one below. We check the signs first, the grout, the silicone, the tiles and the walls around the shower. If your leak is a membrane failure, regrouting will not fix it and we will tell you before you spend money, then point you to the right repair. If it is grout and seals, which it often is, we fix it on the spot. Read more on{" "}
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
                Balcony Regrouting in Elwood
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Elwood&apos;s deco and post war blocks carry balconies that face the bay and the weather. Their falls were often shallow to begin with, and once the grout at the edges and the door sill cracks, water works under the tiles and into the underside of the slab, and then into the flat below. We cut out the failed grout, reseal the edges and door sill, and regrout with a grout made for outdoor use, usually without lifting a tile.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "White Chalky Salts", text: "Efflorescence in the grout lines means water is moving through the balcony." },
                { title: "Cracked Edge Grout", text: "Cracked or missing grout at the door sill and along the balcony edges." },
                { title: "Pooling Water", text: "Puddles that sit after rain on shallow falls instead of running to the outlet." },
                { title: "Marks on the Soffit Below", text: "Stains, bubbling paint or cracking concrete on the underside of the balcony above you." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Apartment Balcony Leaking Into the Unit Below?</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                The first question is usually who pays, you or the owners corporation. In Victoria, responsibility follows the source of the leak and the boundary in your building&apos;s plan of subdivision, and those plans are not all written the same way. We can document what we find, in writing with photos, so you have what your committee or manager needs. And if the problem is a failed membrane or falls that send water the wrong way, regrouting cannot fix it, and we will tell you that before you book. More detail on our{" "}
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
                Tile, Epoxy and Silicone Work in Elwood
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Tile Regrouting", text: "Kitchen splashbacks, laundries, bathroom floors and the original tiles in Elwood deco bathrooms.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Epoxy Grout", text: "Denser, waterproof and stain resistant, the long lasting choice for small hard working flat bathrooms.", href: "/epoxy-grout", label: "Epoxy grout" },
                { title: "Silicone Replacement", text: "Mouldy or peeling silicone stripped right back and replaced, so the mould growing inside it goes with it.", href: "/silicone-recaulking", label: "Silicone and recaulking" },
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
                Renting, Selling or Managing an Elwood Flat?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                More than half of Elwood households rent, so a lot of our Elwood work is booked by landlords and property managers as well as owners. A leaking shower in a rental is treated as an urgent repair in Victoria, and a tired bathroom holds a flat back at sale or lease. Fresh grout and silicone fix both impressions and inspections, in a day, without a renovation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Between Tenancies", text: "Regrout and reseal while the flat is empty, so the next tenant starts with a bathroom that is watertight, not patched." },
                { title: "Urgent Leak Repairs", text: "A tenant report of water through the ceiling below acted on quickly, with the cause documented for the owner." },
                { title: "Pre Sale Refresh", text: "Deco bathrooms photograph beautifully when the grout is fresh. A fraction of a renovation, without the weeks of dust." },
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
              <h3 className="text-xl font-bold">Managing property in Elwood or St Kilda?</h3>
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
                Areas We Cover Around Elwood
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover Elwood 3184, plus St Kilda, Elsternwick, Brighton and Balaclava around the bay.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">St Kilda 3182</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in St Kilda</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  North past Point Ormond, St Kilda has its own dedicated Groutix page covering its flats, walk up blocks and period homes, including St Kilda East and St Kilda West.
                </p>
                <p>
                  <Link href="/locations/melbourne/st-kilda" className="font-bold text-accent hover:underline">
                    See our St Kilda page &rarr;
                  </Link>
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Elsternwick 3185</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Elsternwick</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Inland from Elwood along Glen Huntly Road, Elsternwick mixes period homes with deco and post war flats much like Elwood itself. We regrout showers, floors and balconies across Elsternwick.
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Brighton 3186</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Brighton</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  South along the foreshore, Brighton has its own dedicated Groutix page for its period homes, townhouses and bayside units.
                </p>
                <p>
                  <Link href="/locations/melbourne/brighton" className="font-bold text-accent hover:underline">
                    See our Brighton page &rarr;
                  </Link>
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Balaclava 3183</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Balaclava</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  East of St Kilda, Balaclava has its own dedicated Groutix page, with the same mix of flats and period homes around Carlisle Street.
                </p>
                <p>
                  <Link href="/locations/melbourne/balaclava" className="font-bold text-accent hover:underline">
                    See our Balaclava page &rarr;
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "St Kilda", href: "/locations/melbourne/st-kilda" },
                { name: "Brighton", href: "/locations/melbourne/brighton" },
                { name: "Balaclava", href: "/locations/melbourne/balaclava" },
                { name: "All Melbourne areas", href: "/locations/melbourne" },
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
                Why Elwood Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Already Working in Elwood", text: "A recent Elwood customer had us regrout and seal a shower with waterproofing issues, and described the team as very professional." },
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs. Original deco tiles stay where they belong." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google, with real before and after photos of our work." },
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
                What Does Regrouting Cost in Elwood?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Small jobs in Elwood get quoted everything from a quick skim price to a full renovation pitch. We price from your photos, so the quote is for your bathroom and the full job, cut out and rebuilt, not a surface skim that fails within the year. Three things set the price.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Size", text: "How big the shower, balcony or floor is. Compact flat bathrooms are often at the simpler end." },
                { title: "Condition", text: "How far the grout and silicone have failed, and whether tiles have started to lift." },
                { title: "Grout Type", text: "Cement grout with sealer, or epoxy grout for the longest lasting finish." },
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
              How the work itself is done is on our{" "}
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
                Elwood Regrouting FAQs
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
              Tired Grout or a Leaking Shower in Elwood?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover Elwood, St Kilda, Brighton and Balaclava.
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
