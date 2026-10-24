"use client";

// /about — who Groutix is, how we work, and why Melbourne homeowners trust us.
// Trust intent only: service detail lives on the service pages (linked, not repeated),
// so this page supports the site instead of competing with it.
// Colours, type and components follow the site's v2 system (navy #001F97, gold #FBBC04).

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, Droplets, Home, MapPin, Phone, SearchCheck, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContact } from "@/components/SiteContentProvider";
import { abs, faqJsonLd } from "@/lib/seo";
import type { Review, BusinessRating } from "@/lib/reviews";
import {
  FaqList, MobileCallBar, ReviewsMarquee, Section, SectionHead,
  box, btnNavy, cardText, cardTitle, eyebrow, h2, inlineLink, lead, wrap,
} from "@/components/v2/ui";

const googleReviewsUrl = "https://www.google.com/maps/place/Groutix";

const principles = [
  {
    Icon: Droplets,
    title: "Epoxy in Wet Areas, Always",
    text: "Cement grout absorbs water and grows mould in its pores. We rebuild shower and balcony joints with waterproof epoxy resin, made for constant moisture.",
  },
  {
    Icon: Home,
    title: "Your Tiles Stay in Place",
    text: "A standard regrout removes only the failed grout and silicone. No demolition, no retiling bill, and most bathrooms are back in use far sooner.",
  },
  {
    Icon: SearchCheck,
    title: "Honest Advice Before Any Quote",
    text: "If your waterproof membrane has failed, regrouting will not fix it — and we will tell you that upfront instead of selling you a job that cannot last.",
  },
  {
    Icon: ShieldCheck,
    title: "Written 10-Year Warranty",
    text: "Every complete shower regrout comes with a 10-year waterproof warranty in writing, so the promise is on paper, not just in a sales pitch.",
  },
  {
    Icon: Clock3,
    title: "Most Jobs Done in One Visit",
    text: "A standard shower regrout is usually finished in a single visit, scheduled around your household — or around tenants for property managers.",
  },
  {
    Icon: MapPin,
    title: "Local Melbourne Team",
    text: "We are based in Gowanbrae and work across Melbourne's inner, bayside and surrounding suburbs. The people who quote your job are the people who do it.",
  },
];

const steps = [
  { title: "Assess First", text: "We inspect the grout, silicone and tiles — and check whether the membrane underneath is sound — before recommending anything." },
  { title: "Remove & Prepare", text: "Failed grout and old silicone are fully removed. Skipping this step is why quick regrouts fail early, so we never skip it." },
  { title: "Regrout & Seal", text: "New waterproof epoxy grout and fresh silicone are applied and finished so the surface is sealed properly again." },
  { title: "Cure & Warranty", text: "We tell you exactly when the shower can be used again, and complete regrouts are backed by the written 10-year warranty." },
];

const services = [
  { title: "Shower Regrouting", text: "Failed shower grout removed and rebuilt with waterproof epoxy.", href: "/shower-regrouting/" },
  { title: "Leaking Shower Repair", text: "Leaks traced to grout, silicone or the membrane — fixed at the cause.", href: "/leaking-shower-repair/" },
  { title: "Balcony Leak Repairs", text: "Balcony regrouting and leak repairs that stop water getting in.", href: "/balcony-leak-repairs/" },
  { title: "Tile Regrouting", text: "Bathrooms, kitchens, laundries and floors regrouted and resealed.", href: "/tile-regrouting/" },
  { title: "Epoxy Grout", text: "Why epoxy outperforms cement grout in showers and wet areas.", href: "/epoxy-grout/" },
  { title: "Silicone Recaulking", text: "Peeling, mouldy silicone removed and professionally resealed.", href: "/silicone-recaulking/" },
  { title: "Small Tiling Jobs", text: "Cracked, chipped or loose tiles replaced and finished neatly.", href: "/small-tiling-jobs/" },
];

