import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { BusinessRating } from "@/lib/reviews";
import { BUSINESS } from "@/lib/seo";
import styles from "./ServiceTrustStrip.module.css";

export default function ServiceTrustStrip({ id, rating, first, warrantyDetail = "On eligible completed work", variant }: {
  id: string;
  rating: BusinessRating;
  first: { value: string; label: string; detail: ReactNode };
  warrantyDetail?: string;
  variant?: "wireframe";
}) {
  if (variant === "wireframe") {
    return <section aria-labelledby={id} className={styles.section}>
      <h2 id={id} className={styles.eyebrow}>Trusted Across Victoria</h2>
      <div className={styles.grid}>
        <div className={styles.card}><div className={styles.number}>{first.value}</div><div className={styles.heading}>{first.label}</div><div className={styles.detail}>{first.detail}</div></div>
        <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={styles.card}><div className={styles.number}>{rating.value.toFixed(1)}<span className={styles.scale}>/5</span></div><div className={styles.stars} aria-hidden="true">{"★".repeat(Math.round(rating.value))}</div><div className={styles.heading}>Google Rating</div><div className={styles.detail}>Based on {rating.count} Google reviews</div></a>
        <div className={styles.card}><div className={styles.number}>10 Year</div><div className={styles.heading}>Waterproof Warranty</div><div className={styles.detail}>{warrantyDetail}</div></div>
      </div>
    </section>;
  }
  const statClass = "rounded-[20px] border border-[#e2e6f0] bg-white px-6 py-8 sm:py-9";
  return <section aria-labelledby={id} className="border-b border-[#e2e6f0] bg-white py-14 lg:py-16">
    <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
      <h2 id={id} className="mb-9 text-center text-[15px] font-black uppercase tracking-[0.16em] text-[#3b5bf0]">Trusted Across Victoria</h2>
      <div className="grid gap-7 text-center md:grid-cols-3">
        <div className={statClass}><p className="text-[40px] font-black leading-tight text-primary">{first.value}</p><p className="mt-3 text-xl font-bold text-neutral-900">{first.label}</p><div className="mt-2 text-base leading-relaxed text-neutral-500">{first.detail}</div></div>
        <div className={statClass}><p className="text-[40px] font-black leading-tight text-primary">{rating.value.toFixed(1)}<span className="text-xl font-bold text-neutral-500">/5</span></p><div className="mt-2 flex justify-center gap-1" aria-label={`${rating.value.toFixed(1)} out of 5 stars`}>{Array.from({ length: Math.round(rating.value) }, (_, i) => <Star key={i} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" aria-hidden="true" />)}</div><p className="mt-3 text-xl font-bold text-neutral-900">Google Rating</p><p className="mt-2 text-base leading-relaxed text-neutral-500">Based on {rating.count} Google reviews</p></div>
        <div className={statClass}><p className="text-[40px] font-black leading-tight text-primary">10 Year</p><p className="mt-3 text-xl font-bold text-neutral-900">Waterproof Warranty</p><p className="mt-2 text-base leading-relaxed text-neutral-500">{warrantyDetail}</p></div>
      </div>
    </div>
  </section>;
}
