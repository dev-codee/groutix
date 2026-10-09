"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight, Phone, Ruler, ShieldCheck } from "lucide-react";
import { SHOWER_SCREEN_MODELS } from "@/lib/showerScreensData";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { ProductRow } from "@/components/ShowerScreenCatalog";

const FAQS = [
  {
    q: "How does the custom shower screen process work?",
    a: "We begin with a free initial consultation and quote. Once approved, our experienced technician visits your home to conduct precise laser measurements. Your screen is then custom-fabricated and installed on-site by our skilled professionals for a perfect fit.",
  },
  {
    q: "What is the difference between frameless, semi-frameless, and sliding screens?",
    a: "Frameless screens use thick 10mm toughened glass secured with minimal metal brackets for a sleek, luxury look. Semi-frameless screens (like Neptune & Optima) feature a perimeter frame for strength while keeping glass edges clean. Sliding screens (like Momentum & Frameless Sliders) glide along top/bottom tracks, ideal for saving space in compact bathrooms.",
  },
  {
    q: "Can I request frosted or obscured glass for privacy?",
    a: "Yes! Most of our models (including Bespoke Frameless, Neptune, and SwiftCloset) offer frosted, low-iron, or obscured cathedral glass options to provide your desired level of privacy and light diffusion.",
  },
  {
    q: "What is the optional Nano4-Glass ceramic coating?",
    a: "Nano4-Glass is an advanced ultra-thin ceramic hydrophobic coating applied to the glass surface. It repels water, soap scum, grime, and mineral buildup, making your screen drastically easier to clean while protecting it against permanent glass staining.",
  },
  {
    q: "Are all your shower screens compliant with Australian Standards?",
    a: "Absolutely. All glass supplied by Groutix is manufactured in accordance with AS/NZS 2208 safety glass standards, ensuring maximum strength, durability, and safety for your home.",
  },
];

export default function ShowerScreensClient() {
  const { phone, tel } = useContact();
  const content = useSiteContent();
  const models = content.showerScreens?.length ? content.showerScreens : SHOWER_SCREEN_MODELS;
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const [compare, setCompare] = useState(false);
  const categories = ["All", ...new Set(models.map(m => m.category))];
  const filtered = models.filter(m => (category === "All" || category === m.category) && `${m.name} ${m.summary} ${m.highlights.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (sort === "name") filtered.sort((a,b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-[#f5f7f9] pt-[110px] text-slate-900 lg:pt-[125px]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex gap-2 text-xs text-slate-500"><Link href="/" className="hover:underline">Home</Link><span>/</span><span>Shower screens &amp; wardrobes</span></nav>
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your shower screen</h1><p className="mt-2 text-sm text-slate-600">Compare designs, glass and finishes. Custom measured and installed across Victoria.</p></div>
          <a href={tel} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Phone size={16} /> {phone}</a>
        </div>
        <div className="mb-7 flex flex-wrap gap-x-7 gap-y-3 border-y border-slate-200 py-4 text-xs text-slate-600"><span className="flex items-center gap-2"><Ruler size={16} className="text-primary" /> On-site measurement</span><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> Toughened safety glass</span><span>Quotes tailored to your space</span></div>
        <div className="grid items-start gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-[140px]">
            <h2 className="mb-5 flex items-center gap-2 font-semibold"><SlidersHorizontal size={17} /> Filter models</h2>
            <label htmlFor="model-search" className="mb-2 block text-xs font-semibold text-slate-600">Search the range</label>
            <div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input id="model-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name or feature" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-2 text-sm focus:outline-primary" /></div>
            <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">Screen type</legend><div className="flex flex-wrap gap-2 lg:block lg:space-y-1">{categories.map(c=><label key={c} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm ${category === c ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50"}`}><input type="radio" name="category" checked={category===c} onChange={()=>setCategory(c)} className="accent-primary" />{c === "All" ? "All models" : c}<span className="ml-auto pl-2 text-xs text-slate-400">{c === "All" ? models.length : models.filter(m=>m.category===c).length}</span></label>)}</div></fieldset>
            {(query || category !== "All") && <button onClick={()=>{setQuery("");setCategory("All");}} className="mt-4 text-xs font-semibold text-primary hover:underline">Clear filters</button>}
            <div className="mt-6 border-t border-slate-200 pt-5"><p className="text-sm font-semibold">Need help choosing?</p><p className="mt-2 text-xs leading-relaxed text-slate-500">Tell us about your space and we’ll help you find a suitable screen.</p><Link href="/contact?enquiry=Shower%20screens" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ask our team <ArrowRight size={14} /></Link></div>
          </aside>
          <section aria-label="Product results" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="text-sm text-slate-600"><strong className="text-slate-900">{filtered.length}</strong> models{category !== "All" ? ` · ${category}` : " in our range"}</p><label className="flex items-center gap-2 text-xs text-slate-500">Sort by<select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"><option value="recommended">Recommended</option><option value="name">Name A–Z</option></select></label></div>
            <div className="overflow-hidden rounded-xl border border-slate-200">{filtered.map(m=><ProductRow key={m.id} model={m} />)}{!filtered.length && <div className="bg-white p-10 text-center"><h2 className="font-semibold">No matching models</h2><p className="mt-2 text-sm text-slate-500">Try another feature or clear your filters.</p></div>}</div>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Compare specifications</h2><p className="mt-1 text-xs text-slate-500">Glass, door operation and finishes at a glance.</p></div><button onClick={()=>setCompare(!compare)} aria-expanded={compare} aria-controls="comparison" className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-primary">{compare ? "Hide" : "Compare"}</button></div>{compare && <div id="comparison" className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><caption className="sr-only">Specifications for the currently filtered models</caption><thead><tr className="border-b border-slate-200 text-slate-500">{["Model", "Glass / material", "Door operation", "Finishes"].map(h=><th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map(m=><tr key={m.id} className="border-b border-slate-100"><th scope="row" className="p-3 font-semibold text-primary"><Link href={`/shower-screens/${m.id}`}>{m.name}</Link></th><td className="p-3">{m.specs.glass}</td><td className="p-3">{m.specs.doorAction}</td><td className="p-3">{m.specs.frameFinishes}</td></tr>)}</tbody></table></div>}</section>
          </section>
        </div>
        <section className="my-12 max-w-3xl"><h2 className="mb-5 text-xl font-semibold">Before you choose</h2><div className="divide-y divide-slate-200">{FAQS.map(f=><details key={f.q} className="py-4"><summary className="cursor-pointer text-sm font-semibold">{f.q}</summary><p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p></details>)}</div></section>
      </div>
    </main>
  );
}