const faqs: Array<{ q: string; a: ReactNode; plain: string }> = [
  {
    q: "Who is Groutix?",
    a: "Groutix is a Melbourne wet-area specialist. We do one thing — repairing failed grout and silicone in showers, balconies and bathrooms — and we do it with waterproof epoxy instead of retiling, so most jobs cost far less than a renovation.",
    plain: "Groutix is a Melbourne wet-area specialist. We do one thing — repairing failed grout and silicone in showers, balconies and bathrooms — and we do it with waterproof epoxy instead of retiling, so most jobs cost far less than a renovation.",
  },
  {
    q: "Where is Groutix based, and which areas do you cover?",
    a: <>We are based in Gowanbrae, in Melbourne’s north-west, and regrout showers and balconies across inner and bayside Melbourne — including South Yarra, Toorak, Malvern, Brighton, St Kilda, Richmond and Albert Park — plus wider Melbourne suburbs. See the full list on our <Link className={inlineLink} href="/locations">locations page</Link>.</>,
    plain: "We are based in Gowanbrae, in Melbourne's north-west, and regrout showers and balconies across inner and bayside Melbourne — including South Yarra, Toorak, Malvern, Brighton, St Kilda, Richmond and Albert Park — plus wider Melbourne suburbs.",
  },
  {
    q: "Is Groutix's work guaranteed?",
    a: "Yes. Every complete shower regrout is backed by a written 10-year waterproof warranty. If the leak comes back through our grout or silicone within that period, we come back and fix it.",
    plain: "Yes. Every complete shower regrout is backed by a written 10-year waterproof warranty. If the leak comes back through our grout or silicone within that period, we come back and fix it.",
  },
  {
    q: "How is Groutix different from a general tiler or handyman?",
    a: "General tilers install new bathrooms; handymen patch problems. We specialise only in failed grout, silicone and leaks in existing wet areas — full removal of the old grout, waterproof epoxy, and honest advice when the real problem is the membrane, not the grout.",
    plain: "General tilers install new bathrooms; handymen patch problems. We specialise only in failed grout, silicone and leaks in existing wet areas — full removal of the old grout, waterproof epoxy, and honest advice when the real problem is the membrane, not the grout.",
  },
  {
    q: "How do quotes work?",
    a: <>Quotes are free. Send us photos of your shower or balcony through the <Link className={inlineLink} href="/#quote-form">quote form</Link> — photos are required, because grout and tile condition decide the price — and we will give you a clear quote before any work starts. No surprises afterwards.</>,
    plain: "Quotes are free. Send us photos of your shower or balcony through the quote form on our homepage — photos are required, because grout and tile condition decide the price — and we will give you a clear quote before any work starts.",
  },
];

