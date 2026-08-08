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
        src="/logo.jpeg"
        alt="Groutix Logo"
        width={240}
        height={80}
        priority
        className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-opacity duration-200 hover:opacity-95 rounded-md"
      />
    </div>
  );
}


