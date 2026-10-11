import type { ReactNode } from "react";

export default function ResponsiveTable({ children, label }: { children: ReactNode; label: string }) {
  return <div className="w-full min-w-0">
    <p className="mb-2 text-xs text-neutral-500 sm:hidden">Swipe left or right to view the full table.</p>
    <div className="responsive-table w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-neutral-200 bg-white focus-visible:outline-2 focus-visible:outline-primary"
      tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  </div>;
}
