"use client";

import { useSiteContent } from "@/components/SiteContentProvider";

export default function HeroBackground() {
  const { hero } = useSiteContent();
  const color = hero.backgroundColor || "#000f5c";
  return <div className="absolute inset-0" style={{ backgroundColor: color }} aria-hidden="true" />;
}
