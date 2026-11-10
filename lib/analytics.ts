// GA4 event helper (measurement ID is configured in app/layout.tsx).
// Events: call_click, form_start, photo_upload, quote_submit.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  action: string,
  params: Record<string, string | number> = {}
) {
  if (typeof window === "undefined") return;
  // Private journey links are excluded from analytics, same as the pageview config.
  if (window.location.pathname.startsWith("/track/")) return;
  if (window.location.pathname.startsWith("/admin")) return;
  window.gtag?.("event", action, {
    page_path: window.location.pathname,
    ...params,
  });
}
