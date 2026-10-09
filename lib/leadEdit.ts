import type { Lead } from "@/components/admin/types";
import { normalizeApptString } from "@/lib/scheduling";

const editableFields = [
  "name", "phone", "email", "address", "service", "status", "assigned",
  "contacted", "follow", "inspectionAt", "jobAt", "notes",
] as const;
const dateFields = new Set<string>(["contacted", "follow", "inspectionAt", "jobAt"]);

/** Submit just the fields edited in the lead form, preserving server-owned data. */
export function leadEditChanges(edited: Partial<Lead>, original: Partial<Lead>): Partial<Lead> {
  const changes: Partial<Lead> = {};
  for (const field of editableFields) {
    if (!(field in edited)) continue;
    const value = dateFields.has(field) ? normalizeApptString(edited[field]) || "" : edited[field] || "";
    const before = dateFields.has(field) ? normalizeApptString(original[field]) || "" : original[field] || "";
    if (value !== before) changes[field] = value;
  }
  if ("inspectionAt" in changes) changes.inspectionReminderSent = false;
  if ("jobAt" in changes) changes.jobReminderSent = false;
  return changes;
}
