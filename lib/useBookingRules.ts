"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BOOKING_RULES, sanitizeBookingRules, type BookingRules } from "@/lib/bookingRules";

// Shared client cache of the manager-configured booking rules. Every admin
// component (date pickers, roster, dispatch timeline) reads the same copy, and
// saving from Settings → Booking Hours pushes the new rules to all of them.

const EVENT = "groutix:booking-rules";
let cached: BookingRules | null = null;
let inflight: Promise<BookingRules> | null = null;

function load(): Promise<BookingRules> {
  if (!inflight) {
    inflight = fetch("/api/admin/settings/booking-rules", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        cached = sanitizeBookingRules(d.rules);
        return cached;
      })
      .catch(() => {
        inflight = null; // allow a retry on next mount
        return cached ?? DEFAULT_BOOKING_RULES;
      });
  }
  return inflight;
}

/** Push freshly saved rules to every mounted consumer. */
export function publishBookingRules(rules: BookingRules) {
  cached = rules;
  inflight = Promise.resolve(rules);
  window.dispatchEvent(new CustomEvent<BookingRules>(EVENT, { detail: rules }));
}

export function useBookingRules(): BookingRules {
  const [rules, setRules] = useState<BookingRules>(cached ?? DEFAULT_BOOKING_RULES);
  useEffect(() => {
    let alive = true;
    load().then((r) => alive && setRules(r));
    const onUpdate = (e: Event) => setRules((e as CustomEvent<BookingRules>).detail);
    window.addEventListener(EVENT, onUpdate);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onUpdate);
    };
  }, []);
  return rules;
}
