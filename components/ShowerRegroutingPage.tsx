"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronUp, Phone, ShieldCheck, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import TrustedMarquee from "@/components/TrustedMarquee";

const phone = "+61 3 7023 8094";
const tel = "tel:+61370238094";

const warningSigns = [
  "Grout that is cracked or crumbles when you touch it",
  "Grout that stays dark even after cleaning",
  "Mould that comes back weeks after you scrub it",
  "Silicone that has peeled, yellowed or turned soft",
  "A damp patch on a wall or ceiling near the bathroom",
  "Water that pools on the shower floor after you turn it off",
];

const priceFactors = [
  "Shower size: more grout lines mean more labour.",
  "Tile size: mosaic tiles have far more grout lines than large tiles.",
  "Condition: heavy mould or crumbling grout needs more preparation.",
  "Grout type: epoxy costs more upfront than cement.",
];

const faqs: Array<[string, ReactNode]> = [
  ["What is shower regrouting?", "Removing old, damaged grout and replacing it with new grout. Your tiles stay in place."],
  ["How much does shower regrouting cost in Melbourne?", "Most standard single showers cost about $550 to $1,500. Shower size, tile type, condition and grout type change the price. We quote after we see it."],
  ["How long does shower regrouting last?", "Done properly, it holds up for years of daily use. Epoxy generally outlasts cement in a wet area. That is why complete jobs carry a 10 year warranty."],
  ["How often should I regrout my shower?", "There is no fixed date. Regrout when you see cracking, staining or returning mould."],
  ["What causes shower grout to fail?", "Age, movement and constant water. Melbourne’s changing weather adds strain, especially on cement grout."],
  ["Do I need to remove my tiles to regrout a shower?", "No, in most cases. Only the old grout is removed. Tile work is needed only if tiles are cracked or loose."],
  ["Will regrouting fix a leaking shower?", <>If the leak comes from failed grout or silicone, yes. If the membrane has failed, it needs more. See <Link className="text-accent underline" href="/leaking-shower-repair">leaking shower repair</Link>.</>],
  ["Can regrouting work on an old bathroom?", "Yes, if the tiles and waterproof membrane are sound."],
  ["Is DIY regrouting worth it?", "It can work for small jobs. Most fail because old grout is not fully removed or the shower is used too early."],
  ["How do I fix shower grout mould?", "Surface mould can often be cleaned. Mould that keeps returning usually means the grout has failed and needs replacing."],
  ["Can you match my existing grout colour?", "Epoxy grout comes in many colours, so a close match is usually possible."],
];

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`px-6 py-16 text-center lg:px-10 lg:py-24 ${className}`}><div className="mx-auto max-w-[1100px]">{children}</div></section>;
}

