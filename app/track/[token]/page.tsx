import type { Metadata } from "next";
import CustomerTracking from "@/components/CustomerTracking";

export const metadata: Metadata = {
  title: "Track your Groutix specialist",
  robots: { index: false, follow: false },
  // Tile providers require a referrer identifying the site origin.
  // Never include the path: it contains the private tracking token.
  referrer: "strict-origin",
};

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerTracking token={token} />;
}
