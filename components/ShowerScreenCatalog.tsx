import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ShowerScreenModel } from "@/lib/showerScreensData";

/** Schematic previews until product photography is available. */
export function ScreenPreview({ model, large = false }: { model: ShowerScreenModel; large?: boolean }) {
  const sliding = model.category === "Sliding" || model.category === "Wardrobes";
  const framed = model.category !== "Frameless";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[#f1f5f7] ${large ? "min-h-[300px] sm:min-h-[390px]" : "h-40"}`}>
      <svg viewBox="0 0 320 280" role="img" aria-label={`${model.name}, illustrative ${sliding ? "sliding" : "hinged"} door design`} className={large ? "w-full max-w-[420px]" : "h-full w-full"}>
        <path d="M48 237H275L300 253H25Z" fill="#dce3e8" />
        <path d="M61 228V44L230 27V228Z" fill="#fff" stroke="#b4c5d1" strokeWidth="2" />
        <path d="M61 44L106 69V238L61 228Z" fill="#dcebf1" fillOpacity=".55" stroke="#a7bac7" strokeWidth="2" />
        <path d="M106 69L259 48V237L106 238Z" fill="#d8eaf3" fillOpacity=".4" stroke={framed ? "#536779" : "#9fb4c3"} strokeWidth={framed ? 5 : 2} />
        <path d="M183 59V238" stroke={framed ? "#536779" : "#9fb4c3"} strokeWidth={framed ? 3 : 1.5} />
        <path d="M124 84L151 79M124 95L169 87M199 76L235 70" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <path d={sliding ? "M173 136V161M195 136V161" : "M194 136V161"} stroke="#536779" strokeWidth="4" strokeLinecap="round" />
        {!sliding && <path d="M254 86H262M254 200H262" stroke="#536779" strokeWidth="6" />}
      </svg>
      {large && <span className="absolute bottom-4 left-4 text-xs text-slate-500">Illustrative design · finishes may vary</span>}
    </div>
  );
}

export function ProductRow({ model }: { model: ShowerScreenModel }) {
  return (
    <article className="grid gap-5 border-b border-slate-200 bg-white p-5 last:border-b-0 sm:grid-cols-[180px_1fr] xl:grid-cols-[180px_1fr_185px]">
      <Link href={`/shower-screens/${model.id}`} aria-label={`View ${model.name}`}><ScreenPreview model={model} /></Link>
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold text-slate-500">{model.category}</p>
        <Link href={`/shower-screens/${model.id}`} className="text-lg font-semibold leading-snug text-primary hover:underline">{model.name}</Link>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{model.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">{model.highlights.slice(0, 3).map(h => <span key={h} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{h}</span>)}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-start-2 xl:col-auto xl:flex-col xl:items-end xl:justify-center xl:text-right">
        <div><p className="font-semibold text-slate-900">Price on request</p><p className="mt-1 text-xs text-slate-500">Custom size &amp; installation</p></div>
        <Link href={`/shower-screens/${model.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover">View model <ArrowRight size={16} /></Link>
      </div>
    </article>
  );
}

export function SpecificationTable({ model }: { model: ShowerScreenModel }) {
  const rows = [["Category", model.category], ["Glass / material", model.specs.glass], ["Hardware & finishes", model.specs.frameFinishes], ["Door operation", model.specs.doorAction], ["Dimensions", model.specs.dimensions], ["Protective coating", model.specs.coating]];
  return <dl className="divide-y divide-slate-200">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-4 text-sm sm:grid-cols-[190px_1fr] sm:gap-6"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-800">{value}</dd></div>)}</dl>;
}
