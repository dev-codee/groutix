"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

// Nav link component with underline animation
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="relative text-neutral-700 hover:text-accent font-medium text-base transition-colors duration-200 py-2"
  >
    <span className="relative">
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-200 ease-in-out hover:w-full"></span>
    </span>
  </Link>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close the mobile menu when resizing up to desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const toggleSubmenu = (menu: string) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  const services = [
    { name: "Shower Regrouting", href: "/shower-regrouting" },
    { name: "Shower Base Repair", href: "/shower-base-repair" },
    { name: "Tile Regrouting", href: "/tile-regrouting" },
    { name: "Leaking Shower Repair", href: "/leaking-shower-repair" },
    { name: "Small Tiling Jobs", href: "/small-tiling-jobs" },
    { name: "Real Estate & Property Services", href: "/real-estate-property-services" },
  ];

  const locations = [
    { name: "Melbourne", href: "/locations" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {/* Services Dropdown */}
            <div className="relative group/menu">
              <button className="relative flex items-center space-x-1 text-neutral-700 hover:text-accent font-medium text-base transition-colors duration-200 py-2">
                <span className="relative">
                  Services
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-200 ease-in-out group-hover/menu:w-full"></span>
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-400 group-hover/menu:text-accent transition-colors" />
              </button>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 mt-0 w-64 bg-white border border-neutral-100 rounded-md shadow-xl py-2 hidden group-hover/menu:block"
              >
                {services.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </motion.div>
            </div>

            {/* Locations Dropdown */}
            <div className="relative group/menu">
              <button className="relative flex items-center space-x-1 text-neutral-700 hover:text-accent font-medium text-base transition-colors duration-200 py-2">
                <span className="relative">
                  Locations
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-200 ease-in-out group-hover/menu:w-full"></span>
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-400 group-hover/menu:text-accent transition-colors" />
              </button>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 mt-0 w-56 bg-white border border-neutral-100 rounded-md shadow-xl py-2 hidden group-hover/menu:block"
              >
                {locations.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </motion.div>
            </div>

            <NavLink href="/about">About Us</NavLink>
            <NavLink href="/faq">FAQs</NavLink>
            <NavLink href="/contact">Get a Quote</NavLink>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="tel:70238094"
              className="flex items-center space-x-2 text-primary font-bold hover:text-accent transition-colors duration-200"
            >
              <div className="p-2 bg-accent/15 rounded-full">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-neutral-500 font-semibold leading-none">Call Today</span>
                <span className="text-base">7023 8094</span>
              </div>
            </a>
            <Link
              href="/contact"
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded font-bold text-base tracking-wide shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200"
            >
              Get a Free Quote
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <a
              href="tel:70238094"
              className="p-2 text-primary hover:text-accent transition-colors"
              aria-label="Call Us"
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-accent hover:bg-accent/10 focus:outline-none"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu: backdrop + slide-in sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 right-0 z-[70] flex h-[100dvh] w-[85%] max-w-sm flex-col bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              {/* Panel header */}
              <div className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-neutral-100 px-4">
                <Link href="/" onClick={closeMenu} className="flex items-center">
                  <Logo />
                </Link>
                <button
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="rounded-md p-2 text-neutral-500 hover:bg-accent/10 hover:text-accent"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Scrollable links */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
                {/* Mobile Services */}
                <div>
                  <button
                    onClick={() => toggleSubmenu("services")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10"
                    aria-expanded={activeSubmenu === "services"}
                  >
                    <span>Services</span>
                    <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${activeSubmenu === "services" ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {activeSubmenu === "services" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pl-6 pt-1 pb-1">
                          {services.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMenu}
                              className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Locations */}
                <div>
                  <button
                    onClick={() => toggleSubmenu("locations")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10"
                    aria-expanded={activeSubmenu === "locations"}
                  >
                    <span>Locations</span>
                    <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${activeSubmenu === "locations" ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {activeSubmenu === "locations" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pl-6 pt-1 pb-1">
                          {locations.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMenu}
                              className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/about"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent"
                >
                  About Us
                </Link>
                <Link
                  href="/faq"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent"
                >
                  FAQs
                </Link>
                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent"
                >
                  Get a Quote
                </Link>
              </div>

              {/* Footer CTAs */}
              <div className="flex-shrink-0 space-y-3 border-t border-neutral-100 px-4 py-4">
                <a
                  href="tel:70238094"
                  className="flex w-full items-center justify-center space-x-3 rounded bg-secondary py-3.5 font-bold text-white transition-all duration-200 hover:bg-secondary-hover"
                >
                  <Phone className="h-5 w-5" />
                  <span>7023 8094</span>
                </a>
                <Link
                  href="/contact"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-center rounded bg-primary py-3.5 font-bold text-white shadow transition-all duration-200 hover:bg-primary-hover active:scale-95"
                >
                  Get a Free Quote
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

