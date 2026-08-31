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
  { key: "Won", label: "Won (Accepted)", owner: "field", group: "booking" },
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

/** Statuses a role works day-to-day (managers see everything). */
export function roleQueue(role: Role): string[] {
  if (role === "manager") return STATUS_KEYS;
  return STAGES.filter((s) => s.owner === role).map((s) => s.key);
}

/** Is this lead currently in the given role's queue? */
export function inRoleQueue(role: Role, status: string): boolean {
  if (role === "manager") return true;
  return stageOwner(status) === role;
}

/** Group buckets used by the Jobs/Bookings board. */
export const JOB_STATUSES = STAGES.filter((s) =>
  ["booking", "job", "finance"].includes(s.group)
).map((s) => s.key);

export const QUOTE_STATUSES = STAGES.filter((s) => s.group === "quote").map((s) => s.key);
