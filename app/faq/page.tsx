import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FaqPageClient from "./FaqPageClient";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about GROUTIX shower regrouting, leaking shower repairs, tile regrouting, pricing and our 10-year waterproof warranty.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions | GROUTIX",
    description:
      "Answers to common questions about shower regrouting, leaking shower repairs, tile regrouting, pricing and our 10-year waterproof warranty.",
    url: "/faq",
    type: "website",
  },
};

// Flat Q&A list mirroring the categories rendered in FaqPageClient, used for
// FAQPage structured data.
const faqs = [
  { q: "What Is Shower Regrouting?", a: "Shower regrouting is the process of removing deteriorated grout from between your tiles and replacing it with a new grout system designed for wet areas. This restores the appearance of your shower, improves hygiene and helps prevent water from penetrating behind the tiles." },
  { q: "How Long Does Shower Regrouting Take?", a: "Most shower regrouting jobs are completed within a single day. The exact timeframe depends on the condition of the existing grout, the size of the shower, the tile size and whether any additional repairs are required. Your GROUTIX technician will confirm the expected timeframe before work begins." },
  { q: "Can You Just Do The Walls Or Floors?", a: "In most cases, yes. After assessing your shower we'll recommend only the work that is genuinely needed — whether that's the walls, the floor or both. If we identify other issues outside our scope, we'll refer you to the appropriate trade." },
  { q: "Do Tiles Need To Be Removed To Regrout A Shower?", a: "In most cases, no. Our regrouting process keeps your existing tiles in place while we remove and replace the failing grout. This restores the shower without the cost, mess and disruption of a full bathroom renovation." },
  { q: "How Do I Know If My Shower Is Leaking?", a: "Common signs include a musty smell, mould growth, water stains on walls or ceilings outside the bathroom, loose or drummy tiles, and bubbling or peeling paint. Some leaks stay hidden behind tiles, so a professional inspection is the best way to confirm the source." },
  { q: "Can A Leaking Shower Be Fixed Without Renovating?", a: "Yes. Many leaking showers can be repaired through regrouting and resealing without removing tiles or renovating the bathroom. Addressing the problem early helps prevent hidden moisture damage and more costly repairs down the track." },
  { q: "Is Resealing Enough To Fix A Leaking Shower?", a: "Resealing can help in some cases, but many leaks are caused by failing grout or weakened junctions rather than the silicone alone. Applying new silicone on its own is often only a temporary fix. A thorough assessment lets us address the real cause for a lasting result." },
  { q: "When Should Grout Be Replaced?", a: "Grout should be replaced when it becomes cracked, missing, permanently stained or starts allowing moisture to pass through. Replacing failing grout early helps maintain the integrity of the tiled area and reduces the risk of leaks." },
  { q: "Can You Regrout Bathroom Tiles Without Removing Them?", a: "Yes. We remove the old grout while your existing tiles stay in place, restoring the joints and improving the overall appearance without demolition." },
  { q: "Is Tile Regrouting Suitable For Floors As Well As Walls?", a: "Yes. Regrouting can be carried out on both floor and wall tiles in bathrooms, laundries and other wet areas, improving hygiene and helping to protect against water damage." },
  { q: "What Areas Can You Regrout?", a: "We can regrout most tiled areas, both indoors and outdoors, including bathrooms, laundries, kitchens, balconies and full homes. Mosaic tiles are generally not suitable for regrouting." },
  { q: "What Types Of Small Tiling Jobs Do You Do?", a: "We carry out small repairs such as replacing loose, cracked or damaged tiles — often alongside regrouting — to restore the appearance and stability of your tiled areas." },
  { q: "Do You Do Full Bathroom Retiling?", a: "We specialise in small repairs associated with grout and shower issues rather than full bathroom retiling. For a complete bathroom renovation, a general contractor is usually the better fit." },
  { q: "Do You Work With Property Managers & Real Estate Agencies?", a: "Yes. We regularly carry out repairs and maintenance for rental properties, helping protect bathrooms and reduce ongoing maintenance issues for property managers and agencies." },
  { q: "Can You Complete Repairs Between Tenancies?", a: "Yes. We can complete work between tenancies to ensure the bathroom is properly maintained before new occupants move in, improving presentation and reducing future issues." },
  { q: "Do You Provide Ongoing Maintenance For Managed Properties?", a: "Yes. We support single properties and managed portfolios with grout and shower repairs, helping prevent water damage and extend the lifespan of bathrooms." },
  { q: "How Much Does Shower Regrouting Or Repair Cost?", a: "Costs vary depending on the condition of the shower, its size and the repairs required. We provide clear, obligation-free quotes after assessing the area so you know exactly what to expect." },
  { q: "Do You Offer A Warranty?", a: "Yes. All full shower regrouts completed by GROUTIX are backed by our industry-leading 10-year waterproof warranty, subject to the approved scope of work and warranty terms." },
  { q: "What Areas Do You Service?", a: "We service major metro and regional areas across Australia, including Victoria, New South Wales, Queensland, Western Australia and South Australia." },
  { q: "Do You Work On Commercial Properties As Well?", a: "Yes. As well as residential work, we handle commercial environments such as gyms, schools and other high-use facilities with durable, long-lasting solutions." },
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
      <Navbar />
      <FaqPageClient />
      <Footer />
    </>
  );
}
