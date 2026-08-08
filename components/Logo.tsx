import React from "react";
import Image from "next/image";

export default function Logo({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <Image
        src="/logo.png?v=1"
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


