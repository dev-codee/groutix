import type { Metadata } from "next";
import GuideArticle from "@/components/guides/GuideArticle";
import { GUIDES } from "@/lib/guidesContent";

const guide = GUIDES.find((g) => g.slug === "shower-leaking-into-ceiling-below")!;
const other = GUIDES.find((g) => g.slug === "shower-still-leaking-after-regrouting")!;

export const metadata: Metadata = {
  title: guide.metaTitle,
  description: guide.metaDescription,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: {
    title: `${guide.metaTitle} | Groutix`,
    description: guide.metaDescription,
    url: `/guides/${guide.slug}`,
    type: "article",
    images: [guide.heroImage],
  },
};

export default function Page() {
  return <GuideArticle guide={guide} other={other} />;
}
