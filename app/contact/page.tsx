import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Shower Regrouting Quotes in Melbourne",
  description:
    "Shower regrouting or a leaking shower in Melbourne? Send photos, book a free inspection and get an upfront quote from Groutix. Call (03) 7023 8094.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Groutix | Shower Regrouting Quotes in Melbourne",
    description:
      "Talk to Groutix about shower regrouting, leaking shower repairs and balcony leak repairs. Free inspections and upfront quotes across Melbourne & Victoria.",
    url: "/contact",
    type: "website",
  },
};

/* FAQPage schema — matches the visible FAQ section in ContactClient exactly. */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I request a quote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fill in the form on this page or call us on (03) 7023 8094. Tell us the service you need, your suburb and what the problem looks like — cracked or mouldy grout, a leak, peeling silicone — and add clear photos. We review every enquiry and book a free inspection at a time that suits you.",
      },
    },
    {
      "@type": "Question",
      name: "Can I send photos of my shower or balcony?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — the form asks for photos, and on your phone you can take them on the spot with the Camera button. Photos help us see the condition of the grout, silicone and tiles before the inspection, so your assessment and quote are more accurate.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an inspection before getting a quote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For an accurate price, yes. Inspections are free: we check the grout, silicone, tiles and drainage, explain exactly what your shower or balcony needs, and give you an upfront quote before any work begins — no obligation to go ahead.",
      },
    },
    {
      "@type": "Question",
      name: "How much does shower regrouting cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on the size of the shower, the condition of the existing grout and silicone, and whether any tiles or the shower base also need repairs — which is why we inspect first instead of guessing over the phone. After the free inspection you receive an upfront quote, and the price we quote is the price you pay for that work.",
      },
    },
    {
      "@type": "Question",
      name: "Can a leaking shower be fixed without removing tiles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In most cases, yes. We remove the failed grout and silicone and rebuild the seals with waterproof epoxy, so your tiles stay in place. If the inspection finds damage beyond what regrouting can fix, we will tell you honestly and explain your options before any work starts.",
      },
    },
    {
      "@type": "Question",
      name: "Do you service my suburb?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We regrout showers and repair leaks right across Melbourne and in regional centres including Geelong and Ballarat. Check our locations page for your area, or call (03) 7023 8094 and we will confirm straight away.",
      },
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <ContactClient />
      <Footer />
    </>
  );
}
