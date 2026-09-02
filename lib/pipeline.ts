// Canonical CRM pipeline: the ordered list of stages a lead moves through, and
// which role's queue each stage belongs to. Dependency-free (safe for edge,
// node, and the browser) so both the API and the dashboard share one source of
// truth. Handoffs are implicit: when a lead's status changes, it automatically
// appears in whichever role owns that stage.

import type { Role } from "@/lib/roles";

export type StageGroup = "lead" | "quote" | "booking" | "job" | "finance" | "closed";

export interface Stage {
  key: string;
  label: string;
  owner: Role; // whose queue this stage sits in
  group: StageGroup;
}

export const STAGES: Stage[] = [
  // ── Intake / sales (Login 1) ──
  { key: "New", label: "New", owner: "intake", group: "lead" },
  { key: "Contacted", label: "Contacted", owner: "intake", group: "lead" },
  { key: "Waiting for Info", label: "Waiting for Info", owner: "intake", group: "lead" },
  { key: "Quote Pending", label: "Quote Pending", owner: "intake", group: "quote" },
  { key: "Quote Sent", label: "Quote Sent", owner: "intake", group: "quote" },
  { key: "Negotiation", label: "Negotiation", owner: "intake", group: "quote" },
  // ── Field / scheduling (Login 2) ── accepted quote hands off here
  { key: "Won", label: "Won (Accepted)", owner: "intake", group: "booking" },
  { key: "Inspection Booked", label: "Inspection Booked", owner: "field", group: "booking" },
  { key: "Inspection Completed", label: "Inspection Completed", owner: "field", group: "booking" },
  { key: "Job Booked", label: "Job Booked", owner: "field", group: "booking" },
  { key: "Scheduled", label: "Scheduled", owner: "field", group: "job" },
  { key: "Job Confirmed", label: "Job Confirmed", owner: "field", group: "job" },
  { key: "Job In Progress", label: "Job In Progress", owner: "field", group: "job" },
  // ── Finance / completion (Login 3) ── job done hands off here
  { key: "Job Done", label: "Job Done", owner: "finance", group: "finance" },
  { key: "Payment Received", label: "Payment Received", owner: "finance", group: "finance" },
  { key: "Warranty Sent", label: "Warranty Sent", owner: "finance", group: "finance" },
  // ── Closed ──
  { key: "Lost", label: "Lost / Closed", owner: "intake", group: "closed" },
];

export const STATUS_KEYS: string[] = STAGES.map((s) => s.key);

const STAGE_BY_KEY = new Map(STAGES.map((s) => [s.key, s] as const));

export function stageOf(status: string): Stage | undefined {
  return STAGE_BY_KEY.get(status);
}

export function stageOwner(status: string): Role | null {
  return STAGE_BY_KEY.get(status)?.owner ?? null;
}

export function stageGroup(status: string): StageGroup | null {
  return STAGE_BY_KEY.get(status)?.group ?? null;
}

/** 1st Login (Intake / Leads): New up to Inspection Booked (handoff milestone) + Lost. */
export const INTAKE_STATUSES: string[] = [
  "New",
  "Contacted",
  "Waiting for Info",
  "Quote Pending",
  "Quote Sent",
  "Negotiation",
  "Won",
  "Inspection Booked",
  "Lost",
];

/** 2nd Login (Field / Scheduling): Inspection Booked through Job Done (handoff milestone). */
export const FIELD_STATUSES: string[] = [
  "Inspection Booked",
  "Inspection Completed",
  "Job Booked",
  "Scheduled",
  "Job Confirmed",
  "Job In Progress",
  "Job Done",
];

/** 3rd Login (Finance / Completion): Job Done to Payment Received to Warranty Sent. */
export const FINANCE_STATUSES: string[] = [
  "Job Done",
  "Payment Received",
  "Warranty Sent",
];

/** Group buckets used by the Jobs/Bookings board: Inspection Booked till Job Done. */
export const JOB_STATUSES: string[] = FIELD_STATUSES;

export const QUOTE_STATUSES = STAGES.filter((s) => s.group === "quote").map((s) => s.key);

/** Statuses a role works day-to-day (managers see everything). */
export function roleQueue(role: Role): string[] {
  if (role === "manager") return STATUS_KEYS;
  if (role === "intake") return INTAKE_STATUSES;
  if (role === "field") return FIELD_STATUSES;
  if (role === "finance") return FINANCE_STATUSES;
  return STATUS_KEYS;
}

/** Is this lead currently in the given role's queue? */
export function inRoleQueue(role: Role, status: string): boolean {
  if (role === "manager") return true;
  if (role === "intake") {
    // Lead stays in intake queue until it is booked for inspection (hands off to field)
    return ["New", "Contacted", "Waiting for Info", "Quote Pending", "Quote Sent", "Negotiation", "Won", "Lost"].includes(status);
  }
  if (role === "field") {
    // Field owns lead from Inspection Booked until Job Done (hands off to finance)
    return ["Inspection Booked", "Inspection Completed", "Job Booked", "Scheduled", "Job Confirmed", "Job In Progress"].includes(status);
  }
  if (role === "finance") {
    // Finance owns lead from Job Done through completion
    return FINANCE_STATUSES.includes(status);
  }
  return stageOwner(status) === role;
}
