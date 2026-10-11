import Image from "next/image";
import Link from "next/link";
import { Droplets, Phone, Search, ShieldCheck, ImageIcon } from "lucide-react";

const signs = [
  "White chalky staining (efflorescence) on tiles",
  "Cracked, crumbling or missing grout",
  "Water stains on the ceiling below the balcony",
  "Loose or “drummy” sounding tiles",
  "Persistent mould in grout lines despite cleaning",
];

const steps = [
  { title: "Inspect & assess", description: "check the balcony surface and moisture levels." },
  { title: "Remove failed grout", description: "grind out old grout and deep-clean the joints." },
  { title: "Epoxy regrout", description: "waterproof epoxy grout colour-matched to your tiles." },
  { title: "Seal perimeters", description: "new silicone to perimeters and expansion joints." },
];

// Supply only a verified before/after pair from the same Groutix job.
// Next Image optimizes the supplied assets; dimensions reserve space before loading.
type BalconyJobPhotos = {
  before: string;
  after: string;
  suburb: string;
  condition: string;
};

export default function HomeBalconySection({ photos }: { photos?: BalconyJobPhotos }) {
  return (
    <section id="balcony" className="scroll-mt-32 bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-[1460px] space-y-10 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">Balcony Specialists</p>
          <h2 className="text-3xl font-bold leading-tight text-neutral-900 lg:text-[42px]">
            Balcony Regrouting &amp; <span className="text-accent">Leak Repairs in Melbourne</span>
          </h2>
          <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
            Melbourne&apos;s heavy rain and temperature swings are brutal on balcony tiling. Once grout cracks, water seeps through the joints — causing white efflorescence staining, mould growth, tile lifting and even damage to the concrete or framing below. Our balcony regrouting removes the failed grout and replaces it with waterproof epoxy grout and sealed perimeter joints — no retiling required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-sm border border-neutral-200 bg-neutral-50 p-5 sm:p-8">
            <Droplets className="h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-bold text-neutral-900">5 Signs Your Balcony Needs Regrouting</h3>
            <ul className="list-disc space-y-3 pl-5 text-base leading-relaxed text-neutral-600">
              {signs.map((sign) => <li key={sign}>{sign}</li>)}
            </ul>
          </div>
          <div className="space-y-4 rounded-sm border border-neutral-200 bg-neutral-50 p-5 sm:p-8">
            <Search className="h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-bold text-neutral-900">How We Fix a Leaking Balcony</h3>
            <ol className="list-decimal space-y-4 pl-5 text-base leading-relaxed text-neutral-600">
              {steps.map((step) => (
                <li key={step.title}><strong className="font-bold text-neutral-900">{step.title}</strong> — {step.description}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {(["before", "after"] as const).map((stage) => (
            <figure key={stage} className="min-w-0 space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                <span className="absolute left-3 top-3 z-10 rounded-sm bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">{stage}</span>
                {photos ? (
                  <Image
                    src={photos[stage]}
                    alt={stage === "before"
                      ? `${photos.condition} balcony grout in ${photos.suburb}, Melbourne, before epoxy regrouting by Groutix`
                      : `Balcony after epoxy regrouting in ${photos.suburb}, Melbourne, by Groutix`}
                    width={960}
                    height={720}
                    loading="lazy"
                    sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1459px) 50vw, 700px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center text-neutral-400">
                    <ImageIcon className="h-10 w-10" aria-hidden="true" />
                    <p className="text-sm">Real balcony job — {stage} photo</p>
                  </div>
                )}
              </div>
              {photos && <figcaption className="text-sm text-neutral-600">Balcony regrout — {photos.suburb}</figcaption>}
            </figure>
          ))}
        </div>

        <div className="flex flex-col gap-6 rounded-sm bg-primary p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-white" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Stop balcony leaks before they become structural repairs.</h3>
              <p className="text-base leading-relaxed text-white/85">Free assessment · 10-year waterproof warranty · No retiling needed</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 text-center">
            <Link href="/contact" className="rounded-sm bg-white px-6 py-3 font-bold text-primary transition-colors hover:bg-accent">Get My Balcony Assessed</Link>
            <a href="tel:+61370238094" className="inline-flex items-center justify-center gap-2 py-2 text-base font-bold text-white underline underline-offset-4"><Phone className="h-4 w-4" aria-hidden="true" />(03) 7023 8094</a>
          </div>
        </div>
      </div>
    </section>
  );
}
