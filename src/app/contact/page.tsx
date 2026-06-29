import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { LeadForm } from "@/components/LeadForm";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Groutix — Melbourne's leaking shower specialists. Call, email or book a free, no-obligation leak assessment.",
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M12 22s8-4 8-10a8 8 0 10-16 0c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

const contactCards = [
  { label: "Email", value: site.email, href: `mailto:${site.email}`, Icon: MailIcon },
  { label: "Website", value: site.website, href: `https://${site.website}`, Icon: GlobeIcon },
  { label: "Phone", value: site.phone, href: site.phoneHref, Icon: PhoneIcon },
  { label: "Location", value: site.address, href: null, Icon: PinIcon },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Contact us"
        subtitle="Have a question, need a hand, or want to share feedback? Our team is here to help you every step of the way."
        crumb={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      />

      <Section>
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Contact details */}
          <Reveal>
            <h2 className="font-display text-2xl font-extrabold text-ink-900">
              Contact information
            </h2>
            <p className="mt-2 text-ink-600">
              Reach out through whichever option suits you best — we&apos;d love to
              hear from you.
            </p>
            <div className="mt-8 space-y-4">
              {contactCards.map((c) => {
                const Inner = (
                  <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white">
                      <c.Icon />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-ink-400">
                        {c.label}
                      </span>
                      <span className="mt-0.5 block font-semibold text-ink-900">{c.value}</span>
                    </span>
                  </div>
                );
                return c.href ? (
                  <a key={c.label} href={c.href} className="block">
                    {Inner}
                  </a>
                ) : (
                  <div key={c.label}>{Inner}</div>
                );
              })}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-5 text-sm text-brand-800 ring-1 ring-brand-100">
              <Icon.Clock className="mt-0.5 h-5 w-5 flex-none text-brand-600" />
              <span>
                <strong className="font-semibold">Fast response. </strong>
                Servicing Melbourne and surrounding suburbs. We aim to get back to
                every enquiry quickly.
              </span>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={120}>
            <LeadForm />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
