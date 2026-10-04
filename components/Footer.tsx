"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useContact } from "@/components/SiteContentProvider";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { phone, tel, email, mailto } = useContact();
  const [logoSrc, setLogoSrc] = useState("/new_logo.jpeg");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.logoUrl) setLogoSrc(d.logoUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#0b1a53] text-white pt-14 pb-8 border-t border-[#091544] relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand / Description / Reviews / Socials */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center group">
              <Image
                src={logoSrc}
                alt="Groutix Logo"
                width={260}
                height={80}
                priority
                unoptimized
                className="h-10 sm:h-12 w-auto object-contain rounded-md"
              />
            </Link>
            <p className="text-sm text-white/80 leading-relaxed font-normal">
              Shower regrouting, epoxy grouting, silicone replacement and leaking shower repairs across Melbourne.
            </p>
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <span className="text-amber-400 font-bold tracking-widest text-xs">★★★★★</span>
                <span className="font-semibold text-white/90">5.0 · 290+ Google reviews</span>
              </div>
            </div>
            {/* Social Icons: circular dark buttons 'f' and 'ig' */}
            <div className="flex items-center space-x-2.5 pt-2">
              <a
                href="https://www.facebook.com/profile.php?id=61582570358855"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-xs font-bold transition-colors"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="https://www.instagram.com/groutix.au/"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-xs font-bold transition-colors"
                aria-label="Instagram"
              >
                ig
              </a>
            </div>
          </div>

          {/* Column 2: SERVICES */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-5">
              SERVICES
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/shower-regrouting" className="hover:text-white transition-colors">
                  Shower Regrouting
                </Link>
              </li>
              <li>
                <Link href="/leaking-shower-repair" className="hover:text-white transition-colors">
                  Leaking Shower Repair
                </Link>
              </li>
              <li>
                <Link href="/balcony-leak-repairs" className="hover:text-white transition-colors">
                  Balcony Leak Repairs
                </Link>
              </li>
              <li>
                <Link href="/tile-regrouting" className="hover:text-white transition-colors">
                  Tile Regrouting
                </Link>
              </li>
              <li>
                <Link href="/shower-base-repair" className="hover:text-white transition-colors">
                  Shower Base Repair
                </Link>
              </li>
              <li>
                <Link href="/shower-screens" className="hover:text-white transition-colors">
                  Shower Screens
                </Link>
              </li>
              <li>
                <Link href="/silicone-recaulking" className="hover:text-white transition-colors">
                  Silicone &amp; Recaulking
                </Link>
              </li>
              <li>
                <Link href="/epoxy-grout" className="hover:text-white transition-colors">
                  Epoxy Grout
                </Link>
              </li>
              <li>
                <Link href="/small-tiling-jobs" className="hover:text-white transition-colors">
                  Small Tiling Jobs
                </Link>
              </li>
              <li>
                <Link href="/real-estate-property-services" className="hover:text-white transition-colors">
                  Real Estate &amp; Property Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: SERVICE AREAS */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-5">
              SERVICE AREAS
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/locations/melbourne" className="hover:text-white transition-colors">
                  Melbourne
                </Link>
              </li>
              <li>
                <Link href="/locations/geelong" className="hover:text-white transition-colors">
                  Geelong
                </Link>
              </li>
              <li>
                <Link href="/locations/ballarat" className="hover:text-white transition-colors">
                  Ballarat
                </Link>
              </li>
              <li>
                <Link href="/locations/frankston" className="hover:text-white transition-colors">
                  Frankston
                </Link>
              </li>
              <li>
                <Link href="/locations/lilydale" className="hover:text-white transition-colors">
                  Lilydale
                </Link>
              </li>
              <li>
                <Link href="/locations/yarra-glen" className="hover:text-white transition-colors">
                  Yarra Glen
                </Link>
              </li>
              <li>
                <Link href="/locations/kilmore" className="hover:text-white transition-colors">
                  Kilmore
                </Link>
              </li>
            </ul>
            <div className="pt-4 text-xs text-white/60 leading-relaxed">
              <Link href="/locations" className="hover:text-white/90 transition-colors">
                → /locations hub. Regions only — the 176 suburbs stay in the header mega menu.
              </Link>
            </div>
          </div>

          {/* Column 4: CONTACT */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-5">
              CONTACT
            </h3>
            <div className="space-y-3 text-sm text-white/80">
              <div>
                <p className="font-bold text-white">Groutix</p>
                <p className="text-white/80">82A Marigold Cres,</p>
                <p className="text-white/80">Gowanbrae VIC 3043</p>
                <a
                  href="https://maps.google.com/?q=82A+Marigold+Cres+Gowanbrae+VIC+3043"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-300 hover:underline block pt-1"
                >
                  Find us on Google Maps →
                </a>
              </div>

              <div>
                <a
                  href={tel || "tel:+61370238094"}
                  className="block text-lg font-bold text-white hover:text-white/90 transition-colors"
                >
                  (03) 7023 8094
                </a>
                <a
                  href={mailto || "mailto:info@groutix.com"}
                  className="text-sm text-white/80 hover:underline block pt-0.5"
                >
                  info@groutix.com
                </a>
              </div>

              <div className="pt-1 text-xs text-white/70 space-y-0.5">
                <p>Mon–Sat: 9:00 AM – 6:30 PM</p>
                <p>Sun: 11:00 AM – 10:00 PM</p>
              </div>
            </div>
          </div>

          {/* Column 5: COMPANY */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-5">
              COMPANY
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Groutix
                </Link>
              </li>
              <li>
                <Link href="/about#team" className="hover:text-white transition-colors">
                  Meet the Team
                </Link>
              </li>
              <li>
                <Link href="/#reviews" className="hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <div>
            © {currentYear} Groutix. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
