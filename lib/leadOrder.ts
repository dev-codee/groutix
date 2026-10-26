type DatedLead = { id?: string; createdAt?: string; received?: string };

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
