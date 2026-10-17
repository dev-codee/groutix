"use client";

// Site-wide pop-up quote form.
// Any "quote" call-to-action on the website (navbar "Get a Free Quote", the mobile
// "Free Quote" bar, hero / section / final CTAs, "#quote-form" links) opens the
// step-by-step quote form in a full-screen window on mobile and a centred window on
// desktop, instead of jumping to another page. The form inside is the same
// QuoteFormV2 used in the heroes, so it sends the same data to /api/quote (CRM).
// Admin / CRM pages are ignored. To switch this off, remove <QuoteModal /> from app/layout.tsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import QuoteFormV2 from "@/components/home/QuoteFormV2";

const QUOTE_TEXT = /quote/i;

// Decide whether a clicked link is a "get a quote" call-to-action.
function isQuoteLink(a: HTMLAnchorElement) {
  if (a.dataset.quoteCta === "false") return false;
  if (a.dataset.quoteCta === "true") return true;
  const raw = a.getAttribute("href") || "";
  if (raw === "#quote-form" || raw.endsWith("#quote-form")) return true;
  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  // "/contact" links only count when the button text is about a quote
  // (so a plain "Contact" menu link still opens the contact page).
  if (url.pathname === "/contact" && QUOTE_TEXT.test(a.textContent || "")) return true;
  return false;
}

export default function QuoteModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // keep what was typed if they close and reopen
  const [service, setService] = useState("");
  const [formKey, setFormKey] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const serviceRef = useRef("");

  const close = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus?.();
  }, []);

  // Intercept quote CTA clicks anywhere on the page.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.location.pathname.startsWith("/admin") || document.querySelector(".admin-ui")) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.closest("[data-quote-modal]")) return;
      if (!isQuoteLink(a)) return;
      e.preventDefault();
      // Pre-select the page's service (e.g. "Epoxy Grout") when the page has one.
      const pageForm = Array.from(document.querySelectorAll("[data-default-service]")).find((el) => !el.closest("[data-quote-modal]"));
      const pageService = pageForm?.getAttribute("data-default-service") || "";
      if (serviceRef.current !== pageService) {
        serviceRef.current = pageService;
        setService(pageService);
        setFormKey((k) => k + 1);
      }
      lastFocus.current = a;
      setMounted(true);
      setOpen(true);
    };
    const onOpenEvent = () => {
      setMounted(true);
      setOpen(true);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("groutix:open-quote", onOpenEvent);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("groutix:open-quote", onOpenEvent);
    };
  }, []);

  // Close when the visitor navigates to another page.
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Lock page scroll, focus the window, close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    boxRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Let an open dropdown list or the photo reminder close first.
      if (document.querySelector("[data-qf-popup]") || document.querySelector('[role="listbox"][aria-labelledby]')) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-quote-modal
      className={`fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[#06124F]/80 backdrop-blur-sm sm:p-6 ${open ? "" : "hidden"}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex min-h-full items-start justify-center sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div
          ref={boxRef}
          role="dialog"
          aria-modal="true"
          aria-label="Request a quote"
          tabIndex={-1}
          className="relative w-full outline-none sm:max-w-[540px]"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close quote form"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2F8] text-[#1A2A8C] transition-colors hover:bg-[#DBE3F0] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F63CC]/40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <QuoteFormV2 key={formKey} idPrefix="qfm" variant="modal" defaultService={service} />
        </div>
      </div>
    </div>,
    document.body
  );
}
