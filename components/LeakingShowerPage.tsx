"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2, Camera, ChevronDown, ClipboardCheck, Droplets, House, Layers, Phone, Search, ShieldCheck, Star, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import ServiceSuburbChecker from "@/components/ServiceSuburbChecker";
import ReviewCard from "@/components/ReviewCard";
import type { Review } from "@/lib/reviews";
import { LEAKING_SHOWER_FAQS, LEAK_REPAIR_PHOTOS } from "@/lib/leakingShowerContent";

const googleReviews = "https://www.google.com/maps/place/Groutix";
const phoneHref = "tel:+61370238094";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-hover";
const textClass = "text-base sm:text-lg leading-relaxed text-neutral-600";

function Section({ id, title, accent, intro, eyebrow, alternate = false, children }: {
  id: string; title: string; accent?: string; intro?: string; eyebrow?: string; alternate?: boolean; children: ReactNode;
}) {
  return <section id={id} className={`${alternate ? "bg-neutral-100" : "bg-white"} py-16 lg:py-24`}>
    <div className="mx-auto max-w-[1460px] px-6 lg:px-10 space-y-10">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        {eyebrow && <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
        <h2 className="text-3xl lg:text-[42px] font-bold leading-tight text-neutral-900">{title}{accent && <> <span className="text-accent">{accent}</span></>}</h2>
        {intro && <p className={textClass}>{intro}</p>}
      </div>
      {children}
    </div>
  </section>;
}

function PhotoPlaceholder({ title, tall = false }: { title: string; tall?: boolean }) {
  return <div className={`relative ${tall ? "aspect-[4/5]" : "aspect-[4/3]"} flex w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-100 p-6 text-center`}>
    <div className="space-y-3"><Camera className="mx-auto h-9 w-9 text-neutral-400" /><p className="font-bold text-neutral-600">{title}</p><p className="text-sm text-neutral-500">Real Groutix photo to be supplied</p></div>
  </div>;
}

function QuoteButtons() {
  return <div className="flex flex-wrap items-center justify-center gap-4"><Link href="/contact" className={buttonClass}>Get a Free Quote <ArrowRight className="h-4 w-4" /></Link><a href={phoneHref} className="inline-flex items-center gap-2 font-bold text-primary hover:underline"><Phone className="h-4 w-4" />+61 3 7023 8094</a></div>;
}

export default function LeakingShowerPage({ reviews }: { reviews: Review[] }) {
  const extraReviews = reviews.filter((review) => /leak/i.test(review.review) && !["David Lau", "Jody Lansdowne", "Veronica", "Lars Madsen"].includes(review.name)).slice(0, 2);
  const signs = [
    "Stains or bubbling paint on the wall behind the shower",
    "A damp or musty smell in the bathroom or next room",
    "A wet patch, swollen skirting or lifting floor near the bathroom",
    "A stain or drip on the ceiling below the shower",
    "Cracked, missing or crumbling grout, or black or peeling silicone",
    "Tiles that sound hollow or feel loose",
  ];
  const sources = [
    ["Grout and silicone at the tile surface", "Cracked grout, black or peeling silicone, damp near corners and the floor junction", "Groutix"],
    ["Waterproofing membrane under the tiles", "Damp walls or ceiling below with grout that looks fine, repeated leaks after regrouting", "We assess it. Usually needs more than a regrout, and we tell you before work starts"],
    ["Shower base, screen or waste junction", "Water at the base, around the drain or under the screen", "We repair sealing and joint failures. Other faults are referred"],
    ["Pipes, mixer or fittings behind the wall", "Water that keeps flowing when the shower is off, wet wall around the tap", "Licensed plumber"],
  ];
  const immediateSteps = [
    "Stop using the shower if water is escaping the screen or coming through a wall or ceiling.",
    "Dry the area and take photos of stains, cracks and damp spots.",
    "Check the room or unit below for stains or drips.",
    "Do not seal over cracks with sealer or silicone. It hides the cause.",
    "If water is flowing when the shower is off, turn off the water to the bathroom and call a licensed plumber.",
  ];
  const process = [
    ["Inspect and Trace", "We check grout lines, corners, the floor junction, the base, the drain edge and the fittings to see where water is getting out."],
    ["Confirm the Cause", "We explain what we found in plain English. If it is a membrane or pipe problem, we say so before any work."],
    ["Repair the Cause", "Failed grout and silicone are removed and the joints rebuilt with waterproof materials made for wet areas. Tiles stay in place where they are sound."],
    ["Cure and Recheck", "The repair cures before the shower is used. We explain the cure time for your repair before work starts. Eligible repairs are backed by our 10-year waterproof warranty."],
  ];

  return <>
    <Navbar />
    <main>
      <section id="quote-form" className="relative overflow-hidden pt-[110px] lg:pt-[125px]">
        <Image src="/img101.jpeg" alt="Tiled bathroom shower" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative mx-auto max-w-[1460px] px-6 py-8 pb-16 lg:px-10 lg:pb-20">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_540px] lg:gap-12">
            <div className="space-y-5 text-center text-white lg:pt-2 lg:text-left">
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">Groutix</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">Leaking Shower Repairs Melbourne</h1>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">Groutix finds where your shower is leaking and repairs failed grout and silicone, often without removing tiles. If the cause is a pipe or the waterproofing membrane, we tell you before any work starts.</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                <a href={googleReviews} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-sm border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="5.0 stars, 290 plus Google reviews for Groutix">
                  <Image src="/google-logo.svg" alt="Google" width={24} height={24} /><span className="text-2xl font-black">5.0</span>
                  <span><span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />)}</span><span className="text-[13px] text-white/80">290+ Google Reviews</span></span>
                </a>
                <a href={phoneHref} className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-5 py-3 font-bold backdrop-blur-sm transition-colors hover:bg-white/20"><Phone className="h-4 w-4" />+61 3 7023 8094</a>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-white/85 lg:justify-start"><span className="inline-flex items-center gap-2"><Search className="h-4 w-4" />Find the source</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Eligible repairs: 10-year warranty</span></div>
            </div>
            <div className="w-full"><HeroQuoteForm /></div>
          </div>
        </div>
      </section>

      <section id="trust-stats" className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1460px] px-6 lg:px-10">
          <p className="mb-8 text-center text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Trusted Across Melbourne</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Droplets, value: "Specialist", label: "Bathroom Repairs", detail: "Focused on grout, silicone and wet areas" },
              { Icon: Star, value: "5.0/5", label: "Google Rating", detail: "Based on 290+ Google reviews" },
              { Icon: ShieldCheck, value: "10 Year", label: "Waterproof Warranty", detail: "On eligible completed repairs" },
            ].map(({ Icon, value, label, detail }) => <div key={label} className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-secondary"><Icon className="h-6 w-6" /></span><p className="text-3xl font-black leading-none text-neutral-900">{value}</p><h2 className="text-lg font-bold text-neutral-900">{label}</h2><p className="text-sm text-neutral-500">{detail}</p></div>)}
          </div>
        </div>
      </section>

      <Section id="leak-signs" title="Signs Your Shower May Be" accent="Leaking" eyebrow="Know the Signs" alternate intro="A leak often shows up away from the shower first. Look for these signs.">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{signs.map((sign) => <li key={sign} className="flex items-start gap-3 rounded-sm border border-neutral-200 bg-white p-6"><Droplets className="mt-1 h-5 w-5 shrink-0 text-accent" /><p className="text-base leading-relaxed text-neutral-700">{sign}</p></li>)}</ul>
        <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-neutral-600">One sign is worth checking. Two or more together mean water is probably getting out. For grout related signs, see our <Link href="/shower-regrouting/" className="font-semibold text-accent hover:underline">shower regrouting page</Link>.</p>
      </Section>

      <Section id="leak-sources" title="Where Is the Water" accent="Coming From?" intro="Not every leak is a grout leak. Here is how the common sources compare and who fixes each one.">
        <div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[680px] text-left text-base leading-relaxed"><caption className="sr-only">Common shower leak sources, signs and who repairs them</caption><thead className="bg-primary text-white"><tr>{["Source", "What it looks like", "Who fixes it"].map((label) => <th key={label} scope="col" className="px-6 py-4 font-bold">{label}</th>)}</tr></thead><tbody>{sources.map(([source, signs, repairer], index) => <tr key={source} className={index % 2 ? "bg-neutral-50" : "bg-white"}><th scope="row" className="w-[30%] border-t border-neutral-200 px-6 py-5 align-top font-bold text-neutral-900">{source}</th><td className="w-[35%] border-t border-neutral-200 px-6 py-5 align-top text-neutral-600">{signs}</td><td className="border-t border-neutral-200 px-6 py-5 align-top text-neutral-700">{repairer}</td></tr>)}</tbody></table></div>
        <p className="mx-auto max-w-4xl rounded-sm border-l-4 border-accent bg-accent/5 p-5 text-base leading-relaxed text-neutral-700">Plumbing work in Victoria must be done by a licensed plumber. If we suspect a pipe leak, we say so and do not charge for a repair that will not fix it.</p>
      </Section>

      <Section id="leak-damage" title="What a Leaking Shower Can" accent="Damage" alternate intro="Water behind tiles can travel a long way before you see it. A small leak can turn into a big repair.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[
          { Icon: House, title: "Walls and plasterboard", description: "Swelling, bubbling paint, crumbling lining" },
          { Icon: Layers, title: "Timber framing and floor", description: "Rot can start out of sight" },
          { Icon: Building2, title: "Ceiling and rooms below", description: "Stains, drips and damage to the unit or room underneath" },
          { Icon: Droplets, title: "Mould and odours", description: "Damp areas can keep growing mould" },
        ].map(({ Icon, title, description }) => <div key={title} className="rounded-sm border border-neutral-200 bg-white p-6 space-y-4"><Icon className="h-7 w-7 text-primary" /><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="text-base leading-relaxed text-neutral-600">{description}</p></div>)}</div>
        <p className="text-center text-base text-neutral-600">Covering the problem with sealer or fresh silicone only hides it for a short time.</p>
      </Section>

      <Section id="what-to-do" title="What To Do" accent="Right Now" eyebrow="Limit the Damage" intro="If you think your shower is leaking, these steps limit the damage while you arrange a repair.">
        <ol className="mx-auto max-w-4xl space-y-4">{immediateSteps.map((step, index) => <li key={step} className="flex items-start gap-4 rounded-sm border border-neutral-200 bg-neutral-50 p-5"><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</span><p className="text-base leading-relaxed text-neutral-700">{step}</p></li>)}</ol>
        <QuoteButtons />
      </Section>

      <Section id="repair-process" title="Our Leak Repair" accent="Process" eyebrow="Find It. Explain It. Repair It." alternate intro="Every leak is different, so we start by finding the cause, not by guessing.">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
          <ol className="space-y-8">{process.map(([title, description], index) => <li key={title} className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-black text-white" aria-hidden="true">{index + 1}</span><div className="space-y-2"><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="text-base leading-relaxed text-neutral-600">{description}</p></div></li>)}</ol>
          <PhotoPlaceholder title="Real technician tracing a shower leak" tall />
        </div>
      </Section>

      <Section id="repair-cost" title="What Does Leaking Shower Repair" accent="Cost?" intro="The price depends on where the leak comes from, so we quote after we inspect.">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-xl bg-primary p-6 sm:p-8 text-white"><div className="flex items-center gap-3"><ClipboardCheck className="h-7 w-7 shrink-0" /><h3 className="text-2xl font-bold">A clear quote for the cause of your leak</h3></div><p className="mt-3 text-base leading-relaxed text-white/85">We explain the recommended repair and the price before any work starts.</p></div>
          <ul className="space-y-4 text-base leading-relaxed text-neutral-600">
            <li><strong className="text-neutral-900">Grout and silicone repair:</strong> priced like a regrout. <Link href="/shower-regrouting/" className="font-semibold text-accent hover:underline">See cost details on our shower regrouting page</Link>.</li>
            <li><strong className="text-neutral-900">Failed membrane:</strong> this is a rebuild. Tiles come out and costs rise, and it can run into the thousands. We tell you before any work.</li>
            <li><strong className="text-neutral-900">Pipe or fitting leak:</strong> a licensed plumber quotes this.</li>
          </ul>
          <QuoteButtons />
        </div>
      </Section>

      <Section id="why-groutix" title="Why Choose Groutix" accent="for a Leak" alternate intro="We only work on grout, silicone and wet area repairs. That focus means we see these failures every day.">
        <div className="grid gap-6 md:grid-cols-3">{[
          { Icon: Search, title: "Honest scope", description: "If it is not a grout or silicone leak, we say so before you spend money on the wrong fix." },
          { Icon: ClipboardCheck, title: "A clear cause before any work", description: "You see what we found and why we recommend the repair." },
          { Icon: Wrench, title: "Waterproof materials for wet areas", description: "Failed grout and silicone are replaced with materials made for wet areas." },
        ].map(({ Icon, title, description }) => <div key={title} className="rounded-sm border border-neutral-200 bg-white p-6 space-y-4"><span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-primary"><Icon className="h-6 w-6" /></span><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="text-base leading-relaxed text-neutral-600">{description}</p></div>)}</div>
        <div className="flex flex-col items-center justify-between gap-5 rounded-sm bg-primary p-6 text-white sm:flex-row"><p className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="h-7 w-7 shrink-0" />10-year waterproof warranty on eligible completed repairs.</p><Link href="/terms-conditions" className="shrink-0 text-sm font-semibold underline hover:text-white/80">View warranty terms</Link></div>
      </Section>

      <Section id="before-after" title="Before and After:" accent="Real Leak Repairs" eyebrow="Real Work">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{LEAK_REPAIR_PHOTOS.map((photo) => <figure key={photo.title} className="space-y-3"><PhotoPlaceholder title={photo.title} /><figcaption className="text-sm leading-relaxed text-neutral-500">{photo.caption}</figcaption></figure>)}</div>
      </Section>

      <Section id="customer-feedback" title="What Customers Say About" accent="Leak Repairs" eyebrow="Customer Feedback" alternate>
        <div className="grid gap-6 md:grid-cols-3">
          <figure className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6"><Image src="/google-logo.svg" alt="Google" width={24} height={24} /><blockquote className="mt-5 flex-1 text-base leading-relaxed text-neutral-800">“Our bathroom was leaking into the ceiling downstairs. We had it done with epoxy grout. No more mould and leakage.”</blockquote><figcaption className="mt-6 font-bold text-neutral-900">David Lau<span className="mt-1 block text-sm font-normal text-neutral-500">Google review</span></figcaption></figure>
          {extraReviews.map((review) => <ReviewCard key={review.name} review={review} />)}
          {Array.from({ length: 2 - extraReviews.length }, (_, index) => <div key={index} className="flex flex-col justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-6 text-center"><Image src="/google-logo.svg" alt="Google" width={24} height={24} className="mx-auto" /><p className="mt-4 font-semibold text-neutral-600">Leak repair review to be supplied</p><p className="mt-2 text-sm leading-relaxed text-neutral-500">Reserved for a real Google review about a leaking shower repair.</p></div>)}
        </div>
        <div className="text-center"><a href={googleReviews} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">Read More Verified Reviews on Google →</a></div>
      </Section>

      <Section id="property-services" title="Leaking Shower in a" accent="Rental or Apartment?" eyebrow="Landlords, Agents and Strata">
        <div className="mx-auto max-w-4xl rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-10 text-center space-y-6"><Building2 className="mx-auto h-10 w-10 text-primary" /><p className={textClass}>Leaks in rentals and apartments often reach the unit or room below. We work around tenant timelines and explain the cause in plain terms for owners and managers.</p><Link href="/real-estate-property-services/" className={buttonClass}>Discuss a Property Job <ArrowRight className="h-4 w-4" /></Link></div>
      </Section>

      <Section id="related-services" title="Related" accent="Services" alternate>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[
          { Icon: Droplets, need: "Regrouting the whole shower", title: "Shower Regrouting", href: "/shower-regrouting/" },
          { Icon: Wrench, need: "Peeling or mouldy silicone", title: "Silicone and Recaulking", href: "/silicone-recaulking" },
          { Icon: House, need: "Balcony leaks", title: "Balcony Leak Repairs and Regrouting", href: "/balcony-leak-repairs" },
          { Icon: Layers, need: "Epoxy grout details", title: "Epoxy Grout", href: "/epoxy-grout" },
        ].map(({ Icon, need, title, href }) => <Link key={href} href={href} className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-accent"><Icon className="h-8 w-8 text-primary" /><p className="mt-4 text-sm text-neutral-500">{need}</p><h3 className="mt-2 flex-1 text-lg font-bold text-neutral-900">{title}</h3><span className="mt-5 flex items-center gap-2 border-t border-neutral-200 pt-4 text-sm font-bold text-accent">View service <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div>
      </Section>

      <Section id="service-areas" title="Which Melbourne Suburbs Do We Repair" accent="Leaking Showers In?" eyebrow="Where We Work" intro="Coverage can vary by suburb, so confirm your area before booking.">
        <div className="mx-auto max-w-5xl space-y-6 text-center"><h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Check your suburb</h3><div className="flex flex-wrap justify-center gap-2">{["South Yarra", "Toorak", "Malvern", "Armadale", "Prahran", "Hawthorn", "Camberwell", "Brighton", "St Kilda", "Richmond", "Albert Park", "Windsor", "Elwood", "Port Melbourne"].map((suburb) => <Link key={suburb} href={`/locations/melbourne/${suburb.toLowerCase().replaceAll(" ", "-")}`} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-primary hover:text-primary"><MapPinIcon />{suburb}</Link>)}</div><p className="text-base text-neutral-600">Outside these suburbs? <Link href="/locations" className="font-bold text-accent hover:underline">View our locations</Link> or check your area below.</p></div>
        <ServiceSuburbChecker />
      </Section>

      <Section id="faq" title="Frequently Asked" accent="Questions" alternate>
        <div className="mx-auto max-w-3xl space-y-3">{LEAKING_SHOWER_FAQS.map(({ q, a }) => <details key={q} className="group rounded-lg border border-neutral-200 bg-white open:border-accent/50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden"><span>{q}</span><ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180 group-open:text-accent" /></summary><p className="border-t border-neutral-100 px-5 py-4 text-base leading-relaxed text-neutral-600">{a}</p></details>)}</div>
        <div className="text-center"><Link href="/contact" className={buttonClass}>Still Have Questions? Get a Free Quote</Link></div>
      </Section>

      <section id="final-cta" className="bg-primary px-6 py-16 text-center lg:px-10 lg:py-20"><div className="mx-auto max-w-4xl space-y-5"><h2 className="text-3xl font-bold leading-tight text-white lg:text-[42px]">Get Your Free Quote Today</h2><p className="text-base leading-relaxed text-white/90 sm:text-lg">Call <a href={phoneHref} className="font-semibold underline">+61 3 7023 8094</a>, email <a href="mailto:info@groutix.com" className="font-semibold underline">info@groutix.com</a>, or request a quote online.</p><p className="text-sm text-white/75">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p><p className="text-base text-white/85">Honest advice and workmanship you can rely on.</p><div className="flex flex-wrap justify-center gap-4 pt-2"><Link href="/contact" className="rounded-sm bg-white px-6 py-3 text-base font-bold text-primary transition-colors hover:bg-neutral-100">Request A Quote</Link><a href={phoneHref} className="inline-flex items-center gap-2 rounded-sm border border-white/60 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-white/10"><Phone className="h-4 w-4" />+61 3 7023 8094</a></div></div></section>
    </main>
    <Footer />
  </>;
}

function MapPinIcon() {
  return <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />;
}
