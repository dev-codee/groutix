"use client";

import Image from "next/image";
import { Phone, Star } from "lucide-react";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { BUSINESS, GOOGLE_REVIEW_COUNT_LABEL } from "@/lib/seo";
import type { BusinessRating } from "@/lib/reviews";

export default function HeroContactBadges({ rating, theme = "dark" }: {
  rating?: BusinessRating;
  theme?: "dark" | "light";
}) {
  const { phone, tel } = useContact();
  const { business } = useSiteContent();
  const stars = rating?.value ?? business.rating.value;
  const badge = "inline-flex box-border h-14 w-auto max-w-full shrink-0 items-center justify-center rounded-2xl border px-5 py-2.5 text-sm transition-colors";
  const googleColors = theme === "light"
  ? "border-primary/20 bg-white text-primary hover:bg-blue-50"
  : "border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15";
  const phoneColors = theme === "light"
    ? "border-primary/20 bg-white text-primary hover:bg-blue-50"
    : "border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15";

  return <>
    <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer"
      className={`${badge} ${googleColors} gap-3`}
      aria-label={`${stars.toFixed(1)} stars from ${GOOGLE_REVIEW_COUNT_LABEL} Google reviews for Groutix`}>
      <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="shrink-0" />
      <span className="h-8 w-px bg-white/25 shrink-0" aria-hidden="true" />
      <strong className="text-xl font-black">{stars.toFixed(1)}</strong>
      <span>
        <span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: Math.round(stars) }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#FBBC04] text-[#FBBC04]" />)}</span>
        <span className={`whitespace-nowrap text-xs ${theme === "light" ? "text-primary/80" : "text-white/80"}`}>{GOOGLE_REVIEW_COUNT_LABEL} Google Reviews</span>
      </span>
    </a>
    <a href={tel} className={`${badge} ${phoneColors} gap-2 font-bold whitespace-nowrap`}>
      <Phone className="h-4 w-4 shrink-0" />{phone}
    </a>
  </>;
}
