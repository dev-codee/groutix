import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { SITE_URL, OG_IMAGE, localBusinessJsonLd } from "@/lib/seo";
import { getBusinessRating } from "@/lib/reviews";
import SupportChatWidget from "@/components/SupportChatWidget";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const TITLE_DEFAULT = "Groutix | Shower Regrouting & Leak Repair Specialists";
const DESCRIPTION =
  "Specialist shower regrouting, grout repair, leaking shower repair and tile sealing services across Australia. Restore wet areas without full tile removal, backed by a 10-year waterproof warranty.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "%s | Groutix",
  },
  description: DESCRIPTION,
  keywords: [
    "shower regrouting",
    "leaking shower repair",
    "tile resealing",
    "grout repair Australia",
    "shower sealing",
    "regrout shower",
    "balcony leak repair",
  ],
  applicationName: "Groutix",
  authors: [{ name: "Groutix" }],
  creator: "Groutix",
  publisher: "Groutix",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Groutix",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_AU",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Groutix shower regrouting and grout repair services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/favicon.ico" },
  formatDetection: { telephone: true, address: true, email: true },
  category: "Home Services",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rating = await getBusinessRating();
  return (
    <html lang="en-AU" className={`${roboto.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Site-wide LocalBusiness structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(rating)) }}
        />
        {children}
        <SupportChatWidget />
      </body>
    </html>
  );
}
