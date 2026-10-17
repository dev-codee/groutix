"use client";
import type { Lead } from "./types";
import { jobBookingRows, leadBookings, leadRowKey } from "@/lib/leadBookings";
import { BookingStatusControl } from "./BookingStatusControl";
import { JobBookingActions } from "./JobBookingActions";
import { useAdminPageCtx } from "./AdminPageContext";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";

export function LeadBookings({ lead }: { lead: Lead }) {
  const { role, jobBookingsSaving } = useAdminPageCtx();
  const bookings = leadBookings(lead).filter(b => !lead.activeBooking ||
    b.type === lead.activeBooking.type && `${b.date}T${b.time}` === lead.activeBooking.start);
  const showJobActions = (role === "manager" || role === "super_admin") && bookings.filter(b => b.type === "job").length > 1;
  const jobRows = showJobActions ? jobBookingRows(lead) : [];
  if (!bookings.length) return null;
  return <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
    <p className="mb-2 font-semibold text-slate-700">Bookings · Melbourne time</p>
    {showJobActions && <p className="mb-3 text-slate-500">Update each job separately. Completing one booking leaves the others unchanged.</p>}
    <ul className={showJobActions ? "grid gap-3 xl:grid-cols-2" : "space-y-2"}>{bookings.map(b => {
      const start = `${b.date}T${b.time}`;
      const row = jobRows.find(item => item.activeBooking?.start === start);
      const jobIndex = jobRows.findIndex(item => item.activeBooking?.start === start);
      if (showJobActions && b.type === "job" && row) {
        return <li key={`job-${start}`} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-900">Job booking {jobIndex + 1}</span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${b.status === "Job Done" ? "bg-emerald-50 text-emerald-700" : b.status === "Cancelled" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>{b.status}</span>
          </div>
          <div className="space-y-1 text-slate-600">
            <p className="font-medium text-slate-800">{formatApptDate(start)} · {formatApptTime(start)}{b.endAt ? ` – ${formatApptDate(b.endAt)} ${formatApptTime(b.endAt)}` : ""}</p>
            <p>Technician: <span className="font-semibold">{b.technician || "Unassigned"}</span></p>
          </div>
          <JobBookingActions lead={row} />
          <details className="text-slate-500">
            <summary className="cursor-pointer text-[11px]">Change or correct status</summary>
            <div className="pt-2"><BookingStatusControl leadId={lead.id} booking={b}
              disabled={["Lost", "Cancelled"].includes(lead.status) || Boolean(jobBookingsSaving[leadRowKey(row)])} /></div>
          </details>
        </li>;
      }
      return <li key={`${b.type}-${start}`} className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="font-semibold capitalize">{b.type}</span>
        <span>{b.date} at {b.time}{b.endAt ? ` – ${b.endAt.replace("T", " at ")}` : ""}</span>
        <span>Assigned to {b.type === "job" ? b.technician || "Unassigned" : b.assigned || "Unassigned"}</span>
        <BookingStatusControl leadId={lead.id} booking={b} disabled={["Lost", "Cancelled"].includes(lead.status)} />
      </li>;
    })}</ul>
  </div>;
}
