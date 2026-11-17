import { getActiveUsersByRole } from "@/lib/users";
import { pickAssigneeForRole } from "@/lib/submissions";

type InspectorAssignment = { assigned?: string | null; inspectorId?: string | null; inspectorUsername?: string | null };

/** Resolve before saving so the lead and reserved visit receive the same inspector. */
export async function inspectionAssignmentOnBooking(current: InspectorAssignment): Promise<InspectorAssignment | null> {
  const inspectors = await getActiveUsersByRole("inspection");
  if (!inspectors.length) return null;
  const normalize = (value?: string | null) => (value || "").trim().toLowerCase();
  // A deliberately selected ID must never be replaced by workload balancing.
  const selected = inspectors.find(person => person.id === current.inspectorId)
    || inspectors.find(person => normalize(person.username) === normalize(current.inspectorUsername))
    || inspectors.find(person => [normalize(person.name), normalize(person.username)].includes(normalize(current.assigned)));
  if (!selected && current.inspectorId && normalize(current.inspectorId) !== "unassigned") return null;
  const name = selected ? null : await pickAssigneeForRole("inspection");
  const inspector = selected || inspectors.find(person => person.name === name);
  if (!inspector) return null;
  return { assigned: inspector.name, inspectorId: inspector.id, inspectorUsername: inspector.username };
}
