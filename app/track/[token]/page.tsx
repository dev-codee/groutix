import type { Metadata } from "next";
import CustomerTracking from "@/components/CustomerTracking";

export const metadata: Metadata = {
  title: "Track your Groutix specialist",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerTracking token={token} />;
}
