"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Logo({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  const [logoSrc, setLogoSrc] = useState("/new_logo.jpeg");
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.logoUrl) setLogoSrc(d.logoUrl); })
      .catch(() => {});
  }, []);

  return (
    <div className={`flex items-center select-none ${className}`}>
      <Image
        src={logoSrc}
        alt="Groutix Logo"
        width={260}
        height={80}
        priority
        unoptimized
        className="h-12 sm:h-14 md:h-16 max-h-[64px] w-auto object-contain transition-opacity duration-200 hover:opacity-95 rounded-md"
      />
    </div>
  );
}
