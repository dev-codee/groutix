import type { Metadata } from "next";
import LeakingShowerPage from "@/components/LeakingShowerPage";
import { getReviews } from "@/lib/reviews";
import { faqJsonLd } from "@/lib/seo";
import { LEAKING_SHOWER_FAQS, LEAKING_SHOWER_META } from "@/lib/leakingShowerContent";

export const metadata: Metadata = {
  title: { absolute: LEAKING_SHOWER_META.title },
  description: LEAKING_SHOWER_META.description,
  alternates: { canonical: "/leaking-shower-repair" },
  openGraph: {
    title: LEAKING_SHOWER_META.title,
    description: LEAKING_SHOWER_META.description,
    url: "/leaking-shower-repair",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: LEAKING_SHOWER_META.title, description: LEAKING_SHOWER_META.description },
};

export default async function Page() {
  const reviews = await getReviews(5);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(LEAKING_SHOWER_FAQS)).replace(/</g, "\\u003c") }} />
    <LeakingShowerPage reviews={reviews} />
  </>;
}
