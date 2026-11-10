import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GUIDES } from "@/lib/guidesContent";

export const metadata: Metadata = {
  title: "Leak and Regrouting Guides",
  description:
    "Plain language guides from the Groutix team on leaking showers, failed grout and waterproofing, what causes them, and who is responsible for the repair.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Leak and Regrouting Guides | Groutix",
    description:
      "Plain language guides on leaking showers, failed grout and waterproofing, what causes them, and who is responsible for the repair.",
    url: "/guides",
    type: "website",
  },
};

export default function GuidesIndexPage() {
  return (
    <main className="public-page min-h-screen">
      <section className="bg-[#001F97]">
        <div className="mx-auto w-full max-w-[1248px] px-5 py-16 sm:py-20">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[2px] text-[#FBBC04]">Groutix Guides</p>
          <h1 className="max-w-3xl text-[clamp(30px,4vw,46px)] font-black leading-[1.12] text-white [text-wrap:balance]">
            Leaking Shower and Regrouting Guides
          </h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-white/85">
            Straight answers from the team that repairs these problems every week. What causes leaks, what actually fixes them, and who is responsible when water ends up somewhere it should not be.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1248px] px-5 py-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GUIDES.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
                <Image src={guide.heroImage} alt={guide.heroAlt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold leading-snug text-slate-900 group-hover:text-[#001F97]">{guide.h1}</h2>
                <p className="mt-2 text-[16px] leading-relaxed text-slate-600">{guide.cardText}</p>
                <span className="mt-3 inline-block font-bold text-[#2F63CC] underline">Read this guide</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-slate-50 p-6 text-center">
          <p className="text-[17px] leading-relaxed text-slate-700">
            Dealing with a leak right now? See our <Link href="/leaking-shower-repair" className="font-bold text-[#2F63CC] underline hover:text-[#001F97]">leaking shower repair service</Link> or call <a href="tel:+61370238094" className="font-bold text-[#2F63CC] underline hover:text-[#001F97]">(03) 7023 8094</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
