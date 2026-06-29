import type { Metadata } from "next";
import { Container, Section, SectionHeading, CheckItem, Button, ArrowIcon } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { site, stats } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Groutix is a Melbourne team of leaking shower and waterproofing specialists, fixing leaks properly and backing every job with a 10-year warranty.",
};

const values = [
  {
    title: "Honest advice",
    body: "We only recommend what your bathroom actually needs — no upselling, no scare tactics.",
    icon: Icon.Shield,
  },
  {
    title: "Done properly",
    body: "We fix the root cause with quality materials so the problem stays fixed for the long run.",
    icon: Icon.Tools,
  },
  {
    title: "Clean & respectful",
    body: "We treat your home with care and leave every job site tidy when we're finished.",
    icon: Icon.Droplet,
  },
  {
    title: "Local & reliable",
    body: "A Melbourne-based team that turns up on time and does what we say we'll do.",
    icon: Icon.Clock,
  },
];

const points = [
  "Specialists in leaking showers and waterproofing",
  "Repairs that usually keep your tiles in place",
  "Fully licensed and insured",
  "Backed by a written 10-year warranty",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Groutix"
        title="Melbourne's leaking shower specialists"
        subtitle={site.description}
        crumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ]}
      />

      {/* Story */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-2xl ring-1 ring-ink-100">
              <ImagePlaceholder src="/images/bathroom-finished.jpeg" alt="A finished, watertight bathroom" className="aspect-[4/3]" priority />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SectionHeading
              eyebrow="Who we are"
              title="A team that takes leaks seriously"
              subtitle="We built Groutix around a simple idea: most leaking showers can be fixed properly without tearing the whole bathroom apart."
            />
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink-600">
              <p>
                Too many homeowners are told they need a full renovation when a
                targeted, expert repair would do the job for a fraction of the
                cost. We set out to change that.
              </p>
              <p>
                Today we help households right across Melbourne stop leaks, beat
                mould and protect their homes — with workmanship we&apos;re proud to
                stand behind for a decade.
              </p>
            </div>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {points.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/contact" size="lg">
                Get in touch <ArrowIcon />
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Stats */}
      <Section muted>
        <Container>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 90} className="text-center">
                <div className="font-display text-4xl font-extrabold text-brand-600 sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                  {s.label}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              center
              eyebrow="What we stand for"
              title="The values behind every job"
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const VIcon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 100}>
                  <div className="group h-full rounded-2xl border border-ink-100 bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-soft transition-transform duration-300 group-hover:scale-110">
                      <VIcon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{v.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <CTASection />
    </>
  );
}
