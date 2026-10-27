import { apptInstantMs } from "./scheduling";

type DatedLead = { id?: string; createdAt?: string; received?: string };
type ScheduledLead = DatedLead & { inspectionAt?: string; jobAt?: string; activeBooking?: { start: string } };

function createdTime(lead: DatedLead): number {
  for (const value of [lead.createdAt, lead.received]) {
    const time = value ? Date.parse(value) : NaN;
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

/** Sort before pagination; scheduling and subsequent edits do not change age. */
export function newestLeadsFirst<T extends DatedLead>(leads: readonly T[]): T[] {
  return [...leads].sort((a, b) => createdTime(b) - createdTime(a)
    || (b.id || "").localeCompare(a.id || ""));
}

/** Work queues show the next appointment, then recent past visits, then undated leads. */
export function dashboardLeadsFirst<T extends ScheduledLead>(leads: readonly T[], role: string, now = Date.now()): T[] {
  const field = role === "inspection" || role === "field" ? "inspectionAt"
    : role === "technician" ? "jobAt" : null;
  if (!field) return newestLeadsFirst(leads);
  const time = (lead: T) => apptInstantMs(lead.activeBooking?.start || lead[field]);
  const group = (value: number) => !Number.isFinite(value) ? 2 : value >= now ? 0 : 1;
  return newestLeadsFirst(leads).sort((a, b) => {
    const ta = time(a), tb = time(b);
    const ga = group(ta), gb = group(tb);
    return ga - gb || (ga === 0 ? ta - tb : ga === 1 ? tb - ta : 0);
  });
}
