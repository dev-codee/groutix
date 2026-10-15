"use client";

// Redesigned /shower-regrouting page. The copy, links and FAQ schema are exactly the
// same as components/ShowerRegroutingPage.tsx (kept for a one-line rollback);
// only the layout and styling follow the new homepage.

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Check, Droplets, Grid2x2, Home, Phone, Users, Waves, Wrench, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import { faqJsonLd } from "@/lib/seo";
import type { Review } from "@/lib/reviews";
import {
  BeforeAfter, FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead, ServiceHero, SuburbCheck,
  box, btnGhost, btnGold, btnNavy, cardText, cardTitle, h2, inlineLink, lead, wrap, eyebrow,
} from "@/components/v2/ui";

/* ───────────── Content (unchanged from the live page) ───────────── */
const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";

const warningSigns: Array<{ Icon: ComponentType<{ className?: string }>; title: string; text: string }> = [
  { Icon: Zap, title: "Cracked or Crumbling Grout", text: "Grout that is cracked or crumbles when you touch it" },
  { Icon: Grid2x2, title: "Dark Grout After Cleaning", text: "Grout that stays dark even after cleaning" },
  { Icon: Droplets, title: "Returning Mould", text: "Mould that comes back weeks after you scrub it" },
  { Icon: Wrench, title: "Tired Silicone", text: "Silicone that has peeled, yellowed or turned soft" },
  { Icon: Home, title: "Damp Patch Nearby", text: "A damp patch on a wall or ceiling near the bathroom" },
  { Icon: Waves, title: "Pooling Water", text: "Water that pools on the shower floor after you turn it off" },
];

const comparisonRows: Array<[string, string, string]> = [
  ["Water resistance", "Porous, absorbs water over time", "Non porous, built for wet areas"],
  ["Mould resistance", "Weaker, mould can grow in the pores", "Stronger, nothing to hold moisture"],
  ["Flexibility", "Can crack with movement", "Handles movement better"],
  ["Best for", "Dry areas like splashbacks", "Showers and wet areas"],
];

const fixOptions = [
  { pill: "Regrout", pillClass: "bg-[#EEF3FF] text-[#001F97]", title: "Tiles solid, membrane intact", text: "The problem sits in the grout or silicone. This covers most jobs we see." },
  { pill: "Retile", pillClass: "bg-[#E8EDFE] text-[#2F63CC]", title: "Cracked, chipped or hollow tiles", text: "Individual tiles are cracked, chipped or sound hollow when tapped. A hollow sound can mean the tile has come loose." },
  { pill: "Rebuild", pillClass: "bg-[#FFF4D1] text-[#7A5600]", title: "Failed waterproof membrane", text: "Water has been getting through. Regrouting cannot fix that. It only delays the problem." },
];

const processSteps = [
  { title: "Assess the Shower", text: "We inspect the grout, silicone and surrounding tiles before recommending any work." },
  { title: "Remove and Prepare", text: "Damaged grout and old silicone are fully removed and the area is prepared. The amount of work depends on what we find." },
  { title: "Regrout and Finish", text: "New grout and sealant are applied and finished so the surface is sealed properly again." },
  { title: "Cure and Warranty", text: "Your shower is ready to use once the grout and silicone have cured." },
];

const priceFactors = [
  { title: "Shower Size", text: "More grout lines mean more labour." },
  { title: "Tile Size", text: "Mosaic tiles have far more grout lines than large tiles." },
  { title: "Condition", text: "Heavy mould or crumbling grout needs more preparation." },
  { title: "Grout Type", text: "Epoxy costs more upfront than cement." },
];

const included = [
  "On site inspection",
  "Full removal of old grout",
  "Waterproof epoxy application",
  "Silicone resealing at corners and joints",
  "Written warranty",
  "No tile removal for a standard regrout",
  "Clear quote before work starts",
];

const diyMistakes = [
  { title: "Old Grout Left Behind", text: "Old grout is left in the joint, so mould grows back through the new grout." },
  { title: "Wrong Grout Type", text: "Cement grout is used in a shower, where it was never meant to last." },
  { title: "Used Too Soon", text: "The shower is used again before the grout and silicone have cured." },
];

