import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "@/components/Logo";

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current strokeWidth-2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
  ),
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#001F97] text-white pt-16 pb-8 border-t border-[#001579]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-neutral-800">
          {/* Company Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center group">
              <Logo light={true} />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Australia&apos;s trusted shower regrouting and tile repair specialist. Over 20 years of experience resolving leaking showers and damaged tiles with quality workmanship and a leading 10-year warranty.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-neutral-800 hover:bg-primary hover:text-white rounded-full transition-all duration-200"
                aria-label="Facebook"
              >
                <SocialIcons.Facebook />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-neutral-800 hover:bg-primary hover:text-white rounded-full transition-all duration-200"
                aria-label="Instagram"
              >
                <SocialIcons.Instagram />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-neutral-800 hover:bg-primary hover:text-white rounded-full transition-all duration-200"
                aria-label="Twitter"
              >
                <SocialIcons.Twitter />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-neutral-800 hover:bg-primary hover:text-white rounded-full transition-all duration-200"
                aria-label="LinkedIn"
              >
                <SocialIcons.Linkedin />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wide uppercase mb-6">Services</h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link href="/shower-regrouting" className="hover:text-white transition-colors duration-200">
                  Shower Regrouting
                </Link>
              </li>
              <li>
                <Link href="/shower-base-repair" className="hover:text-white transition-colors duration-200">
                  Shower Base Repair
                </Link>
              </li>
              <li>
                <Link href="/tile-regrouting" className="hover:text-white transition-colors duration-200">
                  Tile Regrouting
                </Link>
              </li>
              <li>
                <Link href="/leaking-shower-repair" className="hover:text-white transition-colors duration-200">
                  Leaking Shower Repair
                </Link>
              </li>
              <li>
                <Link href="/small-tiling-jobs" className="hover:text-white transition-colors duration-200">
                  Small Tiling Jobs
                </Link>
              </li>
              <li>
                <Link href="/real-estate-property-services" className="hover:text-white transition-colors duration-200">
                  Real Estate &amp; Property Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations Column */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wide uppercase mb-6">Location</h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link href="/locations" className="hover:text-white transition-colors duration-200">
                  Melbourne
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-bold text-base tracking-wide uppercase mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="tel:70238094"
                  className="flex items-start space-x-3 hover:text-white transition-colors duration-200"
                >
                  <Phone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold">7023 8094</span>
                    <span className="text-xs text-neutral-500">Call Today (7023 8094)</span>
                  </div>
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold">info@groutix.com.au</span>
                  <span className="text-xs text-neutral-500 font-medium">Fast online responses</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold">Office Hours</span>
                  <span className="text-xs text-neutral-500">Mon - Fri: 8:00am - 5:00pm</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 space-y-4 md:space-y-0">
          <div>
            &copy; {currentYear} GROUTIX. All rights reserved. Built with Next.js &amp; Tailwind CSS.
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-neutral-300 transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/sitemap" className="hover:text-neutral-300 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
