"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-10 w-10 place-items-center rounded-lg text-ink-700 ring-1 ring-ink-200 transition-colors hover:text-brand-700 ${className}`}
    >
      {/* Sun (shown in dark mode → click for light) */}
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 ${dark ? "block" : "hidden"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>
      {/* Moon (shown in light mode → click for dark) */}
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 ${dark ? "hidden" : "block"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  );
}
