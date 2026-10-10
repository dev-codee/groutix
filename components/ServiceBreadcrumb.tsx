import Link from "next/link";

export default function ServiceBreadcrumb({ service, theme = "dark", className = "" }: {
  service: string;
  theme?: "dark" | "light";
  className?: string;
}) {
  return <nav aria-label="Breadcrumb" className={`w-full text-sm ${theme === "light" ? "text-slate-500" : "text-white/70"} ${className}`}>
    <ol className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
      <li><Link href="/" className={theme === "light" ? "hover:text-primary" : "hover:text-white"}>Home</Link></li>
      <li aria-hidden="true">/</li>
      <li aria-current="page">{service}</li>
    </ol>
  </nav>;
}
