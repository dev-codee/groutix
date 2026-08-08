import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
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
  "Groutix specialises in shower regrouting, epoxy grouting, silicone replacement and leaking shower repairs across Victoria. We help restore tiled wet areas without the need for unnecessary renovations.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "%s | Groutix",
  },
  description: DESCRIPTION,
  keywords: [
    // Top queries
    "shower regrouting near me",
    "grout repairs near me",
    "grout repair melbourne",
    "regrouting shower",
    "shower repairs melbourne",
    "bathroom grout repair",
    "shower regrouting melbourne",
    "groutix reviews",
    "balcony regrouting melbourne",
    // Original keywords
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
  icons: {
    icon: "/icon.jpeg?v=3",
    shortcut: "/icon.jpeg?v=3",
    apple: "/icon.jpeg?v=3",
  },
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GT047SQJNS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-GT047SQJNS');
          `}
        </Script>
        <Script id="product-review-settings" strategy="beforeInteractive">
          {`
            window.__productReviewSettings = {
              brandId: '426b71b0-46c5-5604-b737-26602f0dbf10'
            };
          `}
        </Script>
        <Script
          src="https://cdn.productreview.com.au/assets/widgets/loader.js"
          strategy="afterInteractive"
        />
      </head>
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
