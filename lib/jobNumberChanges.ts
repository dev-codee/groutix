import type { Lead } from "@/components/admin/types";

// Number generation sorts the rows. Compare identity rather than row position.
export function jobNumberChanges(before: Pick<Lead, "id" | "jobNo">[], after: Pick<Lead, "id" | "jobNo">[]) {
  const previous = new Map(before.map(lead => [lead.id, lead.jobNo]));
  return after.filter(lead => previous.has(lead.id) && previous.get(lead.id) !== lead.jobNo)
    .map(lead => ({ id: lead.id, jobNo: lead.jobNo }));
}
