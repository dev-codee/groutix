import Link from "next/link";
import Image from "next/image";
import { Button, Container, Section, SectionHeading, Eyebrow, CheckItem, ArrowIcon } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Reveal } from "@/components/Reveal";
import { Icon, serviceIcons } from "@/components/icons";
import { services, stats, site } from "@/lib/site";
import { gallery, serviceImage, serviceAreas, testimonials } from "@/lib/content";

const heroChecks = [
  "No tile removal in most cases",
  "Save thousands versus a full renovation",
  "Tidy, fast and stress-free",
  "Licensed, insured and trusted",
];

const aboutPoints = [
  "Specialists in leaking showers and waterproofing",
  "Most repairs keep your existing tiles in place",
  "Fully licensed and insured Melbourne team",
  "Backed by a written 10-year warranty",
];

const warningSigns = [
  "Cracked or missing grout",
  "Mould or blackened silicone",
  "Water escaping the shower",
  "Damp walls or skirting boards",
  "Loose or hollow-sounding tiles",
  "A lingering musty smell",
];

const whyChoose = [
  { title: "Save Thousands", body: "A targeted repair costs a fraction of ripping out and rebuilding the whole bathroom.", icon: Icon.Coins, tint: "from-brand-500 to-brand-700" },
  { title: "Tiles Stay Put", body: "Wherever it's possible, we fix the problem without removing your existing tiles.", icon: Icon.Grid, tint: "from-teal-500 to-teal-700" },
  { title: "Done in a Day", body: "Most jobs are completed within a single visit, so life gets back to normal fast.", icon: Icon.Clock, tint: "from-amber-500 to-orange-600" },
  { title: "Backed for 10 Years", body: "Every repair is covered by our written 10-year waterproof warranty.", icon: Icon.Shield, tint: "from-brand-600 to-teal-600" },
];

const statIcons = [Icon.Shield, Icon.Layers, Icon.Droplet, Icon.Clock];

