/** Dispatch labels group the existing CRM stages; customer records keep their saved status. */
export const DISPATCH_LEAD_FILTERS = [
  { id: "new", label: "New Lead", statuses: ["New", "New Lead"] },
  { id: "contacted", label: "Contacted", statuses: ["Contacted"] },
  { id: "waiting-info", label: "Waiting for Info", statuses: ["Waiting for Info"] },
  { id: "inspection-booked", label: "Inspection Booked", statuses: ["Inspection Booked", "Inspection En Route", "Inspection Arrived", "Inspection In Progress"] },
  { id: "inspection-completed", label: "Inspection Completed", statuses: ["Inspection Completed"] },
  { id: "quote", label: "Quote", statuses: ["Quote", "Quote Sent", "Negotiation", "Won", "Quote Accepted"] },
  { id: "quote-waiting", label: "Quote Waiting", statuses: ["Quote Waiting", "Quote Pending"] },
  { id: "job-booked", label: "Job Booked", statuses: ["Job Booked", "Scheduled", "Job Confirmed", "Job En Route", "Job Arrived", "Job Started", "Job In Progress"] },
] as const;
export type DispatchLeadFilter = "active" | typeof DISPATCH_LEAD_FILTERS[number]["id"];
const normalized = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
export function dispatchLeadStage(status: string) {
  return DISPATCH_LEAD_FILTERS.find(stage => stage.statuses.some(value => normalized(value) === normalized(status)));
}
export function matchesDispatchLeadStatus(status: string, filter: DispatchLeadFilter) {
  const stage = dispatchLeadStage(status);
  // Completed inspections are available explicitly for the next booking/quote,
  // while the initial dispatch list stays focused on work waiting to progress.
  return filter === "active" ? !!stage && stage.id !== "inspection-completed" : stage?.id === filter;
}
