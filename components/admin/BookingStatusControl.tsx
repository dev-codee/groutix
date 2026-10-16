"use client";

import { useRef, useState } from "react";
import { useAdminPageCtx } from "@/components/admin/AdminPageContext";
import { BOOKING_STATUSES } from "@/lib/bookingStatus";
import type { LeadBooking } from "@/lib/leadBookings";

export function BookingStatusControl({ leadId, booking, disabled = false }: { leadId: string; booking: LeadBooking; disabled?: boolean }) {
  const { upsertLead } = useAdminPageCtx();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  async function save(status: string) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/submissions/${leadId}/bookings`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: booking.type, start: `${booking.date}T${booking.time}`, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the booking status.");
      upsertLead(data.item);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update the booking status."); }
    finally { saving.current = false; setBusy(false); }
  }
  return <div className="text-xs">
    <label className="flex items-center gap-2">Booking status
      <select aria-label={`${booking.type} ${booking.date} ${booking.time} status`} disabled={disabled || busy}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 disabled:opacity-50"
        value={booking.status || BOOKING_STATUSES[booking.type][0]} onChange={event => void save(event.target.value)}>
        {BOOKING_STATUSES[booking.type].map(status => <option key={status} value={status}>{status}</option>)}
      </select>
      {busy && <span>Saving…</span>}
    </label>
    {error && <p role="alert" className="mt-1 text-red-700">{error}</p>}
  </div>;
}