/* Captions stay empty until real suburb + problem captions are supplied. */
const beforeAfterPhotos = [
  { src: "/img12.jpeg", caption: "" },
  { src: "/img13.jpeg", caption: "" },
  { src: "/img14.jpeg", caption: "" },
  { src: "/img15.jpeg", caption: "" },
];

const relatedProblems = [
  { label: "Leaking shower or damp walls", href: "/leaking-shower-repair", link: "Leaking Shower Repair" },
  { label: "Peeling or mouldy silicone", href: "/silicone-recaulking", link: "Silicone and Recaulking" },
  { label: "Balcony leaks", href: "/balcony-leak-repairs", link: "Balcony Leak Repairs and Regrouting" },
  { label: "Bathrooms, kitchens, laundries", href: "/tile-regrouting", link: "Tile Regrouting" },
];

const innerSuburbs = [
  "South Yarra", "Toorak", "Malvern", "Armadale", "Prahran", "Hawthorn", "Camberwell",
  "Brighton", "St Kilda", "Richmond", "Albert Park", "Windsor", "Elwood", "Port Melbourne",
];
const regionalSuburbs = ["Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"];

const faqs: Array<{ q: string; a: ReactNode; plain: string }> = [
  { q: "What is shower regrouting?", a: "Removing old, damaged grout and replacing it with new grout. Your tiles stay in place.", plain: "Removing old, damaged grout and replacing it with new grout. Your tiles stay in place." },
  { q: "How much does shower regrouting cost in Melbourne?", a: "Most standard single showers cost about $550 to $1,500. Shower size, tile type, condition and grout type change the price. We quote after we see it.", plain: "Most standard single showers cost about $550 to $1,500. Shower size, tile type, condition and grout type change the price. We quote after we see it." },
  { q: "How long does shower regrouting last?", a: "Done properly, it holds up for years of daily use. Epoxy generally outlasts cement in a wet area. That is why complete jobs carry a 10 year warranty.", plain: "Done properly, it holds up for years of daily use. Epoxy generally outlasts cement in a wet area. That is why complete jobs carry a 10 year warranty." },
  { q: "How often should I regrout my shower?", a: "There is no fixed date. Regrout when you see cracking, staining or returning mould.", plain: "There is no fixed date. Regrout when you see cracking, staining or returning mould." },
  { q: "What causes shower grout to fail?", a: "Age, movement and constant water. Melbourne’s changing weather adds strain, especially on cement grout.", plain: "Age, movement and constant water. Melbourne’s changing weather adds strain, especially on cement grout." },
  { q: "Do I need to remove my tiles to regrout a shower?", a: "No, in most cases. Only the old grout is removed. Tile work is needed only if tiles are cracked or loose.", plain: "No, in most cases. Only the old grout is removed. Tile work is needed only if tiles are cracked or loose." },
  {
    q: "Will regrouting fix a leaking shower?",
    a: <>If the leak comes from failed grout or silicone, yes. If the membrane has failed, it needs more. See <Link className={inlineLink} href="/leaking-shower-repair">leaking shower repair</Link>.</>,
    plain: "If the leak comes from failed grout or silicone, yes. If the membrane has failed, it needs more. See leaking shower repair.",
  },
  { q: "Can regrouting work on an old bathroom?", a: "Yes, if the tiles and waterproof membrane are sound.", plain: "Yes, if the tiles and waterproof membrane are sound." },
  { q: "Is DIY regrouting worth it?", a: "It can work for small jobs. Most fail because old grout is not fully removed or the shower is used too early.", plain: "It can work for small jobs. Most fail because old grout is not fully removed or the shower is used too early." },
  { q: "How do I fix shower grout mould?", a: "Surface mould can often be cleaned. Mould that keeps returning usually means the grout has failed and needs replacing.", plain: "Surface mould can often be cleaned. Mould that keeps returning usually means the grout has failed and needs replacing." },
  { q: "Can you match my existing grout colour?", a: "Epoxy grout comes in many colours, so a close match is usually possible.", plain: "Epoxy grout comes in many colours, so a close match is usually possible." },
];

