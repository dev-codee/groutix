"use client";

// Redesigned /leaking-shower-repair page (also used by /cracked-grout-or-a-leaking-shower).
// Copy, links and FAQs are the same as components/LeakingShowerPage.tsx (kept for a
// one-line rollback); only the layout follows the new homepage.

import Image from "next/image";
import Link from "next/link";
import { Building2, ClipboardCheck, Droplets, House, Layers, Phone, Search, ShieldCheck, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeAreasV2 from "@/components/home/HomeAreasV2";
import { useContact } from "@/components/SiteContentProvider";
import { GOOGLE_REVIEW_COUNT_LABEL } from "@/lib/seo";
import type { Review } from "@/lib/reviews";
import { LEAKING_SHOWER_FAQS } from "@/lib/leakingShowerContent";
import {
  BeforeAfter, FaqList, FinalCta, MobileCallBar, PhotoCard, ReviewsMarquee, Section, SectionHead, ServiceHero,
  box, btnGold, btnNavy, cardText, cardTitle, eyebrow, h2, inlineLink, lead, wrap, type PhotoCardData,
} from "@/components/v2/ui";

const googleReviews = "https://www.google.com/maps/place/Groutix";

/* ───────────── Content (unchanged from the live page) ───────────── */
// Sign text is the live copy; the photo and link are new for the card layout.
const signs: PhotoCardData[] = [
  { title: "Stains or bubbling paint on the wall behind the shower", img: "/img58.jpeg", alt: "Damp, stained wall next to a bathroom", href: "#leak-damage", link: "What a leak can damage" },
  { title: "A damp or musty smell in the bathroom or next room", img: "/img23.jpeg", alt: "Mould and staining in a damp shower corner", href: "#leak-sources", link: "Where the water comes from" },
  { title: "A wet patch, swollen skirting or lifting floor near the bathroom", img: "/img37.jpeg", alt: "Water damage on skirting and flooring beside a bathroom", href: "#what-to-do", link: "What to do right now" },
  { title: "A stain or drip on the ceiling below the shower", img: "/img97.jpeg", alt: "Water damage on a wall and ceiling below a leak", href: "#property-services", link: "Leaks in rentals and apartments", half: true },
  { title: "Cracked, missing or crumbling grout, or black or peeling silicone", img: "/img54.jpeg", alt: "Cracked, crumbling grout between shower tiles", href: "/shower-regrouting/", link: "Shower regrouting" },
  { title: "Tiles that sound hollow or feel loose", img: "/img41.jpeg", alt: "Loose and broken tiles on a shower wall", href: "/small-tiling-jobs/", link: "Small tiling jobs" },
];

const sources: Array<[string, string, string]> = [
  ["Grout and silicone at the tile surface", "Cracked grout, black or peeling silicone, damp near corners and the floor junction", "Groutix"],
  ["Waterproofing membrane under the tiles", "Damp walls or ceiling below with grout that looks fine, repeated leaks after regrouting", "We assess it. Usually needs more than a regrout, and we tell you before work starts"],
  ["Shower base, screen or waste junction", "Water at the base, around the drain or under the screen", "We repair sealing and joint failures. Other faults are referred"],
  ["Pipes, mixer or fittings behind the wall", "Water that keeps flowing when the shower is off, wet wall around the tap", "Licensed plumber"],
];

const damage = [
  { Icon: House, title: "Walls and plasterboard", description: "Swelling, bubbling paint, crumbling lining" },
  { Icon: Layers, title: "Timber framing and floor", description: "Rot can start out of sight" },
  { Icon: Building2, title: "Ceiling and rooms below", description: "Stains, drips and damage to the unit or room underneath" },
  { Icon: Droplets, title: "Mould and odours", description: "Damp areas can keep growing mould" },
];

const immediateSteps = [
  "Stop using the shower if water is escaping the screen or coming through a wall or ceiling.",
  "Dry the area and take photos of stains, cracks and damp spots.",
  "Check the room or unit below for stains or drips.",
  "Do not seal over cracks with sealer or silicone. It hides the cause.",
  "If water is flowing when the shower is off, turn off the water to the bathroom and call a licensed plumber.",
];

const process: Array<[string, string]> = [
  ["Inspect and Trace", "We check grout lines, corners, the floor junction, the base, the drain edge and the fittings to see where water is getting out."],
  ["Confirm the Cause", "We explain what we found in plain English. If it is a membrane or pipe problem, we say so before any work."],
  ["Repair the Cause", "Failed grout and silicone are removed and the joints rebuilt with waterproof materials made for wet areas. Tiles stay in place where they are sound."],
  ["Cure and Recheck", "The repair cures before the shower is used. We explain the cure time for your repair before work starts. Eligible repairs are backed by our 10-year waterproof warranty."],
];

const whyGroutix = [
  { Icon: Search, title: "Honest scope", description: "If it is not a grout or silicone leak, we say so before you spend money on the wrong fix." },
  { Icon: ClipboardCheck, title: "A clear cause before any work", description: "You see what we found and why we recommend the repair." },
  { Icon: Wrench, title: "Waterproof materials for wet areas", description: "Failed grout and silicone are replaced with materials made for wet areas." },
];

// Real Groutix before/after jobs (the live page still shows empty photo placeholders here).
const beforeAfter = [
  { src: "/img95.jpeg", alt: "Shower floor before and after repair" },
  { src: "/img91.jpeg", alt: "Dark tiled shower floor before and after regrouting" },
  { src: "/img10.jpeg", alt: "Stained floor grout before and after repair" },
  { src: "/img61.jpeg", alt: "Mouldy wall grout before and after regrouting" },
];

const related: PhotoCardData[] = [
  { text: "Regrouting the whole shower", title: "Shower Regrouting", href: "/shower-regrouting/", img: "/img53.jpeg", alt: "New grout being applied to shower floor tiles", link: "View service" },
  { text: "Peeling or mouldy silicone", title: "Silicone and Recaulking", href: "/silicone-recaulking", img: "/img50.jpeg", alt: "Old silicone being replaced around a shower screen", link: "View service" },
  { text: "Balcony leaks", title: "Balcony Leak Repairs and Regrouting", href: "/balcony-leak-repairs", img: "/img76.jpeg", alt: "Tiled balcony in a Melbourne apartment", link: "View service" },
  { text: "Epoxy grout details", title: "Epoxy Grout", href: "/epoxy-grout", img: "/img59.jpeg", alt: "Floor tiles regrouted with epoxy grout", link: "View service", half: true },
  { text: "Broken or loose tiles", title: "Small Tiling Jobs", href: "/small-tiling-jobs/", img: "/img2.jpeg", alt: "Tiles being set and grouted on a wall", link: "View service" },
];

/* ───────────── Page ───────────── */
export default function LeakingShowerPageV2({ reviews }: { reviews: Review[] }) {
  const { phone, tel } = useContact();

  const quoteButtons = (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <Link href="/contact" className={btnNavy}>Get a Free Quote →</Link>
      <a href={tel} className="inline-flex items-center gap-2 font-bold text-[#001F97] hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        {/* 1. HERO */}
        <ServiceHero title="Leaking Shower Repairs Melbourne" warrantyNote="On eligible completed repairs">
          <p>Groutix finds where your shower is leaking and repairs failed grout and silicone, often without removing tiles. If the cause is a pipe or the waterproofing membrane, we tell you before any work starts.</p>
        </ServiceHero>

        {/* 2. TRUST STATS */}
        <Section id="trust-stats">
          <p className={`${eyebrow} text-center`}>Trusted Across Melbourne</p>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { Icon: Droplets, value: "Specialist", label: "Bathroom Repairs", detail: "Focused on grout, silicone and wet areas" },
              { Icon: ShieldCheck, value: "5.0/5", label: "Google Rating", detail: `Based on ${GOOGLE_REVIEW_COUNT_LABEL} Google reviews` },
              { Icon: ShieldCheck, value: "10 Year", label: "Waterproof Warranty", detail: "On eligible completed repairs" },
            ].map(({ Icon, value, label, detail }, i) => (
              <div key={label} className={`${box} flex items-center gap-4 p-6`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]">
                  {i === 1 ? <Image src="/google-logo.svg" alt="" width={22} height={22} /> : <Icon className="h-6 w-6" aria-hidden="true" />}
                </span>
                <span>
                  <span className="block text-[28px] font-black leading-none text-slate-900">{value}</span>
                  <h3 className="mt-1 text-[17px] font-bold text-slate-900">{label}</h3>
                  <p className="text-sm text-slate-500">{detail}</p>
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. SIGNS */}
        <Section id="leak-signs" alt>
          <SectionHead k="Know the Signs" title="Signs Your Shower May Be Leaking">
            <p className={lead}>A leak often shows up away from the shower first. Look for these signs.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signs.map((c) => <PhotoCard key={c.title} c={c} />)}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl md:text-center`}>
            One sign is worth checking. Two or more together mean water is probably getting out. For grout related signs, see our{" "}
            <Link href="/shower-regrouting/" className={inlineLink}>shower regrouting page</Link>.
          </p>
        </Section>

        {/* 4. SOURCES */}
        <Section id="leak-sources">
          <SectionHead title="Where Is the Water Coming From?">
            <p className={lead}>Not every leak is a grout leak. Here is how the common sources compare and who fixes each one.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1100px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[680px] border-collapse text-left text-[15px] leading-relaxed">
                <caption className="sr-only">Common shower leak sources, signs and who repairs them</caption>
                <thead>
                  <tr className="bg-[#001F97] text-white">
                    {["Source", "What it looks like", "Who fixes it"].map((l) => <th key={l} scope="col" className="px-5 py-4 font-bold">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sources.map(([source, looks, who], i) => (
                    <tr key={source} className={`border-t border-slate-200 ${i === 0 ? "bg-[#EEF3FF]" : ""}`}>
                      <th scope="row" className="w-[30%] px-5 py-4 align-top font-bold text-slate-900">{source}</th>
                      <td className="w-[35%] px-5 py-4 align-top text-slate-600">{looks}</td>
                      <td className={`px-5 py-4 align-top ${i === 0 ? "font-bold text-[#001F97]" : "text-slate-700"}`}>{who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${box} mt-6 border-l-4 border-l-[#FBBC04] p-6`}>
              <p className="text-base leading-relaxed text-slate-700">Plumbing work in Victoria must be done by a licensed plumber. If we suspect a pipe leak, we say so and do not charge for a repair that will not fix it.</p>
            </div>
          </div>
        </Section>

        {/* 5. DAMAGE */}
        <Section id="leak-damage" alt>
          <SectionHead title="What a Leaking Shower Can Damage">
            <p className={lead}>Water behind tiles can travel a long way before you see it. A small leak can turn into a big repair.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {damage.map(({ Icon, title, description }) => (
              <div key={title} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-base text-slate-600">Covering the problem with sealer or fresh silicone only hides it for a short time.</p>
        </Section>

        {/* 6. WHAT TO DO */}
        <Section id="what-to-do">
          <SectionHead k="Limit the Damage" title="What To Do Right Now">
            <p className={lead}>If you think your shower is leaking, these steps limit the damage while you arrange a repair.</p>
          </SectionHead>
          <ol className="mx-auto grid max-w-[900px] gap-4">
            {immediateSteps.map((step, i) => (
              <li key={step} className={`${box} flex items-start gap-4 p-5`}>
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-sm font-black text-white">{i + 1}</span>
                <p className="pt-1 text-base leading-relaxed text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
          {quoteButtons}
        </Section>

        {/* 7. PROCESS */}
        <section id="repair-process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Find It. Explain It. Repair It.</p>
              <h2 className={h2}>Our Leak Repair Process</h2>
              <p className={lead}>Every leak is different, so we start by finding the cause, not by guessing.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {process.map(([title, text], i) => (
                  <li key={title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/img85.jpeg" alt="Groutix technician repairing shower floor grout" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 8. COST */}
        <Section id="repair-cost">
          <SectionHead title="What Does Leaking Shower Repair Cost?">
            <p className={lead}>The price depends on where the leak comes from, so we quote after we inspect.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1000px]">
            <div className="flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <div>
                <h3 className="flex items-center gap-3 text-2xl font-bold"><ClipboardCheck className="h-7 w-7 shrink-0 text-[#FBBC04]" aria-hidden="true" />A clear quote for the cause of your leak</h3>
                <p className="mt-2 text-[#D6DCF5]">We explain the recommended repair and the price before any work starts.</p>
              </div>
              <Link href="/contact" className={`${btnGold} shrink-0`}>Get a Free Quote</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                <h3 className={cardTitle}>Grout and silicone repair</h3>
                <p className={cardText}>Priced like a regrout. <Link href="/shower-regrouting/" className={inlineLink}>See cost details on our shower regrouting page</Link>.</p>
              </div>
              <div className={`${box} border-t-4 border-t-[#2F63CC] p-6`}>
                <h3 className={cardTitle}>Failed membrane</h3>
                <p className={cardText}>This is a rebuild. Tiles come out and costs rise, and it can run into the thousands. We tell you before any work.</p>
              </div>
              <div className={`${box} border-t-4 border-t-[#FBBC04] p-6`}>
                <h3 className={cardTitle}>Pipe or fitting leak</h3>
                <p className={cardText}>A licensed plumber quotes this.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. WHY GROUTIX */}
        <Section id="why-groutix" alt>
          <SectionHead title="Why Choose Groutix for a Leak">
            <p className={lead}>We only work on grout, silicone and wet area repairs. That focus means we see these failures every day.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {whyGroutix.map(({ Icon, title, description }) => (
              <div key={title} className={`${box} p-6`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg bg-[#001F97] p-6 text-white sm:flex-row sm:items-center">
            <p className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="h-7 w-7 shrink-0 text-[#FBBC04]" aria-hidden="true" />10-year waterproof warranty on eligible completed repairs.</p>
            <Link href="/terms-conditions" className="shrink-0 text-sm font-semibold underline hover:text-white/80">View warranty terms</Link>
          </div>
        </Section>

        {/* 10. BEFORE & AFTER */}
        <Section id="before-after">
          <SectionHead k="Real Work" title="Before and After: Real Leak Repairs" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfter.map((p) => <BeforeAfter key={p.src} src={p.src} title="" alt={p.alt} />)}
          </div>
        </Section>

        {/* 11. REVIEWS */}
        <Section id="customer-feedback" alt>
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} />
          <div className="mt-6 text-center">
            <a href={googleReviews} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">Read More Verified Reviews on Google →</a>
          </div>
        </Section>

        {/* 12. PROPERTY */}
        <section id="property-services" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>Landlords, Agents and Strata</p>
              <h2 className={`${h2} text-white`}>Leaking Shower in a Rental or Apartment?</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">Leaks in rentals and apartments often reach the unit or room below. We work around tenant timelines and explain the cause in plain terms for owners and managers.</p>
            </div>
            <Link href="/real-estate-property-services/" className={`${btnGold} shrink-0`}>Discuss a Property Job →</Link>
          </div>
        </section>

        {/* 13. RELATED SERVICES */}
        <Section id="related-services" alt>
          <SectionHead title="Related Services" />
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-5">
            {related.map((c) => <PhotoCard key={c.href} c={c} imgH="h-[150px]" sizes="(min-width:1024px) 20vw, 50vw" />)}
          </div>
        </Section>

        {/* 14. SERVICE AREAS (homepage layout: map + live suburb check) */}
        <Section id="service-areas">
          <p className={eyebrow}>Where We Work</p>
          <h2 className={`${h2} mb-3`}>Which Melbourne Suburbs Do We Repair Leaking Showers In?</h2>
          <p className="mb-8 text-[17px] leading-relaxed text-slate-600">
            Coverage can vary by suburb, so confirm your area before booking. Outside these suburbs?{" "}
            <Link href="/locations" className={inlineLink}>View our locations</Link> or check your area below.
          </p>
          <HomeAreasV2 />
        </Section>

        {/* 15. FAQ (FAQPage schema is added by the route, as before) */}
        <Section id="faq" alt>
          <SectionHead title="Frequently Asked Questions" />
          <FaqList items={LEAKING_SHOWER_FAQS} />
          <div className="mt-7 text-center">
            <Link href="/contact" className={btnNavy}>Still Have Questions? Get a Free Quote</Link>
          </div>
        </Section>

        {/* 16. FINAL CTA */}
        <FinalCta
          title="Get Your Free Quote Today"
          lines={["Honest advice and workmanship you can rely on.", "Find the source · Tiles stay in place where sound · 10-year waterproof warranty"]}
        />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
