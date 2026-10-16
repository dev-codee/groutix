"use client";
import type { Lead } from "./types";
import { leadBookings } from "@/lib/leadBookings";

export function LeadBookings({ lead }: { lead: Lead }) {
  const bookings = leadBookings(lead);
  if (!bookings.length) return null;
  return <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
    <p className="mb-2 font-semibold text-slate-700">Bookings · Melbourne time</p>
    <ul className="space-y-2">{bookings.map(b => <li key={`${b.type}-${b.date}-${b.time}`} className="flex flex-wrap gap-x-3 gap-y-1">
      <span className="font-semibold capitalize">{b.type}</span>
      <span>{b.date} at {b.time}{b.endAt ? ` – ${b.endAt.replace("T", " at ")}` : ""}</span>
      <span>Assigned to {b.type === "job" ? b.technician || "Unassigned" : b.assigned || "Unassigned"}</span>
    </li>)}</ul>
  </div>;
}
