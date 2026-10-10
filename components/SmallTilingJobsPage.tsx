"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Clock, Grid2x2, Hammer, House, Layers, Paintbrush, Phone, Ruler, Search, ShieldCheck, Wrench } from "lucide-react";
import ServiceTrustStrip from "@/components/ServiceTrustStrip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicePageHero from "@/components/ServicePageHero";
import ServiceAreaCoverage from "@/components/ServiceAreaCoverage";
import ReviewCard from "@/components/ReviewCard";
import { Section, Cards, PhotoSlot, QuoteLink, card, link, text } from "@/components/ServicePageSections";
import type { BusinessRating, Review } from "@/lib/reviews";
import { BUSINESS } from "@/lib/seo";
import { smallTilingFaqs, smallTilingPhotoSlots, smallTilingSteps } from "@/lib/smallTilingContent";

function FaqAnswer({ index }: { index: number }) {
  const answer = smallTilingFaqs[index].a;
  if (index !== 6) return answer;
  const [before, after] = answer.split("leaking shower repair");
  return <>{before}<Link href="/leaking-shower-repair/" className={link}>leaking shower repair</Link>{after}</>;
}

export default function SmallTilingJobsPage({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  return <><Navbar /><main className="overflow-x-clip">
    <ServicePageHero title="Small Tiling Jobs Melbourne" breadcrumb="Small Tiling Jobs" description="Groutix repairs and replaces broken, cracked and loose tiles, then matches the grout so the repair blends in. No full retile needed for a small problem." defaultService="Small Tiling Job" benefits={["Single tile repairs", "Clear quote first", "Matched grout finish"]} rating={rating} />

    <ServiceTrustStrip id="small-tiling-trust" variant="wireframe" rating={rating} first={{ value: "8,000+", label: "Bathrooms Restored", detail: "Across Melbourne & regional Victoria" }} />

    <Section id="signs" eyebrow="Signs to check" title="Signs a Tile Needs Repair or Replacing" alternate><Cards items={[
      { title: "Cracked Tile", body: "A visible crack across the tile.", icon: Wrench },
      { title: "Chipped Tile", body: "A chipped corner or edge.", icon: Grid2x2 },
      { title: "Loose Tile", body: "A tile that rocks or moves underfoot.", icon: Layers },
      { title: "Hollow Sound", body: "A tile that sounds hollow when tapped.", icon: Search },
      { title: "Raised Edges", body: "An edge or corner that sits higher than the rest.", icon: Ruler },
      { title: "Missing Tile", body: "A tile that is missing or has fallen off the wall.", icon: House },
    ]} /><p className={`mx-auto mt-8 max-w-3xl text-center ${text}`}>One tile is a small job. A lot of loose tiles in one area needs a closer look.</p></Section>

    <Section id="what-we-do" eyebrow="What we do" title="Small Tiling Jobs We Do" intro="Small fixes done properly, so you do not need a full retile."><Cards items={[
      { title: "Replace a Cracked or Chipped Tile", body: "Remove the damaged tile and fit a replacement.", icon: Hammer },
      { title: "Refix a Loose Tile", body: "Clean, re-bed and set a sound tile level again.", icon: Layers },
      { title: "Replace a Missing Tile", body: "Replace a missing tile on a wall or floor.", icon: Grid2x2 },
      { title: "Repair Lifted Edges", body: "Assess tiles lifted at an edge or corner.", icon: Ruler },
      { title: "Patch After Other Trades", body: "Patch tiles after a tap or fitting change, where suitable.", icon: Wrench },
      { title: "Match the Grout", body: "Colour match the grout around the repair.", icon: Paintbrush },
    ]} /><p className="mt-6 text-center text-sm leading-relaxed text-neutral-500">We inspect the area and confirm the repair scope before work starts.</p></Section>

    <Section id="what-it-means" eyebrow="Reading the problem" title="Loose, Cracked or Hollow: What It Means" intro="A tile can fail for different reasons. Here is how we read it." alternate><div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[640px] text-left text-sm sm:text-base"><caption className="sr-only">Tile symptoms, possible causes and the repair assessment.</caption><thead className="bg-primary text-white"><tr>{["What you notice", "What it could mean", "What we do"].map(heading => <th key={heading} scope="col" className="px-6 py-5 font-bold">{heading}</th>)}</tr></thead><tbody>{[
      ["Hollow sound when tapped", "The tile may have lost its bond underneath", "We tap test nearby tiles and lift one if needed."],
      ["Tile moves or rocks", "The adhesive has let go", "Refix or replace."],
      ["Cracked tile", "Impact or movement", "Replace the tile."],
      ["Raised or lifted edge", "Movement or bond failure", "Refix, and check the surrounding tiles."],
    ].map(([notice, meaning, action], i) => <tr key={notice} className={i % 2 ? "bg-neutral-50" : "bg-white"}><th scope="row" className="border-t border-neutral-200 px-6 py-5 font-bold text-neutral-900">{notice}</th><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">{meaning}</td><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">{action}</td></tr>)}<tr className="bg-white"><th scope="row" className="border-t border-neutral-200 px-6 py-5 font-bold text-neutral-900">Tiles keep coming loose in one area</th><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">Moisture or movement under the tiles</td><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">We tell you if it needs a leak assessment. See <Link href="/leaking-shower-repair/" className={link}>leaking shower repair</Link>.</td></tr></tbody></table></div><p className={`mx-auto mt-7 max-w-3xl text-center ${text}`}>A hollow sound alone is not always a problem. We check before we recommend anything.</p></Section>

    <Section id="matching" eyebrow="Getting a match" title="Matching Your Tile"><aside className="mb-6 rounded-xl border-l-4 border-[#FBBC04] bg-accent-light/30 p-6 sm:p-8"><h3 className="text-xl font-bold text-neutral-900">Spare Tiles Match Best</h3><p className="mt-3 leading-relaxed text-neutral-600">Spare tiles from the original job are the best match. If you have a few, keep them. If the tile is discontinued, we tell you what the closest options are before we start.</p><p className="mt-3 text-sm leading-relaxed text-neutral-500">Please supply matching spare tiles if you have them. We confirm tile availability and supply arrangements before booking the repair.</p></aside><Cards items={[
      { title: "Size and Thickness", body: "The repaired tile needs to sit level with the rest.", icon: Ruler },
      { title: "Colour and Finish", body: "Colour, texture and finish matched as closely as possible.", icon: Grid2x2 },
      { title: "Grout Colour", body: "The grout around the repair is matched to the surrounding joints.", icon: Paintbrush },
    ]} /></Section>

    <section id="process" className="bg-neutral-50 py-16 lg:py-20"><div className="mx-auto grid max-w-[1320px] items-start gap-8 px-6 lg:grid-cols-2 lg:gap-x-14 lg:px-10"><div className="order-1"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">Our process</p><h2 className="text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-4xl">Our Small Tiling Process</h2><p className={`mt-4 ${text}`}>Careful removal, a solid bed and a neat finish. Here is how it works.</p></div><div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"><PhotoSlot title="A Groutix technician repairing a tile" technician /></div><div className="order-3 lg:col-start-1"><ol className="space-y-6">{smallTilingSteps.map(({ title, body }, i) => <li key={title} className="flex gap-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light font-bold text-primary">{i + 1}</span><div><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div></li>)}</ol><p className="my-7 text-sm leading-relaxed text-neutral-500">We confirm the applicable workmanship warranty and repair scope in your quote.</p><QuoteLink label="Book Your Free Quote" /></div></div></section>

    <Section id="wait-time" eyebrow="After the job" title="How Long Until I Can Use It?"><aside className="mx-auto max-w-3xl rounded-xl border-l-4 border-[#FBBC04] bg-accent-light/30 p-6 sm:p-8"><Clock className="mb-4 h-7 w-7 text-primary" /><h3 className="text-xl font-bold text-neutral-900">Adhesive and Grout Need Time to Set</h3><p className={`mt-3 ${text}`}>The adhesive and grout need time to set. We tell you the exact wait before we start. Keep foot traffic and water off the repair until we say it is ready.</p></aside></Section>

    <Section id="cost" eyebrow="Pricing" title="What Does a Small Tiling Job Cost?" intro="The price depends on the job, so we quote after we see it." alternate><Cards columns={4} items={[
      { title: "Number of Tiles", body: "One tile or several in the same area.", icon: Grid2x2 },
      { title: "Tile Type and Availability", body: "The type of tile and whether a matching replacement is available.", icon: Layers },
      { title: "Wall or Floor, and Access", body: "Tight or awkward areas can take longer.", icon: House },
      { title: "Condition Underneath", body: "A damaged bed needs more preparation.", icon: Wrench },
    ]} /><aside className="mt-6 rounded-xl border-l-4 border-[#FBBC04] bg-white p-6"><h3 className="text-xl font-bold text-neutral-900">A Clear Quote First</h3><p className="mt-3 leading-relaxed text-neutral-600">We quote by the job so you know the price before work starts.</p></aside><div className="mt-7 text-center"><QuoteLink /></div></Section>

    <Section id="honest-scope" eyebrow="Honest scope" title="When It Is More Than a Small Job"><aside className="mx-auto max-w-4xl rounded-xl border-l-4 border-[#FBBC04] bg-accent-light/30 p-6 sm:p-8"><Search className="mb-4 h-7 w-7 text-primary" /><h3 className="text-xl font-bold text-neutral-900">We Tell You Before We Start</h3><p className={`mt-3 ${text}`}>If many tiles are loose, or there are signs of moisture, it may need more than a repair. A damp wall or a stain below are warning signs. We tell you before any work starts. See <Link href="/leaking-shower-repair/" className={link}>leaking shower repair</Link> and <Link href="/tile-regrouting/" className={link}>tile regrouting</Link>.</p></aside></Section>

    <section className="bg-primary py-14 text-white"><div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-7 px-6 lg:flex-row lg:items-center lg:px-10"><div className="max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FBBC04]">For property professionals</p><h2 className="text-3xl font-bold">Landlords, Agents and Property Managers</h2><p className="mt-4 leading-relaxed text-white/80">A quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants.</p></div><Link href="/real-estate-property-services/" className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Discuss a Property Job<ArrowRight className="h-4 w-4" /></Link></div></section>

    <Section id="why-groutix" eyebrow="Why Groutix" title="Why Choose Groutix"><Cards columns={4} items={[
      { title: "Honest Advice", body: "We tell you when it is not a small job.", icon: Search },
      { title: "Clear Quote First", body: "You know the price before work starts.", icon: Check },
      { title: "Matched Finish", body: "Tile and grout matched as closely as possible.", icon: Paintbrush },
      { title: "Clear Warranty Scope", body: "The applicable workmanship warranty is confirmed in your quote.", icon: ShieldCheck },
    ]} /></Section>

    <Section id="before-after" eyebrow="Our work" title="Before and After" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{smallTilingPhotoSlots.map(title => <PhotoSlot key={title} title={title} />)}</div></Section>

    <Section id="reviews" eyebrow="Customer feedback" title="What Our Customers Say" intro="Real feedback from homeowners we’ve helped across Melbourne and Victoria."><div className="grid gap-6 md:grid-cols-3">{reviews.map(review => <ReviewCard key={`${review.name}-${review.review}`} review={review} />)}</div><div className="mt-7 text-center"><a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={link}>Read More Reviews on Google →</a></div></Section>

    <Section id="related-services" eyebrow="More ways we can help" title="Related Services" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Tile Regrouting", "/tile-regrouting/", "Worn grout on floors, kitchens and laundries."],
      ["Shower Regrouting", "/shower-regrouting/", "Worn grout throughout the shower."],
      ["Leaking Shower Repair", "/leaking-shower-repair/", "When water is already getting out."],
      ["Silicone and Recaulking", "/silicone-recaulking/", "Flexible seals at corners and edges."],
    ].map(([title, href, body]) => <Link key={href} href={href} className={`${card} group transition-colors hover:border-accent`}><h3 className="font-bold text-neutral-900">{title}</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">{body}</p><ArrowRight className="mt-6 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" /></Link>)}</div></Section>

    <Section id="service-areas" eyebrow="Service areas" title="Which Melbourne Suburbs Do We Repair Tiles In?" intro="Looking for small tiling jobs near you? Check your suburb below."><ServiceAreaCoverage service="Small Tiling Job" sourcePage="/small-tiling-jobs" subject="your tile repair" /></Section>

    <Section id="faqs" eyebrow="Your questions, answered" title="Small Tiling Jobs FAQs" alternate><div className="mx-auto max-w-3xl space-y-3">{smallTilingFaqs.map((faq, index) => <details key={faq.q} className="group rounded-xl border border-neutral-200 bg-white open:border-accent/50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden"><h3 className="text-base font-bold text-neutral-900">{faq.q}</h3><ChevronDown className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-180" /></summary><p className="px-5 pb-5 leading-relaxed text-neutral-600"><FaqAnswer index={index} /></p></details>)}</div><div className="mt-8 text-center"><QuoteLink label="Still Have Questions? Get a Free Quote" /></div></Section>

    <section className="bg-primary py-16 text-center text-white"><div className="mx-auto max-w-3xl px-6"><h2 className="text-3xl font-bold sm:text-4xl">Get Your Free Quote Today</h2><p className="mt-5 leading-relaxed text-white/85">Call <a href="tel:+61370238094" className="underline">(03) 7023 8094</a>, email <a href="mailto:info@groutix.com" className="underline">info@groutix.com</a>, or request a quote online.</p><p className="mt-3 text-sm text-white/70">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p><p className="mt-3 text-white/80">Honest advice and workmanship you can rely on.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/contact" className="rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Request A Quote</Link><a href="tel:+61370238094" className="inline-flex items-center gap-2 rounded-sm border border-white/60 px-6 py-3 font-bold hover:bg-white/10"><Phone className="h-4 w-4" />(03) 7023 8094</a></div></div></section>
  </main><Footer /></>;
}
