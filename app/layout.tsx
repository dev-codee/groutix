import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import { SITE_URL, OG_IMAGE, localBusinessJsonLd } from "@/lib/seo";
import { getBusinessRating } from "@/lib/reviews";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const TITLE_DEFAULT = "GROUTIX — Shower Regrouting Specialists Australia";
const DESCRIPTION =
  "Australia's #1 shower regrouting and tile sealing specialists. Fix leaking showers without removing tiles. 10-year warranty. Free quotes across Perth, Melbourne, Sydney, Brisbane & more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "%s | GROUTIX",
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
  applicationName: "GROUTIX",
  authors: [{ name: "GROUTIX" }],
  creator: "GROUTIX",
  publisher: "GROUTIX",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "GROUTIX",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_AU",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "GROUTIX shower regrouting" }],
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
    <html lang="en-AU" className={`${barlow.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Site-wide LocalBusiness structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(rating)) }}
        />
        {children}
      </body>
    </html>
  );
}
