"use client";
import React from "react";

/* ─────────────────────────────────────────────────────────
   Inline SVG logos for every company in the marquee.
   These are clean vector reproductions matching the brand
   typography and colour identities visible in the screenshots.
───────────────────────────────────────────────────────── */

function ArdexLogo() {
  return (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
      {/* Circle emblem */}
      <circle cx="25" cy="30" r="22" stroke="#1a1a1a" strokeWidth="3.5" fill="none" />
      <circle cx="25" cy="30" r="15" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      <text x="14" y="26" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="900" fill="#1a1a1a">AR</text>
      <text x="14" y="37" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="900" fill="#1a1a1a">DEX</text>
      {/* Wordmark */}
      <text x="54" y="35" fontFamily="Arial Black, sans-serif" fontSize="18" fontWeight="900" fill="#1a1a1a" letterSpacing="1">ARDEX</text>
    </svg>
  );
}

function BarryPlantLogo() {
  return (
    <svg viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      {/* Red arrow/flag icon */}
      <polygon points="0,5 16,5 16,25 8,32 0,25" fill="#e02020" />
      <text x="24" y="22" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#1a1a1a" letterSpacing="0.3">BARRY</text>
      <text x="24" y="38" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#1a1a1a" letterSpacing="0.3">PLANT</text>
    </svg>
  );
}

function BigginScottLogo() {
  return (
    <svg viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="30" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#1a1a1a" letterSpacing="0.5">Biggin</text>
      <text x="82" y="30" fontFamily="Georgia, serif" fontSize="22" fontWeight="400" fill="#1a1a1a" letterSpacing="0.5">Scott</text>
      <text x="168" y="14" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="400" fill="#1a1a1a">®</text>
    </svg>
  );
}

function GaryPeerLogo() {
  return (
    <svg viewBox="0 0 140 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      {/* Circle icon */}
      <circle cx="16" cy="21" r="13" stroke="#b8860b" strokeWidth="1.5" fill="none" />
      <text x="9" y="25" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#b8860b">GP</text>
      <text x="36" y="27" fontFamily="Arial Black, sans-serif" fontSize="16" fontWeight="900" fill="#1a1a1a" letterSpacing="0.3">GaryPeer</text>
    </svg>
  );
}

function HarcourtsLogo() {
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="30" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#002855" letterSpacing="0.5">Harcourts</text>
    </svg>
  );
}

function HouseSmartLogo() {
  return (
    <svg viewBox="0 0 160 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-auto">
      {/* Blue square background */}
      <rect x="0" y="0" width="70" height="65" fill="#1a7fd4" rx="2" />
      {/* House roof */}
      <polygon points="5,35 35,8 65,35" fill="#ffcc00" />
      {/* House walls */}
      <rect x="18" y="35" width="34" height="25" fill="white" />
      {/* Door */}
      <rect x="28" y="45" width="14" height="15" fill="#ffcc00" />
      {/* Text right side */}
      <text x="76" y="26" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="900" fill="#1a1a1a">House</text>
      <text x="76" y="44" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="900" fill="#ffcc00">Smart</text>
      <text x="76" y="58" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="400" fill="#555">Real Estate Pty Ltd</text>
    </svg>
  );
}

function JasStephensLogo() {
  return (
    <svg viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="28" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="400" fill="#333" letterSpacing="3">JAS STEPHENS</text>
    </svg>
  );
}

function JellisCraigLogo() {
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="30" fontFamily="Georgia, Times New Roman, serif" fontSize="22" fontWeight="700" fill="#1a1a1a" letterSpacing="0.3">JellisCraig</text>
    </svg>
  );
}

function LJHookerLogo() {
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      {/* Orange block */}
      <rect x="0" y="4" width="36" height="32" fill="#f47920" rx="1" />
      <text x="5" y="26" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" fill="white">LJ</text>
      <text x="44" y="30" fontFamily="Arial Black, sans-serif" fontSize="18" fontWeight="900" fill="#1a1a1a" letterSpacing="0.5">Hooker</text>
    </svg>
  );
}

