import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section, SectionHeading, ArrowIcon, CheckItem, Button } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { LeadForm } from "@/components/LeadForm";
import { Accordion } from "@/components/Accordion";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Reveal } from "@/components/Reveal";
import { Icon, serviceIcons } from "@/components/icons";
import { services, site } from "@/lib/site";
import { serviceDetails, serviceBenefits, serviceImage } from "@/lib/content";

const benefitIcon = {
  Tools: Icon.Tools,
  Grid: Icon.Grid,
  Shield: Icon.Shield,
  Clock: Icon.Clock,
};

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  const detail = serviceDetails[service.slug];
  return {
    title: service.title,
    description: detail?.intro ?? service.blurb,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const detail = serviceDetails[service.slug];
  const SvcIcon = serviceIcons[service.slug] ?? Icon.Droplet;
  const related = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.title}
        subtitle={detail?.intro}
        image={serviceImage[service.slug]}
        imageAlt={service.title}
        crumb={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
      />

      {/* Overview + sidebar form */}
      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16 lg:items-start">
          <Reveal>
            <div className="overflow-hidden rounded-2xl ring-1 ring-ink-100">
              <ImagePlaceholder src={serviceImage[service.slug]} alt={service.title} sizes="(max-width:1024px) 100vw, 60vw" className="aspect-[16/9]" priority />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
                <SvcIcon className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl font-extrabold text-ink-900">
                About this service
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink-600">
              {detail?.overview.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-ink-100 bg-surface p-7">
              <h3 className="font-display text-xl font-bold text-ink-900">What&apos;s included</h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {detail?.includes.map((point) => (
                  <CheckItem key={point}>{point}</CheckItem>
                ))}
              </ul>
              {detail?.idealFor ? (
                <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-brand-50 p-4 text-sm text-brand-800 ring-1 ring-brand-100">
                  <Icon.Shield className="mt-0.5 h-5 w-5 flex-none text-brand-600" />
                  <span>
                    <strong className="font-semibold">Ideal for: </strong>
                    {detail.idealFor}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#quote" size="lg">
                Book a Free Assessment <ArrowIcon />
              </Button>
              <Button href={site.phoneHref} size="lg" variant="secondary">
                Call {site.phone}
              </Button>
            </div>
          </Reveal>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-28">
            <div id="quote">
              <LeadForm />
            </div>
            <div className="mt-6 rounded-2xl border border-ink-100 bg-card p-6 shadow-soft">
              <h3 className="font-display text-base font-bold text-ink-900">Other services</h3>
              <ul className="mt-3 divide-y divide-ink-100">
                {related.map((r) => {
                  const RIcon = serviceIcons[r.slug] ?? Icon.Droplet;
                  return (
                    <li key={r.slug}>
                      <Link
                        href={`/services/${r.slug}`}
                        className="group flex items-center gap-3 py-3 text-sm font-medium text-ink-700 transition-colors hover:text-brand-700"
                      >
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <RIcon className="h-5 w-5" />
                        </span>
                        {r.title}
                        <ArrowIcon className="ml-auto text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-500" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Warning signs for this service */}
      {detail?.signs?.length ? (
        <Section muted>
          <Container>
            <Reveal>
              <SectionHeading
                center
                eyebrow="Warning Signs"
                title="Signs you might need this"
                subtitle="Spotting the problem early keeps the repair small. Look out for these tell-tale signs."
              />
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
              {detail.signs.map((sign, i) => (
                <Reveal key={sign} delay={(i % 2) * 100}>
                  <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-card p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-50 text-amber-500">
                      <Icon.Alert className="h-5 w-5" />
                    </span>
                    <span className="font-medium text-ink-800">{sign}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* How it works */}
      {detail?.steps?.length ? (
        <Section>
          <Container>
            <Reveal>
              <SectionHeading
                center
                eyebrow="How It Works"
                title="Our process, step by step"
                subtitle="A clear, proven approach that gets the job done right the first time."
              />
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {detail.steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 120}>
                  <div className="relative h-full rounded-2xl border border-ink-100 bg-card p-7 shadow-soft">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-extrabold text-white shadow-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-ink-600">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Why choose Groutix */}
      <Section muted>
        <Container>
          <Reveal>
            <SectionHeading
              center
              eyebrow="Why Groutix"
              title="Why homeowners choose us"
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceBenefits.map((b, i) => {
              const BIcon = benefitIcon[b.icon];
              return (
                <Reveal key={b.title} delay={i * 100}>
                  <div className="group h-full rounded-2xl border border-ink-100 bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-soft transition-transform duration-300 group-hover:scale-110">
                      <BIcon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{b.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Service FAQ */}
      {detail?.faqs?.length ? (
        <Section>
          <Container>
            <Reveal>
              <SectionHeading
                center
                eyebrow="FAQ"
                title={`${service.title} questions`}
                subtitle="Quick answers to the things people ask us most about this service."
              />
            </Reveal>
            <div className="mt-12">
              <Reveal>
                <Accordion items={detail.faqs} />
              </Reveal>
            </div>
          </Container>
        </Section>
      ) : null}

      <CTABanner
        title={`Need help with ${service.title.toLowerCase()}?`}
        blurb="Book a free, no-obligation assessment and we'll give you honest advice and a clear quote."
      />
    </>
  );
}
