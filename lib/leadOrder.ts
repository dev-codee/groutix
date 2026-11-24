import { apptInstantMs, melbourneYmd } from "./scheduling";

type DatedLead = { id?: string; createdAt?: string; received?: string };
type ScheduledLead = DatedLead & {
  inspectionAt?: string; inspectionEndAt?: string; inspectionWorkSegments?: { date: string }[];
  jobAt?: string; jobEndAt?: string; jobWorkSegments?: { date: string }[];
  activeBooking?: { start: string };
};

function visitEndDay(lead: ScheduledLead, field: "inspectionAt" | "jobAt"): string | null {
  const end = field === "jobAt" ? lead.jobEndAt : lead.inspectionEndAt;
  const segments = field === "jobAt" ? lead.jobWorkSegments : lead.inspectionWorkSegments;
  const lastSegment = segments?.map(segment => segment.date).filter(Boolean).sort().at(-1);
  const endInstant = apptInstantMs(end);
  const startInstant = apptInstantMs(lead.activeBooking?.start || lead[field]);
  return [Number.isFinite(startInstant) ? melbourneYmd(new Date(startInstant)) : null,
    Number.isFinite(endInstant) ? melbourneYmd(new Date(endInstant)) : null, lastSegment]
    .filter((day): day is string => Boolean(day)).sort().at(-1) || null;
}

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

/** Keep today's visits in the active order through the end of Melbourne's day. */
export function dashboardLeadsFirst<T extends ScheduledLead>(leads: readonly T[], role: string, now = Date.now()): T[] {
  const field = role === "inspection" || role === "field" ? "inspectionAt"
    : role === "technician" ? "jobAt" : null;
  if (!field) return newestLeadsFirst(leads);
  const time = (lead: T) => apptInstantMs(lead.activeBooking?.start || lead[field]);
  const today = melbourneYmd(new Date(now));
  const group = (lead: T) => {
    const day = visitEndDay(lead, field);
    return !day ? 2 : day >= today ? 0 : 1;
  };
  return newestLeadsFirst(leads).sort((a, b) => {
    const ta = time(a), tb = time(b);
    const ga = group(a), gb = group(b);
    return ga - gb || (ga === 0 ? ta - tb : ga === 1 ? tb - ta : 0);
  });
}

/** An active field visit remains on the work board until completion or date end. */
export function roleVisitVisibleThroughDay(lead: ScheduledLead, role: string, now = Date.now()): boolean {
  const day = visitEndDay(lead, role === "technician" ? "jobAt" : "inspectionAt");
  return !day || day >= melbourneYmd(new Date(now));
}