/* ───────────── Page ───────────── */
export default function AboutPage({ reviews, rating }: { reviews: Review[]; rating: BusinessRating }) {
  const { phone, tel } = useContact();

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Groutix",
    url: abs("/about"),
    description:
      "Groutix is a Melbourne shower and balcony regrouting specialist: waterproof epoxy regrouting with no tile removal, backed by a 10-year waterproof warranty.",
    about: {
      "@type": "LocalBusiness",
      name: "Groutix",
      telephone: "+61 3 7023 8094",
      address: {
        "@type": "PostalAddress",
        streetAddress: "82A Marigold Crescent",
        addressLocality: "Gowanbrae",
        addressRegion: "VIC",
        postalCode: "3043",
        addressCountry: "AU",
      },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: "About", item: abs("/about") },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="public-page v2-page overflow-x-clip">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

        {/* INTRO — no hero image; heading, text and CTA centred, full width */}
        <section className="scroll-mt-28 bg-white pb-14 pt-[140px] md:pb-20 lg:pt-[160px]">
          <div className={`${wrap} text-center`}>
            <p className={eyebrow}>About Groutix</p>
            <h1 className={`${h2} [text-wrap:balance]`}>Melbourne’s Shower &amp; Balcony Regrouting Specialists</h1>
            <p className={`${lead} mt-4`}>
              Groutix fixes the problem most Melbourne bathrooms eventually have: grout and silicone that crack,
              stain, grow mould and let water through. Instead of demolishing your bathroom, we remove the failed
              grout, rebuild it with waterproof epoxy, and reseal every joint — your tiles stay exactly where they are.
            </p>
          </div>
        </section>

        {/* WHY GROUTIX EXISTS */}
        <Section id="our-story" alt>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
              <Image src="/shower-regrouting-over-bath-tiles.webp" alt="Shower over a bath regrouted and resealed by Groutix" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <div>
              <SectionHead k="Why Groutix Exists" title="Most Leaking Showers Don’t Need a Renovation" left>
                <p className={lead}>
                  When grout fails, the usual advice is a full bathroom renovation — weeks of work and a five-figure
                  bill. But in most showers the tiles and waterproof membrane underneath are still sound. Only the
                  grout and silicone have given up.
                </p>
              </SectionHead>
              <div className="space-y-4 text-[17px] leading-relaxed text-slate-600">
                <p>
                  Groutix was built around that gap. We specialise in the repair most bathrooms actually need:
                  complete removal of the failed grout, a rebuild in waterproof epoxy, and fresh silicone at every
                  corner and joint. The bathroom looks new again, the leak stops, and the tiles you already have stay put.
                </p>
                <p>
                  And when a shower genuinely needs more than regrouting — a failed membrane, loose or cracked
                  tiles — we say so before quoting, and point you to the right fix instead of the biggest one.
                </p>
                <p>
                  The results are on our <Link className={inlineLink} href="/gallery">gallery page</Link>: real
                  before-and-after photos from Melbourne homes, not stock images.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* PRINCIPLES */}
        <Section id="how-we-work">
          <SectionHead k="How We Work" title="The Groutix Standard">
            <p className={lead}>Six commitments that shape every quote, every job and every warranty we write.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {principles.map(({ Icon, title, text }) => (
              <div key={title} className={`${box} p-6 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF3FF] text-[#001F97]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className={`${cardTitle} mt-4`}>{title}</h3>
                <p className={cardText}>{text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* PROCESS SUMMARY */}
        <Section id="process" alt>
          <SectionHead k="Our Process" title="From First Look to Written Warranty">
            <p className={lead}>Every job follows the same four steps — no shortcuts where water is involved.</p>
          </SectionHead>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className={`${box} p-5`}>
                <div className="text-[32px] font-black leading-none text-[#2F63CC]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link href="/our-process" className={btnNavy}>See the Full Process<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </Section>

        {/* PHOTO STRIP */}
        <Section id="results">
          <SectionHead k="Real Results" title="Recent Work From Melbourne Homes" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { src: "/grey-shower-floor-regrouting-top-view after.webp", alt: "Grey shower floor after epoxy regrouting by Groutix" },
              { src: "/white-tile-shower-regrouting-overhead after.webp", alt: "White tiled shower after regrouting and resealing by Groutix" },
              { src: "/balcony-regrouting-herringbone-tiles.webp", alt: "Herringbone balcony tiles regrouted by Groutix" },
            ].map((img) => (
              <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                <Image src={img.src} alt={img.alt} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition-transform duration-500 hover:scale-105" />
              </div>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link href="/gallery" className="text-[15px] font-bold text-[#2F63CC] hover:underline">Browse the full gallery →</Link>
          </div>
        </Section>

        {/* REVIEWS */}
        <Section id="reviews" alt>
          <SectionHead k="Customer Feedback" title="What Our Customers Say">
            <p className={lead}>Real feedback from homeowners we’ve helped across Melbourne and Victoria.</p>
          </SectionHead>
          <ReviewsMarquee reviews={reviews} rating={rating} />
          <div className="mt-6 text-center">
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2F63CC] hover:underline">
              Read More Verified Reviews on Google <span className="font-extrabold text-[#FBBC04]">→</span>
            </a>
          </div>
        </Section>

        {/* SERVICES INDEX */}
        <Section id="services">
          <SectionHead k="What We Do" title="Our Services">
            <p className={lead}>One specialty, done properly. Each service page explains the problem, the fix and the cost factors.</p>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className={`${box} group flex flex-col p-6 text-slate-900 transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]`}>
                <h3 className={cardTitle}>{s.title}</h3>
                <p className={cardText}>{s.text}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold text-[#2F63CC] group-hover:underline">
                  Learn more<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
            <Link href="/services" className="group flex flex-col justify-center rounded-lg bg-[#001F97] p-6 text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
              <h3 className="text-lg font-bold leading-snug">View All Services</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#D6DCF5]">Every repair we offer, in one place.</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold text-[#FBBC04] group-hover:underline">
                All services<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" alt>
          <SectionHead title="About Groutix — Questions" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.plain })))) }} />
          <FaqList items={faqs.map((f) => ({ q: f.q, a: f.a }))} />
        </Section>

        {/* CONTACT CARD */}
        <Section id="contact-card">
          <div className={`${box} grid grid-cols-1 gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
            <div>
              <p className={eyebrow}>Visit or Call</p>
              <h2 className={h2}>Based in Gowanbrae, Working Melbourne-Wide</h2>
              <ul className="mt-6 space-y-4 text-base text-slate-700">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#001F97]" aria-hidden="true" />
                  <span><b className="text-slate-900">Groutix</b><br />82A Marigold Crescent, Gowanbrae VIC 3043</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#001F97]" aria-hidden="true" />
                  <a href={tel} className="font-bold text-[#001F97] hover:underline">{phone}</a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#001F97]" aria-hidden="true" />
                  <span>Mon–Sat: 9:00 am – 6:30 pm<br />Sun: 11:00 am – 10:00 pm</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={cardTitle}>Where We Work</h3>
              <p className={`${cardText} mt-2`}>
                Most days we are out on jobs across inner and bayside Melbourne — South Yarra, Toorak, Malvern,
                Armadale, Prahran, Hawthorn, Camberwell, Brighton, St Kilda, Richmond, Albert Park, Windsor, Elwood
                and Port Melbourne — and we travel further for the right job, including Geelong, Ballarat and Frankston.
              </p>
              <p className={`${cardText} mt-3`}>
                The fastest way to reach us is the quote form or a call — tell us what your shower or balcony is
                doing, add photos, and we will come back with honest advice and a clear quote.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/#quote-form" className={btnNavy}>Get a Free Quote</Link>
                <Link href="/locations" className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-[1.5px] border-[#001F97] px-6 text-base font-bold text-[#001F97] transition-colors hover:bg-[#EEF3FF]">See All Locations</Link>
              </div>
            </div>
          </div>
        </Section>

        {/* FINAL CTA */}
        <section className="bg-white pb-14 md:pb-20">
          <div className={wrap}>
            <div className="grid grid-cols-1 items-center gap-7 rounded-xl border-2 border-[#001F97] bg-white p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-[52px]">
              <div>
                <h2 className={h2}>Get Your Free Quote Today</h2>
                <p className="mt-3 text-slate-600">Honest advice and workmanship you can rely on.</p>
                <p className="mt-1 text-slate-600">Free quote · Tiles stay in place · 10-year waterproof warranty</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/#quote-form" className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border-[1.5px] border-[#001F97] px-6 text-base font-bold text-[#001F97] transition-colors hover:bg-[#EEF3FF] sm:w-auto">Request A Quote</a>
                <a href={tel} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border-[1.5px] border-[#001F97] px-6 text-base font-bold text-[#001F97] transition-colors hover:bg-[#EEF3FF] sm:w-auto"><Phone className="h-4 w-4" aria-hidden="true" />{phone}</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar quoteHref="/#quote-form" />
    </>
  );
}
