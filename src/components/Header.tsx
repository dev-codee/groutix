"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { mainNav, services, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-ink-200 bg-card/90 backdrop-blur"
          : "border-transparent bg-card"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1680px] items-center gap-4 px-6 py-3 sm:px-10 lg:px-16">
        <Logo />

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {mainNav.map((item) =>
            item.href === "/services" ? (
              <div key={item.href} className="group relative">
                <Link
                  href="/services"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive("/services")
                      ? "text-brand-700"
                      : "text-ink-700 hover:text-brand-700"
                  }`}
                >
                  Services
                  <svg
                    viewBox="0 0 12 8"
                    className="h-2 w-2.5 transition-transform group-hover:rotate-180"
                    fill="currentColor"
                  >
                    <path d="M6 8 0 0h12z" />
                  </svg>
                </Link>
                <div className="invisible absolute left-0 top-full w-64 translate-y-2 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-2xl border border-ink-100 bg-card p-2 shadow-lift">
                    {services.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/services/${s.slug}`}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        {s.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "text-brand-700"
                    : "text-ink-700 hover:text-brand-700"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <ThemeToggle className="ml-auto lg:ml-2" />

        {/* Phone CTA */}
        <a
          href={site.phoneHref}
          className="hidden items-center gap-2.5 lg:ml-1 lg:flex"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-sm font-extrabold text-ink-900">{site.phone}</strong>
            <small className="text-[0.65rem] text-ink-500">We&apos;re ready to help</small>
          </span>
        </a>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-1 grid h-10 w-10 place-items-center rounded-lg text-ink-800 ring-1 ring-ink-200 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink-100 bg-card lg:hidden">
          <nav className="mx-auto flex max-w-[1680px] flex-col px-6 py-3 sm:px-10 lg:px-16">
            {mainNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-ink-100 py-3 text-base font-semibold text-ink-800"
                >
                  {item.label}
                </Link>
                {item.href === "/services" && (
                  <div className="flex flex-col border-b border-ink-100 py-1 pl-4">
                    {services.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/services/${s.slug}`}
                        onClick={() => setOpen(false)}
                        className="py-2 text-sm font-medium text-ink-600"
                      >
                        {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button href={site.phoneHref} size="lg" className="mt-4">
              Call {site.phone}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
