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
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://www.facebook.com/profile.php?id=61582570358855"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#1565d8] text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/groutix.au/"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-85 text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
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
                  href="tel:+61370238094"
                  className="block text-lg font-bold text-white hover:text-white/90 transition-colors"
                >
                  +61 3 7023 8094
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
