import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { testimonials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Read what Melbourne homeowners say about Groutix — rated 5.0 from 300+ reviews for leaking shower repairs, regrouting and waterproofing.",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-ink-200">{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Reviews"
        title="What your neighbours say"
        subtitle="We're proud of the work we do — but our customers say it best. Here's a selection of recent feedback from across Melbourne."
        crumb={[
          { label: "Home", href: "/" },
          { label: "Reviews", href: "/reviews" },
        ]}
      />

      {/* Rating summary */}
      <Section>
        <Container>
          <Reveal>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-ink-100 bg-card p-8 text-center shadow-soft sm:flex-row sm:justify-center sm:gap-8 sm:text-left">
              <div>
                <div className="font-display text-5xl font-extrabold text-ink-900">5.0</div>
                <Stars rating={5} />
              </div>
              <div className="hidden h-14 w-px bg-ink-100 sm:block" />
              <p className="max-w-xs text-ink-600">
                Rated an average of <strong className="text-ink-900">5.0</strong> from over{" "}
                <strong className="text-ink-900">300</strong> verified Melbourne reviews.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 110}>
                <figure className="flex h-full flex-col rounded-2xl border border-ink-100 bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                  <Icon.Quote className="h-9 w-9 text-brand-100" />
                  <blockquote className="mt-2 flex-1 text-ink-700">{t.quote}</blockquote>
                  <Stars rating={t.rating} />
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-sm font-bold text-white">
                      {t.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">{t.name}</span>
                      <span className="block text-xs text-ink-500">{t.suburb}, VIC</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection title="Join hundreds of happy Melbourne homeowners" />
    </>
  );
}
