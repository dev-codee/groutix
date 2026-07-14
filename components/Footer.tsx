"use client";
import React from "react";
import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current strokeWidth-2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
  ),
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="bg-[#001F97] text-white pt-16 pb-8 border-t border-[#001579] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,214,79,0.18),_transparent_55%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-neutral-800">
          {/* Company Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.0 }}
            className="space-y-6"
          >
            <Link href="/" className="flex items-center group">
              <Logo light={true} />
            </Link>
            <p className="text-base text-neutral-400 leading-relaxed">
              Expert shower regrouting, grout fixes, and leaky shower restoration for homes and managed properties. Groutix helps restore tiled wet areas with quality work and a top <span className="text-accent font-bold">10-year guarantee</span>.
            </p>
            <div className="flex space-x-4">
              {["Facebook", "Instagram", "Twitter", "Linkedin"].map((social, i) => (
                <motion.a
                  key={social}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  href={`https://${social.toLowerCase()}.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-neutral-800 hover:bg-accent hover:text-primary rounded-full transition-all duration-200"
                  aria-label={social}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {social === "Facebook" && <SocialIcons.Facebook />}
                  {social === "Instagram" && <SocialIcons.Instagram />}
                  {social === "Twitter" && <SocialIcons.Twitter />}
                  {social === "Linkedin" && <SocialIcons.Linkedin />}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Services Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <h3 className="text-accent font-bold text-base tracking-wide uppercase mb-6 text-center">Services</h3>
            <ul className="grid grid-cols-2 gap-y-3.5 gap-x-1 text-base text-center">
              {[
                { href: "/shower-regrouting", label: "Shower Regrouting" },
                { href: "/shower-base-repair", label: "Shower Base Repair" },
                { href: "/tile-regrouting", label: "Tile Regrouting" },
                { href: "/balcony-leak-repairs", label: "Balcony Leak Repairs" },
                { href: "/silicone-recaulking", label: "Silicone & Recaulking" },
                { href: "/epoxy-grout", label: "Epoxy Grout" },
                { href: "/leaking-shower-repair", label: "Leaking Shower Repair" },
                { href: "/small-tiling-jobs", label: "Small Tiling Jobs" },
                { href: "/real-estate-property-services", label: "Real Estate & Property" },
              ].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Link href={item.href} className="hover:text-accent transition-colors duration-200 whitespace-nowrap">
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Locations Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-accent font-bold text-base tracking-wide uppercase mb-6">Service Areas</h3>
            <ul className="space-y-3.5 text-base">
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/locations" className="hover:text-accent transition-colors duration-200">
                  Victoria
                </Link>
              </motion.li>
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-accent font-bold text-base tracking-wide uppercase mb-6">Contact Us</h3>
            <ul className="space-y-4 text-base">
              <motion.li
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <a
                  href="tel:70238094"
                  className="flex items-start space-x-3 hover:text-accent transition-colors duration-200"
                >
                  <Phone className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold">7023 8094</span>
                    <span className="text-sm text-neutral-500">Talk through your repair</span>
                  </div>
                </a>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="flex items-start space-x-3"
              >
                <Mail className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold">info@groutix.com</span>
                  <span className="text-sm text-neutral-500 font-medium">Request a quote or send shower photos</span>
                </div>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-start space-x-3"
              >
                <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold">Office Hours</span>
                  <span className="block text-sm text-neutral-500">Mon – Fri: 9am – 5pm</span>
                  <span className="block text-sm text-neutral-500">Sat – Sun: 10am – 3pm</span>
                </div>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500 space-y-4 md:space-y-0"
        >
          <div>
            &copy; {currentYear} Groutix. All rights reserved. Built with Next.js &amp; Tailwind CSS.
          </div>
          <div className="flex space-x-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55 }}
            >
              <Link href="/faq" className="hover:text-accent transition-colors">
                FAQs
              </Link>
            </motion.div>
            {["Privacy Policy", "Terms & Conditions", "Sitemap"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <Link
                  href={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                  className="hover:text-accent transition-colors"
                >
                  {item}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
