"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Site wide click tracking for phone links (call_click in GA4).
export default function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="tel:"]') as HTMLAnchorElement | null;
      if (link) {
        trackEvent("call_click", { phone: link.getAttribute("href") ?? "" });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
