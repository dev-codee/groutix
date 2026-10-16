"use client";

// Site-wide footer (5 columns: brand, services, service areas, company, contact).
// Phone, email and the Google rating come from the site content provider, so they
// update automatically (admin settings + live Google rating from the layout).

import Link from "next/link";
import Logo from "@/components/Logo";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { BUSINESS, GOOGLE_REVIEW_COUNT, GOOGLE_REVIEW_COUNT_LABEL } from "@/lib/seo";

const SERVICES: [string, string][] = [
  ["Shower Regrouting", "/shower-regrouting"],
  ["Leaking Shower Repair", "/leaking-shower-repair"],
  ["Balcony Leak Repair", "/balcony-leak-repairs"],
  ["Tile Regrouting", "/tile-regrouting"],
  ["Silicone & Recaulking", "/silicone-recaulking"],
  ["Epoxy Grout", "/epoxy-grout"],
  ["Small Tiling Jobs", "/small-tiling-jobs"],
];

const AREAS: [string, string][] = [
  ["Melbourne", "/locations/melbourne"],
  ["Geelong", "/locations/geelong"],
  ["Ballarat", "/locations/ballarat"],
  ["Frankston", "/locations/frankston"],
  ["Lilydale", "/locations/lilydale"],
  ["Yarra Glen", "/locations/yarra-glen"],
  ["Kilmore", "/locations/kilmore"],
];

const COMPANY: [string, string][] = [
  ["About Groutix", "/about"],
  ["Meet the Team", "/about#team"],
  ["Reviews", "/#reviews"],
  ["Property Managers", "/real-estate-property-services"],
  ["Warranty", "/terms-conditions"],
  ["FAQs", "/faq"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
];

const heading = "mb-4 text-[13px] font-bold uppercase tracking-[1.5px] text-white";
const listLink = "text-sm leading-[2.1] text-white/75 transition-colors hover:text-white";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { phone, tel, email, mailto } = useContact();
  const { business } = useSiteContent();

  // Live Google rating (refreshed daily in the layout); falls back to the stored figure.
  const ratingValue = business.rating?.value ?? BUSINESS.rating.value;
  const ratingCount = business.rating?.count ?? GOOGLE_REVIEW_COUNT;
  const countLabel = ratingCount === GOOGLE_REVIEW_COUNT ? GOOGLE_REVIEW_COUNT_LABEL : ratingCount.toLocaleString("en-AU");

  return (
    <footer className="relative overflow-hidden border-t border-[#091544] bg-[#0b1a53] font-sans text-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-6 pt-16 sm:px-10 lg:px-20 xl:px-28">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-white/10 pb-10 md:grid-cols-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] lg:gap-x-9">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" aria-label="Groutix home" className="inline-flex">
              <Logo imageClassName="h-11 w-auto rounded-md object-contain sm:h-12" />
            </Link>
            <p className="my-4 max-w-[340px] text-sm leading-relaxed text-white/75">
              Shower regrouting, epoxy grouting, silicone replacement and leaking shower repairs across Melbourne.
            </p>
            <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
              <span className="tracking-[1px] text-[#FBBC04]" aria-hidden="true">★★★★★</span>
              <span>{ratingValue.toFixed(1)} · {countLabel} Google reviews</span>
            </a>
            <div className="mt-5 flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/profile.php?id=61582570358855"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Groutix on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877F2] text-white transition hover:scale-105 hover:bg-[#1565D8]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/groutix.au/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Groutix on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(45deg,#F58529_0%,#DD2A7B_50%,#8134AF_80%,#515BD4_100%)] text-white transition hover:scale-105 hover:opacity-90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <nav aria-label="Services">
            <h3 className={heading}>Services</h3>
            <ul>
              {SERVICES.map(([label, href]) => (
                <li key={href}><Link href={href} className={listLink}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Service areas */}
          <nav aria-label="Service areas">
            <h3 className={heading}>Service Areas</h3>
            <ul>
              {AREAS.map(([label, href]) => (
                <li key={href}><Link href={href} className={listLink}>{label}</Link></li>
              ))}
              <li><Link href="/locations" className="text-sm font-bold leading-[2.1] text-white hover:underline">All areas →</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company" className="col-span-2 md:col-span-1">
            <h3 className={heading}>Company</h3>
            <ul className="grid grid-cols-2 gap-x-6 md:block">
              {COMPANY.map(([label, href]) => (
                <li key={label}><Link href={href} className={listLink}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className={heading}>Contact</h3>
            <address className="text-sm not-italic leading-[1.75] text-white/75">
              <span className="font-bold text-white">Groutix</span><br />
              82A Marigold Cres,<br />
              Gowanbrae VIC 3043
            </address>
            <a href={tel} className="mt-3 block text-[17px] font-bold text-white hover:text-white/90">{phone}</a>
            <a href={mailto} className="block text-sm leading-[2.1] text-white/75 hover:text-white">{email}</a>
            <p className="mt-1 text-[13px] leading-relaxed text-white/60">
              Mon–Sat: 9:00 AM – 6:30 PM<br />
              Sun: 11:00 AM – 10:00 PM
            </p>
            <a
              href="https://maps.google.com/?q=82A+Marigold+Cres+Gowanbrae+VIC+3043"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-[#8FB0F5] hover:underline"
            >
              Find us on Google Maps →
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[13px] text-white/60 sm:flex-row">
          <span>© {currentYear} Groutix. All rights reserved.</span>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-5">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms-conditions" className="hover:text-white">Terms &amp; Conditions</Link>
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
