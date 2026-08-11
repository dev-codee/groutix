"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Menu, X, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { useContact } from "@/components/SiteContentProvider";

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
  const [hoveredLocation, setHoveredLocation] = useState<string>("melbourne");
  const [mobileLocationSubmenu, setMobileLocationSubmenu] = useState<string | null>(null);
  const { phone, tel } = useContact();

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
    { name: "Shower Base Repair", href: "/shower-base-repair" },
    // { name: "Shower Screens", href: "/shower-screens" },
    { name: "Tile Regrouting", href: "/tile-regrouting" },
    { name: "Balcony Leak Repairs", href: "/balcony-leak-repairs" },
    { name: "Silicone & Recaulking", href: "/silicone-recaulking" },
    { name: "Epoxy Grout", href: "/epoxy-grout" },
    { name: "Small Tiling Jobs", href: "/small-tiling-jobs" },
    { name: "Real Estate & Property Services", href: "/real-estate-property-services" },
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
        "Brighton", "Brighton East", "Broadmeadows", "Brooklyn", "Brunswick", "Brunswick East",
        "Brunswick West", "Bulleen", "Bundoora", "Camberwell", "Campbellfield", "Canterbury",
        "Carlton", "Carlton North", "Caroline Springs", "Carrum Downs", "Chelsea", "Cheltenham",
        "Clayton", "Clifton Hill", "Coburg", "Coburg North", "Collingwood", "Coolaroo",
        "Craigieburn", "Cranbourne", "Cremorne", "Croydon", "Croydon Hills", "Croydon North",
        "Croydon South", "Dallas", "Dandenong", "Deer Park", "Derrimut", "Docklands",
        "Doncaster", "Doncaster East", "Donvale", "East Melbourne", "Eltham", "Eltham North",
        "Elwood", "Epping", "Essendon", "Essendon North", "Essendon West", "Fawkner",
        "Ferntree Gully", "Fitzroy", "Fitzroy North", "Flemington", "Forest Hill", "Frankston",
        "Gladstone Park", "Glen Iris", "Glen Waverley", "Glenroy", "Greensborough", "Greenvale",
        "Hallam", "Hampton", "Hampton Park", "Hawthorn", "Hawthorn East", "Heidelberg",
        "Highett", "Hoppers Crossing", "Keilor", "Keilor Downs", "Keilor East", "Kew",
        "Kew East", "Keysborough", "Kilsyth", "Knox", "Lalor", "Laverton",
        "Lilydale", "Lower Plenty", "Macleod", "Malvern", "Malvern East", "Maribyrnong",
        "McKinnon", "Meadow Heights", "Melbourne CBD", "Melton", "Melton South", "Mentone",
        "Middle Park", "Mill Park", "Montmorency", "Moonee Ponds", "Moorabbin", "Mooroolbark",
        "Mount Evelyn", "Mount Waverley", "Mulgrave", "Narre Warren", "Niddrie", "Noble Park",
        "North Melbourne", "Northcote", "Nunawading", "Oak Park", "Oakleigh", "Ormond",
        "Pakenham", "Parkville", "Patterson Lakes", "Plumpton", "Point Cook", "Port Melbourne",
        "Prahran", "Princes Hill", "Research", "Reservoir", "Richmond", "Ringwood",
        "Ringwood East", "Ringwood North", "Rosanna", "Sandringham", "Seaford", "South Melbourne",
        "South Morang", "South Yarra", "Southbank", "Springvale", "St Kilda", "St Kilda East",
        "St Kilda West", "Strathmore", "Sunbury", "Sydenham", "Tarneit", "Templestowe",
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[76px] py-1.5">
          {/* Logo */}
          <Link href="/" className="flex items-center group py-1">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {/* Services Dropdown */}
            <div className="relative group/menu">
              <button className="relative flex items-center space-x-1 text-neutral-700 hover:text-accent font-medium text-base transition-colors duration-200 py-2">
                <span>Services</span>
                <ChevronDown className="h-4 w-4 transform transition-transform duration-200 group-hover/menu:rotate-180" />
              </button>

              <div
                className="absolute top-full left-0 w-64 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:translate-y-0 group-hover/menu:pointer-events-auto transition-all duration-200 ease-out z-50"
              >
                <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-2 space-y-1">
                  {services.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Locations Dropdown */}
            <div className="relative group/menu">
              <button className="relative flex items-center space-x-1 text-neutral-700 hover:text-accent font-medium text-base transition-colors duration-200 py-2">
                <span>Area of Service</span>
                <ChevronDown className="h-4 w-4 transform transition-transform duration-200 group-hover/menu:rotate-180" />
              </button>

              <div
                className="absolute top-full left-0 w-[540px] pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:translate-y-0 group-hover/menu:pointer-events-auto transition-all duration-200 ease-out z-50"
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
                          <Link href={loc.href} className="flex-1">
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

            <NavLink href="/about">About Us</NavLink>
            <NavLink href="/faq">FAQs</NavLink>
            <NavLink href="/contact">Get a Quote</NavLink>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href={tel}
              className="flex items-center space-x-2 text-primary font-bold hover:text-accent transition-colors duration-200"
            >
              <div className="p-2 bg-accent/15 rounded-full">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-neutral-500 font-semibold leading-none">Call Today</span>
                <span className="text-base">{phone}</span>
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
              href={tel}
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

                {/* Mobile Area of Service & Suburbs */}
                <div>
                  <button
                    onClick={() => toggleSubmenu("locations")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-semibold text-neutral-700 hover:bg-accent/10"
                    aria-expanded={activeSubmenu === "locations"}
                  >
                    <span>Area of Service</span>
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
