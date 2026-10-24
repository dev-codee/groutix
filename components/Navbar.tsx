"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Menu, X, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { useContact } from "@/components/SiteContentProvider";
import { useGoogleRating } from "@/components/useGoogleRating";
const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

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
  const gr = useGoogleRating();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string>("melbourne");
  const [mobileLocationSubmenu, setMobileLocationSubmenu] = useState<string | null>(null);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const desktopNavRef = React.useRef<HTMLDivElement>(null);
  const mobileNavRef = React.useRef<HTMLElement>(null);
  const { phone, tel } = useContact();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setOpenDesktopMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeDesktopMenu = () => {
    setOpenDesktopMenu(null);
  };

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
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const panel = mobileNavRef.current;
    panel?.querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveSubmenu(null);
        setMobileLocationSubmenu(null);
      }
      if (event.key !== "Tab" || !panel) return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  // Close the mobile menu when resizing up to desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSubmenu = (menu: string) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveSubmenu(null);
    setMobileLocationSubmenu(null);
  };

  const services = [
    { name: "Shower Regrouting", href: "/shower-regrouting" },
    { name: "Leaking Shower Repair", href: "/leaking-shower-repair" },
    { name: "Balcony Leak Repair", href: "/balcony-leak-repairs" },
    // { name: "Shower Base Repair", href: "/shower-base-repair" },
    // { name: "Shower Screens", href: "/shower-screens" },
    { name: "Tile Regrouting", href: "/tile-regrouting" },
    { name: "Silicone & Recaulking", href: "/silicone-recaulking" },
    { name: "Epoxy Grout", href: "/epoxy-grout" },
    { name: "Small Tiling Jobs", href: "/small-tiling-jobs" },
    // { name: "Real Estate & Property Services", href: "/real-estate-property-services" },
  ];

  const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const locationMenu = [
    {
      name: "Melbourne",
      slug: "melbourne",
      href: "/locations/melbourne",
      suburbs: [
        "Abbotsford", "Airport West", "Albert Park", "Altona", "Altona Meadows", "Altona North",
        "Ascot Vale", "Avondale Heights", "Balaclava", "Balwyn", "Balwyn North", "Bayswater",
        "Bentleigh", "Bentleigh East", "Berwick", "Boronia", "Box Hill", "Box Hill North",
        "Brighton", "Broadmeadows", "Brooklyn", "Brunswick", "Brunswick East",
        "Brunswick West", "Bulleen", "Bundoora", "Camberwell", "Campbellfield", "Canterbury",
        "Carlton", "Carlton North", "Caroline Springs", "Carrum Downs", "Chelsea", "Cheltenham",
        "Clayton", "Clifton Hill", "Coburg", "Coburg North", "Collingwood", "Coolaroo",
        "Craigieburn", "Cranbourne", "Cremorne", "Croydon", "Croydon Hills", "Croydon North",
        "Croydon South", "Dallas", "Dandenong", "Deer Park", "Derrimut", "Docklands",
        "Doncaster", "Doncaster East", "Donvale", "East Melbourne", "Eltham", "Eltham North",
        "Epping", "Essendon", "Essendon North", "Essendon West", "Fawkner",
        "Ferntree Gully", "Fitzroy", "Fitzroy North", "Flemington", "Forest Hill", "Frankston",
        "Gladstone Park", "Glen Iris", "Glen Waverley", "Glenroy", "Greensborough", "Greenvale",
        "Hallam", "Hampton Park", "Hawthorn", "Hawthorn East", "Heidelberg",
        "Hoppers Crossing", "Keilor", "Keilor Downs", "Keilor East", "Kew",
        "Kew East", "Keysborough", "Kilsyth", "Knox", "Lalor", "Laverton",
        "Lilydale", "Lower Plenty", "Macleod", "Malvern", "Malvern East", "Maribyrnong",
        "McKinnon", "Meadow Heights", "Melbourne CBD", "Melton", "Melton South", "Mentone",
        "Middle Park", "Mill Park", "Montmorency", "Moonee Ponds", "Moorabbin", "Mooroolbark",
        "Mount Evelyn", "Mount Waverley", "Mulgrave", "Narre Warren", "Niddrie", "Noble Park",
        "North Melbourne", "Northcote", "Nunawading", "Oak Park", "Oakleigh", "Ormond",
        "Pakenham", "Parkville", "Patterson Lakes", "Plumpton", "Point Cook", "Port Melbourne",
        "Princes Hill", "Research", "Reservoir", "Richmond", "Ringwood",
        "Ringwood East", "Ringwood North", "Rosanna", "Seaford", "South Melbourne",
        "South Morang", "South Yarra", "Southbank", "Springvale", "St Kilda", "Strathmore",
        "Sunbury", "Sydenham", "Tarneit", "Templestowe",
        "Templestowe Lower", "Thomastown", "Thornbury", "Toorak", "Truganina", "Tullamarine",
        "Vermont", "Vermont South", "Wantirna", "Wantirna South", "Warrandyte", "Werribee",
        "West Melbourne", "Wheelers Hill", "Williams Landing", "Williamstown", "Williamstown North",
        "Windsor", "Wollert", "Wyndham Vale"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Geelong",
      slug: "geelong",
      href: "/locations/geelong",
      suburbs: [
        "Aireys Inlet", "Anakie", "Anglesea", "Barwon Heads", "Bell Park", "Bell Post Hill",
        "Belmont", "Breakwater", "Clifton Springs", "Corio", "Drumcondra", "Drysdale",
        "East Geelong", "Fairhaven", "Fyansford", "Geelong", "Geelong West", "Grovedale",
        "Hamlyn Heights", "Herne Hill", "Highton", "Indented Head", "Jan Juc", "Lara",
        "Leopold", "Little River", "Lorne", "Lovely Banks", "Manifold Heights", "Marshall",
        "Newcomb", "Newtown", "Norlane", "North Geelong", "North Shore", "Ocean Grove",
        "Point Lonsdale", "Portarlington", "Queenscliff", "South Geelong", "St Albans Park",
        "St Leonards", "Thomson", "Torquay", "Wallington", "Wandana Heights", "Waurn Ponds",
        "Whittington"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Ballarat",
      slug: "ballarat",
      href: "/locations/ballarat",
      suburbs: [
        "Alfredton", "Ballarat Central", "Ballarat East", "Ballarat North", "Black Hill",
        "Buninyong", "Clarendon", "Creswick", "Daylesford", "Delacombe", "Elaine",
        "Eureka", "Mount Clear", "Mount Helen", "Newlyn", "Redan", "Sebastopol", "Wendouree"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Frankston",
      slug: "frankston",
      href: "/locations/frankston",
      suburbs: [
        "Beaconsfield", "Berwick", "Clyde", "Cranbourne", "Frankston Central",
        "Frankston North", "Frankston South", "Harkaway", "Karingal", "Langwarrin",
        "Officer", "Seaford"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Lilydale",
      slug: "lilydale",
      href: "/locations/lilydale",
      suburbs: [
        "Chirnside Park", "Coldstream", "Doreen", "Emerald", "Hurstbridge",
        "Kangaroo Ground", "Lilydale Central", "Macclesfield", "Monbulk", "Mooroolbark",
        "Mount Evelyn", "Nutfield", "Silvan", "Watsons Creek"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Yarra Glen",
      slug: "yarra-glen",
      href: "/locations/yarra-glen",
      suburbs: [
        "Christmas Hills", "Dixons Creek", "Steels Creek", "Tarrawarra", "Yarra Glen Central"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
    {
      name: "Kilmore",
      slug: "kilmore",
      href: "/locations/kilmore",
      suburbs: [
        "Bylands", "Eden Park", "Hesket", "Hidden Valley", "Kilmore Central",
        "Kilmore East", "Lancefield", "Romsey", "Tylden", "Wallan", "Wandong",
        "Whittlesea", "Willowmavin", "Woodend", "Yan Yean"
      ].map(name => ({ name, slug: toSlug(name) })),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      <div className="w-full bg-white shadow-lg pointer-events-auto">
        {/* Top Dark Blue Bar */}
        <div className="bg-[#001f97] text-white px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-xs sm:text-[13px] font-medium tracking-tight overflow-hidden">
          {/* Left: Location Pin & Address */}
          <div className="flex items-center gap-1.5 text-white/95 truncate">
            <span className="text-sm select-none">📍</span>
            <a
              href="https://maps.google.com/?q=82A+Marigold+Cres+Gowanbrae+VIC+3043"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-white"
            >
              82A Marigold Cres, Gowanbrae VIC 3043 · Serving Melbourne &amp; Surrounds
            </a>
          </div>

          {/* Right: Email & Google Reviews */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-white/95">
            <a
              href="mailto:info@groutix.com"
              className="flex items-center gap-1.5 hover:underline hover:text-white"
            >
              <span className="text-sm select-none">✉️</span>
              <span>info@groutix.com</span>
            </a>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold tracking-widest text-xs">★★★★★</span>
              <span className="font-semibold">{gr.ratingLabel} · {gr.countLabel} Google Reviews</span>
            </div>
            <a
  href="https://www.facebook.com/profile.php?id=61582570358855"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Groutix on Facebook"
  className="text-white/85 hover:text-white transition-colors"
>
  <FacebookIcon className="h-4 w-4" />
</a>
<a
  href="https://www.instagram.com/groutix.au/"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Groutix on Instagram"
  className="text-white/85 hover:text-white transition-colors"
>
  <InstagramIcon className="h-4 w-4" />
</a>
          </div>
        </div>

        {/* Main White Nav Bar */}
        <div className="bg-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Logo (preserved original logo picture) */}
          <Link href="/" className="flex items-center group py-0.5">
            <Logo imageClassName="h-11 sm:h-12 md:h-14 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav ref={desktopNavRef} className="hidden lg:flex items-center space-x-6 xl:space-x-7">
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDesktopMenu("services")}
              onMouseLeave={() => setOpenDesktopMenu(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDesktopMenu(openDesktopMenu === "services" ? null : "services")}
                className="flex items-center gap-1 text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1 cursor-pointer"
                aria-expanded={openDesktopMenu === "services"}
              >
                <span>Services</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transform transition-transform duration-200 ${openDesktopMenu === "services" ? "rotate-180 text-[#001f97]" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 w-64 pt-2 transition-all duration-200 ease-out z-50 ${
                  openDesktopMenu === "services"
                    ? "opacity-100 translate-y-0 pointer-events-auto visible"
                    : "opacity-0 translate-y-2 pointer-events-none invisible"
                }`}
              >
                <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-2 space-y-1">
                  {services.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeDesktopMenu}
                      className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Locations Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDesktopMenu("locations")}
              onMouseLeave={() => setOpenDesktopMenu(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDesktopMenu(openDesktopMenu === "locations" ? null : "locations")}
                className="flex items-center gap-1 text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1 cursor-pointer"
                aria-expanded={openDesktopMenu === "locations"}
              >
                <span>Locations</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transform transition-transform duration-200 ${openDesktopMenu === "locations" ? "rotate-180 text-[#001f97]" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 w-[540px] pt-2 transition-all duration-200 ease-out z-50 ${
                  openDesktopMenu === "locations"
                    ? "opacity-100 translate-y-0 pointer-events-auto visible"
                    : "opacity-0 translate-y-2 pointer-events-none invisible"
                }`}
              >
                <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-4 grid grid-cols-5 gap-4">
                  {/* Left Column: Regions */}
                  <div className="col-span-2 space-y-1 border-r border-neutral-100 pr-2">
                    <p className="px-2 py-1 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                      Regions
                    </p>
                    {locationMenu.map((loc) => {
                      const isActive = hoveredLocation === loc.slug;
                      return (
                        <div
                          key={loc.slug}
                          onMouseEnter={() => setHoveredLocation(loc.slug)}
                          className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${isActive
                            ? "bg-primary text-white"
                            : "text-neutral-700 hover:bg-neutral-100 hover:text-primary"
                            }`}
                        >
                          <Link href={loc.href} onClick={closeDesktopMenu} className="flex-1">
                            {loc.name}
                          </Link>
                          <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-neutral-400"}`} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Suburbs List */}
                  <div className="col-span-3 pl-1">
                    {(() => {
                      const currentLoc = locationMenu.find((l) => l.slug === hoveredLocation) || locationMenu[0];
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <span className="text-xs font-bold tracking-wide text-primary uppercase flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-accent" />
                              {currentLoc.name} Suburbs ({currentLoc.suburbs.length})
                            </span>
                            <Link
                              href={currentLoc.href}
                              onClick={closeDesktopMenu}
                              className="text-[11px] font-bold text-accent hover:underline"
                            >
                              All {currentLoc.name} →
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-1 max-h-[300px] overflow-y-auto pr-1">
                            {currentLoc.suburbs.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/locations/${currentLoc.slug}/${sub.slug}`}
                                onClick={closeDesktopMenu}
                                className="block px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-accent/10 hover:text-accent rounded transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Our Process */}
            <Link
              href="/our-process"
              className="text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1"
            >
              Our Process
            </Link>

            {/* Gallery */}
            <Link
              href="/gallery"
              className="text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1"
            >
              Gallery
            </Link>

            {/* About Us Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDesktopMenu("about")}
              onMouseLeave={() => setOpenDesktopMenu(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDesktopMenu(openDesktopMenu === "about" ? null : "about")}
                className="flex items-center gap-1 text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1 cursor-pointer"
                aria-expanded={openDesktopMenu === "about"}
              >
                <span>About Us</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transform transition-transform duration-200 ${openDesktopMenu === "about" ? "rotate-180 text-[#001f97]" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 w-48 pt-2 transition-all duration-200 ease-out z-50 ${
                  openDesktopMenu === "about"
                    ? "opacity-100 translate-y-0 pointer-events-auto visible"
                    : "opacity-0 translate-y-2 pointer-events-none invisible"
                }`}
              >
                <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-2 space-y-1">
                  <Link
                    href="/about"
                    onClick={closeDesktopMenu}
                    className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                  >
                    About Groutix
                  </Link>
                  <Link
                    href="/about#team"
                    onClick={closeDesktopMenu}
                    className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                  >
                    Meet the Team
                  </Link>
                  <Link
                    href="/careers"
                    onClick={closeDesktopMenu}
                    className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                  >
                    Careers
                  </Link>
                  <Link
                    href="/terms-conditions"
                    onClick={closeDesktopMenu}
                    className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                  >
                    10-Year Warranty
                  </Link>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <Link
              href="/faq"
              className="text-slate-800 hover:text-[#001f97] font-semibold text-[15px] transition-colors py-1"
            >
              FAQs
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Phone outlined pill */}
            <a
              href="tel:+61370238094"
              className="hidden md:flex items-center gap-2 border border-blue-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-xl px-4 py-2 text-[#001f97] font-bold text-[15px] shadow-2xs transition-all whitespace-nowrap"
            >
              <Phone className="h-4 w-4 text-[#001f97]" strokeWidth={2.2} />
              <span>(03) 7023 8094</span>
            </a>

            {/* Solid CTA Button */}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-[#001f97] hover:bg-[#001773] text-white font-bold text-[15px] px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              Get a Free Quote
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
            <a
              href={tel}
              className="p-2 text-[#001f97] hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Call Us"
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                setActiveSubmenu("services");
              }}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-[#001f97] hover:bg-blue-50 focus:outline-none cursor-pointer"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation"
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
              className="pointer-events-auto lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              ref={mobileNavRef}
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="pointer-events-auto lg:hidden fixed top-0 right-0 z-[70] flex h-[100dvh] w-[90%] max-w-sm flex-col bg-white shadow-2xl"
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
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
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4">
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
                              className="flex min-h-11 items-center py-2 text-base font-medium text-neutral-600 hover:text-accent"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Area of Service & Suburbs */}
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
                        <div className="space-y-2 pl-4 pt-1 pb-1">
                          {locationMenu.map((loc) => (
                            <div key={loc.slug} className="border-l-2 border-neutral-200 pl-3">
                              <div className="flex items-center justify-between py-1">
                                <Link
                                  href={loc.href}
                                  onClick={closeMenu}
                                  className="text-base font-bold text-primary hover:text-accent"
                                >
                                  {loc.name}
                                </Link>
                                <button
                                  onClick={() => setMobileLocationSubmenu(mobileLocationSubmenu === loc.slug ? null : loc.slug)}
                                  className="p-1 text-neutral-400 hover:text-primary"
                                >
                                  <ChevronDown className={`h-4 w-4 transform transition-transform ${mobileLocationSubmenu === loc.slug ? "rotate-180" : ""}`} />
                                </button>
                              </div>

                              {mobileLocationSubmenu === loc.slug && (
                                <div className="pl-2 pt-1 pb-2 space-y-1 max-h-[250px] overflow-y-auto">
                                  {loc.suburbs.map((sub) => (
                                    <Link
                                      key={sub.slug}
                                      href={`/locations/${loc.slug}/${sub.slug}`}
                                      onClick={closeMenu}
                                      className="block py-1 text-sm font-medium text-neutral-500 hover:text-accent"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/our-process"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent"
                >
                  Our Process
                </Link>

                <Link
                  href="/gallery"
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10 hover:text-accent"
                >
                  Gallery
                </Link>

                {/* Mobile About Us */}
                <div>
                  <button
                    onClick={() => toggleSubmenu("about")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10"
                    aria-expanded={activeSubmenu === "about"}
                  >
                    <span>About Us</span>
                    <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${activeSubmenu === "about" ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {activeSubmenu === "about" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pl-6 pt-1 pb-1">
                          <Link
                            href="/about"
                            onClick={closeMenu}
                            className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                          >
                            About Groutix
                          </Link>
                          <Link
                            href="/about#team"
                            onClick={closeMenu}
                            className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                          >
                            Meet the Team
                          </Link>
                          <Link
                            href="/careers"
                            onClick={closeMenu}
                            className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                          >
                            Careers
                          </Link>
                          <Link
                            href="/terms-conditions"
                            onClick={closeMenu}
                            className="block py-2 text-base font-medium text-neutral-600 hover:text-accent"
                          >
                            10-Year Warranty
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                  Get a Free Quote
                </Link>
              </div>

              {/* Footer CTAs */}
              <div className="flex-shrink-0 space-y-3 border-t border-neutral-100 px-4 py-4">
                <a
                  href={tel}
                  className="flex w-full items-center justify-center space-x-3 rounded bg-secondary py-3.5 font-bold text-white transition-all duration-200 hover:bg-secondary-hover"
                >
                  <Phone className="h-5 w-5" />
                  <span>{phone}</span>
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
