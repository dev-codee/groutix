import Link from "next/link";
import { Logo } from "@/components/Logo";
import { mainNav, services, site } from "@/lib/site";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="currentColor">
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M12 22s8-4 8-10a8 8 0 10-16 0c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0b1320] text-slate-300">
      <div className="mx-auto grid max-w-[1680px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] lg:px-16">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
            {site.description}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-slate-400 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={site.phoneHref} className="flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white">
                <PhoneIcon /> {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white">
                <MailIcon /> {site.email}
              </a>
            </li>
            <li>
              <a href={`https://${site.website}`} className="flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white">
                <GlobeIcon /> {site.website}
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-slate-400">
              <span className="mt-0.5"><PinIcon /></span>
              <span>{site.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1680px] px-6 py-5 text-center text-sm font-semibold text-slate-400 sm:px-10 lg:px-16">
          © {new Date().getFullYear()} {site.name}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