function LuxeLogo() {
  return (
    <svg viewBox="0 0 130 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
      {/* Circular emblem */}
      <circle cx="20" cy="22" r="17" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
      <line x1="13" y1="15" x2="20" y2="22" stroke="#1a1a1a" strokeWidth="1" />
      <line x1="27" y1="15" x2="20" y2="22" stroke="#1a1a1a" strokeWidth="1" />
      <line x1="20" y1="22" x2="20" y2="31" stroke="#1a1a1a" strokeWidth="1" />
      {/* LUXE text */}
      <text x="43" y="28" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#1a1a1a" letterSpacing="6">LUXE</text>
      <text x="43" y="42" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="400" fill="#555" letterSpacing="3">PROPERTY</text>
    </svg>
  );
}

function LoveAndCoLogo() {
  return (
    <svg viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="28" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#1a1a1a" letterSpacing="0.3">LOVE</text>
      <text x="60" y="28" fontFamily="Georgia, serif" fontSize="13" fontWeight="400" fill="#c8a96e">&amp;</text>
      <text x="75" y="28" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#1a1a1a" letterSpacing="0.3">CO</text>
    </svg>
  );
}

function McGrathLogo() {
  return (
    <svg viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="30" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#1a1a1a" letterSpacing="1">McGrath</text>
    </svg>
  );
}

function RayWhiteLogo() {
  return (
    <svg viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="30" fontFamily="Arial Black, sans-serif" fontSize="20" fontWeight="900" fill="#ffcc00" letterSpacing="0.5">Ray White</text>
    </svg>
  );
}

function NelsonAlexanderLogo() {
  return (
    <svg viewBox="0 0 190 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text x="0" y="28" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="#1a1a1a" letterSpacing="0.5">Nelson Alexander</text>
    </svg>
  );
}

/* ─── All logos to display in the marquee ─── */
const LOGOS = [
  { key: "ardex",            Logo: ArdexLogo },
  { key: "barry-plant",      Logo: BarryPlantLogo },
  { key: "biggin-scott",     Logo: BigginScottLogo },
  { key: "gary-peer",        Logo: GaryPeerLogo },
  { key: "harcourts",        Logo: HarcourtsLogo },
  { key: "house-smart",      Logo: HouseSmartLogo },
  { key: "jas-stephens",     Logo: JasStephensLogo },
  { key: "jellis-craig",     Logo: JellisCraigLogo },
  { key: "lj-hooker",        Logo: LJHookerLogo },
  { key: "luxe",             Logo: LuxeLogo },
  { key: "love-and-co",      Logo: LoveAndCoLogo },
  { key: "mcgrath",          Logo: McGrathLogo },
  { key: "ray-white",        Logo: RayWhiteLogo },
  { key: "nelson-alexander", Logo: NelsonAlexanderLogo },
];

export default function TrustedMarquee() {
  return (
    <section className="bg-white py-8 border-b border-neutral-100 overflow-hidden">
      {/* Label */}
      <p className="text-center text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">
        TRUSTED ACROSS AUSTRALIA
      </p>

      {/* Marquee track — two identical sets for seamless loop */}
      <div className="relative w-full overflow-hidden">
        {/* Left / Right fade edges */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
          style={{ background: "linear-gradient(to right, white, transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
          style={{ background: "linear-gradient(to left, white, transparent)" }}
        />

        <div className="flex w-max animate-marquee items-center gap-16 px-8">
          {/* First set */}
          {LOGOS.map(({ key, Logo }) => (
            <div
              key={`a-${key}`}
              className="flex-shrink-0 flex items-center justify-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default select-none"
            >
              <Logo />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {LOGOS.map(({ key, Logo }) => (
            <div
              key={`b-${key}`}
              className="flex-shrink-0 flex items-center justify-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default select-none"
              aria-hidden="true"
            >
              <Logo />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
