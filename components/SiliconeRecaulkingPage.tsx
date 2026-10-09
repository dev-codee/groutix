"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bath, Camera, Check, ChevronDown, Clock, Droplets, Grid2x2, House, Layers, MapPin, Phone, Ruler, ShieldCheck, Sparkles, Star, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import ReviewCard from "@/components/ReviewCard";
import ServiceAreaCoverage from "@/components/ServiceAreaCoverage";
import { Section, Cards, QuoteLink, card, link, text } from "@/components/ServicePageSections";
import type { BusinessRating, Review } from "@/lib/reviews";
import { BUSINESS } from "@/lib/seo";
import { siliconeFaqs, siliconePhotoSlots, siliconeSteps, suppliedSiliconeReview } from "@/lib/siliconeRecaulkingContent";

const phone = "(03) 7023 8094";
const tel = "tel:+61370238094";
const heroBadge = "flex h-16 w-[280px] max-w-full shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-white/20";

function PhotoSlot({ title, technician = false }: { title: string; technician?: boolean }) {
  return <figure className="overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center text-neutral-400"><Camera className="h-8 w-8" /><p className="text-sm">{technician ? "Technician photo coming soon" : "Before & after photos coming soon"}</p></div>
    <figcaption className="border-t border-neutral-200 bg-white px-5 py-4 font-bold text-neutral-900">{title}</figcaption>
  </figure>;
}

function FaqAnswer({ index }: { index: number }) {
  const answer = siliconeFaqs[index].a;
  const serviceLink = index === 4 ? { phrase: "shower regrouting", href: "/shower-regrouting/" } : index === 5 ? { phrase: "leaking shower repair", href: "/leaking-shower-repair/" } : null;
  if (!serviceLink) return answer;
  const [before, after] = answer.split(serviceLink.phrase);
  return <>{before}<Link href={serviceLink.href} className={link}>{serviceLink.phrase}</Link>{after}</>;
}

