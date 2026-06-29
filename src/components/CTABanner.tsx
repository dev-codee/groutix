import { Container, Button, ArrowIcon } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export function CTABanner({
  title = "Ready to get started?",
  blurb = "Book a free, no-obligation assessment and we'll take it from there.",
  href = "/contact",
}: {
  title?: string;
  blurb?: string;
  href?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900">
      <div className="dot-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="anim-blob pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/30 blur-3xl" />
      <Container className="relative">
        <Reveal className="flex flex-col items-center gap-6 py-14 text-center lg:flex-row lg:justify-between lg:py-16 lg:text-left">
          <div className="text-white">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-xl text-brand-100">{blurb}</p>
          </div>
          <div className="flex flex-none flex-wrap justify-center gap-3">
            <Button href={href} size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              Get a Free Assessment <ArrowIcon />
            </Button>
            <Button
              href={site.phoneHref}
              size="lg"
              className="border-white/40 bg-transparent text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              Call {site.phone}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
