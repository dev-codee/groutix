"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Grid2x2, Droplets, Footprints, Home, ImageIcon, MapPin, Paintbrush, Phone, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Section, Cards, QuoteLink, card, link, text } from "@/components/ServicePageSections";
import GoogleIcon from "@/components/GoogleIcon";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicePageHero from "@/components/ServicePageHero";
import ServiceAreaCoverage from "@/components/ServiceAreaCoverage";
import ReviewCard from "@/components/ReviewCard";
import type { BusinessRating, Review } from "@/lib/reviews";
import { BUSINESS } from "@/lib/seo";
import { tileRegroutingFaqs, tileGroutRows, tilePhotoSlots } from "@/lib/tileRegroutingContent";


export default function TileRegroutingPage({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  return <><Navbar /><main>
    <ServicePageHero
      title="Tile Regrouting Melbourne"
      breadcrumb="Tile Regrouting"
      description="Groutix removes worn grout from floors, kitchens, laundries and bathrooms and rebuilds the joints. Your tiles look clean and keep water out. Your tiles stay in place. We tell you honestly when a clean is enough."
      defaultService="Tile Regrouting"
      benefits={["Tiles stay in place", "Clear quote first", "Honest advice"]}
      rating={rating}
    />
    <section aria-labelledby="tile-trust" className="border-b border-neutral-200 bg-white py-10"><div className="mx-auto max-w-[1320px] px-6 lg:px-10"><h2 id="tile-trust" className="mb-7 text-center text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Trusted Across Victoria</h2><div className="grid gap-8 text-center sm:grid-cols-3">{[
      { icon: MapPin, value: "Melbourne & Victoria", label: "Local Tile Repairs", sub: "Homes, rentals and commercial properties" },
      { icon: GoogleIcon, value: `${rating.value.toFixed(1)}/5`, label: "Google Rating", sub: `Based on ${rating.count} Google reviews` },
      { icon: ShieldCheck, value: "10 Year", label: "Waterproof Warranty", sub: "Eligible waterproof work; scope confirmed in your quote" },
    ].map(({ icon: Icon, value, label, sub }) => <div key={label}><Icon className="mx-auto mb-3 h-6 w-6 text-accent" /><p className="text-2xl font-black text-primary">{value}</p><p className="mt-1 font-bold text-neutral-900">{label}</p><p className="mt-2 text-sm text-neutral-500">{sub}</p></div>)}</div></div></section>
    <Section eyebrow="Signs to check" title="Signs Your Tile Grout Needs Regrouting" intro="Grout wears out slowly, so it is easy to miss. Look for these signs." alternate><Cards items={[
      { title: "Cracked or Crumbling Grout", body: "Grout that cracks or breaks apart when you touch it.", icon: Wrench },
      { title: "Stains That Stay", body: "Grout that stays stained after a proper clean.", icon: Sparkles },
      { title: "Sunken or Missing Grout", body: "Low spots, missing grout or gaps between your tiles.", icon: Grid2x2 },
      { title: "Returning Mould", body: "Mould or mildew that keeps coming back.", icon: Droplets },
      { title: "Loose Tiles", body: "Tiles that feel loose or move underfoot.", icon: Home },
      { title: "Dirty Floor Lines", body: "Dark, dirty lines on kitchen and laundry floors.", icon: Footprints },
    ]} /><p className={`mx-auto mt-8 max-w-3xl text-center ${text}`}>One or two signs on a small area may only need a spot repair. Widespread wear means a full regrout.</p></Section>
    <Section eyebrow="Every room" title="Tile Regrouting for Every Room" intro="Every room wears grout differently. We match the method to the room."><Cards items={[
      { title: "Kitchens", body: "Floors and splashbacks that face spills, grease and daily traffic." },
      { title: "Laundries", body: "Tiled areas exposed to damp, detergents and water.", icon: Droplets },
      { title: "Bathroom Floors and Walls", body: "Bathroom tiles outside the shower recess.", icon: Home },
      { title: "Hallways, Entries and Living Floors", body: "Floor grout worn by dirt and foot traffic.", icon: Footprints },
      { title: "Commercial and Rental Properties", body: "Tiled spaces in rentals, apartments and commercial properties.", icon: Home },
      { title: "Balconies and Showers", body: <>See our dedicated <Link className={link} href="/balcony-leak-repairs/">balcony leak repairs</Link> and <Link className={link} href="/shower-regrouting/">shower regrouting</Link> pages.</>, icon: Droplets },
    ]} /></Section>
    <Section eyebrow="Honest advice" title="Spot Repair or Full Regrout?" intro="We tell you which one your tiles need, not the biggest job." alternate><div className="grid gap-5 lg:grid-cols-3">{[
      { label: "Spot repair", title: "Small area, sound grout around it", body: <>Small areas where the surrounding grout is sound may only need a spot repair.</> },
      { label: "Full regrout", title: "Many joints failing", body: <>Widespread staining, failing joints or movement need a closer look and may require a full regrout.</> },
      { label: "Replace tiles", title: "Cracked, loose or hollow tiles", body: <>These need more than grout. See <Link href="/small-tiling-jobs/" className={link}>small tiling jobs</Link>.</> },
    ].map(({ label, title, body }, i) => <div key={label} className={`${card} ${i === 1 ? "border-primary border-t-4" : "border-t-4 border-t-accent-light"}`}><span className="inline-block rounded-sm bg-accent-light/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">{label}</span><h3 className="mt-5 text-xl font-bold text-neutral-900">{title}</h3><p className="mt-3 leading-relaxed text-neutral-600">{body}</p></div>)}</div></Section>
    <Section eyebrow="Choosing grout" title="Which Grout Suits Which Area?" intro="The right grout depends on what the room faces every day."><div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[640px] text-left text-sm sm:text-base"><caption className="sr-only">Grout options by tiled area, subject to inspection and material availability.</caption><thead className="bg-primary text-white"><tr>{["Area", "What it faces", "What we usually suggest"].map(h => <th key={h} scope="col" className="px-6 py-5 font-bold">{h}</th>)}</tr></thead><tbody>{tileGroutRows.map(([area, faces, suggestion], i) => <tr key={area} className={i % 2 ? "bg-neutral-50" : "bg-white"}><th scope="row" className="border-t border-neutral-200 px-6 py-5 font-bold text-neutral-900">{area}</th><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">{faces}</td><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">{suggestion}</td></tr>)}</tbody></table></div><p className="mt-5 text-center text-sm leading-relaxed text-neutral-600">We choose after we inspect and confirm the available materials in your quote. Learn more on our <Link href="/epoxy-grout/" className={link}>epoxy grout</Link> page.</p></Section>
    <Section eyebrow="Before you book" title="Clean First, or Regrout?" intro="Not every dirty grout line needs replacing. If the grout is solid but stained, a proper clean may be enough." alternate><Cards items={[
      { title: "Sound Grout, Surface Stain", body: "A clean may be enough.", icon: Sparkles },
      { title: "Cracked, Crumbling or Missing", body: "The grout has failed. Regrout.", icon: Wrench },
      { title: "Mould That Keeps Coming Back", body: "The grout may be holding moisture. We check the cause before recommending regrouting.", icon: Droplets },
    ]} /><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-xl bg-accent-light/50 p-6"><Paintbrush className="mb-3 h-6 w-6 text-primary" /><h3 className="font-bold text-neutral-900">Grout Colour</h3><p className="mt-2 leading-relaxed text-neutral-600">Epoxy comes in many colours. We can match your existing grout or change the colour for a fresh look. We confirm suitable shades and availability after inspection.</p></div><aside className="rounded-xl border-l-4 border-[#FBBC04] bg-white p-6"><ShieldCheck className="mb-3 h-6 w-6 text-primary" /><h3 className="font-bold text-neutral-900">Natural Stone and Delicate Tiles</h3><p className="mt-2 leading-relaxed text-neutral-600">Some natural stone and polished tiles need gentler products. We check your tile type before we start and test where needed.</p></aside></div></Section>
    <Section eyebrow="Our process" title="Our Tile Regrouting Process" intro="Clean, tidy and matched to your tiles. Here is how it works."><div className="grid items-start gap-10 lg:grid-cols-2"><div className="rounded-xl bg-primary p-8 text-white sm:p-10"><Grid2x2 className="h-10 w-10 text-[#FBBC04]" /><h3 className="mt-6 text-3xl font-bold leading-tight">Fresh grout.<br />Your existing tiles.</h3><p className="mt-5 leading-relaxed text-white/80">We inspect first, remove worn grout and rebuild the joints with materials suited to your room.</p><div className="my-7 border-t border-white/20 pt-6 text-sm leading-relaxed text-white/80">Eligible waterproof work is backed by our 10-year waterproof warranty. We confirm the applicable scope in your quote.</div><QuoteLink label="Book Your Free Quote" /></div><ol className="space-y-6">{[
      ["Inspect and Match", "We check the grout, tiles and edges and match the colour."],
      ["Protect and Remove", "We protect your floors and fittings and remove old grout."],
      ["Regrout", "New grout is packed into the joints and finished neatly."],
      ["Clean and Seal", "We clean the haze and leave it to cure. We tell you the exact wait before we start."],
    ].map(([title, body], i) => <li key={title} className="flex gap-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light font-bold text-primary">{i + 1}</span><div><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div></li>)}</ol></div></Section>
    <Section eyebrow="Pricing" title="What Does Tile Regrouting Cost?" intro="The price depends on how much grout there is and what condition it is in. We quote after we see it." alternate><Cards columns={4} items={[
      { title: "Area", body: "More floor means more joints.", icon: Grid2x2 },
      { title: "Tile Size", body: "Small tiles and mosaics have more grout lines.", icon: Grid2x2 },
      { title: "Grout Type", body: "Epoxy costs more than cement.", icon: Paintbrush },
      { title: "Condition and Access", body: "Heavy wear or hard to reach areas take longer.", icon: Wrench },
    ]} /><aside className="mt-6 rounded-xl border-l-4 border-[#FBBC04] bg-white p-6"><h3 className="font-bold text-neutral-900">A Clear Quote First</h3><p className="mt-2 leading-relaxed text-neutral-600">We quote by the job after inspection. For shower prices, see <Link href="/shower-regrouting/" className={link}>shower regrouting</Link>.</p></aside><div className="mt-7 text-center"><QuoteLink /></div></Section>
    <section className="bg-primary py-14 text-white"><div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-7 px-6 lg:flex-row lg:items-center lg:px-10"><div className="max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FBBC04]">For property professionals</p><h2 className="text-3xl font-bold">Landlords, Agents and Commercial</h2><p className="mt-4 leading-relaxed text-white/80">Rentals, apartments and commercial floors are regrouted around tenants and trading hours. We confirm the visit schedule and cure time before work begins.</p></div><Link href="/real-estate-property-services/" className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Discuss a Property Job<ArrowRight className="h-4 w-4" /></Link></div></section>
    <Section eyebrow="Why Groutix" title="Why Choose Groutix"><Cards columns={4} items={[
      { title: "Honest Advice", body: "We say when a clean is enough.", icon: Check },
      { title: "Clear Quote First", body: "You know the price before work starts.", icon: Check },
      { title: "Colour Matched", body: "Grout colour matched to your tiles.", icon: Paintbrush },
      { title: "10-Year Warranty", body: "On eligible waterproof work. Scope confirmed in your quote.", icon: ShieldCheck },
    ]} /></Section>
    <Section eyebrow="Our work" title="Before and After: Real Tile Regrouting" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{tilePhotoSlots.map(room => <figure key={room} className="overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-white"><div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-5 text-center text-neutral-400"><ImageIcon className="h-8 w-8" /><span className="text-sm">Before & after photos<br />coming soon</span></div><figcaption className="border-t border-neutral-100 px-5 py-4 font-bold text-neutral-900">{room}</figcaption></figure>)}</div></Section>
    <Section eyebrow="Customer feedback" title="What Our Customers Say" intro="Real feedback from homeowners we’ve helped across Melbourne and Victoria."><div className="grid gap-6 md:grid-cols-3">{reviews.map(review => <ReviewCard key={`${review.name}-${review.review}`} review={review} />)}</div><div className="mt-7 text-center"><a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={link}>Read More Reviews on Google →</a></div></Section>
    <Section eyebrow="More ways we can help" title="Related Services" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Shower Regrouting", "/shower-regrouting/", "Worn grout throughout the shower."],
      ["Balcony Leak Repairs", "/balcony-leak-repairs/", "Repair options for leaking balconies."],
      ["Epoxy Grout", "/epoxy-grout/", "Stain resistant grout for wet areas."],
      ["Small Tiling Jobs", "/small-tiling-jobs/", "Individual tiles repaired or replaced."],
    ].map(([title, href, body]) => <Link key={href} href={href} className={`${card} group transition-colors hover:border-accent`}><h3 className="font-bold text-neutral-900">{title}</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">{body}</p><ArrowRight className="mt-6 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" /></Link>)}</div></Section>
    <Section eyebrow="Service areas" title="Which Melbourne Suburbs Do We Regrout Tiles In?" intro="Looking for tile regrouting near you? Check your suburb below."><ServiceAreaCoverage service="Tile Regrouting" sourcePage="/tile-regrouting" subject="your tiles" /></Section>
    <Section eyebrow="Your questions, answered" title="Tile Regrouting FAQs" alternate><div className="mx-auto max-w-3xl space-y-3">{tileRegroutingFaqs.map(faq => <details key={faq.q} className="group rounded-xl border border-neutral-200 bg-white open:border-accent/50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden"><h3 className="text-base font-bold text-neutral-900">{faq.q}</h3><ChevronDown className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-180" /></summary><p className="px-5 pb-5 leading-relaxed text-neutral-600">{faq.a}</p></details>)}</div><div className="mt-8 text-center"><QuoteLink label="Still Have Questions? Get a Free Quote" /></div></Section>
    <section className="bg-primary py-16 text-center text-white"><div className="mx-auto max-w-3xl px-6"><h2 className="text-3xl font-bold sm:text-4xl">Get Your Free Quote Today</h2><p className="mt-5 leading-relaxed text-white/85">Call <a className="underline" href="tel:+61370238094">(03) 7023 8094</a>, email <a className="underline" href="mailto:info@groutix.com">info@groutix.com</a>, or request a quote online.</p><p className="mt-3 text-sm text-white/70">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p><p className="mt-3 text-white/80">Honest advice and workmanship you can rely on.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/contact" className="rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Request A Quote</Link><a href="tel:+61370238094" className="inline-flex items-center gap-2 rounded-sm border border-white/60 px-6 py-3 font-bold hover:bg-white/10"><Phone className="h-4 w-4" />(03) 7023 8094</a></div></div></section>
  </main><Footer /></>;
}
