"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MobileCallBar, Section, SectionHead, btnGold, btnGhost, inlineLink } from "@/components/v2/ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Guide, GuideBlock } from "@/lib/guidesContent";

const SITE = "https://groutix.com";
const PHONE_DISPLAY = "(03) 7023 8094";
const PHONE_HREF = "tel:+61370238094";

// Renders plain text with [label](/path) or [label](https://...) links.
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!m) return <span key={i}>{part}</span>;
        if (m[2].startsWith("http")) {
          return (
            <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className={inlineLink}>
              {m[1]}
            </a>
          );
        }
        return (
          <Link key={i} href={m[2]} className={inlineLink}>
            {m[1]}
          </Link>
        );
      })}
    </>
  );
}

function Block({ block }: { block: GuideBlock }) {
  if (block.type === "p") {
    return (
      <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
        <Rich text={block.text} />
      </p>
    );
  }
  if (block.type === "h3") {
    return <h3 className="mt-8 text-xl font-bold text-slate-900">{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ul className="mt-5 space-y-4">
        {block.items.map((item) => (
          <li key={item.lead} className="flex justify-center gap-3">
            <span aria-hidden className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#001F97] text-[13px] font-black text-white">✓</span>
            <p className="max-w-2xl text-center text-[17px] leading-relaxed text-slate-600">
              <strong className="font-bold text-slate-900">{item.lead}</strong> <Rich text={item.text} />
            </p>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "table") {
    return (
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[520px] border-collapse text-center text-[16px]">
          <thead>
            <tr className="bg-[#001F97] text-white">
              <th className="px-4 py-3 font-bold">{block.head[0]}</th>
              <th className="px-4 py-3 font-bold">{block.head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row[0]} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{row[0]}</td>
                <td className="px-4 py-3 text-slate-600">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "image") {
    return (
      <figure className="mt-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-200">
          <Image src={block.src} alt={block.alt} fill sizes="(min-width:1024px) 768px, 100vw" className="object-cover" />
        </div>
        <figcaption className="mt-2 text-sm leading-relaxed text-slate-500">{block.caption}</figcaption>
      </figure>
    );
  }
  return (
    <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-5 text-center">
      <p className="font-bold text-slate-900">{block.title}</p>
      <p className="mt-2 text-[16px] leading-relaxed text-slate-700">
        <Rich text={block.text} />
      </p>
    </div>
  );
}

function MidCta({ guide }: { guide: Guide }) {
  return (
    <section className="mx-auto w-full max-w-[1248px] px-5">
      <div className="mx-auto max-w-3xl rounded-lg bg-[#001F97] p-6 text-center sm:p-8">
        <h2 className="text-[clamp(22px,2.6vw,28px)] font-black leading-tight text-white [text-wrap:balance]">{guide.ctaHeading}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-white/85">{guide.ctaText}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={PHONE_HREF} className={`${btnGold} w-full justify-center sm:w-auto`}>Call {PHONE_DISPLAY}</a>
          <Link href="/#quote-form" className={`${btnGhost} w-full justify-center sm:w-auto`}>Get a Free Quote</Link>
        </div>
        <p className="mt-4 text-[16px]">
          <Link href={guide.serviceHref} className="font-bold text-white underline underline-offset-4">{guide.serviceLabel}</Link>
        </p>
      </div>
    </section>
  );
}

export default function GuideArticle({ guide, other }: { guide: Guide; other: Guide }) {
  const [open, setOpen] = useState(0);
  const url = `${SITE}/guides/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.h1,
        description: guide.metaDescription,
        image: `${SITE}${guide.heroImage}`,
        author: { "@id": `${SITE}/#business` },
        publisher: { "@id": `${SITE}/#business` },
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
          { "@type": "ListItem", position: 3, name: guide.metaTitle, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <Navbar />
    <main className="public-page min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#001F97]">
        <Image src={guide.heroImage} alt={guide.heroAlt} fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="relative mx-auto w-full max-w-[1248px] px-5 pb-16 pt-[140px] text-center sm:pb-20 lg:pt-[160px]">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[2px] text-[#FBBC04]">
            <Link href="/guides" className="hover:underline">Groutix Guides</Link>
          </p>
          <h1 className="w-full text-[clamp(27px,7vw,46px)] font-black leading-[1.12] text-white [text-wrap:balance]">{guide.h1}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-[17px] leading-relaxed text-white/85">
            <Rich text={guide.intro} />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={PHONE_HREF} className={`${btnGold} w-full justify-center sm:w-auto`}>Call {PHONE_DISPLAY}</a>
            <Link href="/#quote-form" className={`${btnGhost} w-full justify-center sm:w-auto`}>Get a Free Quote</Link>
          </div>
        </div>
      </section>

      {/* QUICK ANSWER */}
      <section className="mx-auto w-full max-w-[1248px] px-5 pt-10">
        <div className="rounded-lg border-l-4 border-[#001F97] bg-slate-50 p-6 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[2px] text-[#2F63CC]">The short answer</p>
          <p className="mt-2 text-[17px] leading-relaxed text-slate-800">
            <Rich text={guide.quickAnswer} />
          </p>
        </div>
      </section>

      {/* BODY SECTIONS */}
      {guide.sections.map((section, i) => (
        <div key={section.id}>
          <Section id={section.id} alt={i % 2 === 1}>
            <div className="mx-auto max-w-3xl text-center">
              <SectionHead title={section.heading} />
              {section.blocks.map((block, j) => (
                <Block key={j} block={block} />
              ))}
            </div>
          </Section>
          {i === 1 && guide.sections.length > 3 ? <MidCta guide={guide} /> : null}
        </div>
      ))}

      {/* FAQ */}
      <Section id="faqs" alt>
        <div className="mx-auto max-w-3xl">
          <SectionHead title="Questions People Ask" />
          <div className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {guide.faqs.map((faq, i) => (
              <div key={faq.question}>
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="flex-1 text-center text-[17px] font-bold text-slate-900">{faq.question}</span>
                  <span aria-hidden className="text-xl font-black text-[#001F97]">{open === i ? "−" : "+"}</span>
                </button>
                <div className={open === i ? "block" : "hidden"}>
                  <p className="px-5 pb-5 text-center text-[16px] leading-relaxed text-slate-600">
                    <Rich text={faq.answer} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-[#001F97]">
        <div className="mx-auto w-full max-w-[1248px] px-5 py-14 text-center">
          <h2 className="text-[clamp(24px,3vw,34px)] font-black text-white [text-wrap:balance]">Not sure which cause you are dealing with?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[17px] leading-relaxed text-white/85">
            Send us photos of the shower and the damage. We will tell you honestly what the likely cause is and what the right repair looks like, before you spend anything.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={PHONE_HREF} className={`${btnGold} w-full justify-center sm:w-auto`}>Call {PHONE_DISPLAY}</a>
            <Link href="/#quote-form" className={`${btnGhost} w-full justify-center sm:w-auto`}>Get a Free Quote</Link>
          </div>
        </div>
      </section>

      {/* NEXT GUIDE */}
      <section className="mx-auto w-full max-w-[1248px] px-5 py-12 text-center">
        <p className="text-[13px] font-bold uppercase tracking-[2px] text-[#2F63CC]">Read next</p>
        <Link href={`/guides/${other.slug}`} className="group mx-auto mt-3 block max-w-3xl rounded-lg border border-slate-200 bg-white p-5 transition hover:border-[#2F63CC] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
          <span className="text-lg font-bold text-slate-900 group-hover:text-[#001F97]">{other.h1}</span>
          <span className="mt-2 block text-[16px] leading-relaxed text-slate-600">{other.cardText}</span>
          <span className={inlineLink}>Read this guide</span>
        </Link>
        <p className="mt-6 text-[16px]">
          <Link href="/guides" className={inlineLink}>See all Groutix guides</Link>
          {"  ·  "}
          <Link href="/" className={inlineLink}>Shower regrouting Melbourne</Link>
        </p>
      </section>
    </main>
      <Footer />
      <MobileCallBar />
    </>
  );
}
