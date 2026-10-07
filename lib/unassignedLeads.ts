import type { Lead } from "@/components/admin/types";

export type SchedulingType = "inspection" | "job";
type Assignee = { id: string; name: string; username?: string };

const normalize = (value?: string) => value?.trim().toLowerCase() || "";
const assigned = (value?: string) => Boolean(normalize(value) && normalize(value) !== "unassigned");

export function getLeadSchedulingType(lead: Lead): SchedulingType | null {
  switch (normalize(lead.status)) {
    case "new":
    case "contacted":
    case "waiting for info":
      return "inspection";
    case "inspection completed":
    case "quote":
    case "quote pending":
    case "quote sent":
    case "quote waiting for approval":
      return "job";
    default:
      return null;
  }
}

// The intake owner in `assigned` is separate from a field-staff assignment.
// A completed inspection's inspector does not assign the subsequent job.
export function getUnassignedSchedulingType(
  lead: Lead,
  inspectors: readonly Assignee[],
  technicians: readonly Assignee[],
): SchedulingType | null {
  const type = getLeadSchedulingType(lead);
  if (!type) return null;
  const staff = type === "inspection" ? inspectors : technicians;
  const legacyAssignment = assigned(lead.assigned) && staff.some((member) =>
    [member.id, member.name, member.username].some((value) =>
      assigned(value) && normalize(value) === normalize(lead.assigned),
    ),
  );
  const fieldAssignment = type === "inspection"
    ? assigned(lead.inspectorId)
    : assigned(lead.technicianId) || assigned(lead.technician) || assigned(lead.technicianUsername);
  return fieldAssignment || legacyAssignment ? null : type;
}
