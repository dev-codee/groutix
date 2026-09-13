import React from "react";
import Image from "next/image";
import { getSiteSettings, getLogoPublicUrl } from "@/lib/settings";

export default async function Logo({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  let logoSrc = "/new_logo.jpeg";
  try {
    const settings = await getSiteSettings();
    logoSrc = getLogoPublicUrl(settings);
  } catch {
    // fallback
  }

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
