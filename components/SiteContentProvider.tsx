"use client";

import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_CONTENT,
  telHref,
  mailHref,
  type SiteContent,
} from "@/lib/siteContent";

// Makes the merged site content (loaded once in the root layout) available to
// every client component, so editable contact info / copy stays in sync.
const SiteContentContext = createContext<SiteContent>(DEFAULT_CONTENT);

export function SiteContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: React.ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext);
}

/** Convenience hook for the most-used fields: phone + email (display + href). */
export function useContact() {
  const { business } = useSiteContent();
  return useMemo(
    () => ({
      phone: business.phone,
      tel: telHref(business.phone),
      email: business.email,
      mailto: mailHref(business.email),
    }),
    [business.phone, business.email]
  );
}
