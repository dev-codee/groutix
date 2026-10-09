"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Phone, Ruler, ChevronRight } from "lucide-react";
import type { ShowerScreenModel } from "@/lib/showerScreensData";
import { useContact, useSiteContent } from "@/components/SiteContentProvider";
import { ScreenPreview, SpecificationTable } from "@/components/ShowerScreenCatalog";

export default function ModelDetailClient({ model: initialModel, allModels }: { model: ShowerScreenModel; allModels: ShowerScreenModel[] }) {
  const content = useSiteContent();
  const models = content.showerScreens?.length ? content.showerScreens : allModels;
  const model = models.find(m => m.id === initialModel.id) ?? initialModel;
  const { phone, tel } = useContact();
  const [tab, setTab] = useState("models");
  const tabs = [{ id: "models", label: "Compare models" }, { id: "details", label: "Product details" }, { id: "features", label: "Features & options" }];
  const quote = `/contact?enquiry=${encodeURIComponent(model.name)}`;
  const alternatives = models.filter(m=>m.id!==model.id);
  return (
    <main className="min-h-screen bg-[#f5f7f9] pt-[110px] text-slate-900 lg:pt-[125px]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/" className="hover:underline">Home</Link><ChevronRight size={12} /><Link href="/shower-screens" className="hover:underline">Shower screens</Link><ChevronRight size={12} /><span>{model.name}</span></nav>
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
          <p className="mb-2 text-xs font-semibold text-slate-500">Groutix · {model.category}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{model.name}</h1>
          <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_1.1fr_280px]">
            <ScreenPreview model={model} large />
            <div className="py-2"><p className="text-sm leading-relaxed text-slate-600">{model.summary}</p><h2 className="mt-6 text-sm font-semibold">Product highlights</h2><ul className="mt-3 space-y-3">{model.highlights.map(h=><li key={h} className="flex items-start gap-2 text-sm text-slate-700"><Check size={16} className="mt-0.5 shrink-0 text-primary" />{h}</li>)}</ul><div className="mt-6 border-t border-slate-200 pt-5"><p className="text-xs text-slate-500">Available hardware &amp; finishes</p><p className="mt-2 text-sm font-medium leading-relaxed">{model.specs.frameFinishes}</p></div><button onClick={()=>{setTab("details");document.getElementById("product-information")?.scrollIntoView({behavior:"smooth",block:"start"});}} className="mt-5 text-sm font-semibold text-primary hover:underline">View full specifications ↓</button></div>
            <aside className="self-start rounded-xl border border-blue-100 bg-blue-50/60 p-5"><p className="text-xs text-slate-500">Custom supplied &amp; installed</p><p className="mt-2 text-2xl font-bold">Price on request</p><p className="mt-3 text-sm leading-relaxed text-slate-600">Your quote depends on dimensions, glass, hardware and installation requirements.</p><Link href={quote} className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover">Request a free quote <ArrowRight size={16} /></Link><a href={tel} className="mt-3 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary"><Phone size={15} />{phone}</a><div className="mt-4 flex items-start gap-2 border-t border-blue-100 pt-4 text-xs leading-relaxed text-slate-600"><Ruler size={18} className="shrink-0 text-primary" />On-site measurement to confirm your fit.</div></aside>
          </div>
        </section>
        <section id="product-information" className="mt-6 scroll-mt-[140px] rounded-xl border border-slate-200 bg-white">
          <div role="tablist" aria-label="Product information" className="flex overflow-x-auto border-b border-slate-200 px-4 sm:px-7">{tabs.map(t=><button key={t.id} id={`tab-${t.id}`} role="tab" aria-selected={tab===t.id} aria-controls={`panel-${t.id}`} tabIndex={tab===t.id?0:-1} onClick={()=>setTab(t.id)} onKeyDown={e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const index=tabs.findIndex(x=>x.id===tab);const next=e.key==="Home"?0:e.key==="End"?tabs.length-1:(index+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;setTab(tabs[next].id);document.getElementById(`tab-${tabs[next].id}`)?.focus();}}} className={`shrink-0 border-b-2 px-4 py-4 text-sm font-semibold ${tab===t.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{t.label}</button>)}</div>
          {tabs.map(t=><div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={tab!==t.id} tabIndex={0} className="p-5 sm:p-8">
            {t.id==="models" && <><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Explore {models.length} models</h2><p className="mt-1 text-sm text-slate-500">Compare other designs before choosing your fit.</p></div><Link href="/shower-screens" className="text-sm font-semibold text-primary hover:underline">All models &amp; filters →</Link></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{models.map(m=><Link key={m.id} href={`/shower-screens/${m.id}`} aria-current={m.id===model.id?"page":undefined} className={`flex gap-3 rounded-lg border p-3 transition-colors ${m.id===model.id ? "border-primary bg-blue-50" : "border-slate-200 hover:border-primary"}`}><div className="w-20 shrink-0 [&>div]:h-24"><ScreenPreview model={m} /></div><div className="flex flex-col justify-center"><p className="text-xs text-slate-500">{m.category}</p><h3 className="mt-1 text-sm font-semibold text-primary">{m.name}</h3><p className="mt-2 text-xs text-slate-600">{m.id===model.id?"Selected model":"Price on request"}</p></div></Link>)}</div></>}
            {t.id==="details" && <><h2 className="mb-3 text-xl font-semibold">Product specifications</h2><SpecificationTable model={model} /><h3 className="mb-3 mt-8 text-lg font-semibold">About this model</h3><div className="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-600">{model.description.map(p=><p key={p}>{p}</p>)}</div></>}
            {t.id==="features" && <><h2 className="text-xl font-semibold">Features &amp; available options</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2">{model.features.map(f=><li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600"><Check size={17} className="mt-0.5 shrink-0 text-primary" />{f}</li>)}</ul><p className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">Confirm your preferred finish, dimensions and optional coating with our team when requesting a quote.</p></>}
          </div>)}
        </section>
        <section className="my-10"><h2 className="mb-4 text-xl font-semibold">You may also consider</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{alternatives.slice(0,4).map(m=><Link key={m.id} href={`/shower-screens/${m.id}`} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-primary"><ScreenPreview model={m} /><p className="mt-3 text-xs text-slate-500">{m.category}</p><h3 className="mt-1 text-sm font-semibold text-primary">{m.name}</h3><p className="mt-2 text-xs text-slate-600">Price on request</p></Link>)}</div></section>
      </div>
    </main>
  );
}
