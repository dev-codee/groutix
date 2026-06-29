import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  crumb,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-surface">
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div className="anim-blob pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="anim-blob-slow pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
      <Container className="relative py-14 text-center sm:py-20">
        {crumb ? (
          <nav className="anim-fade-up mb-5 flex items-center justify-center gap-1.5 text-sm text-ink-400">
            {crumb.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-ink-300">/</span>}
                <Link href={c.href} className="transition-colors hover:text-brand-600">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
        {eyebrow ? (
          <div className="anim-fade-up">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        ) : null}
        <h1
          className="anim-fade-up mx-auto mt-4 max-w-4xl font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="anim-fade-up mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-600"
            style={{ animationDelay: "160ms" }}
          >
            {subtitle}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
