"use client";

import { Check } from "lucide-react";
import { useAdminPageCtx } from "./AdminPageContext";
import type { Lead } from "./types";
import { leadRowKey } from "@/lib/leadBookings";

const STEPS = [
  { label: "On the Way", status: "Job En Route" },
  { label: "Reached", status: "Job Arrived" },
  { label: "Start", status: "Job In Progress" },
  { label: "Job Done", status: "Job Done" },
];

/** The supplied lead is a projection of one booking, with its own status and start. */
export function JobBookingActions({ lead }: { lead: Lead }) {
  const { handleOnTheWay, updateJobBooking, setStartJobDays, setStartJobPrompt, jobBookingsSaving, onTheWayLoading } = useAdminPageCtx();
  const key = leadRowKey(lead);
  const saving = Boolean(jobBookingsSaving[key]);
  const blocked = saving || onTheWayLoading === key || ["Lost", "Cancelled"].includes(lead.status);
  const current = STEPS.findIndex(step => step.status === lead.status);
  const totalDays = lead.jobTotalDays || 1;
  const daysDone = lead.jobDaysDone || 1;

  return <div className="space-y-2" aria-label={`Job actions for ${lead.jobAt}`} aria-busy={saving}>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {STEPS.map((step, index) => {
        const done = current >= index;
        return <button key={step.status} type="button" disabled={blocked || done}
          title={`${step.label} · ${lead.jobAt?.replace("T", " at ")}`}
          onClick={() => {
            if (blocked || done) return;
            if (index < 2) void handleOnTheWay(lead, index === 0 ? "en_route" : "arrived", "job");
            else if (step.status === "Job In Progress") {
              setStartJobDays(totalDays);
              setStartJobPrompt({ lead });
            } else void updateJobBooking(lead, { status: step.status });
          }}
          className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors disabled:cursor-default ${done
            ? index < 2 ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50"}`}>
          {done && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}{step.label}
        </button>;
      })}
    </div>
    {lead.status === "Job In Progress" && totalDays > 1 && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
      <span>Day {daysDone} of {totalDays}</span>
      <button type="button" disabled={blocked}
        className="font-semibold underline underline-offset-2 disabled:opacity-50"
        onClick={() => void updateJobBooking(lead, daysDone >= totalDays
          ? { status: "Job Done", jobDaysDone: totalDays }
          : { jobDaysDone: daysDone + 1 })}>
        {daysDone >= totalDays ? "Complete Job" : "Complete Day"}
      </button>
    </div>}
    {saving && <p role="status" className="text-xs text-blue-700">Saving this booking…</p>}
  </div>;
}
