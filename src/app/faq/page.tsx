import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { Accordion } from "@/components/Accordion";
import { Reveal } from "@/components/Reveal";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about leaking shower repairs, regrouting, warranties, timeframes and pricing — answered by the Groutix team.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Everything you might want to know before booking. Can't find your answer? Just get in touch and we'll help."
        crumb={[
          { label: "Home", href: "/" },
          { label: "FAQ", href: "/faq" },
        ]}
      />

      <Section>
        <Container>
          <Reveal>
            <Accordion items={faqs} />
          </Reveal>
        </Container>
      </Section>

      <CTASection title="Still have a question?" kicker="We're happy to help" />
    </>
  );
}
