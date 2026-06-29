import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const name = tone === "light" ? "text-white" : "text-ink-900";
  const tag = tone === "light" ? "text-white/60" : "text-ink-400";
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
        <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden="true">
          <path
            d="M27 16.5a8 8 0 1 0 1 8.5h-7v-3h10v1a11 11 0 1 1-2.2-6.6z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-lg font-extrabold tracking-tight ${name}`}>
          GROUTIX
        </span>
        <span className={`mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.18em] ${tag}`}>
          Stay Sealed. Stay Smiling.
        </span>
      </span>
    </Link>
  );
}
