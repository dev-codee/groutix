"use client";
import HeroBackground from "@/components/HeroBackground";
import HeroContactBadges from "@/components/HeroContactBadges";
import Image from "next/image";
import { Check } from "lucide-react";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import type { BusinessRating } from "@/lib/reviews";


export default function ServicePageHero({ title, description, descriptionId, defaultService, benefits, rating }: {
  title: string; description: string; descriptionId?: string; defaultService: string; benefits: string[]; rating: BusinessRating;
}) {
  return <section id="quote-form" className="relative scroll-mt-20 overflow-hidden bg-primary pt-[110px] lg:pt-[125px]">
    <HeroBackground />
    <div relative mx-auto grid max-w-[1460px] items-start gap-8 px-4 sm:px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-12 lg:px-10 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_540px]">
      <div space-y-5 text-center text-white lg:pt-2 lg:text-left">
        <p text-[13px] font-bold uppercase tracking-[0.2em] text-white/80">Groutix</p>
        <h1 mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:mx-0 lg:text-[42px] xl:text-[48px] [text-shadow:0_2px_24px_rgba(0,0,0,0.25)]">{title}</h1>
        <p id={descriptionId} mx-auto max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">{description}</p>
        <div flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
          <HeroContactBadges rating={rating} />
        </div>
        <div flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-sm text-white/85 lg:justify-start">{benefits.map(item => <span key={item} flex items-center gap-2"><Check className="h-4 w-4 text-[#FBBC04]" />{item}</span>)}</div>
      </div>
      <div className="w-full"><HeroQuoteForm defaultService={defaultService} /></div>
    </div>
  </section>;
}
