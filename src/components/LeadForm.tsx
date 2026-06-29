"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { issueOptions, site } from "@/lib/site";

const fieldClass =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // UI-only for now — no submission backend yet.
    setSent(true);
    e.currentTarget.reset();
    setTimeout(() => setSent(false), 3500);
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-lift sm:p-7">
      <h3 className="font-display text-xl font-extrabold text-ink-900">
        Get Your Free Leak Assessment
      </h3>
      <p className="mt-1 text-sm text-ink-500">No obligation. Fast response.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
        <div className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
          <input className={fieldClass} name="name" placeholder="Full name" required />
          <input className={fieldClass} name="phone" type="tel" placeholder="Phone number" required />
          {!compact && (
            <input className={fieldClass} name="email" type="email" placeholder="Email address" required />
          )}
          {compact && (
            <input className={fieldClass} name="email" type="email" placeholder="Email address" required />
          )}
          <input className={fieldClass} name="suburb" placeholder="Suburb" />
          <select className={`${fieldClass} text-ink-500`} name="issue" defaultValue="" required>
            <option value="" disabled>
              What&apos;s the issue?
            </option>
            {issueOptions.map((o) => (
              <option key={o} value={o} className="text-ink-900">
                {o}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className={fieldClass}
          name="message"
          rows={compact ? 2 : 3}
          placeholder="Tell us a little about your leak..."
        />
        <Button type="submit" size="lg" className="w-full">
          {sent ? "Thank you — we'll be in touch" : "Book Free Assessment"}
        </Button>
        <p className="flex items-center justify-center gap-2 pt-1 text-sm text-ink-500">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-600" fill="currentColor">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
          </svg>
          Or call <a href={site.phoneHref} className="font-semibold text-ink-800">{site.phone}</a>
        </p>
      </form>
    </div>
  );
}
