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
    q: "Will regrouting stop my shower leaking?",
    a: "If the water is getting out through cracked grout, grout that has fallen out, or silicone that has lifted, then yes, regrouting and resealing is the fix. If the waterproofing membrane under the tiles has failed, regrouting on its own will not stop the leak, and we will tell you that before you book the work, not after you have paid for it.",
  },
  {
    q: "How do I know if the grout in my shower has failed?",
    a: "The signs Hampton owners describe to us are grout cracking and crumbling across the shower floor, grout that has fallen out in patches, grout that feels soft or powdery when you press it, and black mould in the corners that keeps coming back no matter how much you clean. Any one of those means water is getting past the surface and the grout needs replacing, not another clean.",
  },
  {
    q: "Can you put new grout over the old grout?",
    a: "No, and we do not work that way. New grout over old grout is a surface skim that cracks and falls out within the year. We cut the failed grout out to full depth along every joint, then regrout, so the new grout bonds properly and lasts.",
  },
  {
    q: "Why does the mould keep coming back in my silicone?",
    a: "Because the mould is growing inside the silicone, not just on it. Once silicone has perished, mould colonises through the bead itself, and bleach only cleans the surface for a few months. The fix is to strip the old silicone out completely and reseal with fresh silicone. Groutix replaces silicone as part of every shower regrout.",
  },
  {
    q: "How long does regrouting last, and when can I use my shower again?",
    a: "Epoxy grout is the longer lasting option and is what we recommend for busy family showers and wet floors. Cement grout with sealer suits walls and lighter use areas. Most Hampton regrouts are finished in a single visit, and your technician will confirm on the day exactly when your shower can be used again, because epoxy and cement grout set differently.",
  },
  {
    q: "My balcony is leaking into the unit below. Who pays, me or the owners corporation?",
    a: "In Victoria, responsibility usually follows the source of the leak. A balcony membrane inside your lot is generally the lot owner\u2019s responsibility, while common property is the owners corporation\u2019s, and the plan of subdivision is what decides the boundary. Send us photos and we will document what we find, which helps either way. If the problem is failed grout and seals we can fix it. If the membrane has failed we will say so before you spend money.",
  },
  {
    q: "How much does it cost to regrout a shower in Hampton?",
    a: "It depends on the size of the shower, how far the grout and silicone have failed, and whether you choose cement grout with sealer or epoxy grout. Send us two or three photos through our quote form and we will give you a fixed quote for your bathroom, with no obligation.",
  },
  {
    q: "Do you cover Hampton East and the streets around Hampton station?",
    a: "Yes. We cover all of Hampton 3188 including Hampton East, from the Hampton Street shops and the station streets out to the post war brick veneer homes near Moorabbin. Hampton East homes often still carry original or first renovation bathrooms, which is exactly the work we do most.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://groutix.com/locations/melbourne/hampton#service",
      name: "Shower, tile and balcony regrouting in Hampton",
      serviceType: ["Shower regrouting", "Balcony regrouting", "Leaking shower repair", "Tile regrouting", "Regrout and reseal", "Silicone replacement"],
      provider: { "@id": "https://groutix.com/#localbusiness" },
      areaServed: [
        { "@type": "Place", name: "Hampton VIC 3188" },
        { "@type": "Place", name: "Hampton East VIC 3188" },
      ],
      url: "https://groutix.com/locations/melbourne/hampton",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://groutix.com/" },
        { "@type": "ListItem", position: 2, name: "Locations", item: "https://groutix.com/locations" },
        { "@type": "ListItem", position: 3, name: "Melbourne", item: "https://groutix.com/locations/melbourne" },
        { "@type": "ListItem", position: 4, name: "Hampton", item: "https://groutix.com/locations/melbourne/hampton" },
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

export default function HamptonPage({
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
                Shower Regrouting &amp; Leak Repairs in Hampton
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:mx-0">
                Hampton bathrooms were built for the long term, from California bungalows near Hampton Street to post war family homes and beachside apartments. When the grout starts falling out and the silicone goes black, the tiles are usually still worth keeping. We regrout showers, bathroom floors and balconies across Hampton and Hampton East without pulling up your tiles, and back eligible shower work with a 10 year waterproof warranty.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <HeroContactBadges rating={rating} />
              </div>
            </div>
            <div className="w-full">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-white/5">
                <Image
                  src="/mosaic-strip-niche-shower-regrouting-after.webp"
                  alt="Regrouted shower with a mosaic feature strip and tiled niche by Groutix"
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
                Regrouting for Hampton&apos;s Bungalows, Post War Homes and Beachside Apartments
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Groutix regrouts showers, tiled floors and balconies across Hampton 3188 and the City of Bayside, working from our Gowanbrae base.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Hampton sits on the bay between Brighton and Sandringham, about 14 kilometres south of the city, with the Sandringham line running through Hampton station and the Hampton Street village at its heart. The housing is a real mix. Heritage streets like the Orlando Street precinct hold some of Melbourne&apos;s best kept period homes, Hampton East is post war brick veneer, and newer apartment buildings near the station and along the Esplanade bring balconies and ensuites into the picture.
              </p>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                What they share is the bayside air. Salt air and humidity work on grout and silicone the way they work on everything near the coast. Grout breaks down faster, silicone perishes earlier, and by the time a Hampton bathroom is fifteen or twenty years old the grout is often chalked to powder in the shower floor while the tiles themselves are still sound. That is a regrouting job, not a renovation.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { value: "65%", label: "Of Hampton Homes Are Separate Houses", sub: "ABS Census 2021" },
                { value: "13,518", label: "Hampton Residents", sub: "ABS Census 2021" },
                { value: "3188", label: "Hampton and Hampton East", sub: "All covered from our Gowanbrae base" },
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
                Shower Regrouting in Hampton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                A shower regrout replaces the cracked, mouldy or missing grout and the silicone in your shower, usually in one visit, with the tiles left where they are.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                From the outside, most Hampton showers still look fine. Get closer and the floor grout is cracking and crumbling, sections have fallen out completely, and the corners are going black. Owners tell us the mould keeps coming back within months of cleaning it. That is failed grout and perished silicone letting water through, and it is the right time to regrout, before water gets under the tiles and a refresh turns into a rebuild.
              </p>
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">What a Groutix Shower Regrout Includes</h3>
                <ol className="space-y-3">
                  {[
                    "Old grout cut out to full depth along every joint, never grouted over.",
                    "Grout colour matched to your existing grout wherever we can.",
                    "Old silicone stripped completely, because new silicone will not bond to old, and mould grows inside perished silicone.",
                    <>Your choice of cement grout with sealer, or <Link href="/epoxy-grout" className="font-bold text-accent hover:underline">epoxy grout</Link> for busy family showers.</>,
                    "A full clean up before we leave. Regrouting is grinding work, and we treat your bathroom like our own.",
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
                  src="/double-shower-niche-linear-drain-regrouting-after.webp"
                  alt="Double shower with fresh grout, tiled niche and linear drain regrouted by Groutix"
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
                Leaking Shower Repair in Hampton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                In a two storey Hampton home, a leaking upstairs shower often shows up somewhere else first, as a stain on the ceiling below, damp in the bedroom wall next to the bathroom, or a musty smell that will not clear. We find where the water is getting out, fix the grout and seals if that is the cause, and tell you straight if it is a membrane problem instead.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Stain on the Ceiling Below", text: "A water mark spreading on the ceiling under the bathroom." },
                { title: "Damp in the Next Room", text: "Damp or bubbling paint on the wall that shares a side with the shower." },
                { title: "Hollow Sounding Tiles", text: "Tiles that sound hollow when you tap them, or wobble when you press them." },
                { title: "Spongy Wall", text: "A wall near the shower that feels soft or spongy when you push on it." },
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
            <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-sm">
              <Image
                src="/white-wall-beige-envelope-shower-regrouting-after.webp"
                alt="Freshly regrouted shower recess with clean grout lines and new silicone by Groutix"
                fill
                className="object-cover"
              />
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                One bayside trap catches Hampton owners out. The soil here is sandy, so a slow leak under a slab or behind a wall can drain away without ever leaving a wet patch you can see. Sometimes the first sign is a water bill that jumps, or a meter that keeps turning when everything is off. If that sounds familiar, do not wait for a stain to appear.
              </p>
            </div>
            <div className="mx-auto max-w-3xl rounded-sm border-l-4 border-accent bg-white p-6">
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Regrouting Is Not Waterproofing, and We Will Say So</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                Some companies will happily regrout a shower whose waterproofing membrane has failed, and the leak comes back. We check the signs first, the grout, the silicone, the tiles and the walls around the shower. If your leak is a membrane failure, regrouting will not fix it and we will tell you before you spend money, then point you to the right repair. If it is grout and seals, which it often is, we fix it on the spot. Read more on{" "}
                <Link href="/leaking-shower-repair" className="font-bold text-accent hover:underline">leaking shower repair</Link>{" "}
                and our guide on{" "}
                <Link href="/guides/shower-still-leaking-after-regrouting" className="font-bold text-accent hover:underline">why a shower can still leak after regrouting</Link>.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═════════ 6. BALCONY ═════════ */}
        <AnimatedSection className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
                Balcony Regrouting in Hampton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Balcony regrouting is the work Hampton searches for most. Townhouse and apartment balconies from the Esplanade to Hampton East face salt air, summer sun and winter rain, and the grout at the edges and the door sill usually fails first. Once it cracks, water works under the tiles and shows up in the room or the unit below. We cut out the failed grout, reseal the edges and door sill, and regrout with a grout made for outdoor use, usually without lifting a tile.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "White Chalky Crust", text: "Efflorescence in the grout lines means water is moving through the balcony." },
                { title: "Cracked Edge Grout", text: "Cracked or missing grout at the door sill and along the balcony edges." },
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
              <h3 className="mb-2 text-lg font-bold text-neutral-900">Apartment Balcony Leaking Into the Unit Below?</h3>
              <p className="text-base leading-relaxed text-neutral-600">
                The first question is usually who pays, you or the owners corporation. In Victoria, responsibility generally follows the source, and the plan of subdivision decides where your lot ends and common property begins. We can document what we find so you have it in writing for your owners corporation, and if the membrane under the tiles has failed we will tell you that before you book a regrout that cannot fix it. More detail on our{" "}
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
                Tile, Epoxy and Silicone Work in Hampton
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Tile Regrouting", text: "Kitchen splashbacks, laundries, bathroom floors and the tiled entries Hampton period homes are known for.", href: "/tile-regrouting", label: "Tile regrouting" },
                { title: "Epoxy Grout", text: "Denser, waterproof and stain resistant, the long lasting choice for busy family showers and wet floors.", href: "/epoxy-grout", label: "Epoxy grout" },
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
                Selling, Leasing or Managing a Hampton Property?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Hampton homes are tightly held and well presented when they sell. Fresh grout and clean silicone make a bathroom look cared for in listing photos and at open inspections, for a fraction of what a renovation costs, and without the weeks of dust.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Pre Sale Refresh", text: "Regrout and reseal before the photographer comes, so the bathroom reads as looked after, not tired." },
                { title: "Inspection Items", text: "Cracked grout or failed silicone flagged in a building report, fixed properly before settlement." },
                { title: "Rental Turnover", text: "Booked between tenants or around them. A proper fix, not a full restoration, with the bathroom out of action for as little time as possible." },
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
                Areas We Cover Around Hampton
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                We cover Hampton and Hampton East 3188, plus Brighton, Sandringham and Highett along the bay.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div id="hampton-east" className="scroll-mt-28 space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Hampton East 3188</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Hampton East</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Hampton East is post war brick veneer, much of it still carrying original or first renovation bathrooms. Those bathrooms are now sixty or seventy years into their first tiles, and the grout in them is well past its working life. We regrout showers, floors and balconies across Hampton East, and match heritage colours where the original tiling is worth keeping.
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Brighton 3186</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Brighton</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  North along the foreshore, Brighton has its own dedicated Groutix page covering its period homes, townhouses and bayside units, including balcony work in Hampton and Beaumaris.
                </p>
                <p>
                  <Link href="/locations/melbourne/brighton" className="font-bold text-accent hover:underline">
                    See our Brighton page &rarr;
                  </Link>
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Sandringham 3191</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Sandringham</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  South of Hampton past Picnic Point, Sandringham mixes period homes with units and townhouses near the water. Bathrooms by the bay deal with damp sea air, so mould in the grout is usually the first sign. We regrout showers, floors and balconies across Sandringham.
                </p>
              </div>
              <div className="space-y-3 rounded-sm border border-neutral-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-accent">Highett 3190</p>
                <h3 className="text-xl font-bold text-neutral-900">Regrouting in Highett</h3>
                <p className="text-base leading-relaxed text-neutral-600">
                  Inland from Hampton East, Highett has grown fast around its station, with older family homes sitting alongside new townhouse builds. We regrout showers and bathroom floors across Highett, including the older homes where the grout is original.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-neutral-500">Also nearby:</span>
              {[
                { name: "Brighton", href: "/locations/melbourne/brighton" },
                { name: "Bentleigh", href: "/locations/melbourne/bentleigh" },
                { name: "St Kilda", href: "/locations/melbourne/st-kilda" },
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
                Why Hampton Owners Choose Groutix
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Keep Your Tiles", text: "No tile removal on most regrouting jobs. Your original or renovated tiles stay where they are." },
                { title: "10 Year Waterproof Warranty", text: "On eligible completed shower regrouting.", link: { href: "/terms-conditions", label: "Warranty terms" } },
                { title: `${gr.ratingLabel} From ${gr.countLabel} Reviews`, text: "Rated by Melbourne customers on Google, with real before and after photos of our work." },
                { title: "Straight Answers", text: "If it is a membrane or plumbing problem, we say so before you pay for a regrout that cannot fix it." },
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
                What Does Regrouting Cost in Hampton?
              </h2>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                Owners comparing quotes for the same Hampton shower can be quoted wildly different numbers. We price from your photos, so the quote is for your bathroom, not a guess. Three things set the price.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Size", text: "How big the shower, balcony or floor is." },
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
                Hampton Regrouting FAQs
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
              Tired Grout or a Leaking Shower in Hampton?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Send us a photo or call (03) 7023 8094 for a free quote. We cover Hampton, Hampton East, Brighton and Sandringham.
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
