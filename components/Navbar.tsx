"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";

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
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md py-3"
          : "bg-white py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {/* Services Dropdown */}
            <div className="relative group/menu">
              <button className="flex items-center space-x-1 text-neutral-700 hover:text-primary font-medium text-sm transition-colors duration-200 py-2">
                <span>Services</span>
                <ChevronDown className="h-4 w-4 text-neutral-400 group-hover/menu:text-primary transition-colors" />
              </button>
              <div className="absolute left-0 mt-0 w-64 bg-white border border-neutral-100 rounded-md shadow-xl py-2 hidden group-hover/menu:block transition-all duration-200">
                {services.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Locations Dropdown */}
            <div className="relative group/menu">
              <button className="flex items-center space-x-1 text-neutral-700 hover:text-primary font-medium text-sm transition-colors duration-200 py-2">
                <span>Locations</span>
                <ChevronDown className="h-4 w-4 text-neutral-400 group-hover/menu:text-primary transition-colors" />
              </button>
              <div className="absolute left-0 mt-0 w-56 bg-white border border-neutral-100 rounded-md shadow-xl py-2 hidden group-hover/menu:block transition-all duration-200">
                {locations.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/about"
              className="text-neutral-700 hover:text-primary font-medium text-sm transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-neutral-700 hover:text-primary font-medium text-sm transition-colors duration-200"
            >
              Get a Quote
            </Link>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="tel:70238094"
              className="flex items-center space-x-2 text-primary font-bold hover:text-secondary transition-colors duration-200"
            >
              <div className="p-2 bg-neutral-100 rounded-full">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-semibold leading-none">Call Today</span>
                <span className="text-sm">7023 8094</span>
              </div>
            </a>
            <Link
              href="/contact"
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded font-bold text-sm tracking-wide shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200"
            >
              Get a Free Quote
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <a
              href="tel:70238094"
              className="p-2 text-primary hover:text-secondary transition-colors"
              aria-label="Call Us"
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-primary hover:bg-neutral-100 focus:outline-none"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 top-[73px] z-40 bg-white border-t border-neutral-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-4 pt-6 pb-8 space-y-6 bg-white h-full flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Mobile Services */}
            <div>
              <button
                onClick={() => toggleSubmenu("services")}
                className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <span>Services</span>
                <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${activeSubmenu === "services" ? "rotate-180" : ""}`} />
              </button>
              {activeSubmenu === "services" && (
                <div className="pl-6 space-y-2 mt-2">
                  {services.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-sm text-neutral-600 hover:text-primary font-medium"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Locations */}
            <div>
              <button
                onClick={() => toggleSubmenu("locations")}
                className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <span>Locations</span>
                <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${activeSubmenu === "locations" ? "rotate-180" : ""}`} />
              </button>
              {activeSubmenu === "locations" && (
                <div className="pl-6 space-y-2 mt-2">
                  {locations.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-sm text-neutral-600 hover:text-primary font-medium"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-semibold text-neutral-700 hover:text-primary hover:bg-neutral-50"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-semibold text-neutral-700 hover:text-primary hover:bg-neutral-50"
            >
              Get a Quote
            </Link>
          </div>

          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <a
              href="tel:70238094"
              className="flex items-center justify-center space-x-3 w-full bg-neutral-100 hover:bg-neutral-200 text-primary font-bold py-3.5 rounded transition-all duration-200"
            >
              <Phone className="h-5 w-5" />
              <span>7023 8094</span>
            </a>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded shadow transition-all duration-200"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

