"use client";
import Image from "next/image";
import Link from "next/link";
import QuoteFormV2 from "@/components/home/QuoteFormV2";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Camera,
  ClipboardCheck,
  CalendarCheck2,
  Star,
  ShieldCheck,
  Layers,
  BadgeCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";

const FAQS = [
  {
    q: "How do I request a quote?",
    a: "Fill in the form on this page or call us on (03) 7023 8094. Tell us the service you need, your suburb and what the problem looks like — cracked or mouldy grout, a leak, peeling silicone — and add clear photos. We review every enquiry and book a free inspection at a time that suits you.",
  },
  {
    q: "Can I send photos of my shower or balcony?",
    a: "Yes — the form asks for photos, and on your phone you can take them on the spot with the Camera button. Photos help us see the condition of the grout, silicone and tiles before the inspection, so your assessment and quote are more accurate.",
  },
  {
    q: "Do I need an inspection before getting a quote?",
    a: "For an accurate price, yes. Inspections are free: we check the grout, silicone, tiles and drainage, explain exactly what your shower or balcony needs, and give you an upfront quote before any work begins — no obligation to go ahead.",
  },
  {
    q: "How much does shower regrouting cost?",
    a: "It depends on the size of the shower, the condition of the existing grout and silicone, and whether any tiles or the shower base also need repairs — which is why we inspect first instead of guessing over the phone. After the free inspection you receive an upfront quote, and the price we quote is the price you pay for that work.",
  },
  {
    q: "Can a leaking shower be fixed without removing tiles?",
    a: "In most cases, yes. We remove the failed grout and silicone and rebuild the seals with waterproof epoxy, so your tiles stay in place. If the inspection finds damage beyond what regrouting can fix, we will tell you honestly and explain your options before any work starts.",
  },
  {
    q: "Do you service my suburb?",
    a: "We regrout showers and repair leaks right across Melbourne and in regional centres including Geelong and Ballarat. Check our locations page for your area, or call (03) 7023 8094 and we will confirm straight away.",
  },
];

const STEPS = [
  {
    icon: <Camera className="h-5 w-5 text-primary" />,
    title: "1. Send your details",
    text: "Pick the service, tell us the problem and your suburb, and add photos of the shower or balcony.",
  },
  {
    icon: <ClipboardCheck className="h-5 w-5 text-primary" />,
    title: "2. We review your enquiry",
    text: "We look at your photos and details, then book your free inspection at a time from the form that suits you.",
  },
  {
    icon: <CalendarCheck2 className="h-5 w-5 text-primary" />,
    title: "3. Inspection & upfront quote",
    text: "We inspect in person, explain the fix in plain English and quote upfront — no obligation to proceed.",
  },
];

const WORK_PHOTOS = [
  { src: "/shower-regrouting-tiled-interior.webp", alt: "Regrouted tiled shower interior by Groutix", caption: "Shower regrouting" },
  { src: "/shower-regrouting-over-bath-tiles.webp", alt: "Regrouted shower over bath tiles", caption: "Leaking shower repairs" },
  { src: "/balcony-regrouting-herringbone-tiles.webp", alt: "Regrouted balcony with herringbone tiles", caption: "Balcony leak repairs" },
];

