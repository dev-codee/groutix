import type { Metadata } from "next";

// Customer booking pages are private, token-gated links — keep them unindexed.
export const metadata: Metadata = {
  title: "Book your appointment — Groutix",
  robots: { index: false, follow: false, nocache: true },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
