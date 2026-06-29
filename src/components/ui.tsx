import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1680px] px-6 sm:px-10 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  className = "",
  muted = false,
  children,
  id,
}: {
  className?: string;
  muted?: boolean;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-24 lg:py-28 ${muted ? "bg-surface" : "bg-background"} ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={`${center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 text-lg leading-relaxed text-ink-600 sm:text-xl">{subtitle}</p>
      ) : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5",
  secondary:
    "bg-card text-ink-800 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand-700",
  ghost: "text-brand-700 hover:bg-brand-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  href?: string;
  children: ReactNode;
} & Partial<ComponentProps<"button">>) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
  if (href) {
    const external = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
    if (external) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-ink-700">
      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-600 text-white">
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 10.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