export default function ContactClient() {
  const { phone, tel, email, mailto } = useContact();
  const { business } = useSiteContent();
  const areasLine =
    business.areasServed?.join(", ") ||
    "Melbourne, Geelong, Ballarat, Frankston, Lilydale, Yarra Glen, Kilmore";

  const contactInfo = [
    { icon: <Phone className="h-5 w-5 text-secondary" />, label: "Call Us", value: phone, href: tel },
    { icon: <Mail className="h-5 w-5 text-secondary" />, label: "Email Us", value: email, href: mailto },
    {
      icon: <Clock className="h-5 w-5 text-secondary" />,
      label: "Our Hours",
      value: (
        <>
          <span className="block">Mon – Sat: 9:00am – 6:30pm</span>
          <span className="block font-medium text-neutral-600 mt-0.5">Sun: 11:00am – 10:00pm</span>
        </>
      ),
      href: null,
    },
    { icon: <MapPin className="h-5 w-5 text-secondary" />, label: "Areas We Serve", value: areasLine, href: "/locations" },
  ];

  return (
    <main className="pt-[110px] lg:pt-[125px]">
      {/* ─── Hero ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-primary py-16 lg:py-20 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/70"
            >
              Contact Groutix — Melbourne &amp; Victoria
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]"
            >
              Request a Shower Regrouting or Repair Quote
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/80 text-lg max-w-xl mx-auto lg:mx-0"
            >
              Tell us a little about your shower, the problem you&apos;re seeing and your suburb.
              Add photos so we can assess it properly — inspections are free, and every quote is
              upfront before any work begins.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <a
                href={tel}
                className="inline-flex items-center gap-2 rounded-full bg-white text-primary font-bold px-5 py-3 hover:bg-neutral-100 transition-colors"
              >
                <Phone className="h-4 w-4" /> {phone}
              </a>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-3 text-sm font-semibold text-white/90">
                <Star className="h-4 w-4 fill-current" /> Rated 5.0 from 296+ Google reviews
              </span>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl hidden lg:block"
          >
            <Image
              src="/shower-regrouting-tiled-interior.webp"
              alt="Freshly regrouted tiled shower by Groutix in Melbourne"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Form + sidebar ─── */}
      <AnimatedSection className="py-16 lg:py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Form first on mobile */}
          <div id="quote-form" className="lg:col-span-3 order-1 scroll-mt-32">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-5 sm:p-7">
              <h2 className="text-2xl font-black text-neutral-900">Get your free quote</h2>
              <p className="text-neutral-600 mt-1.5 leading-relaxed">
                Choose the service, describe the problem and add photos — that&apos;s everything we
                need to review your job and book your free inspection.
              </p>
              <div className="mt-5">
                <QuoteFormV2 idPrefix="contactqf" variant="hero" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 order-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6">
              <h2 className="text-xl font-black text-neutral-900">Get in touch</h2>
              <ul className="mt-5 space-y-5">
                {contactInfo.map((item, i) => (
                  <li key={i} className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">{item.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-bold text-neutral-900 hover:text-primary transition-colors break-words">
                          {item.value}
                        </a>
                      ) : (
                        <div className="font-bold text-neutral-900">{item.value}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6">
              <h2 className="text-xl font-black text-neutral-900">What happens after you enquire?</h2>
              <div className="mt-5 space-y-5">
                {STEPS.map((s) => (
                  <div key={s.title} className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">{s.icon}</div>
                    <div>
                      <p className="font-bold text-neutral-900">{s.title}</p>
                      <p className="text-sm text-neutral-600 leading-relaxed mt-0.5">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary text-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-black">Why Melbourne calls Groutix</h2>
              <ul className="mt-4 space-y-3 text-[15px]">
                <li className="flex gap-2.5">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-white/80" />
                  <span><strong>10-year waterproof warranty</strong> on every complete shower regrout</span>
                </li>
                <li className="flex gap-2.5">
                  <Layers className="h-5 w-5 flex-shrink-0 text-white/80" />
                  <span><strong>No tile removal</strong> — failed grout and silicone rebuilt, tiles stay in place</span>
                </li>
                <li className="flex gap-2.5">
                  <BadgeCheck className="h-5 w-5 flex-shrink-0 text-white/80" />
                  <span><strong>Free inspections</strong> and upfront quotes across Melbourne &amp; Victoria</span>
                </li>
                <li className="flex gap-2.5">
                  <Star className="h-5 w-5 flex-shrink-0 text-white/80" />
                  <span><strong>5.0-star rated</strong> from 296+ Google reviews</span>
                </li>
              </ul>
              <div className="mt-5 bg-white rounded-xl p-3 flex items-center justify-center">
                <Image
                  src="/groutix-official-warranty-seal.webp"
                  alt="Groutix official warranty seal"
                  width={180}
                  height={90}
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Recent work ─── */}
      <AnimatedSection className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-neutral-900">Recent regrouting work</h2>
              <p className="text-neutral-600 mt-2 max-w-2xl">
                Real showers and balconies we&apos;ve regrouted and resealed — the same standard your
                job gets, finished in most cases in a single visit.
              </p>
            </div>
            <Link href="/gallery" className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-secondary transition-colors">
              See the gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            {WORK_PHOTOS.map((p) => (
              <figure key={p.src} className="group">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                  <Image src={p.src} alt={p.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <figcaption className="mt-2.5 text-sm font-bold text-neutral-700">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Service areas + map ─── */}
      <AnimatedSection className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-black text-neutral-900">Where we work</h2>
            <p className="text-neutral-600 leading-relaxed mt-3">
              From our base in Gowanbrae we regrout showers, fix leaking showers and repair balconies
              across <strong className="text-neutral-900">{areasLine}</strong> and the suburbs in
              between — homes, apartments and rental properties alike.
            </p>
            <p className="text-neutral-600 leading-relaxed mt-3">
              Not sure if we cover your suburb?{" "}
              <Link href="/locations" className="font-bold text-primary hover:text-secondary transition-colors">
                Check our locations
              </Link>{" "}
              or call us on{" "}
              <a href={tel} className="font-bold text-primary hover:text-secondary transition-colors">
                {phone}
              </a>{" "}
              and we&apos;ll confirm straight away.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
              <iframe
                title="Groutix location on Google Maps"
                src="https://www.google.com/maps?q=Groutix%2C%2082A%20Marigold%20Cres%2C%20Gowanbrae%20VIC%203043&z=14&output=embed"
                className="block w-full h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a
              href="https://maps.google.com/?cid=11736395911597271820"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary transition-colors"
            >
              <MapPin className="h-4 w-4" /> Get directions
            </a>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FAQ ─── */}
      <AnimatedSection className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-neutral-900 text-center">Questions before you enquire</h2>
          <p className="text-neutral-600 text-center mt-3 max-w-2xl mx-auto">
            The things Melbourne homeowners ask us most before requesting a quote.
          </p>
          <div className="mt-9 space-y-3.5">
            {FAQS.map((f) => (
              <details key={f.q} className="group bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-4 open:bg-white open:shadow-md transition-shadow">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="text-neutral-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Final CTA ─── */}
      <section className="bg-primary py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to fix your shower properly?</h2>
          <p className="text-white/80 text-lg">
            Send your photos today and book a free inspection — or talk to us first on {phone}.
            Your details go straight to the Groutix team and nowhere else.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <a href="#quote-form" className="inline-flex items-center gap-2 rounded-full bg-white text-primary font-bold px-6 py-3.5 hover:bg-neutral-100 transition-colors">
              Request a Quote <ArrowRight className="h-4 w-4" />
            </a>
            <a href={tel} className="inline-flex items-center gap-2 rounded-full border border-white/40 font-bold px-6 py-3.5 hover:bg-white/10 transition-colors">
              <Phone className="h-4 w-4" /> Call {phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