export default function SiliconeRecaulkingPage({ rating, reviews }: { rating: BusinessRating; reviews: Review[] }) {
  const isAdelene = (review: Review) => review.name.toLowerCase() === suppliedSiliconeReview.name.toLowerCase();
  const siliconeReviews = [reviews.find(isAdelene) ?? suppliedSiliconeReview, ...reviews.filter(review => !isAdelene(review)).slice(0, 2)];
  return <><Navbar /><main className="overflow-x-clip">
    <section id="quote-form" className="relative scroll-mt-20 overflow-hidden bg-primary pt-[110px] lg:pt-[125px]">
      <Image src="/img101.jpeg" alt="Tiled bathroom shower" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative mx-auto grid max-w-[1460px] items-start gap-8 px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_540px]">
        <div className="space-y-5 text-center text-white lg:pt-2 lg:text-left">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70 lg:justify-start"><Link href="/" className="hover:text-white">Home</Link><span>/</span><span aria-current="page">Silicone & Recaulking</span></nav>
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">Groutix</p>
          <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">Silicone Replacement Melbourne</h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">Groutix removes old, mouldy or peeling silicone and reseals the joint with fresh mould resistant silicone. We take the old bead out completely, so the new one bonds and holds.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={`${heroBadge} gap-3`} aria-label={`${rating.value.toFixed(1)} stars from ${rating.count} Google reviews for Groutix`}>
              <Image src="/google-logo.svg" alt="Google" width={24} height={24} /><strong className="text-2xl font-black">{rating.value.toFixed(1)}</strong><span><span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: Math.round(rating.value) }, (_, i) => <Star key={i} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />)}</span><span className="whitespace-nowrap text-[13px] text-white/80">{rating.count} Google Reviews</span></span>
            </a>
            <a href={tel} className={`${heroBadge} gap-2 font-bold`}><Phone className="h-4 w-4" />{phone}</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-white/85 lg:justify-start">{["Full removal of old silicone", "Clear quote first", "Mould resistant finish"].map(item => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FBBC04]" />{item}</span>)}</div>
        </div>
        <div className="w-full"><HeroQuoteForm defaultService="Silicone Replacement" /></div>
      </div>
    </section>

    <section aria-labelledby="silicone-trust" className="border-b border-neutral-200 bg-white py-12"><div className="mx-auto max-w-[1320px] px-6 lg:px-10"><h2 id="silicone-trust" className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Trusted Across Melbourne</h2><div className="grid gap-8 text-center sm:grid-cols-3">{[
      { Icon: MapPin, value: "Local", label: "Bathroom & Wet Area Repairs", detail: "Across Melbourne and surrounding service areas" },
      { Icon: Star, value: `${rating.value.toFixed(1)}/5`, label: "Google Rating", detail: `Based on ${rating.count} Google reviews` },
      { Icon: Layers, value: "Full Removal", label: "A Fresh Seal", detail: "Old silicone and residue removed before resealing" },
    ].map(({ Icon, value, label, detail }) => <div key={label}><Icon className="mx-auto mb-3 h-7 w-7 text-accent" /><p className="text-3xl font-black text-primary">{value}</p><p className="mt-2 font-bold text-neutral-900">{label}</p><p className="mt-2 text-sm text-neutral-500">{detail}</p></div>)}</div></div></section>

    <Section id="signs" eyebrow="Signs to check" title="Signs Your Silicone Needs Replacing" intro="Silicone wears out before almost anything else in a bathroom. Look for these signs." alternate><Cards items={[
      { title: "Black or Pink Mould", body: "Mould in the silicone bead.", icon: Droplets },
      { title: "Peeling or Lifting Edges", body: "The seal pulls away from the surface.", icon: Layers },
      { title: "Cracked or Split Silicone", body: "Cracks and splits through the bead.", icon: Wrench },
      { title: "Yellow or Hardened Silicone", body: "Silicone that has gone yellow or hard.", icon: Clock },
      { title: "Gaps at the Tile", body: "Gaps between the bead and the tile.", icon: Grid2x2 },
      { title: "Shrinking at Corners", body: "A bead that has shrunk or pulled away at corners.", icon: House },
    ]} /><p className={`mx-auto mt-8 max-w-3xl text-center ${text}`}>Mould only on the surface may clean off. Mould through the bead, or a bead that has lifted, means it needs replacing.</p></Section>

    <Section id="where" eyebrow="Around your home" title="Where We Replace Silicone" intro="Anywhere two surfaces meet and need a flexible, waterproof seal."><Cards items={[
      { title: "Shower Corners and Edges", body: "Flexible seals where shower walls and floors meet.", icon: Droplets },
      { title: "Around the Bath", body: "A fresh bead along the bath edge.", icon: Bath },
      { title: "Shower Screen Frames and Base Edges", body: "Seals around screen frames and base edges.", icon: Layers },
      { title: "Vanities, Basins and Benchtops", body: "Neat joints between fixtures and tiled surfaces.", icon: House },
      { title: "Kitchen Sinks and Splashbacks", body: "Flexible seals around kitchen wet areas.", icon: Sparkles },
      { title: "Laundry Tubs and Wet Area Walls", body: "Resealing around tubs and wet area junctions.", icon: Droplets },
    ]} /></Section>

    <Section id="silicone-or-grout" eyebrow="The right material" title="Silicone or Grout? Which Joint Gets Which" intro="Both seal your bathroom, but they do different jobs." alternate>
      <div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[640px] text-left text-sm sm:text-base"><caption className="sr-only">The right material for each type of tile and fixture joint.</caption><thead className="bg-primary text-white"><tr>{["Joint", "Why", "What it needs"].map(heading => <th key={heading} scope="col" className="px-6 py-5 font-bold">{heading}</th>)}</tr></thead><tbody>
        <tr className="bg-white"><th scope="row" className="px-6 py-5 font-bold text-neutral-900">Flat tile to tile joints</th><td className="px-6 py-5 text-neutral-600">The joint does not move much</td><td className="px-6 py-5 text-neutral-600">Grout. See <Link href="/shower-regrouting/" className={link}>shower regrouting</Link> or <Link href="/tile-regrouting/" className={link}>tile regrouting</Link>.</td></tr>
        {[
          ["Inside corners and wall to wall", "Walls move and shrink"],
          ["Wall to floor, base to wall", "Different materials move at different rates"],
          ["Tile to bath, basin, benchtop or screen", "Two surfaces that expand differently"],
        ].map(([joint, why], i) => <tr key={joint} className={i % 2 ? "bg-white" : "bg-neutral-50"}><th scope="row" className="border-t border-neutral-200 px-6 py-5 font-bold text-neutral-900">{joint}</th><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">{why}</td><td className="border-t border-neutral-200 px-6 py-5 text-neutral-600">Silicone.</td></tr>)}
      </tbody></table></div><p className={`mx-auto mt-7 max-w-3xl text-center ${text}`}>Grout in a corner cracks. Silicone on a flat joint peels. We use the right one in the right place.</p>
    </Section>

    <Section id="why-silicone-fails" eyebrow="The cause" title="Why Silicone Fails"><Cards columns={4} items={[
      { title: "Moisture and Soap Scum", body: "Constant moisture and soap scum wear at the seal.", icon: Droplets },
      { title: "Movement", body: "Corners and joints move over time.", icon: Layers },
      { title: "Age", body: "Silicone does not last forever.", icon: Clock },
      { title: "New Over Old", body: "New silicone laid over old silicone does not bond.", icon: Wrench },
    ]} /><aside className="mt-6 rounded-xl border-l-4 border-[#FBBC04] bg-accent-light/30 p-6 sm:p-8"><h3 className="text-xl font-bold text-neutral-900">Why We Remove All of the Old Silicone</h3><p className="mt-3 leading-relaxed text-neutral-600">New silicone does not stick to old silicone. A bead laid over the old one looks fine for a few weeks and then peels. We cut out the old bead and clean the joint before we start.</p></aside></Section>

    <section id="process" className="bg-neutral-50 py-16 lg:py-20"><div className="mx-auto grid max-w-[1320px] items-start gap-8 px-6 lg:grid-cols-2 lg:gap-x-14 lg:px-10">
      <div className="order-1"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">Our process</p><h2 className="text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-4xl">Our Silicone Replacement Process</h2><p className={`mt-4 ${text}`}>Clean, neat and made to last. Here is how it works.</p></div>
      <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"><PhotoSlot title="A Groutix technician applying silicone" technician /></div>
      <div className="order-3 lg:col-start-1"><ol className="space-y-6">{siliconeSteps.map(({ title, body }, i) => <li key={title} className="flex gap-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-light font-bold text-primary">{i + 1}</span><div><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div></li>)}</ol><p className="my-7 text-sm leading-relaxed text-neutral-500">We confirm the applicable workmanship warranty and repair scope in your quote.</p><QuoteLink label="Book Your Free Quote" /></div>
    </div></section>

    <Section id="cure-time" eyebrow="After the job" title="How Soon Can I Use My Shower?"><aside className="mx-auto max-w-3xl rounded-xl border-l-4 border-[#FBBC04] bg-accent-light/30 p-6 sm:p-8"><Clock className="mb-4 h-7 w-7 text-primary" /><h3 className="text-xl font-bold text-neutral-900">It Depends on the Silicone Used</h3><p className={`mt-3 ${text}`}>We tell you the exact wait before we start so you can plan.</p></aside><div className="mx-auto mt-6 grid max-w-3xl gap-5 sm:grid-cols-2">{[
      ["Do Not Touch the Bead", "Leave it alone while it cures."],
      ["Keep the Area Dry", "Keep the shower dry until we tell you it is ready."],
    ].map(([title, body]) => <div key={title} className={card}><Check className="mb-3 h-5 w-5 text-primary" /><h3 className="font-bold text-neutral-900">{title}</h3><p className="mt-2 leading-relaxed text-neutral-600">{body}</p></div>)}</div></Section>

    <Section id="cost" eyebrow="Pricing" title="What Does Silicone Replacement Cost?" intro="The price depends on how much silicone needs replacing, so we quote after we see it." alternate><Cards columns={4} items={[
      { title: "Length of Silicone", body: "How much of the existing bead needs replacing.", icon: Ruler },
      { title: "Location", body: "A shower corner versus a full bath surround.", icon: Bath },
      { title: "Condition", body: "The condition of the old silicone and residue.", icon: Wrench },
      { title: "Access", body: "Screens and fixtures can affect access.", icon: Layers },
    ]} /><aside className="mt-6 rounded-xl border-l-4 border-[#FBBC04] bg-white p-6"><h3 className="text-xl font-bold text-neutral-900">A Clear Quote First</h3><p className="mt-3 leading-relaxed text-neutral-600">We quote by the job so you know the price before work starts. Often combined with a regrout. For shower prices see <Link href="/shower-regrouting/" className={link}>shower regrouting</Link>.</p></aside><div className="mt-7 text-center"><QuoteLink /></div></Section>

    <section className="bg-primary py-14 text-white"><div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-7 px-6 lg:flex-row lg:items-center lg:px-10"><div className="max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FBBC04]">For property professionals</p><h2 className="text-3xl font-bold">Landlords, Agents and Strata</h2><p className="mt-4 leading-relaxed text-white/80">Fresh silicone is a quick, visible fix before an inspection, a sale or a new tenant. Scheduled around tenants. Most jobs are completed in a single visit. We confirm the visit schedule and cure time before work begins.</p></div><Link href="/real-estate-property-services/" className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Discuss a Property Job<ArrowRight className="h-4 w-4" /></Link></div></section>

    <Section id="why-groutix" eyebrow="Why Groutix" title="Why Choose Groutix"><Cards columns={4} items={[
      { title: "Honest Advice", body: "We tell you if it is grout, not silicone.", icon: Check },
      { title: "Clear Quote First", body: "You know the price before work starts.", icon: Check },
      { title: "Full Removal, Not Overlay", body: "The old bead is removed completely before resealing.", icon: Layers },
      { title: "Clear Warranty Scope", body: "The applicable workmanship warranty is confirmed in your quote.", icon: ShieldCheck },
    ]} /></Section>

    <Section id="before-after" eyebrow="Our work" title="Before and After" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{siliconePhotoSlots.map(title => <PhotoSlot key={title} title={title} />)}</div></Section>

    <Section id="reviews" eyebrow="Customer feedback" title="What Our Customers Say"><div className={`grid gap-6 ${siliconeReviews.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-2xl"}`}>
      {siliconeReviews.map(review => <ReviewCard key={`${review.name}-${review.review}`} review={review} />)}
    </div><div className="mt-7 text-center"><a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={link}>Read More Reviews on Google →</a></div></Section>

    <Section id="related-services" eyebrow="More ways we can help" title="Related Services" alternate><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Shower Regrouting", "/shower-regrouting/", "Grout joints throughout the shower."],
      ["Leaking Shower Repair", "/leaking-shower-repair/", "Find and repair where water is getting out."],
      ["Tile Regrouting", "/tile-regrouting/", "Floors, kitchens and laundries."],
      ["Epoxy Grout", "/epoxy-grout/", "Stain resistant grout for wet areas."],
    ].map(([title, href, body]) => <Link key={href} href={href} className={`${card} group transition-colors hover:border-accent`}><h3 className="font-bold text-neutral-900">{title}</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">{body}</p><ArrowRight className="mt-6 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" /></Link>)}</div></Section>

    <Section id="service-areas" eyebrow="Service areas" title="Which Melbourne Suburbs Do We Replace Silicone In?" intro="Looking for silicone replacement near you? Check your suburb below."><ServiceAreaCoverage service="Silicone Replacement" sourcePage="/silicone-recaulking" subject="your silicone replacement" /></Section>

    <Section id="faqs" eyebrow="Your questions, answered" title="Silicone Replacement FAQs" alternate><div className="mx-auto max-w-3xl space-y-3">{siliconeFaqs.map((faq, index) => <details key={faq.q} className="group rounded-xl border border-neutral-200 bg-white open:border-accent/50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden"><h3 className="text-base font-bold text-neutral-900">{faq.q}</h3><ChevronDown className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-180" /></summary><p className="px-5 pb-5 leading-relaxed text-neutral-600"><FaqAnswer index={index} /></p></details>)}</div><div className="mt-8 text-center"><QuoteLink label="Still Have Questions? Get a Free Quote" /></div></Section>

    <section className="bg-primary py-16 text-center text-white"><div className="mx-auto max-w-3xl px-6"><h2 className="text-3xl font-bold sm:text-4xl">Get Your Free Quote Today</h2><p className="mt-5 leading-relaxed text-white/85">Call <a href={tel} className="underline">{phone}</a>, email <a href="mailto:info@groutix.com" className="underline">info@groutix.com</a>, or request a quote online.</p><p className="mt-3 text-sm text-white/70">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p><p className="mt-3 text-white/80">Honest advice and workmanship you can rely on.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/contact" className="rounded-sm bg-[#FBBC04] px-6 py-3 font-bold text-primary hover:bg-white">Request A Quote</Link><a href={tel} className="inline-flex items-center gap-2 rounded-sm border border-white/60 px-6 py-3 font-bold hover:bg-white/10"><Phone className="h-4 w-4" />{phone}</a></div></div></section>
  </main><Footer /></>;
}
