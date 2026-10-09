import Link from "next/link";
import ServiceSuburbChecker from "@/components/ServiceSuburbChecker";
import { link } from "@/components/ServicePageSections";

const suburbs = ["South Yarra", "Malvern", "Toorak", "Albert Park", "Armadale", "Prahran", "Hawthorn", "Camberwell", "Brighton", "St Kilda", "Richmond", "Windsor", "Elwood", "Port Melbourne"];
const regional = ["Geelong", "Ballarat", "Frankston", "Lilydale", "Yarra Glen", "Kilmore"];
const slug = (name: string) => name.toLowerCase().replaceAll(" ", "-");

export default function ServiceAreaCoverage({ service, sourcePage, subject }: { service: string; sourcePage: string; subject: string }) {
  return <div className="grid items-start gap-10 lg:grid-cols-2">
    <div>
      <h3 className="mb-5 text-xl font-bold text-neutral-900">Inner & Bayside Melbourne</h3>
      <div className="flex flex-wrap gap-2">{suburbs.map(name => <Link key={name} href={`/locations/melbourne/${slug(name)}`} className="rounded-sm border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:border-primary hover:text-primary">{name}</Link>)}</div>
      <h3 className="mb-4 mt-8 text-xl font-bold text-neutral-900">Also Servicing</h3>
      <div className="flex flex-wrap gap-2">{regional.map(name => <Link key={name} href={`/locations/${slug(name)}`} className="rounded-sm bg-neutral-50 px-3 py-2 text-sm text-neutral-700 hover:text-primary">{name}</Link>)}</div>
      <p className="mt-5 text-sm leading-relaxed text-neutral-600">Coverage can vary by suburb. Check your location before booking.</p>
      <Link href="/locations/" className={`${link} mt-5 inline-block`}>Browse all service locations →</Link>
    </div>
    <ServiceSuburbChecker service={service} sourcePage={sourcePage} subject={subject} />
  </div>;
}
