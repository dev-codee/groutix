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
  const badge = "inline-flex box-border h-16 w-[280px] max-w-full shrink-0 items-center justify-center rounded-sm border px-5 py-3 text-base transition-colors";
  const colors = theme === "light"
    ? "border-primary/20 bg-white text-primary hover:bg-blue-50"
    : "border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20";

  return <>
    <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer"
      className={`${badge} ${colors} gap-3`}
      aria-label={`${stars.toFixed(1)} stars from ${GOOGLE_REVIEW_COUNT_LABEL} Google reviews for Groutix`}>
      <Image src="/google-logo.svg" alt="Google" width={24} height={24} className="shrink-0" />
      <strong className="text-2xl font-black">{stars.toFixed(1)}</strong>
      <span>
        <span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: Math.round(stars) }, (_, i) => <Star key={i} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />)}</span>
        <span className={`whitespace-nowrap text-[13px] ${theme === "light" ? "text-primary/80" : "text-white/80"}`}>{GOOGLE_REVIEW_COUNT_LABEL} Google Reviews</span>
      </span>
    </a>
    <a href={tel} className={`${badge} ${colors} gap-2 font-bold whitespace-nowrap`}>
      <Phone className="h-4 w-4 shrink-0" />{phone}
    </a>
  </>;
}