function Heading({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-3"><>{eyebrow && <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}</><h2 className="text-3xl font-bold leading-tight text-primary lg:text-[42px]">{children}</h2></div>;
}

function GoogleIcon({ className = "h-7 w-7" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>;
}

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="border-b border-neutral-200">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-bold text-neutral-900">
      <span>{question}</span>{open ? <ChevronUp className="h-5 w-5 flex-shrink-0 text-accent" /> : <ChevronDown className="h-5 w-5 flex-shrink-0 text-neutral-400" />}
    </button>
    {open && <div className="pb-5 leading-relaxed text-neutral-600">{answer}</div>}
  </div>;
}

function WireframeStyles() {
  return <style jsx global>{`
    .shower-wireframe section:not(.shower-hero) > div > .max-w-2xl,
    .shower-wireframe section:not(.shower-hero) > div > .max-w-3xl,
    .shower-wireframe section:not(.shower-hero) > div > .max-w-4xl {
      margin-left: auto;
      margin-right: auto;
    }
    .shower-wireframe .wire-card {
      border: 1px solid #dbe3f1;
      border-radius: 0.65rem;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 31, 151, 0.06);
      text-align: left;
    }
    .shower-wireframe .wire-card-accent {
      border-left: 3px solid #f5a623;
    }
    .shower-wireframe section:not(.shower-hero) .grid > div {
      border-color: #dbe3f1;
      border-radius: 0.65rem;
    }
    .shower-wireframe .wire-button {
      background: #001f97;
      color: #fff;
      border-radius: 0.35rem;
      font-weight: 800;
    }
    .shower-wireframe .wire-button:hover {
      background: #2f63cc;
    }
  `}</style>;
}

function SimpleSuburbChecker() {
  const [suburb, setSuburb] = useState("");
  const [message, setMessage] = useState("");
  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!suburb.trim()) return;
    setMessage("Checking your suburb…");
    try {
      const response = await fetch(`/api/suburb-check?q=${encodeURIComponent(suburb.trim())}`);
      const result = await response.json();
      setMessage(result.message || (result.inServiceArea ? "Yes, we service your area." : "Please contact us and we’ll confirm your location."));
    } catch {
      setMessage("We couldn’t check that suburb right now. Please call us and we’ll confirm it.");
    }
  };
  return <form onSubmit={check} className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
    <input value={suburb} onChange={(event) => setSuburb(event.target.value)} placeholder="Suburb or postcode" className="min-h-12 flex-1 rounded-sm border border-neutral-200 px-4 text-neutral-900 outline-none focus:border-accent" aria-label="Suburb or postcode" />
    <button className="rounded-sm bg-primary px-6 py-3 font-bold text-white transition hover:bg-accent">Check My Suburb</button>
    {message && <p className="sm:col-span-2 text-sm text-neutral-600">{message}</p>}
  </form>;
}

