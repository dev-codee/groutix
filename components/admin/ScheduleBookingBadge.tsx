import { CheckCircle2 } from "lucide-react";

export function ScheduleBookingBadge({ type, status }: { type: "inspection" | "job"; status?: string }) {
  const completed = status === (type === "inspection" ? "Inspection Completed" : "Job Done");
  const label = type === "inspection" ? "Inspection" : "Job";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${completed
    ? "border-emerald-300 bg-emerald-100 text-emerald-900"
    : type === "inspection" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
    {completed && <CheckCircle2 aria-hidden="true" className="h-3 w-3 shrink-0" />}
    {label}{completed ? " completed" : ""}
  </span>;
}
