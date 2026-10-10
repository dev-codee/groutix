"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Phone, Star } from "lucide-react";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import type { BusinessRating } from "@/lib/reviews";
import { BUSINESS } from "@/lib/seo";

const badge = "flex h-16 w-[280px] max-w-full shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-white/20";

export default function ServicePageHero({ title, breadcrumb, description, descriptionId, defaultService, benefits, rating }: {
  title: string; breadcrumb: string; description: string; descriptionId?: string; defaultService: string; benefits: string[]; rating: BusinessRating;
}) {
  return <section id="quote-form" className="relative scroll-mt-20 overflow-hidden bg-primary pt-[110px] lg:pt-[125px]">
    <Image src="/img101.jpeg" alt="Tiled bathroom shower" fill priority sizes="100vw" className="object-cover" />
    <div className="absolute inset-0 bg-black/55" />
    <div className="relative mx-auto grid max-w-[1460px] items-start gap-8 px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_540px]">
      <div className="space-y-5 text-center text-white lg:pt-2 lg:text-left">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70 lg:justify-start"><Link href="/" className="hover:text-white">Home</Link><span>/</span><span aria-current="page">{breadcrumb}</span></nav>
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">Groutix</p>
        <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">{title}</h1>
        <p id={descriptionId} className="mx-auto max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
          <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" className={`${badge} gap-3`} aria-label={`${rating.value.toFixed(1)} stars from ${rating.count} Google reviews for Groutix`}>
            <Image src="/google-logo.svg" alt="Google" width={24} height={24} /><strong className="text-2xl font-black">{rating.value.toFixed(1)}</strong><span><span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: Math.round(rating.value) }, (_, i) => <Star key={i} className="h-4 w-4 fill-[#FBBC04] text-[#FBBC04]" />)}</span><span className="whitespace-nowrap text-[13px] text-white/80">{rating.count} Google Reviews</span></span>
          </a>
          <a href="tel:+61370238094" className={`${badge} gap-2 font-bold`}><Phone className="h-4 w-4" />(03) 7023 8094</a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-white/85 lg:justify-start">{benefits.map(item => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#FBBC04]" />{item}</span>)}</div>
      </div>
      <div className="w-full"><HeroQuoteForm defaultService={defaultService} /></div>
    </div>
  </section>;
}