export default function ShowerRegroutingPage() {
  return <><Navbar /><main className="shower-wireframe pt-[88px] lg:pt-[105px]"><WireframeStyles />
    <section className="bg-[#0D1030] text-white">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-6 py-12 text-center lg:grid-cols-2 lg:px-10 lg:py-16">
        <div className="space-y-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F5A623]">Shower Regrouting</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-[56px]">Shower Regrouting Melbourne</h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/80">Groutix removes failed shower grout and rebuilds it with waterproof epoxy. Your tiles stay in place. Every complete shower regrout comes with a 10 year waterproof warranty.</p>
          <a href="https://www.google.com/maps/place/Groutix" target="_blank" rel="noreferrer" className="mx-auto flex w-fit items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-left text-white backdrop-blur-sm transition hover:bg-white/15">
            <GoogleIcon />
            <span><span className="flex items-center gap-2 text-lg font-extrabold"><span>5.0</span><span className="text-[#F5A623]">★★★★★</span></span><span className="block text-sm text-white/80">290+ Google Reviews</span></span>
          </a>
          <a href={tel} className="mx-auto flex w-full max-w-[520px] items-center justify-center gap-2 rounded-xl border-2 border-white/70 px-5 py-4 text-lg font-bold hover:border-[#F5A623] hover:text-[#F5A623]"><Phone className="h-5 w-5" />{phone}</a>
        </div>
        <div className="w-full rounded-sm bg-white p-4 text-left text-neutral-900 shadow-2xl sm:p-6"><HeroQuoteForm /></div>
      </div>
    </section>

    <TrustedMarquee />

    <Section className="bg-white">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["8,000+", "Bathrooms Restored", "Across Melbourne and regional Victoria"],
          ["5.0/5", "Google Rating", "Based on 290+ Google reviews"],
          ["10 Year", "Waterproof Warranty", "On every complete shower regrout"],
        ].map(([value, label, sub]) => <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center"><ShieldCheck className="mx-auto mb-4 h-8 w-8 text-secondary" /><p className="text-4xl font-black text-neutral-900">{value}</p><p className="mt-2 font-bold text-neutral-900">{label}</p><p className="mt-1 text-sm text-neutral-500">{sub}</p></div>)}
      </div>
    </Section>

    <Section className="bg-white">
      <Heading>Does Your Shower Need Regrouting?</Heading>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">Check your shower for these signs. If you spot two or more, get it looked at soon.</p>
      <div className="mt-8 grid gap-4 text-left md:grid-cols-3">{warningSigns.map((sign, index) => <div key={sign} className="wire-card p-5"><div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2fa] text-primary"><Check className="h-4 w-4" /></div><h3 className="font-bold text-primary">{["Cracked or Crumbling Grout", "Dark Grout After Cleaning", "Returning Mould", "Tired Silicone", "Damp Patch Nearby", "Pooling Water"][index]}</h3><p className="mt-2 text-sm leading-relaxed text-neutral-600">{sign}</p></div>)}</div>
      <p className="mt-8 max-w-3xl leading-relaxed text-neutral-600">One sign is worth a look. Several together can mean water has moved past the grout. If you notice damp walls or ceiling stains, see our <Link className="font-bold text-accent underline" href="/leaking-shower-repair">leaking shower repair</Link> page.</p>
    </Section>

    <Section className="bg-[#eef2fa]"><Heading>What Causes Shower Grout to Fail in Melbourne Homes?</Heading><p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">Grout is not decoration. It works with the waterproof membrane under your tiles to keep water where it belongs.</p><div className="mt-8 grid gap-4 text-left md:grid-cols-3"><div className="wire-card p-5"><h3 className="font-bold text-primary">Melbourne’s Weather</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">Warm days and cold nights make tiles move slightly. Cement grout cannot flex with that movement for long. It cracks, and water gets in.</p></div><div className="wire-card p-5"><h3 className="font-bold text-primary">Older Bathrooms</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">Many homes in suburbs like Malvern, Toorak and Camberwell have bathrooms that are decades old, where grout and silicone do more of the work than they should.</p></div><div className="wire-card p-5"><h3 className="font-bold text-primary">Wet Area Standards</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">Some older showers were built before Australian Standard AS 3740 tightened the rules for wet area waterproofing.</p></div></div></Section>

    <Section className="bg-white"><Heading>Epoxy Grout vs Cement Grout</Heading><p className="mt-4 text-lg text-neutral-600">Most showers use one of two grout types. The difference matters.</p><div className="mt-8 overflow-x-auto rounded-sm border border-neutral-200 bg-white"><table className="w-full min-w-[640px] text-left"><thead className="bg-primary text-white"><tr><th className="p-4"> </th><th className="p-4">Cement grout</th><th className="p-4">Epoxy grout</th></tr></thead><tbody>{[["Water resistance","Porous, absorbs water over time","Non porous, built for wet areas"],["Mould resistance","Weaker, mould can grow in the pores","Stronger, nothing to hold moisture"],["Flexibility","Can crack with movement","Handles movement better"],["Best for","Dry areas like splashbacks","Showers and wet areas"]].map((row) => <tr key={row[0]} className="border-t border-neutral-200"><th className="p-4 font-bold text-neutral-900">{row[0]}</th><td className="p-4 text-neutral-600">{row[1]}</td><td className="p-4 font-semibold text-neutral-900">{row[2]}</td></tr>)}</tbody></table></div><div className="mt-8 max-w-4xl space-y-4 leading-relaxed text-neutral-600"><p>Cement grout soaks up water, soap and dirt. Mould then grows in those pores, even when you clean often.</p><p>Epoxy grout is a resin. It does not absorb water. It costs more to install and takes more skill to apply, but it is made for constant moisture. <Link className="font-bold text-accent underline" href="/epoxy-grout">Learn more on our epoxy grout page.</Link></p><h3 className="pt-4 text-xl font-bold text-neutral-900">Why a Rushed Cement Regrout Fails Again</h3><p>Cement grout works well in dry spots. It was never built for daily water contact. A quick cement regrout in a shower often looks fine for a while, then cracks and discolours again.</p><h3 className="pt-4 text-xl font-bold text-neutral-900">Why Isn’t Epoxy Used More Often?</h3><p>Epoxy is harder to apply and sets faster, so it needs more experience to finish cleanly. Some tradespeople stay with cement because it is quicker for them, not because it suits your shower.</p></div></Section>

    <Section className="bg-[#eef2fa]"><Heading>Can You Regrout an Old or Original Bathroom?</Heading><div className="mt-8 grid gap-4 text-left md:grid-cols-3"><div className="wire-card border-t-2 border-t-primary p-5"><h3 className="font-bold text-primary">Yes, in Most Cases</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">Age alone does not rule it out. The condition underneath matters.</p></div><div className="wire-card border-t-2 border-t-accent p-5"><h3 className="font-bold text-primary">Tiles Stay, Grout Goes</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">If your tiles are solid and the membrane has not failed, regrouting works on a bathroom from any decade.</p></div><div className="wire-card wire-card-accent p-5"><h3 className="font-bold text-primary">We Check First</h3><p className="mt-3 text-sm leading-relaxed text-neutral-600">If the membrane has failed, regrouting will not fix that for long. We check before we quote.</p></div></div></Section>

    <Section className="bg-white"><Heading>Regrout, Retile or Rebuild?</Heading><p className="mt-4 text-lg text-neutral-600">Not every shower needs the same fix. A good tradesperson tells you the truth, not the biggest job.</p><div className="mt-8 grid gap-5 md:grid-cols-3">{[["Regrout", "When tiles are solid and the membrane is intact. The problem sits in the grout or silicone. This covers most jobs we see."], ["Retile", "When individual tiles are cracked, chipped or sound hollow when tapped. A hollow sound can mean the tile has come loose."], ["Rebuild", "When the waterproof membrane has failed and water has been getting through. Regrouting cannot fix that."]].map(([title, text]) => <div key={title} className="rounded-sm border border-neutral-200 bg-white p-6"><h3 className="text-xl font-bold text-primary">{title}</h3><p className="mt-3 leading-relaxed text-neutral-600">{text}</p></div>)}</div><Link href="/leaking-shower-repair" className="mt-8 inline-block font-bold text-accent underline">Read about leaking shower repair</Link></Section>

    <Section className="bg-[#eef2fa]"><div className="grid items-center gap-10 text-left lg:grid-cols-2"><div><Heading>Our Regrouting Process</Heading><p className="mt-4 text-neutral-600">Every job starts with understanding what’s actually happening, not a quick surface fix.</p><div className="mt-8 space-y-5">{[["Assess the Shower", "We inspect the grout, silicone and surrounding tiles before recommending any work."], ["Remove and Prepare", "Damaged grout and old silicone are fully removed and the area is prepared."], ["Regrout and Finish", "New grout and sealant are applied and finished so the surface is sealed properly again."], ["Cure and Warranty", "Your shower is ready once materials have cured. Eligible complete work is backed by a 10-year waterproof warranty."]].map(([title, text], index) => <div key={title} className="flex gap-4"><span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-black text-white">{index + 1}</span><div><h3 className="font-bold text-primary">{title}</h3><p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p></div></div>)}</div><Link href="/contact" className="wire-button mt-8 inline-flex px-5 py-3">Book Your Free Quote</Link></div><div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-[#b9c7df] bg-[repeating-linear-gradient(45deg,#f7f9fd,#f7f9fd_10px,#edf1f8_10px,#edf1f8_20px)] text-center text-sm text-neutral-500">Real Groutix technician mid-job<br /><span className="text-xs text-[#b08a19]">PLACEHOLDER — PHOTO TO BE SUPPLIED</span></div></div></Section>

    <Section className="bg-white"><Heading>What Does Shower Regrouting Cost in Melbourne?</Heading><p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-600">This is the question we get asked most. A standard single shower regrout and reseal in Melbourne typically costs about $550 to $1,500. Simple jobs with little damage sit near the low end. Larger showers, mosaic tiles, heavy mould and epoxy grout sit near the high end. The final price depends on your shower, so we quote after we see it.</p><div className="my-8 max-w-xl rounded-sm bg-primary p-8 text-white"><p className="text-sm font-bold uppercase tracking-wider text-accent">Typical Melbourne range</p><p className="mt-2 text-4xl font-black">$550 to $1,500</p><p className="mt-2 text-white/70">For a standard single shower. We quote after we see it.</p></div><h3 className="text-xl font-bold text-neutral-900">What Changes the Price</h3><ul className="mt-4 grid gap-3 text-neutral-600 md:grid-cols-2">{priceFactors.map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-accent" />{item}</li>)}</ul><h3 className="mt-10 text-xl font-bold text-neutral-900">Regrouting vs a Full Bathroom Rebuild</h3><p className="mt-3 max-w-3xl leading-relaxed text-neutral-600">Regrouting early is usually far cheaper than waiting for water damage. A failed membrane can turn a small job into a full shower rebuild, which can run into the thousands of dollars.</p></Section>

    <Section className="bg-[#eef2fa]"><Heading>What’s Included in Every Groutix Regrout</Heading><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{["On site inspection", "Full removal of old grout", "Waterproof epoxy application", "Silicone resealing at corners and joints", "Written warranty", "No tile removal for a standard regrout", "Clear quote before work starts"].map((item) => <div key={item} className="flex gap-3 rounded-sm border border-neutral-200 p-4"><Check className="h-5 w-5 flex-shrink-0 text-accent" />{item}</div>)}</div></Section>

    <Section className="bg-neutral-50"><Heading>Is DIY Shower Regrouting Worth It?</Heading><p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-600">DIY can work for a small job with no deeper damage. Most DIY jobs fail for the same reasons:</p><ul className="mt-6 max-w-3xl space-y-3 text-neutral-600">{["Old grout is left in the joint, so mould grows back through the new grout.", "Cement grout is used in a shower, where it was never meant to last.", "The shower is used again before the grout and silicone have cured."].map((item) => <li key={item} className="flex gap-3"><Check className="h-5 w-5 flex-shrink-0 text-accent" />{item}</li>)}</ul><p className="mt-6 max-w-3xl leading-relaxed text-neutral-600">If you see damage past the grout, such as a stain on a ceiling below, get a professional to check first. Regrouting over a hidden leak only hides it for a while.</p></Section>

    <Section className="bg-[#eef2fa]"><p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Real Work</p><Heading>Before and After: Real Regrouting Results</Heading><p className="mt-4 text-neutral-600">Real jobs completed across Melbourne homes, not stock photos.</p><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">    {["/img12.jpeg", "/img13.jpeg", "/img14.jpeg", "/img15.jpeg"].map((src, index) => <figure key={src}><div className="relative aspect-[4/3] overflow-hidden rounded-sm"><Image src={src} alt={`Shower regrouting result ${index + 1}`} fill className="object-cover" /><span className="absolute left-2 top-2 bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Before</span><span className="absolute right-2 top-2 bg-primary/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">After</span></div><figcaption className="mt-2 text-sm text-neutral-500">Melbourne shower regrouting result</figcaption></figure>)}</div></Section>

    <Section className="bg-white"><Heading>What Our Customers Say</Heading><div className="mt-8 rounded-xl border border-neutral-200 bg-white p-8 text-center"><div className="flex justify-center gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-6 w-6 fill-amber-400 text-amber-400" />)}</div><p className="mt-3 text-xl font-bold text-neutral-900">5 star Customer Reviews</p><a href="https://www.google.com/maps/place/Groutix" target="_blank" rel="noreferrer" className="mt-2 inline-block font-bold text-accent underline">Read More Verified Reviews on Google</a></div></Section>

    <Section className="bg-[#eef2fa]"><Heading>Meet the Groutix Team</Heading><div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2"><div className="rounded-sm border border-dashed border-neutral-300 bg-neutral-50 p-10"><div className="aspect-square rounded-sm bg-neutral-100" /><h3 className="mt-4 text-xl font-bold text-neutral-900">Johnny</h3></div><div className="rounded-sm border border-dashed border-neutral-300 bg-neutral-50 p-10"><div className="aspect-square rounded-sm bg-neutral-100" /></div></div></Section>

    <Section className="bg-white"><Heading>Landlords, Agents and Property Managers</Heading><p className="mt-5 max-w-4xl text-lg leading-relaxed text-neutral-600">Homeowners call us when a shower starts to fail. Landlords and property managers call us before a new tenant moves in. Agents call us before a sale, because buyers notice mouldy grout fast. Most jobs are completed in a single visit, scheduled around tenants.</p><Link href="/real-estate-property-services" className="mt-8 inline-flex rounded-sm bg-primary px-6 py-3 font-bold text-white hover:bg-primary-hover">Discuss a Property Job</Link></Section>

    <Section className="bg-[#eef2fa]"><Heading>Related Problems</Heading><div className="mt-8 grid gap-3 md:grid-cols-2">{[["Leaking shower or damp walls", "/leaking-shower-repair", "Leaking Shower Repair"], ["Peeling or mouldy silicone", "/silicone-recaulking", "Silicone and Recaulking"], ["Balcony leaks", "/balcony-leak-repairs", "Balcony Leak Repairs and Regrouting"], ["Bathrooms, kitchens, laundries", "/tile-regrouting", "Tile Regrouting"]].map(([label, href, link]) => <Link key={href} href={href} className="rounded-sm border border-neutral-200 p-4 font-bold text-neutral-900 transition hover:border-accent hover:text-accent">{label} <span className="ml-2 text-accent">→ {link}</span></Link>)}</div></Section>

    <Section className="bg-white"><Heading>Which Melbourne Suburbs Do We Regrout?</Heading><p className="mt-5 max-w-4xl text-lg leading-relaxed text-neutral-600">We regrout showers across inner and bayside Melbourne, including South Yarra, Toorak, Malvern, Armadale, Prahran, Hawthorn, Camberwell, Brighton, St Kilda, Richmond, Albert Park, Windsor, Elwood and Port Melbourne. We also service Geelong, Ballarat, Frankston, Lilydale, Yarra Glen and Kilmore. Not sure about your suburb? Use the suburb checker or see our <Link className="font-bold text-accent underline" href="/locations">locations page</Link>.</p><SimpleSuburbChecker /></Section>

    <Section className="bg-[#eef2fa]"><Heading>Frequently Asked Questions</Heading><div className="mt-8 max-w-4xl">{faqs.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}</div><Link href="/contact" className="mt-8 inline-flex font-bold text-accent underline">Still Have Questions? Get a Free Quote</Link></Section>

    <section id="quote-form" className="bg-primary px-6 py-16 text-white lg:px-10 lg:py-20"><div className="mx-auto max-w-4xl text-center"><h2 className="text-3xl font-bold lg:text-5xl">Get Your Free Quote Today</h2><p className="mt-5 text-lg text-white/80">Call <a className="font-bold text-white underline" href={tel}>{phone}</a>, email <a className="font-bold text-white underline" href="mailto:info@groutix.com">info@groutix.com</a>, or request a quote online.</p><p className="mt-3 text-sm text-white/70">Open Mon to Sat 9:00 AM to 6:30 PM, Sun 11:00 AM to 10:00 PM.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/contact" className="rounded-sm bg-accent px-6 py-3 font-bold text-primary hover:bg-white">Request A Quote</Link><a href={tel} className="rounded-sm border border-white/30 px-6 py-3 font-bold hover:bg-white/10">{phone}</a></div></div></section>
  </main><Footer /></>;
}
