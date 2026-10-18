"use client";
import { formatLeadBookingTime } from "@/lib/bookingPresentation";
import type { Lead } from "./types";
import { jobBookingRows } from "@/lib/leadBookings";
import { JobBookingActions } from "./JobBookingActions";
import { useAdminPageCtx } from "./AdminPageContext";
import { formatApptDate, formatApptTime } from "@/lib/scheduling";

export function LeadBookings({ lead }: { lead: Lead }) {
  const { role } = useAdminPageCtx();
  const jobRows = jobBookingRows(lead);
  // Single visits already have their actions in the main job card.
  if (lead.activeBooking || (role !== "manager" && role !== "super_admin") || jobRows.length < 2) return null;
  return <div className="mx-4 mb-3 text-xs">
    <ul className="grid gap-3 xl:grid-cols-2">{jobRows.map((row, index) => (
      <li key={row.activeBooking!.bookingId || row.activeBooking!.start} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-slate-900">Job {index + 1}</span>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.status === "Job Done" ? "bg-emerald-50 text-emerald-700" : row.status === "Cancelled" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>{row.status}</span>
        </div>
        <div className="space-y-1 text-slate-600">
          <p className="font-medium text-slate-800">{formatApptDate(row.jobAt!)} · {formatLeadBookingTime(row, "job")}</p>
          <p>Technician: <span className="font-semibold">{row.technician || "Unassigned"}</span></p>
        </div>
        <JobBookingActions lead={row} />
      </li>
    ))}</ul>
  </div>;
}