/* ───────────── Small pieces ───────────── */
const card = `${box} p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`;

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${box} border-l-4 border-l-[#FBBC04] p-6`}>
      <h3 className={cardTitle}>{title}</h3>
      <p className={cardText}>{children}</p>
    </div>
  );
}

/* ───────────── Page ───────────── */
export default function ShowerRegroutingPageV2({ reviews }: { reviews: Review[] }) {
  const { phone, tel, email, mailto } = useContact();

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        {/* 1. HERO */}
        <ServiceHero title="Shower Regrouting Melbourne">
          <p>Groutix removes failed shower grout and rebuilds it with waterproof epoxy. Your tiles stay in place. Every complete shower regrout comes with a 10 year waterproof warranty.</p>
        </ServiceHero>

        {/* 2. SIGNS */}
        <Section id="signs">
          <SectionHead k="Signs To Check" title="Does Your Shower Need Regrouting?">
            <p className={lead}>Check your shower for these signs. If you spot two or more, get it looked at soon.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {warningSigns.map(({ Icon, title, text }) => (
              <div key={title} className={`${card} flex items-start gap-4`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2F63CC]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span>
                  <h3 className={cardTitle}>{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                </span>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl md:text-center`}>
            One sign is worth a look. Several together can mean water has moved past the grout. If you notice damp walls or ceiling stains, see our{" "}
            <Link className={inlineLink} href="/leaking-shower-repair">leaking shower repair</Link> page.
          </p>
        </Section>

        {/* 3. WHY GROUT FAILS */}
        <Section id="why-grout-fails" alt>
          <SectionHead k="Why Grout Fails" title="What Causes Shower Grout to Fail in Melbourne Homes?">
            <p className={lead}>Grout is not decoration. It works with the waterproof membrane under your tiles to keep water where it belongs.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className={card}>
              <h3 className={cardTitle}>Melbourne’s Weather</h3>
              <p className={cardText}>Warm days and cold nights make tiles move slightly. Cement grout cannot flex with that movement for long. It cracks, and water gets in.</p>
            </div>
            <div className={card}>
              <h3 className={cardTitle}>Older Bathrooms</h3>
              <p className={cardText}>Many homes in suburbs like Malvern, Toorak and Camberwell have bathrooms that are decades old.</p>
            </div>
            <div className={card}>
              <h3 className={cardTitle}>Wet Area Standards</h3>
              <p className={cardText}>Some were built before Australian Standard AS 3740 tightened the rules for wet area waterproofing. In those showers, the grout and silicone do more of the work than they should.</p>
            </div>
          </div>
        </Section>

        {/* 4. EPOXY VS CEMENT */}
        <Section id="epoxy-vs-cement">
          <SectionHead k="Choosing Grout" title="Epoxy Grout vs Cement Grout">
            <p className={lead}>Most showers use one of two grout types. The difference matters.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1000px]">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[560px] border-collapse text-[15px]" aria-label="Epoxy grout and cement grout comparison">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="px-5 py-4 font-medium text-slate-500"><span className="sr-only">Feature</span></th>
                    <th scope="col" className="px-5 py-4 font-bold text-slate-900">Cement grout</th>
                    <th scope="col" className="bg-[#001F97] px-5 py-4 font-bold text-white">Epoxy grout</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([label, cement, epoxy]) => (
                    <tr key={label} className="border-t border-slate-200">
                      <th scope="row" className="px-5 py-4 text-left font-bold text-slate-900">{label}</th>
                      <td className="px-5 py-4 text-slate-600">{cement}</td>
                      <td className="bg-[#EEF3FF] px-5 py-4 font-bold text-[#001F97]">{epoxy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 space-y-3 md:text-center">
              <p className="text-[17px] leading-relaxed text-slate-600">Cement grout soaks up water, soap and dirt. Mould then grows in those pores, even when you clean often.</p>
              <p className="text-[17px] leading-relaxed text-slate-600">
                Epoxy grout is a resin. It does not absorb water. It costs more to install and takes more skill to apply, but it is made for constant moisture.{" "}
                <Link className={inlineLink} href="/epoxy-grout">Learn more on our epoxy grout page.</Link>
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Callout title="Why a Rushed Cement Regrout Fails Again">
                Cement grout works well in dry spots. It was never built for daily water contact. A quick cement regrout in a shower often looks fine for a while, then cracks and discolours again.
              </Callout>
              <Callout title="Why Isn’t Epoxy Used More Often?">
                Epoxy is harder to apply and sets faster, so it needs more experience to finish cleanly. Some tradespeople stay with cement because it is quicker for them, not because it suits your shower.
              </Callout>
            </div>
          </div>
        </Section>

        {/* 5. OLD BATHROOMS */}
        <Section id="old-bathrooms" alt>
          <SectionHead k="Older Homes" title="Can You Regrout an Old or Original Bathroom?" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { t: "Yes, in Most Cases", d: "Age alone does not rule it out. The condition underneath matters.", c: "border-t-[#001F97]" },
              { t: "Tiles Stay, Grout Goes", d: "If your tiles are solid and the membrane has not failed, regrouting works on a bathroom from any decade. The tiles stay. Only the grout and silicone are replaced.", c: "border-t-[#2F63CC]" },
              { t: "We Check First", d: "If the membrane has failed, regrouting will not fix that for long. We check before we quote.", c: "border-t-[#FBBC04]" },
            ].map((x) => (
              <div key={x.t} className={`${card} border-t-4 ${x.c}`}>
                <h3 className={cardTitle}>{x.t}</h3>
                <p className={cardText}>{x.d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. REGROUT, RETILE OR REBUILD */}
        <Section id="regrout-retile-rebuild">
          <SectionHead k="Honest Advice" title="Regrout, Retile or Rebuild?">
            <p className={lead}>Not every shower needs the same fix. A good tradesperson tells you the truth, not the biggest job.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {fixOptions.map((o) => (
              <div key={o.pill} className={`${card} flex flex-col gap-2`}>
                <span className={`w-fit rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${o.pillClass}`}>{o.pill}</span>
                <h3 className={cardTitle}>{o.title}</h3>
                <p className="text-base leading-relaxed text-slate-600">{o.text}</p>
                {o.pill === "Retile" && <Link href="/small-tiling-jobs/" className="mt-auto pt-2 text-[15px] font-bold text-[#2F63CC] hover:underline">Explore small tiling jobs →</Link>}
              </div>
            ))}
          </div>
          <div className="mt-7 md:text-center">
            <Link href="/leaking-shower-repair" className="text-[15px] font-bold text-[#2F63CC] hover:underline">Read about leaking shower repair →</Link>
          </div>
        </Section>

        {/* 7. PROCESS */}
        <section id="process" className="scroll-mt-28 bg-slate-100 py-14 md:py-20">
          <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14`}>
            <div>
              <p className={eyebrow}>Our Process</p>
              <h2 className={h2}>Our Regrouting Process</h2>
              <p className={lead}>Every job starts with understanding what’s actually happening, not a quick surface fix. The exact work can vary depending on the condition of your shower.</p>
              <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {processSteps.map((s, i) => (
                  <li key={s.title} className={`${box} p-5`}>
                    <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.text}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-l-[3px] border-[#FBBC04] pl-3 font-semibold text-slate-700">Eligible complete shower regrouting work is backed by a 10-year waterproof warranty.</p>
              <Link href="/contact" className={`${btnNavy} mt-6`}>Book Your Free Quote</Link>
            </div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
              <Image src="/img42.jpeg" alt="Groutix technician regrouting a shower" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </section>

        {/* 8. COST */}
        <Section id="cost">
          <SectionHead k="Pricing" title="What Does Shower Regrouting Cost in Melbourne?">
            <p className={lead}>This is the question we get asked most.</p>
            <p className={lead}>A standard single shower regrout and reseal in Melbourne typically costs about $550 to $1,500. Simple jobs with little damage sit near the low end. Larger showers, mosaic tiles, heavy mould and epoxy grout sit near the high end. The final price depends on your shower, so we quote after we see it.</p>
          </SectionHead>
          <div className="mx-auto max-w-[1000px]">
            <div className="flex flex-col items-start gap-6 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <div>
                <p className="text-xs font-bold uppercase tracking-[2px] text-[#FBBC04]">Typical Melbourne range</p>
                <p className="mt-1 text-[clamp(30px,4vw,42px)] font-black leading-tight tabular-nums">$550 to $1,500</p>
                <p className="mt-1 text-[#D6DCF5]">For a standard single shower. We quote after we see it.</p>
              </div>
              <Link href="/contact" className={`${btnGold} shrink-0`}>Get a Free Quote</Link>
            </div>
            <h3 className="mb-5 mt-10 text-xl font-bold text-slate-900 md:text-center lg:text-2xl">What Changes the Price</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {priceFactors.map((f) => (
                <div key={f.title} className={`${box} border-t-4 border-t-[#001F97] p-6`}>
                  <h4 className={cardTitle}>{f.title}</h4>
                  <p className={cardText}>{f.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Callout title="Regrouting vs a Full Bathroom Rebuild">
                Regrouting early is usually far cheaper than waiting for water damage. A failed membrane can turn a small job into a full shower rebuild, which can run into the thousands of dollars.
              </Callout>
            </div>
          </div>
        </Section>

        {/* 9. INCLUDED */}
        <Section id="included" alt>
          <SectionHead k="Included" title="What’s Included in Every Groutix Regrout" />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <li key={item} className={`${box} flex items-center gap-3 p-5`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBBC04] text-[#0F172A]"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                <span className="text-base font-bold leading-snug text-slate-900">{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 10. DIY */}
        <Section id="diy">
          <SectionHead k="DIY" title="Is DIY Shower Regrouting Worth It?">
            <p className={lead}>DIY can work for a small job with no deeper damage. Most DIY jobs fail for the same reasons:</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {diyMistakes.map((m, i) => (
              <div key={m.title} className={card}>
                <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className={`${cardTitle} mt-2`}>{m.title}</h3>
                <p className={cardText}>{m.text}</p>
              </div>
            ))}
          </div>
          <p className={`${lead} mx-auto mt-8 max-w-3xl md:text-center`}>
            If you see damage past the grout, such as a stain on a ceiling below, get a professional to check first. Regrouting over a hidden leak only hides it for a while.
          </p>
        </Section>

        {/* 11. BEFORE & AFTER */}
        <Section id="before-after" alt>
          <SectionHead k="Real Work" title="Before and After: Real Regrouting Results">
            <p className={lead}>Real jobs completed across Melbourne homes, not stock photos.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {beforeAfterPhotos.map((p, i) => <BeforeAfter key={p.src} src={p.src} title={p.caption} alt={p.caption || `Shower regrouting result ${i + 1}`} />)}
          </div>
        </Section>

        {/* 12. REVIEWS */}
        <Section id="reviews">
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} />
          <div className="mt-6 text-center">
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">
              Read More Verified Reviews on Google <span className="font-extrabold text-[#FBBC04]">→</span>
            </a>
          </div>
          <div className={`${box} mt-8 flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center`}>
            <div>
              <h3 className={cardTitle}>Have a shower or grout problem that needs attention?</h3>
              <p className="mt-1 text-base text-slate-600">Tell us what’s happening and we’ll help you understand the right next step.</p>
            </div>
            <Link href="/contact" className={`${btnNavy} shrink-0`}>Get a Quote</Link>
          </div>
        </Section>

        {/* 13. TEAM */}
        <Section id="team" alt>
          <SectionHead k="The People Behind The Work" title="Meet the Groutix Team">
            <p className={lead}>The same small team handles your job from inspection through to the finished work. Here’s who you’ll actually deal with.</p>
          </SectionHead>
          <div className="flex flex-col items-center gap-6">
            <div className={`${box} flex items-center gap-5 px-7 py-6`}>
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[#001F97]"><Users className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="text-xl font-bold text-slate-900">Johnny</h3>
            </div>
            <Link href="/contact" className={btnNavy}>Talk to Our Team</Link>
          </div>
        </Section>

        {/* 14. PROPERTY MANAGERS */}
        <section id="property" className="scroll-mt-28 bg-[#001F97] py-14 text-white md:py-[72px]">
          <div className={`${wrap} grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12`}>
            <div>
              <p className={`${eyebrow} text-[#FBBC04]`}>For Property Professionals</p>
              <h2 className={`${h2} text-white`}>Landlords, Agents and Property Managers</h2>
              <p className="mt-3.5 max-w-[760px] text-[17px] text-[#D6DCF5]">
                Homeowners call us when a shower starts to fail. Landlords and property managers call us before a new tenant moves in. Agents call us before a sale, because buyers notice mouldy grout fast.
              </p>
              <p className="mt-4 flex items-start gap-3 text-lg font-bold">
                <Home className="mt-1 h-5 w-5 shrink-0 text-[#FBBC04]" aria-hidden="true" />
                Most jobs are completed in a single visit, scheduled around tenants.
              </p>
            </div>
            <Link href="/real-estate-property-services" className={`${btnGold} shrink-0`}>Discuss a Property Job</Link>
          </div>
        </section>

        {/* 15. RELATED PROBLEMS */}
        <Section id="related">
          <SectionHead k="Related Services" title="Related Problems" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProblems.map((r) => (
              <Link key={r.href} href={r.href} className={`${card} group flex flex-col text-slate-900`}>
                <h3 className={cardTitle}>{r.label}</h3>
                <span className="mt-auto border-t border-slate-200 pt-4 text-sm font-bold text-[#2F63CC] group-hover:underline">{r.link} →</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* 16. SERVICE AREAS */}
        <Section id="service-areas" alt>
          <h2 className={`${h2} mb-4`}>Which Melbourne Suburbs Do We Regrout?</h2>
          <p className="mb-8 max-w-[900px] text-[17px] leading-relaxed text-slate-600">
            We regrout showers across inner and bayside Melbourne, including South Yarra, Toorak, Malvern, Armadale, Prahran, Hawthorn, Camberwell, Brighton, St Kilda, Richmond, Albert Park, Windsor, Elwood and Port Melbourne. We also service Geelong, Ballarat, Frankston, Lilydale, Yarra Glen and Kilmore. Not sure about your suburb? Use the suburb checker or see our{" "}
            <Link className={inlineLink} href="/locations">locations page</Link>.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-3 text-lg font-bold text-slate-900">Inner &amp; Bayside Melbourne</h3>
                <div className="flex flex-wrap gap-2.5">
                  {innerSuburbs.map((s) => <span key={s} className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-[15px] font-medium text-slate-900">{s}</span>)}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-lg font-bold text-slate-900">Also Servicing</h3>
                <div className="flex flex-wrap gap-2.5">
                  {regionalSuburbs.map((s) => <span key={s} className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-[15px] font-medium text-slate-900">{s}</span>)}
                </div>
              </div>
            </div>
            <div className="lg:pt-9">
              <SuburbCheck
                title="Check If We Service Your Suburb"
                text="Not listed above, or not sure? Enter your suburb or postcode and we’ll confirm coverage."
              />
            </div>
          </div>
        </Section>

        {/* 17. FAQ */}
        <Section id="faq">
          <SectionHead title="Frequently Asked Questions" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.plain })))) }} />
          <FaqList items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
          <div className="mt-7 text-center">
            <Link href="/contact" className={btnNavy}>Still Have Questions? Get a Free Quote</Link>
          </div>
        </Section>

        {/* 18. FINAL CTA */}
        <section className="bg-white pb-14 md:pb-20">
          <div className={wrap}>
            <div className="grid grid-cols-1 items-center gap-7 rounded-xl bg-[linear-gradient(120deg,#06124F_0%,#001F97_100%)] p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
              <div>
                <h2 className={`${h2} text-white`}>Get Your Free Quote Today</h2>
                <p className="mt-3 text-[#D6DCF5]">
                  Call <a href={tel} className="font-bold text-white underline">{phone}</a>, email <a href={mailto} className="font-bold text-white underline">{email}</a>, or request a quote online.
                </p>
                <p className="mt-2 text-[#D6DCF5]/80">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p>
                <p className="mt-2 text-[#D6DCF5]">Honest advice and workmanship you can rely on.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className={`${btnGold} min-h-[54px] w-full sm:w-auto`}>Request A Quote</Link>
                <a href={tel} className={`${btnGhost} min-h-[54px] w-full sm:w-auto`}><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
