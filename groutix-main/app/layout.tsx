import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GROUTIX — Shower Regrouting Specialists Australia",
  description:
    "Australia's #1 shower regrouting and tile sealing specialists. Fix leaking showers without removing tiles. 10-year warranty. Free quotes across Perth, Melbourne, Sydney, Brisbane & more.",
  keywords: "shower regrouting, leaking shower repair, tile resealing, grout repair Australia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
