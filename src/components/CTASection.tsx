import { Container } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { Reveal } from "@/components/Reveal";

const points = ["Free assessment", "No obligation", "Expert advice", "Fast response"];

export function CTASection({
  title = "Get your leak assessed today",
  kicker = "Don't wait until the damage spreads",
  blurb = "Free, no-obligation advice from Melbourne's leaking shower specialists. Honest answers and a fast response.",
}: {
  title?: string;
  kicker?: string;
  blurb?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1846b4] via-[#193e92] to-[#0b1320]">
      <div className="dot-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="anim-blob pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/30 blur-3xl" />
      <div className="anim-blob-slow pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
      <Container className="relative grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-24">
        <Reveal className="text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">{kicker}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-lg text-brand-100">{blurb}</p>
          <ul className="mt-7 grid max-w-md grid-cols-2 gap-3.5 text-sm font-medium text-white/90">
            {points.map((f) => (
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
  );
}
