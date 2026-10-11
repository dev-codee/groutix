import Link from "next/link";
import { Droplets, Search, ShieldCheck } from "lucide-react";
import { balconyIntro } from "@/lib/balconyLeakContent";

const signs = [
  "Cracked or crumbling grout between balcony tiles",
  "Worn sealant around balcony doors and tile edges",
  "White chalky stains, mould or dark grout",
  "Loose or hollow-sounding tiles",
  "Water stains or peeling paint in the room below",
  "Water pooling around tiles or drains",
];

const repairs = [
  {
    title: "Balcony Regrouting",
    description: "Failed grout is removed and replaced with material suited to outdoor exposure. Where the membrane remains sound, regrouting may be possible without removing tiles. Movement joints are assessed separately for flexible sealant.",
  },
  {
    title: "Sealant & Joint Repairs",
    description: "Worn silicone and vulnerable joints around balcony doors, edges and tiles are assessed and renewed where appropriate. Surface sealing is not a substitute for repairing a failed waterproofing membrane.",
  },
  {
    title: "Balcony Leak Repair",
    description: "We trace where water is entering before recommending a repair. If the membrane or base has failed, the work may require tile removal, repairs to the base, a new membrane and retiling. The scope is explained after inspection.",
  },
];

const steps = [
  { title: "Inspect & Trace the Leak", description: "We check grout, joints, drains and edges, look for hollow tiles and assess moisture and stains to understand where water is travelling." },
  { title: "Explain the Repair & Quote", description: "We explain whether your balcony needs regrouting, joint repairs or further waterproofing work, with the recommended scope and price before work starts." },
  { title: "Repair, Check & Tidy", description: "The work follows the assessment. We check the finished repair, leave the area tidy and explain any curing time and applicable warranty terms." },
];

export default function HomeBalconySection() {
  return (
    <section id="balcony" className="scroll-mt-32 bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Balcony Regrouting &amp; Leak Repairs</p>
          <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
            Balcony Regrouting &amp; <span className="text-accent">Leak Repair in Melbourne</span>
          </h2>
          <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">{balconyIntro}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-sm border border-neutral-200 bg-neutral-50 p-5 sm:p-8">
            <Droplets className="h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-bold text-neutral-900">Signs Your Balcony Needs Attention</h3>
            <ul className="list-disc space-y-3 pl-5 text-base leading-relaxed text-neutral-600">
              {signs.map((sign) => <li key={sign}>{sign}</li>)}
            </ul>
          </div>
          <div className="space-y-4 rounded-sm border border-neutral-200 bg-neutral-50 p-5 sm:p-8">
            <Search className="h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-bold text-neutral-900">Find the Cause Before Choosing the Repair</h3>
            <p className="text-base leading-relaxed text-neutral-600">Sun, rain and temperature changes put stress on balcony grout and seals. Failed joints, drainage problems or a damaged membrane can each allow water to reach the areas below.</p>
            <p className="text-base leading-relaxed text-neutral-600">Cracked grout alone does not confirm a membrane failure. We assess the grout, sealant, surrounding tiles and drainage first, so the repair addresses the source of the leak.</p>
            <p className="text-base leading-relaxed text-neutral-600">We help homeowners, landlords and strata managers with balcony work, with clear assessments and scheduling around occupants.</p>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="text-2xl font-bold text-neutral-900">Balcony Repair Options</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {repairs.map((repair) => (
              <div key={repair.title} className="space-y-3 rounded-sm border border-neutral-200 p-5 sm:p-6">
                <h4 className="text-lg font-bold text-neutral-900">{repair.title}</h4>
                <p className="text-base leading-relaxed text-neutral-600">{repair.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="text-2xl font-bold text-neutral-900">How We Approach a Leaking Balcony</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="space-y-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-white">{index + 1}</span>
                <h4 className="text-lg font-bold text-neutral-900">{step.title}</h4>
                <p className="text-base leading-relaxed text-neutral-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-sm bg-primary p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-white" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Not Sure What Your Balcony Needs?</h3>
              <p className="text-base leading-relaxed text-white/85">Tell us about the grout, stains or leaking areas and we&apos;ll explain the next step. Warranty eligibility and repair scope are confirmed in your quote.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 text-center">
            <Link href="/contact" className="rounded-sm bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent">Get a Quote</Link>
            <Link href="/balcony-leak-repairs" className="text-sm font-bold text-white underline underline-offset-4">Read our balcony leak repair guide →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