const processSteps = [
  { n: "01", title: "Inspect", body: "We carry out a thorough on-site inspection to find exactly where the water is getting in." },
  { n: "02", title: "Repair", body: "Using premium sealants and proven methods, we fix the cause at its source — not just the surface." },
  { n: "03", title: "Protect", body: "We reseal and waterproof the area so it stays dry, clean and leak-free for years to come." },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface">
        <Image
          src="/images/hero-bathroom.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
        <div className="anim-blob pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-200/40 blur-3xl" />

        <Container className="relative grid items-center gap-10 pb-10 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-12 lg:pt-6">
          <div>
            <div className="anim-fade-up">
              <Eyebrow>Leaking Shower Specialists</Eyebrow>
            </div>
            <h1 className="anim-fade-up mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl" style={{ animationDelay: "90ms" }}>
              Stop your leaking shower —{" "}
              <span className="text-gradient">without removing the tiles</span>
            </h1>
            <p className="anim-fade-up mt-5 max-w-xl text-lg leading-relaxed text-ink-600" style={{ animationDelay: "180ms" }}>
              Permanent leak repairs, regrouting, silicone replacement and
              waterproofing across Melbourne — all backed by our {site.warrantyYears}-year
              waterproof warranty.
            </p>
            <ul className="anim-fade-up mt-6 grid max-w-lg gap-2.5 sm:grid-cols-2" style={{ animationDelay: "260ms" }}>
              {heroChecks.map((c) => (
                <CheckItem key={c}>{c}</CheckItem>
              ))}
            </ul>
            <div className="anim-fade-up mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "340ms" }}>
              <Button href="#quote" size="lg">
                Get a Free Assessment <ArrowIcon />
              </Button>
              <Button href={site.phoneHref} size="lg" variant="secondary">
                Call {site.phone}
              </Button>
            </div>
            <div className="anim-fade-up mt-6 flex items-center gap-3 text-sm text-ink-500" style={{ animationDelay: "420ms" }}>
              <span className="font-bold tracking-wide text-amber-500">★★★★★</span>
              <span>Rated 5.0 from 300+ Melbourne reviews</span>
            </div>
          </div>

          <div id="quote" className="anim-fade-in relative" style={{ animationDelay: "300ms" }}>
            <div className="anim-float-slow absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-300/40 to-teal-300/40 blur-2xl" />
            <div className="anim-float absolute -right-5 top-12 z-10 hidden items-center gap-2.5 rounded-2xl bg-white p-3 pr-4 shadow-lift ring-1 ring-ink-100 lg:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white">
                <Icon.Shield className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold leading-tight text-ink-800">10-Year<br />Warranty</span>
            </div>
            <div className="anim-float-slow absolute -bottom-5 -right-3 z-10 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lift ring-1 ring-ink-100 lg:flex">
              <span className="text-amber-500">★</span>
              <span className="text-xs font-bold text-ink-800">5.0 · 300+ reviews</span>
            </div>
            <LeadForm />
          </div>
        </Container>
      </section>

      {/* STATS */}
      <div className="relative border-y border-ink-100 bg-white">
        <div className="shimmer-line absolute inset-x-0 top-0 h-1" />
        <Container className="grid grid-cols-2 gap-y-8 py-10 sm:py-12 lg:grid-cols-4">
          {stats.map((s, i) => {
            const StatIcon = statIcons[i];
            return (
              <Reveal key={s.label} delay={i * 90} className={`flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-4 lg:text-left ${i !== stats.length - 1 ? "lg:border-r lg:border-ink-100" : ""}`}>
                <span className="mb-3 grid h-12 w-12 flex-none place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 lg:mb-0">
                  <StatIcon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">{s.value}</span>
                  <span className="mt-1 block text-sm font-semibold uppercase tracking-wide text-ink-500">{s.label}</span>
                </span>
              </Reveal>
            );
          })}
        </Container>
      </div>

      {/* INTRO / ABOUT */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl ring-1 ring-ink-100 shadow-soft">
                <ImagePlaceholder src="/images/bathroom-finished.jpeg" alt="A clean, finished Melbourne bathroom" className="aspect-[4/3]" priority />
              </div>
              <div className="anim-float absolute -bottom-6 -right-4 hidden rounded-2xl bg-white p-5 shadow-lift ring-1 ring-ink-100 sm:block">
                <div className="font-display text-3xl font-extrabold text-brand-600">10yr</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">Waterproof warranty</div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SectionHeading
              eyebrow="About Groutix"
              title="Melbourne's trusted leaking shower team"
              subtitle="We fix the cause of the leak properly the first time — usually without removing a single tile — and stand behind every job for a decade."
            />
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {aboutPoints.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/about" size="lg">Learn more about us <ArrowIcon /></Button>
              <Button href="/contact" size="lg" variant="secondary">Get in touch</Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* SERVICES */}
      <Section muted className="relative overflow-hidden">
        <div className="anim-blob pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl" />
        <Container className="relative">
          <Reveal>
            <SectionHeading center eyebrow="Our Services" title="Specialist solutions that fix the cause" subtitle="We treat the source of the problem, not just the symptoms — so your repair actually lasts." />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => {
              const SvcIcon = serviceIcons[s.slug] ?? Icon.Droplet;
              return (
                <Reveal key={s.slug} delay={(i % 3) * 110}>
                  <Link href={`/services/${s.slug}`} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                    <span className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
                    <div className="relative overflow-hidden">
                      <ImagePlaceholder src={serviceImage[s.slug]} alt={s.title} sizes="(max-width:768px) 100vw, 33vw" className="aspect-[16/10] transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute -bottom-6 left-6 z-10 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lift ring-4 ring-white">
                        <SvcIcon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6 pt-9">
                      <h3 className="font-display text-lg font-bold text-ink-900">{s.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{s.blurb}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                        Learn more <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* WARNING SIGNS */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-3xl ring-1 ring-ink-100 shadow-soft">
              <ImagePlaceholder src="/images/damage-mould.jpeg" alt="Water damage and mould in a leaking shower" className="aspect-[4/3]" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SectionHeading eyebrow="Warning Signs" title="Don't ignore the early symptoms" subtitle="What looks like a small cosmetic problem today can turn into serious water damage tomorrow. Watch for these signs." />
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {warningSigns.map((sign) => (
                <li key={sign} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 shadow-soft">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-amber-50 text-amber-500">
                    <Icon.Alert className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-ink-800">{sign}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="#quote" size="lg">Book a Free Inspection <ArrowIcon /></Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* WHY CHOOSE */}
      <Section muted>
        <Container>
          <Reveal>
            <SectionHeading center eyebrow="Why Groutix" title="Why homeowners choose us" />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((w, i) => {
              const WIcon = w.icon;
              return (
                <Reveal key={w.title} delay={i * 100}>
                  <div className="group h-full rounded-2xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${w.tint} text-white shadow-soft transition-transform duration-300 group-hover:scale-110`}>
                      <WIcon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{w.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{w.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* PROCESS */}
      <Section>
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="The Groutix Process" title="Simple, proven, permanent" subtitle="A straightforward three-step approach that gets your shower watertight again." />
            <ol className="relative mt-10 space-y-8 before:absolute before:left-[1.4rem] before:top-3 before:h-[calc(100%-2rem)] before:w-px before:bg-gradient-to-b before:from-brand-300 before:to-teal-300">
              {processSteps.map((step, i) => (
                <Reveal as="li" key={step.n} delay={i * 120} className="relative flex gap-5">
                  <span className="relative z-10 grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-extrabold text-white shadow-soft">
                    {step.n}
                  </span>
                  <div className="pt-1">
                    <h4 className="font-display text-lg font-bold text-ink-900">{step.title}</h4>
                    <p className="mt-1 text-ink-600">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={150}>
            <div className="overflow-hidden rounded-3xl ring-1 ring-ink-100 shadow-soft">
              <ImagePlaceholder src="/images/regrouting-2.jpeg" alt="Applying fresh grout to shower tiles" className="aspect-[4/5]" />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* RESULTS GALLERY */}
      <Section muted>
        <Container>
          <Reveal>
            <SectionHeading center eyebrow="Real Results" title="Transformations that last" subtitle="A look at the before-and-after difference a proper repair makes around Melbourne." />
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, i) => (
              <Reveal key={g.src} delay={(i % 3) * 100}>
                <div className="group relative overflow-hidden rounded-2xl ring-1 ring-ink-100 shadow-soft">
                  <ImagePlaceholder src={g.src} alt={g.label} sizes="(max-width:768px) 100vw, 33vw" className="aspect-[16/11] transition-transform duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-4 left-4 translate-y-2 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {g.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* TESTIMONIALS */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading center eyebrow="Reviews" title="What your neighbours say" />
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((r, i) => (
              <Reveal key={r.name} delay={i * 120}>
                <figure className="relative h-full rounded-2xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                  <Icon.Quote className="h-9 w-9 text-brand-100" />
                  <blockquote className="mt-2 text-ink-700">{r.quote}</blockquote>
                  <div className="mt-3 text-amber-500">★★★★★</div>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-sm font-bold text-white">{r.initials}</span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">{r.name}</span>
                      <span className="block text-xs text-ink-500">{r.suburb}, VIC</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Button href="/reviews" variant="secondary">Read all reviews <ArrowIcon /></Button>
          </Reveal>
        </Container>
      </Section>

      {/* SERVICE AREAS */}
      <Section muted>
        <Container>
          <Reveal>
            <SectionHeading center eyebrow="Service Areas" title="Proudly servicing Melbourne" subtitle="We help homeowners right across Melbourne and the surrounding suburbs." />
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {serviceAreas.map((area, i) => (
              <Reveal key={area} delay={(i % 4) * 80}>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-soft transition-colors hover:border-brand-200">
                  <Icon.Droplet className="h-4 w-4 flex-none text-brand-500" />
                  <span className="text-sm font-medium text-ink-800">{area}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900">
        <div className="dot-pattern pointer-events-none absolute inset-0 opacity-40" />
        <div className="anim-blob pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/30 blur-3xl" />
        <div className="anim-blob-slow pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        <Container className="relative grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-24">
          <Reveal className="text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Don&apos;t wait until the damage spreads</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl">Get your leak assessed today</h2>
            <p className="mt-4 max-w-md text-lg text-brand-100">Free, no-obligation advice from Melbourne&apos;s leaking shower specialists. Honest answers and a fast response.</p>
            <ul className="mt-7 grid max-w-md grid-cols-2 gap-3.5 text-sm font-medium text-white/90">
              {["Free assessment", "No obligation", "Expert advice", "Fast response"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white/15 text-teal-200">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 10.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <LeadForm compact />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
