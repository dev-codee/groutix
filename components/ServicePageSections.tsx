import type { ReactNode } from "react";
import { ArrowRight, Grid2x2 } from "lucide-react";

export const button = "inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-hover";
export const link = "font-bold text-accent underline underline-offset-4 hover:text-primary";
export const card = "rounded-xl border border-neutral-200 bg-white p-6 sm:p-7";
export const text = "text-base leading-relaxed text-neutral-600 sm:text-lg";
export function Section({ eyebrow, title, intro, children, alternate = false, id }: { eyebrow: string; title: string; intro?: string; children: ReactNode; alternate?: boolean; id?: string }) {
  return <section id={id} className={`py-16 lg:py-20 ${alternate ? "bg-neutral-50" : "bg-white"}`}><div className="mx-auto max-w-[1320px] px-6 lg:px-10"><div className="mx-auto mb-10 max-w-3xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p><h2 className="text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-4xl">{title}</h2>{intro && <p className={`mt-4 ${text}`}>{intro}</p>}</div>{children}</div></section>;
}
export function Cards({ items, columns = 3 }: { items: { title: string; body: ReactNode; icon?: typeof Grid2x2 }[]; columns?: 3 | 4 }) {
  return <div className={`grid gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>{items.map(({ title, body, icon: Icon = Grid2x2 }) => <div key={title} className={`${card} transition-all hover:border-accent/40 hover:shadow-md`}><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-light/60 text-primary"><Icon className="h-5 w-5" /></div><h3 className="text-lg font-bold text-neutral-900">{title}</h3><p className="mt-3 leading-relaxed text-neutral-600">{body}</p></div>)}</div>;
}
export function QuoteLink({ label = "Get a Free Quote" }: { label?: string }) { return <a href="#quote-form" className={button}>{label}<ArrowRight className="h-4 w-4" /></a>; }
