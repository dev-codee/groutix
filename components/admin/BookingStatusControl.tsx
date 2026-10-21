"use client";

import { useRef, useState } from "react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { BOOKING_STATUSES } from "@/lib/bookingStatus";
import type { LeadBooking } from "@/lib/leadBookings";

export function BookingStatusControl({ leadId, booking, disabled = false, compact = false, onSaved }: {
  leadId: string; booking: LeadBooking; disabled?: boolean; compact?: boolean; onSaved?: (status: string) => void;
}) {
  const { upsertLead } = useAdminPageCtx();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  async function save(status: string) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/submissions/${leadId}/bookings`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId, type: booking.type, syncWorkflow: booking.type === "job", start: `${booking.date}T${booking.time}`, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the booking status.");
      upsertLead(data.item);
      onSaved?.(status);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update the booking status."); }
    finally { saving.current = false; setBusy(false); }
  }
  return <div className="min-w-0 text-xs">
    <label className={compact ? "block min-w-0" : "flex flex-wrap items-center gap-2"}>
      <span className={compact ? "sr-only" : ""}>Booking status</span>
      <select aria-label={`${booking.type} ${booking.date} ${booking.time} status`} disabled={disabled || busy}
        title={booking.status || BOOKING_STATUSES[booking.type][0]}
        className={compact
          ? "block w-full min-w-0 max-w-full rounded-lg border border-blue-100 bg-blue-50/60 px-2 py-1.5 text-[11px] font-medium text-blue-800 focus:outline-2 focus:outline-blue-500 disabled:opacity-50"
          : "max-w-full rounded-lg border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"}
        value={booking.status || BOOKING_STATUSES[booking.type][0]} onChange={event => void save(event.target.value)}>
        {BOOKING_STATUSES[booking.type].map(status => <option key={status} value={status}>{status}</option>)}
      </select>
    </label>
    {busy && <p role="status" className="mt-1 text-[10px] text-slate-500">Saving…</p>}
    {error && <p role="alert" className="mt-1 break-words text-red-700">{error}</p>}
  </div>;
}
