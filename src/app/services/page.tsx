import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, ArrowIcon } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Reveal } from "@/components/Reveal";
import { Icon, serviceIcons } from "@/components/icons";
import { services } from "@/lib/site";
import { serviceImage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Leaking shower repairs, regrouting, retiling, waterproofing, leak detection, balcony repairs and full bathroom renovations across Melbourne.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Specialist waterproofing & shower repairs"
        subtitle="We fix the cause of the problem — not just the symptoms — so your repair lasts. Explore what we do below."
        image="/images/shower-clean.jpeg"
        imageAlt="Clean, watertight shower"
        crumb={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
        ]}
      />

      <Section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => {
              const SvcIcon = serviceIcons[s.slug] ?? Icon.Droplet;
              return (
                <Reveal key={s.slug} delay={(i % 3) * 110}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
                  >
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
                    <div className="relative overflow-hidden">
                      <ImagePlaceholder
                        src={serviceImage[s.slug]}
                        alt={s.title}
                        sizes="(max-width:768px) 100vw, 33vw"
                        className="aspect-[16/10] transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute -bottom-6 left-6 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lift ring-4 ring-white">
                        <SvcIcon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6 pt-9">
                      <h2 className="font-display text-lg font-bold text-ink-900">{s.title}</h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{s.blurb}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                        Learn more
                        <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
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
