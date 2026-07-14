import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FaqPageClient from "./FaqPageClient";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Groutix shower regrouting, leaking shower repairs, tile regrouting, pricing and our 10-year waterproof warranty.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions | Groutix",
    description:
      "Answers to common questions about shower regrouting, leaking shower repairs, tile regrouting, pricing and our 10-year waterproof warranty.",
    url: "/faq",
    type: "website",
  },
};

// Flat Q&A list mirroring the categories rendered in FaqPageClient, used for
// FAQPage structured data.
const faqs = [
  { q: "How Do I Know If My Shower Needs Regrouting or Recaulking?", a: "Cracked, missing or discoloured grout, peeling silicone, water escaping the shower, damp walls or persistent mould are all signs your shower may need attention. Repairing these issues early can help prevent further water damage and more expensive repairs." },
  { q: "What Is Shower Regrouting?", a: "Shower regrouting involves removing deteriorated grout and replacing it with a new, durable grout system suitable for wet areas. This improves the appearance of your shower, strengthens the tile joints and helps reduce water penetration." },
  { q: "How Long Does Shower Regrouting Take?", a: "Most shower regrouting projects are completed within one day. After inspecting your shower, your technician will explain the repair process, expected timeframe and any additional work that may be required before getting started." },
  { q: "Can You Regrout Just The Shower Walls or Floor?", a: "Yes. Every shower is different, so we tailor the repairs to its condition. Whether only the walls, the floor or the entire shower requires regrouting, we'll recommend the most appropriate solution." },
  { q: "Do Tiles Need To Be Removed To Regrout A Shower?", a: "No, in most cases. Our regrouting process is designed to restore the grout joints while keeping your existing tiles in place, avoiding the time, cost and disruption of replacing the entire shower." },
  { q: "How Do I Know If My Shower Is Leaking?", a: "A leaking shower isn't always obvious. Common signs include water stains, peeling paint, mould growth, damp walls, musty odours, or water appearing outside the shower after use. If left untreated, even a small leak can lead to costly structural damage." },
  { q: "Can A Leaking Shower Be Repaired Without Removing The Tiles?", a: "Yes, in many cases. If the leak is caused by failed grout, silicone or movement joints, we can often repair your leaking shower without removing the tiles or renovating the bathroom. An inspection will determine the most suitable solution." },
  { q: "What Causes A Shower To Leak?", a: "Leaking showers are commonly caused by cracked grout, deteriorated silicone, movement in tile joints, damaged waterproofing or plumbing defects. Identifying the exact cause is the first step towards a long-lasting repair." },
  { q: "How Do You Find The Source Of A Shower Leak?", a: "Our technicians carry out a thorough inspection of the shower and surrounding areas to identify where the water is escaping. Once the cause has been confirmed, we'll explain the issue and recommend the most appropriate repair solution." },
  { q: "Can A Leaking Shower Get Worse If Left Unrepaired?", a: "Yes. Water can continue spreading behind tiles, damaging walls, floors and surrounding structures. Repairing a leaking shower early can help prevent more extensive damage and significantly reduce future repair costs." },
  { q: "When Should Tile Grout Be Replaced?", a: "Grout should be replaced when it becomes cracked, missing, discoloured or begins allowing moisture to penetrate. Replacing deteriorated grout early helps protect your tiled surfaces and extends their lifespan." },
  { q: "Can You Regrout Tiles Without Removing Them?", a: "Yes. We remove the old grout while keeping your existing tiles in place, restoring the grout joints without the cost, mess or disruption of replacing the tiles." },
  { q: "What Areas Can Be Regrouted?", a: "We can regrout most tiled areas, including bathrooms, showers, laundries, kitchens, balconies, floors and walls. During your inspection, we'll confirm whether your tiled area is suitable for regrouting." },
  { q: "Can You Match My Existing Grout Colour?", a: "Yes. We stock a wide range of grout colours and will recommend the closest match to your existing grout wherever possible. If you're updating the look of your tiles, we can also help you choose a new grout colour." },
  { q: "Is Tile Regrouting Better Than Retiling?", a: "If your tiles are still in good condition, regrouting is often a faster and more cost-effective alternative to replacing them. It refreshes the appearance of your tiled area while restoring the grout joints without the need for demolition." },
  { q: "Can You Match My Existing Tiles?", a: "We'll do our best to match your existing tiles where possible. If you have spare tiles or can provide the tile brand, model or supplier, it can help us source a closer match. If an exact match isn't available, we'll discuss the most suitable replacement options with you before proceeding." },
  { q: "Do You Replace Just A Few Tiles?", a: "Yes. Whether it's one damaged tile or several, we can replace individual tiles without requiring a complete renovation, provided the surrounding tiles are suitable for repair." },
  { q: "Do You Supply Tiles?", a: "We can install customer-supplied tiles or discuss suitable replacement options if matching tiles are available. Your technician will explain the best approach during the assessment." },
  { q: "Do You Do Full Bathroom Retiling?", a: "No. We specialise in small tiling repairs, tile replacements and regrouting rather than complete bathroom renovations. This allows us to focus on fast, high-quality repairs without the cost and disruption of a full bathroom remodel." },
  { q: "Do You Work With Property Managers & Real Estate Agencies?", a: "Yes. We work with property managers, real estate agencies, landlords and body corporates, providing professional shower repairs, regrouting and small tiling repairs across Melbourne." },
  { q: "Can You Complete Repairs Between Tenancies?", a: "Yes. Completing repairs between tenancies helps prepare the property for new occupants while reducing the risk of future maintenance issues. We always aim to minimise downtime and complete the work efficiently." },
  { q: "Do You Provide Quotes For Rental Property Repairs?", a: "Yes. We can provide detailed quotes for rental properties, helping property managers and owners make informed maintenance decisions before work begins." },
  { q: "Can You Work Directly With Tenants?", a: "Yes. With the owner's or property manager's approval, we can arrange access directly with tenants to help simplify the repair process and reduce administration." },
  { q: "Can You Handle Multiple Properties?", a: "Yes. Whether you manage a single investment property or a large portfolio, we can assist with ongoing shower repairs, regrouting and small tiling works across multiple locations." },
  { q: "What Is Epoxy Grout?", a: "Epoxy grout is a premium grout specifically designed for wet areas and demanding environments. It offers superior stain resistance, water resistance and durability, making it an excellent long-term solution for tiled surfaces." },
  { q: "Is Epoxy Grout Better Than Cement Grout?", a: "Both have their advantages, but epoxy grout offers greater durability, superior stain resistance and enhanced water resistance. It's a popular upgrade for customers looking for a longer-lasting, lower-maintenance finish." },
  { q: "Can My Existing Shower Or Tiled Area Be Upgraded To Epoxy Grout?", a: "In many cases, yes. Existing grout can often be removed and replaced with epoxy grout, provided the tiles and surrounding area are suitable. We'll assess your tiled area and recommend the most appropriate solution." },
  { q: "How Long Does Epoxy Grout Take To Cure?", a: "Epoxy grout requires approximately 72 hours to fully cure before the area can be used. Your technician will confirm the recommended curing time after the installation is complete." },
  { q: "Where Do You Recommend Epoxy Grout?", a: "We recommend epoxy grout for showers, bathrooms, balconies, laundries, kitchens, and other high-moisture or high-traffic tiled areas. Its superior durability, stain resistance and water resistance make it an excellent long-term solution for both residential and commercial properties." },
  { q: "When Should Shower Silicone Be Replaced?", a: "Shower silicone should be replaced if it is cracked, peeling, mouldy, separating from the tiles, or no longer forming a watertight seal. Replacing failed silicone helps prevent water leaks and keeps your shower protected." },
  { q: "Why Does Shower Silicone Turn Black?", a: "Black stains are usually caused by mould growing on or beneath deteriorated silicone in damp environments. Once silicone has deteriorated, cleaning alone may not restore it, and replacement is often the best long-term solution." },
  { q: "Can You Match My Existing Silicone Colour?", a: "Yes. We stock a wide range of silicone colours and will recommend the closest match to your existing grout, tiles or fixtures wherever possible." },
  { q: "How Long Before New Silicone Cures?", a: "New silicone typically requires 24 hours to fully cure before the shower can be used. Your technician will confirm the recommended curing time after the installation is complete." },
  { q: "Why Is Silicone Important In A Shower?", a: "Silicone creates a flexible, waterproof seal around movement joints, corners and fixtures where grout should not be used. It helps prevent water penetration while allowing for normal movement between surfaces." },
  { q: "How Much Does Shower Regrouting Or Repair Cost?", a: "The cost depends on the condition of your shower, its size and the repairs required. We provide a detailed quote after assessing your shower, so you know exactly what's included before any work begins." },
  { q: "Do You Offer A Warranty?", a: "Yes. Eligible works completed by Groutix are backed by our workmanship warranty, with warranty periods varying depending on the type of repair and materials used. Your technician will explain the applicable warranty before work begins." },
  { q: "What Areas Do You Service?", a: "We service Melbourne and surrounding suburbs across Victoria. If you're unsure whether we cover your area, simply contact our team and we'll be happy to assist." },
  { q: "Do You Work On Commercial Properties?", a: "Yes. We carry out shower repairs, regrouting and small tiling works for commercial properties, including offices, gyms, schools, aged care facilities, apartment buildings, hotels, and other commercial premises." },
  { q: "How Can I Request A Quote?", a: "Simply contact our team by phone, email or through our online enquiry form. We'll discuss your requirements and arrange an inspection or provide a quote based on the information available." },
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
