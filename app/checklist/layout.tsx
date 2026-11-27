import type { Metadata } from "next";

// Customer checklist pages are private, token-gated links, keep them unindexed.
export const metadata: Metadata = {
  title: "Smart Quote Request, Groutix",
  robots: { index: false, follow: false, nocache: true },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
