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

// Inspection-first pipeline: a lead is captured, a FREE inspection is booked and
// carried out, then Intake quotes off the inspection findings, the customer
// accepts, the job is booked & done, and Finance invoices → payment → warranty →
// completed. The En Route / Arrived / In Progress micro-stages track a
// technician's visit so the CRM mirrors what's happening on the ground.
export const STAGES: Stage[] = [
  // ── Intake / sales (Login 1) ── new enquiry capture
  { key: "New", label: "New", owner: "intake", group: "lead" },
  { key: "Contacted", label: "Contacted", owner: "intake", group: "lead" },
  { key: "Waiting for Info", label: "Waiting for Info", owner: "intake", group: "lead" },
  // ── Inspection (Login 2 / Inspection) ── free inspection happens BEFORE the quote
  { key: "Inspection Booked", label: "Inspection Booked", owner: "inspection", group: "booking" },
  { key: "Inspection En Route", label: "Inspection — On the Way", owner: "inspection", group: "booking" },
  { key: "Inspection Arrived", label: "Inspection — Reached", owner: "inspection", group: "booking" },
  { key: "Inspection In Progress", label: "Inspection In Progress", owner: "inspection", group: "booking" },
  // Completed inspection hands the lead BACK to Intake to build the quote.
  { key: "Inspection Completed", label: "Inspection Completed", owner: "intake", group: "booking" },
  // ── Quote (Login 1 / Intake) ──
  { key: "Quote Pending", label: "Quote Pending", owner: "intake", group: "quote" },
  { key: "Quote Sent", label: "Quote Sent", owner: "intake", group: "quote" },
  { key: "Negotiation", label: "Negotiation", owner: "intake", group: "quote" },
  // Accepted quote hands off to Technician to book & execute the job.
  { key: "Won", label: "Quote Accepted", owner: "technician", group: "booking" },
  // ── Job (Login 3 / Technician) ──
  { key: "Job Booked", label: "Job Booked", owner: "technician", group: "job" },
  { key: "Scheduled", label: "Scheduled", owner: "technician", group: "job" },
  { key: "Job Confirmed", label: "Job Confirmed", owner: "technician", group: "job" },
  { key: "Job En Route", label: "Job — On the Way", owner: "technician", group: "job" },
  { key: "Job Arrived", label: "Job — Reached", owner: "technician", group: "job" },
  { key: "Job In Progress", label: "Job In Progress", owner: "technician", group: "job" },
  // ── Finance / completion (Login 4) ── job done hands off here
  { key: "Job Done", label: "Job Done", owner: "finance", group: "finance" },
  { key: "Invoice Sent", label: "Invoice Sent", owner: "finance", group: "finance" },
  { key: "Payment Pending", label: "Payment Pending", owner: "finance", group: "finance" },
  { key: "Payment Received", label: "Payment Received", owner: "finance", group: "finance" },
  { key: "Warranty Sent", label: "Warranty Sent", owner: "finance", group: "finance" },
  // Everything done — invoiced, paid, warrantied.
  { key: "Completed", label: "Completed 🏆", owner: "finance", group: "closed" },
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

/**
 * 1st Login (Intake / Leads): capture the lead, book the free inspection, then
 * (after the inspection) build & send the quote. Owns the pre-inspection and
 * quoting stages, plus Lost.
 */
export const INTAKE_STATUSES: string[] = [
  "New",
  "Contacted",
  "Waiting for Info",
  "Inspection Booked", // intake books the inspection, which hands off to inspection
  "Inspection Completed", // handed back to intake to quote
  "Quote Pending",
  "Quote Sent",
  "Negotiation",
  "Won",
  "Job Booked",
  "Lost",
];

/**
 * 2nd Login (Inspection / Field Visit): runs the inspection visit on-site,
 * completes inspection report, and hands back to intake to quote.
 */
export const INSPECTION_STATUSES: string[] = [
  "Inspection Booked",
  "Inspection En Route",
  "Inspection Arrived",
  "Inspection In Progress",
  "Inspection Completed",
];

/**
 * 3rd Login (Technician / Job Execution): executes the approved job on-site.
 * En Route / Arrived / In Progress → Job Done hands off to Finance.
 */
export const TECHNICIAN_STATUSES: string[] = [
  "Won",
  "Job Booked",
  "Scheduled",
  "Job Confirmed",
  "Job En Route",
  "Job Arrived",
  "Job In Progress",
  "Job Done",
];

/** Group of all field visit stages (inspection + job). */
export const FIELD_STATUSES: string[] = [
  ...INSPECTION_STATUSES,
  "Quote Pending",
  ...TECHNICIAN_STATUSES,
];

/** 4th Login (Finance / Completion): Job Done → Invoice → Payment → Warranty → Completed. */
export const FINANCE_STATUSES: string[] = [
  "Job Done",
  "Invoice Sent",
  "Payment Pending",
  "Payment Received",
  "Warranty Sent",
  "Completed",
];

/** Group buckets used by the Jobs/Bookings board: every inspection + job stage. */
export const JOB_STATUSES: string[] = FIELD_STATUSES;

export const QUOTE_STATUSES = STAGES.filter((s) => s.group === "quote").map((s) => s.key);

/** Statuses a role works day-to-day (managers see everything). */
export function roleQueue(role: Role): string[] {
  if (role === "manager" || role === "super_admin") return STATUS_KEYS;
  if (role === "intake") return INTAKE_STATUSES;
  if (role === "inspection" || role === "field") return INSPECTION_STATUSES;
  if (role === "technician") return TECHNICIAN_STATUSES;
  if (role === "finance") return FINANCE_STATUSES;
  return STATUS_KEYS;
}

/** Is this lead currently in the given role's queue? */
export function inRoleQueue(role: Role, status: string): boolean {
  if (role === "manager" || role === "super_admin") return true;
  if (role === "intake") {
    // Intake owns capture, booking the inspection, quoting after inspection, and Won/Job Booked
    return [
      "New",
      "Contacted",
      "Waiting for Info",
      "Inspection Booked",
      "Inspection Completed",
      "Quote Pending",
      "Quote Sent",
      "Negotiation",
      "Won",
      "Job Booked",
      "Lost",
    ].includes(status);
  }
  if (role === "inspection" || role === "field") {
    // Inspection / Field Visit owns the on-site inspection visit up to quote handoff
    return [
      ...INSPECTION_STATUSES,
      "Quote Pending",
    ].includes(status);
  }
  if (role === "technician") {
    // Technician owns job execution on-site (Won/Job Booked through Job Done)
    return TECHNICIAN_STATUSES.includes(status);
  }
  if (role === "finance") {
    // Finance owns lead from Job Done through completion
    return FINANCE_STATUSES.includes(status);
  }
  return stageOwner(status) === role;
}
