"use client";

import Link from "next/link";
import { ArrowRight, Building2, Check, ChevronDown, ClipboardCheck, Clock, Droplets, Eye, Grid2x2, House, Layers, Paintbrush, Phone, Search, ShieldCheck, Sparkles, Sun, Waves, Wind, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicePageHero from "@/components/ServicePageHero";
import ServiceTrustStrip from "@/components/ServiceTrustStrip";
import { Section, Cards, PhotoSlot, QuoteLink, button, card, link, text } from "@/components/ServicePageSections";
import ReviewCard from "@/components/ReviewCard";
import TeamSection from "@/components/TeamSection";
import ServiceAreaCoverage from "@/components/ServiceAreaCoverage";
import type { BusinessRating, Review } from "@/lib/reviews";
import { balconyFaqs, balconyIntro } from "@/lib/balconyLeakContent";
import { BUSINESS } from "@/lib/seo";

const tel = "tel:+61370238094";

function InspectionCta({ label = "Book Your Free Inspection" }: { label?: string }) {
  return <div className="mt-8 flex flex-wrap items-center justify-center gap-5"><QuoteLink label={label} /><a href={tel} className="inline-flex items-center gap-2 font-bold text-primary hover:underline"><Phone className="h-4 w-4" />(03) 7023 8094</a></div>;
}

export default function BalconyLeakRepairsPage({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const balconyReviews = reviews.filter(review => /balcon(?:y|ies)/i.test(review.review));
  const visibleReviews = balconyReviews.length ? balconyReviews : reviews.slice(0, 3);
  return <><Navbar /><main className="overflow-x-clip">
    <ServicePageHero title="Balcony Leak Repair Melbourne" breadcrumb="Balcony Leak Repairs" description={balconyIntro} descriptionId="balcony-intro" defaultService="Balcony Leak Repair" benefits={["No unnecessary tile removal", "Fixed written quote", "10-year warranty on eligible work"]} rating={rating} />
    <ServiceTrustStrip id="balcony-trust" rating={rating} first={{ value: "Melbourne", label: "Homes, Apartments & Strata", detail: "Balcony leak repairs across our service areas" }} warrantyDetail="Eligible waterproof work; scope confirmed in your quote" />

    <Section id="signs" eyebrow="Signs to check" title="Signs Your Balcony Needs Leak Repair" intro="Balconies rarely fail overnight. They warn you first. Here is what to look for." alternate>
      <Cards items={[
        { title: "White Chalky Stains", body: "On tiles or walls. This is efflorescence. It can indicate water moving through the surface.", icon: Sparkles },
        { title: "Mould or Dark Grout", body: "Mould or dark stains in grout lines that return after cleaning.", icon: Droplets },
        { title: "Hollow Sounding Tiles", body: "Tiles that sound hollow when tapped. Builders call these drummy tiles.", icon: Grid2x2 },
        { title: "Ceiling Water Stains", body: "Water stains on the ceiling of the room below your balcony.", icon: House },
        { title: "Bubbling or Peeling Paint", body: "Paint that bubbles or peels on walls under the balcony.", icon: Paintbrush },
        { title: "Pooling Water", body: "Water that pools for hours after rain instead of draining away.", icon: Waves },
      ]} />
      <p className={`mt-8 text-center ${text}`}>Spot even one sign? Book a free inspection. Small leaks can turn into bigger damage.</p><InspectionCta />
    </Section>

    <Section eyebrow="Find the cause" title="What Causes Balconies to Leak in Melbourne" intro="Melbourne weather punishes outdoor tiles. Summer sun bakes them. Winter rain soaks them. Bay winds drive water into gaps.">
      <Cards items={[
        { title: "Failed Waterproof Membrane", body: "Water can pass through a damaged or incorrectly installed membrane beneath the tiles.", icon: Layers },
        { title: "Cracked or Missing Grout", body: "Open joints let water pass beneath the tiled surface.", icon: Grid2x2 },
        { title: "Split Movement Joints", body: "Buildings shift with heat and cold. Flexible joints must accommodate that movement.", icon: Wrench },
        { title: "Poor Drainage", body: "Blocked drains or inadequate falls leave water sitting on the balcony.", icon: Waves },
        { title: "Worn Sealant", body: "Gaps around edges, drains and balustrade posts create vulnerable entry points.", icon: Droplets },
        { title: "UV Damage", body: "Harsh sun breaks down unsuitable sealants year after year.", icon: Sun },
      ]} /><p className={`mt-8 text-center ${text}`}>Most leaks have more than one cause. That is why we diagnose before we repair.</p>
    </Section>

    <Section eyebrow="An honest diagnosis" title="Is It the Grout or the Membrane? How We Diagnose the Real Cause" intro="This question decides your repair. Get it wrong and the leak returns." alternate>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-primary p-7 text-white sm:p-9"><Search className="h-9 w-9 text-[#FBBC04]" /><h3 className="mt-5 text-2xl font-bold">The right fix starts with the source</h3><div className="mt-6 space-y-5"><div className="border-b border-white/20 pb-5"><p className="font-bold text-[#FBBC04]">Failed grout</p><p className="mt-2 text-white/85">May need regrouting when the membrane and base remain sound.</p></div><div><p className="font-bold text-[#FBBC04]">Failed membrane</p><p className="mt-2 text-white/85">Needs a rebuild. Grout alone cannot repair a failed membrane.</p></div></div></div>
        <div><h3 className="mb-5 text-xl font-bold text-neutral-900">Our inspection finds the cause</h3><ol className="space-y-5">{[
          "We check grout lines, joints, drains and edges up close.",
          "We tap tiles to find hollow drummy spots.",
          "We assess moisture and where water may be travelling.",
          "We trace stains back towards the entry point, not just the visible damage.",
        ].map((step, i) => <li key={step} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-bold text-primary">{i + 1}</span><p className="pt-1 leading-relaxed text-neutral-600">{step}</p></li>)}</ol><p className="mt-6 leading-relaxed text-neutral-600">You get a straight answer. We explain what failed and which fix suits it. Ask us about photos and inspection documentation for your property.</p></div>
      </div>
    </Section>

    <Section eyebrow="Repair options" title="Balcony Leak Repair Options: Choose the Right Fix" intro="One size never fits all. We match the repair to the cause we found.">
      <div className="grid gap-5 lg:grid-cols-3">{[
        { tag: "Grout failed, membrane sound", title: "Epoxy Regrouting With No Tile Removal", body: "We cut out old grout and replace it with epoxy grout suited to the outdoor area. Your tiles stay where they are. Flexible movement joints are repaired separately.", Icon: Grid2x2 },
        { tag: "Early leaks and tired seals", title: "Waterproof Sealing Treatment", body: "We renew silicone joints and seal vulnerable edges where appropriate. This addresses failed seals without treating a surface seal as a substitute for a sound membrane.", Icon: Droplets },
        { tag: "The membrane has failed", title: "Full Rebuild With New Membrane and Tiles", body: "Tiles are lifted, the base repaired and a new external waterproofing membrane installed before retiling. We explain the rebuild scope and applicable AS 4654 requirements in your quote.", Icon: Layers },
      ].map(({ tag, title, body, Icon }) => <div key={title} className={`${card} border-t-4 border-t-primary`}><Icon className="mb-5 h-8 w-8 text-accent" /><p className="text-xs font-bold uppercase tracking-wider text-accent">{tag}</p><h3 className="mt-4 text-xl font-bold text-neutral-900">{title}</h3><p className="mt-4 leading-relaxed text-neutral-600">{body}</p></div>)}</div>
      <p className={`mx-auto mt-8 max-w-3xl text-center ${text}`}>We only recommend what your balcony needs. The inspection decides, not a sales script. We explain why we picked the repair.</p><p className="mt-4 text-center text-neutral-600">Learn more about <Link href="/#balcony" className={link}>balcony regrouting</Link> or our <Link href="/epoxy-grout/" className={link}>epoxy grout service</Link>.</p>
    </Section>

    <Section eyebrow="Outdoor durability" title="Built for Melbourne Weather: UV, Heat and Movement" intro="A balcony can face full sun, cold snaps and salty bay air in one year. The materials must match the exposure." alternate>
      <div className="grid gap-8 lg:grid-cols-2"><div className="space-y-5">{[
        ["Cement grout", "Cement grout can absorb moisture and deteriorate in exposed joints."],
        ["Unsuitable sealants", "Sealants without suitable UV resistance can peel and break down outdoors."],
        ["Rigid repairs", "A rigid repair across a movement joint can crack as the building moves."],
      ].map(([title, body]) => <div key={title} className={card}><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div>)}</div><div className="rounded-xl bg-primary p-7 text-white sm:p-9"><Wind className="h-9 w-9 text-[#FBBC04]" /><h3 className="mt-5 text-2xl font-bold">Materials matched to your balcony</h3><p className="mt-5 leading-relaxed text-white/85">We select grout and sealants suited to outdoor exposure and confirm suitable products in your quote. Flexible perimeter and movement joints accommodate building movement; epoxy grout does not replace those joints.</p><p className="mt-5 leading-relaxed text-white/85">Think bay facing apartments in St Kilda. Think sun baked rooftops in the CBD. Drainage, UV exposure and coastal conditions all help determine the repair.</p></div></div>
    </Section>

    <Section id="process" eyebrow="Our process" title="Our Balcony Leak Repair Process" intro="Simple, clean and clearly explained. Here is how it works.">
      <div className="grid items-start gap-10 lg:grid-cols-2"><PhotoSlot title="A Groutix technician repairing a balcony" technician /><div><ol className="space-y-6">{[
        ["Free inspection", "We visit, check the signs and trace the source."],
        ["Fixed quote", "You approve a written price and repair scope before we start."],
        ["Repair day", "We regrout, reseal or plan a rebuild based on the diagnosis."],
        ["Test and tidy", "We check our work, explain the finished repair and leave the place clean."],
      ].map(([title, body], i) => <li key={title} className="flex gap-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light font-bold text-primary">{i + 1}</span><div><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div></li>)}</ol><p className="mt-7 rounded-xl bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">The repair timeframe and cure time depend on the scope, materials and weather. We confirm the schedule and when you can use your balcony before we start.</p></div></div><InspectionCta />
    </Section>

    <Section eyebrow="Pricing" title="Balcony Leak Repair Cost in Melbourne" intro="No two balconies cost the same. Your price depends on:" alternate>
      <Cards columns={4} items={[
        { title: "Size", body: "Size of the balcony and tiled area.", icon: Grid2x2 },
        { title: "What Failed", body: "Grout, seals, base or membrane.", icon: Search },
        { title: "Access", body: "High rise access and building requirements can add setup time.", icon: Building2 },
        { title: "Repair Tier", body: "Regrout, seal or full rebuild.", icon: Wrench },
      ]} /><aside className="mt-7 rounded-xl border-l-4 border-[#FBBC04] bg-white p-6"><h3 className="font-bold text-neutral-900">Fixed Written Quote</h3><p className="mt-2 leading-relaxed text-neutral-600">After inspection you get a fixed written quote for the agreed scope. Any additional work is discussed and approved before it proceeds.</p></aside><InspectionCta label="Get a Free Quote" />
    </Section>

    <Section eyebrow="For property professionals" title="Strata, Body Corporate and Property Managers" intro="Apartment balcony leaks raise a tough question. Who pays for the repair?">
      <aside className="mb-7 rounded-xl bg-accent-light/40 p-6 sm:p-8"><h3 className="text-xl font-bold text-neutral-900">Who Maintains What in Victoria</h3><p className="mt-3 leading-relaxed text-neutral-600">The owners corporation is responsible for maintaining common property. Whether a balcony membrane or surface is common property depends on the plan of subdivision. Confirm the boundaries and responsibility with your owners corporation before arranging repairs.</p><a href="https://www.consumer.vic.gov.au/housing/owners-corporations/property-maintenance/maintaining-and-improving-common-property" target="_blank" rel="noopener noreferrer" className={`${link} mt-4 inline-block text-sm`}>Read Consumer Affairs Victoria guidance →</a></aside>
      <Cards columns={4} items={[
        { title: "Inspection Documentation", body: "Discuss the photos and written report your committee or insurer needs.", icon: ClipboardCheck },
        { title: "Relevant Standards", body: "External membrane work is assessed against applicable AS 4654 requirements. AS 3740 relates to internal wet areas.", icon: ShieldCheck },
        { title: "Building Approved Hours", body: "We discuss access, approvals and the building's permitted work hours.", icon: Clock },
        { title: "A Clear Contact", body: "Repair scope and scheduling explained from the first call to the final check.", icon: Phone },
      ]} /><p className={`mt-7 text-center ${text}`}>Need a report for a claim or a meeting? Tell us what is required.</p><InspectionCta label="Request an Inspection" />
    </Section>

    <Section eyebrow="Keep your existing tiles" title="Can a Leaking Balcony Be Fixed Without Removing Tiles?" alternate>
      <div className="grid gap-6 md:grid-cols-2"><div className={`${card} border-t-4 border-t-accent`}><Check className="mb-4 h-7 w-7 text-accent" /><h3 className="text-xl font-bold text-neutral-900">Yes, in many cases</h3><p className="mt-4 leading-relaxed text-neutral-600">When the membrane is sound and only grout or seals failed, regrouting and resealing may fix it. Tiles stay down.</p></div><div className={`${card} border-t-4 border-t-primary`}><Layers className="mb-4 h-7 w-7 text-primary" /><h3 className="text-xl font-bold text-neutral-900">When tiles must come up</h3><p className="mt-4 leading-relaxed text-neutral-600">A failed membrane or damaged base needs a rebuild. We tell you upfront. A surface fix cannot restore a failed membrane.</p></div></div><p className={`mt-7 text-center ${text}`}>No pressure. Just an honest diagnosis.</p>
    </Section>

    <Section eyebrow="Why Groutix" title="Why Melbourne Homeowners Choose Groutix">
      <Cards items={[
        { title: "10 Year Waterproof Warranty", body: "On eligible completed waterproof work. Scope and terms confirmed in your quote.", icon: ShieldCheck },
        { title: `${rating.value.toFixed(1)} Star Google Rating`, body: `Based on ${rating.count} Google reviews through our existing business review source.`, icon: Sparkles },
        { title: "Leak and Grout Specialists", body: "Practical repairs for failed grout, silicone and leaking tiled areas.", icon: Wrench },
        { title: "Free Inspections", body: "Fixed written quotes before the agreed work starts.", icon: Search },
        { title: "Real Customer Reviews", body: "Read existing feedback from customers we have helped.", icon: ClipboardCheck },
        { title: "Finished Work Walkthrough", body: "We explain the completed repair and the care it needs before we leave.", icon: Eye },
      ]} />
    </Section>

    <Section id="reviews" eyebrow="Customer feedback" title="What Melbourne Customers Say About Our Balcony Work" intro={balconyReviews.length ? "Google feedback mentioning balcony work, shown in the customer's own words." : "Read Google feedback about Groutix's repair work. These reviews describe the customers' own jobs; balcony-specific feedback will appear when available."} alternate>
      <div className={`grid gap-6 ${visibleReviews.length === 1 ? "mx-auto max-w-xl" : visibleReviews.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>{visibleReviews.map(review => <ReviewCard key={`${review.name}-${review.review}`} review={review} />)}</div><div className="mt-8 text-center"><a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={link}>Read More Reviews on Google →</a></div>
    </Section>

    <TeamSection title="Meet Your Balcony Repair Team" />

    <Section eyebrow="Related services" title="Related Issues We Fix" alternate>
      <div className="grid gap-5 lg:grid-cols-3">{[
        { title: "Shower Regrouting", body: "Leak coming from the bathroom instead? Our grout specialists assess whether repairs can keep your tiles in place.", href: "/shower-regrouting/" },
        { title: "Leaking Shower Repair", body: "We trace the leak to its source before recommending a repair.", href: "/leaking-shower-repair/" },
        { title: "Efflorescence and Mould in Grout Lines", body: "White stains and black spots can signal moisture problems. We inspect the cause before recommending tile regrouting.", href: "/tile-regrouting/" },
      ].map(({ title, body, href }) => <Link key={title} href={href} className={`${card} group transition-colors hover:border-accent`}><h3 className="text-xl font-bold text-neutral-900">{title}</h3><p className="mt-4 leading-relaxed text-neutral-600">{body}</p><ArrowRight className="mt-6 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" /></Link>)}</div><p className={`mt-7 text-center ${text}`}>Not sure where your leak starts? Call us to arrange a free inspection.</p><InspectionCta />
    </Section>

    <Section eyebrow="Service areas" title="Balcony Leak Repairs Across Melbourne" intro="Check your suburb before booking a balcony inspection."><ServiceAreaCoverage service="Balcony Leak Repair" sourcePage="/balcony-leak-repairs" subject="your balcony" /></Section>

    <Section id="balcony-faqs" eyebrow="Your questions, answered" title="Balcony Leak Repair FAQs" alternate>
      <div className="mx-auto max-w-3xl space-y-3">{balconyFaqs.map(faq => <details key={faq.q} className="group rounded-xl border border-neutral-200 bg-white open:border-accent/50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden"><h3 className="text-base font-bold text-neutral-900">{faq.q}</h3><ChevronDown className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-180" /></summary><p className="balcony-faq-answer px-5 pb-5 leading-relaxed text-neutral-600">{faq.a}</p></details>)}</div><InspectionCta label="Still Have Questions? Get a Free Quote" />
    </Section>

    <section className="bg-primary py-16 text-center text-white"><div className="mx-auto max-w-3xl px-6"><h2 className="text-3xl font-bold sm:text-4xl">Book Your Free Balcony Inspection</h2><p className="mt-5 leading-relaxed text-white/85">For balcony leak repairs across Melbourne, call <a href={tel} className="font-bold underline">(03) 7023 8094</a> now. Or request a quote online.</p><p className="mt-4 text-sm text-white/75">Free inspection. Fixed written quote. 10 year warranty on eligible waterproof work.</p><div className="mt-8 flex flex-wrap justify-center gap-4"><Link href="/contact" className={`${button} bg-[#FBBC04] text-primary hover:bg-white`}>Request A Quote</Link><a href={tel} className="inline-flex items-center gap-2 rounded-sm border border-white/60 px-6 py-3 font-bold hover:bg-white/10"><Phone className="h-4 w-4" />(03) 7023 8094</a></div></div></section>
  </main><Footer /></>;
}
