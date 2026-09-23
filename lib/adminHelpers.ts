// Pure helpers for the admin CRM — no React dependencies.
// Row components and page.tsx both import from here.

import type { Lead } from "@/components/admin/types";
import type { Role } from "./roles";
import type { StageGroup } from "./pipeline";
import { STATUS_KEYS, INTAKE_STATUSES, INSPECTION_STATUSES, TECHNICIAN_STATUSES, FINANCE_STATUSES } from "./pipeline";
import { formatAppt } from "./scheduling";

// ── Job number constants ──────────────────────────────────────────────────────
export const JOB_NO_START = 1201;
export const JOB_NO_PREFIX = "Job No-";
const NEW_LEADS_CUTOFF_KEY = "gx_new_leads_cutoff_ms";
const DEFAULT_LEGACY_CUTOFF_MS = 1789102800000;

export const STATUS_LIST: string[] = STATUS_KEYS;

// The manager-facing status filter dropdown (Leads view) only surfaces the
// primary pipeline stages — a few rarely-used micro-stages that overlap with
// an adjacent stage (Negotiation ~ Quote Sent, Won ~ Job Booked, Scheduled ~
// Job Confirmed, Job Started ~ Job In Progress) are left out to keep the list
// short. Leads that happen to sit in one of those hidden statuses are still
// counted under "All statuses" and can still be reached via links elsewhere
// in the app (e.g. dashboard cards) — they're just not offered as a filter.
const MANAGER_STATUS_FILTER_HIDDEN = new Set(["Negotiation", "Won", "Scheduled", "Job Started"]);
export const MANAGER_STATUS_FILTER_LIST: string[] = STATUS_LIST.filter(
  (s) => !MANAGER_STATUS_FILTER_HIDDEN.has(s)
);

// ── Visit micro-stages ────────────────────────────────────────────────────────
export type VisitStep = { label: string; status: string };
export const INSPECTION_STEPS: VisitStep[] = [
  { label: "On the Way", status: "Inspection En Route" },
  { label: "Reached", status: "Inspection Arrived" },
  { label: "Start", status: "Inspection In Progress" },
  { label: "Complete", status: "Inspection Completed" },
];
export const JOB_STEPS: VisitStep[] = [
  { label: "On the Way", status: "Job En Route" },
  { label: "Reached", status: "Job Arrived" },
  { label: "Start", status: "Job In Progress" },
  { label: "Job Done", status: "Job Done" },
];
export const INSPECTION_PHASE = [
  "Inspection Booked",
  "Inspection En Route",
  "Inspection Arrived",
  "Inspection In Progress",
];
export const JOB_PHASE = [
  "Won",
  "Job Booked",
  "Scheduled",
  "Job Confirmed",
  "Job En Route",
  "Job Arrived",
  "Job Started",
  "Job In Progress",
];

export const STAGE_GROUP_ACCENT: Record<StageGroup, { dot: string; value: string }> = {
  lead: { dot: "bg-blue-500", value: "text-blue-600" },
  quote: { dot: "bg-amber-500", value: "text-amber-600" },
  booking: { dot: "bg-violet-500", value: "text-violet-600" },
  job: { dot: "bg-sky-500", value: "text-sky-600" },
  finance: { dot: "bg-emerald-500", value: "text-emerald-600" },
  closed: { dot: "bg-slate-400", value: "text-slate-500" },
};

// ── Job number helpers ────────────────────────────────────────────────────────

export function getNewLeadsCutoffMs(): number {
  if (typeof window === "undefined") return DEFAULT_LEGACY_CUTOFF_MS;
  const existing = window.localStorage.getItem(NEW_LEADS_CUTOFF_KEY);
  if (existing) {
    const n = parseInt(existing, 10);
    if (!isNaN(n) && n > 0) return Math.min(n, DEFAULT_LEGACY_CUTOFF_MS);
  }
  try {
    window.localStorage.setItem(NEW_LEADS_CUTOFF_KEY, String(DEFAULT_LEGACY_CUTOFF_MS));
  } catch { /* ignore */ }
  return DEFAULT_LEGACY_CUTOFF_MS;
}

export function isLegacyLead(lead: Lead, cutoffMs: number): boolean {
  if (lead.jobNo) return false;
  const t = new Date(lead.createdAt).getTime();
  return isNaN(t) ? false : t < cutoffMs;
}

export function extractJobNoNumeric(jobNo?: string): number | null {
  if (!jobNo) return null;
  const match = jobNo.match(/^(?:GQ|JobNo|JOBNO|Job No)-(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

export function generateJobNos(leads: Lead[], cutoffMs: number): Lead[] {
  const byId = new Map<string, Lead>();
  for (const l of leads) {
    let jNo = isLegacyLead(l, cutoffMs) ? undefined : l.jobNo;
    if (jNo && /^(?:GQ|JobNo|JOBNO)-/i.test(jNo)) {
      jNo = jNo.replace(/^(?:GQ|JobNo|JOBNO)-/i, JOB_NO_PREFIX);
    }
    byId.set(l.id, { ...l, jobNo: jNo });
  }

  const newOnly = leads
    .filter((l) => !isLegacyLead(l, cutoffMs))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let maxExisting = JOB_NO_START - 1;
  const usedNumbers = new Set<number>();

  for (const ref of newOnly) {
    const l = byId.get(ref.id)!;
    const n = extractJobNoNumeric(l.jobNo);
    if (n !== null) {
      if (usedNumbers.has(n)) {
        l.jobNo = undefined;
      } else {
        usedNumbers.add(n);
        if (n > maxExisting) maxExisting = n;
      }
    }
  }

  let next = maxExisting + 1;
  for (const ref of newOnly) {
    const l = byId.get(ref.id)!;
    if (!l.jobNo) {
      while (usedNumbers.has(next)) next++;
      l.jobNo = `${JOB_NO_PREFIX}${next}`;
      usedNumbers.add(next);
      next++;
    } else if (/^(?:GQ|JobNo|JOBNO)-/i.test(l.jobNo)) {
      l.jobNo = l.jobNo.replace(/^(?:GQ|JobNo|JOBNO)-/i, JOB_NO_PREFIX);
    }
  }

  return leads
    .map((l) => byId.get(l.id)!)
    .sort((a, b) => {
      const na = extractJobNoNumeric(a.jobNo);
      const nb = extractJobNoNumeric(b.jobNo);
      if (na !== null && nb !== null) return nb - na;
      if (na !== null) return 1;
      if (nb !== null) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

// ── Visit step helpers ────────────────────────────────────────────────────────

export function visitStepsFor(status: string): VisitStep[] | null {
  if (INSPECTION_PHASE.includes(status)) return INSPECTION_STEPS;
  if (JOB_PHASE.includes(status)) return JOB_STEPS;
  return null;
}

// ── Status helpers ────────────────────────────────────────────────────────────

export function getRoleStatusOptions(role: Role, currentStatus?: string): string[] {
  let base: string[];
  if (role === "intake") base = INTAKE_STATUSES;
  else if (role === "inspection" || role === "field") base = INSPECTION_STATUSES;
  else if (role === "technician") base = TECHNICIAN_STATUSES;
  else if (role === "finance") base = FINANCE_STATUSES;
  else base = STATUS_LIST;

  if (currentStatus && !base.includes(currentStatus)) {
    return [currentStatus, ...base];
  }
  return base;
}

export function normalizeStatus(s?: string): string {
  if (!s) return "New";
  const lower = s.toLowerCase().trim();
  if (lower === "new") return "New";
  if (lower === "read") return "Contacted";
  if (lower === "archived") return "Lost";
  const matched = STATUS_LIST.find((x) => x.toLowerCase() === lower);
  return matched || s;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function esc(s?: string) {
  return s || "";
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return (
    formatAppt(iso, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) || "—"
  );
}

export function fmtDateOnly(iso?: string) {
  if (!iso) return "—";
  return (
    formatAppt(iso, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) || "—"
  );
}

export function fmtDateBadge(iso?: string) {
  if (!iso) return "—";
  return (
    formatAppt(iso, { day: "numeric", month: "short", year: "numeric" }).toUpperCase() || "—"
  );
}

export function fmtTimeBadge(iso?: string) {
  if (!iso) return "";
  return formatAppt(iso, { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

export function getLeadQuoteTotal(l: Lead): number {
  const items = Array.isArray(l.quoteItems) ? l.quoteItems : [];
  const sub = items.reduce((a, x) => a + Number(x.price || 0) * Number(x.qty || 1), 0);
  return (
    l.quoteAmount ||
    (l.quoteTaxMode === "exclusive" ? sub * (1 + (l.quoteTaxRate || 10) / 100) : sub)
  );
}

export function getWhatsAppLink(phone?: string): string {
  if (!phone) return "#";
  const clean = phone.replace(/[^0-9+]/g, "");
  if (!clean) return "#";
  const num = clean.startsWith("+")
    ? clean.replace("+", "")
    : clean.startsWith("0")
    ? "61" + clean.slice(1)
    : clean;
  return `https://wa.me/${num}`;
}

export function getStepActive(lead: Lead, step: string): boolean {
  const s = lead.status;
  switch (step) {
    case "New":
      return true;
    case "Inspection Booked":
      return [
        "Inspection Booked","Inspection En Route","Inspection Arrived","Inspection In Progress",
        "Inspection Completed","Quote Pending","Quote Sent","Negotiation","Won","Job Booked",
        "Scheduled","Job Confirmed","Job En Route","Job Arrived","Job Started","Job In Progress",
        "Job Done","Invoice Sent","Payment Request","Payment Pending","Payment Received",
        "Warranty Sent","Completed",
      ].includes(s);
    case "Inspection Completed":
      return [
        "Inspection Completed","Quote Pending","Quote Sent","Negotiation","Won","Job Booked",
        "Scheduled","Job Confirmed","Job En Route","Job Arrived","Job Started","Job In Progress",
        "Job Done","Invoice Sent","Payment Request","Payment Pending","Payment Received",
        "Warranty Sent","Completed",
      ].includes(s);
    case "Quote Sent":
      return [
        "Quote Sent","Negotiation","Won","Job Booked","Scheduled","Job Confirmed","Job En Route",
        "Job Arrived","Job Started","Job In Progress","Job Done","Invoice Sent","Payment Request",
        "Payment Pending","Payment Received","Warranty Sent","Completed",
      ].includes(s);
    case "Job Booked":
      return [
        "Job Booked","Scheduled","Job Confirmed","Job En Route","Job Arrived","Job Started",
        "Job In Progress","Job Done","Invoice Sent","Payment Request","Payment Pending",
        "Payment Received","Warranty Sent","Completed",
      ].includes(s);
    case "Job Done":
      return [
        "Job Done","Invoice Sent","Payment Request","Payment Pending","Payment Received",
        "Warranty Sent","Completed",
      ].includes(s);
    case "Invoice Sent":
      return (
        Boolean(lead.invoiceSentAt) ||
        ["Invoice Sent","Payment Request","Payment Pending","Payment Received","Warranty Sent","Completed"].includes(s)
      );
    case "Payment Request":
      return [
        "Payment Request","Invoice Sent","Payment Pending","Payment Received","Warranty Sent","Completed",
      ].includes(s);
    case "Payment Pending":
      return ["Payment Pending","Payment Received","Warranty Sent","Completed"].includes(s);
    case "Payment Received":
      return ["Payment Received","Warranty Sent","Completed"].includes(s);
    case "Warranty":
    case "Warranty Sent":
      return Boolean(lead.warranty?.sentAt) || ["Warranty Sent","Completed"].includes(s);
    case "Completed":
      return s === "Completed";
    default:
      return false;
  }
}

export function getLatestStepIndex(lead: Lead, steps: { step: string }[]): number {
  let latestIdx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (getStepActive(lead, steps[i].step)) latestIdx = i;
  }
  return latestIdx;
}

export function calcResponseTime(received?: string, contacted?: string) {
  if (!received || !contacted) return "—";
  const m = Math.max(
    0,
    Math.round((new Date(contacted).getTime() - new Date(received).getTime()) / 60000)
  );
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (mm > 0 || parts.length === 0) parts.push(`${mm}m`);
  return parts.join(" ");
}

export function isRedundantScope(service?: string, scope?: string): boolean {
  if (!service || !scope) return false;
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const svc = norm(service);
  const scp = norm(scope);
  if (!svc || !scp) return false;
  return svc === scp || svc.includes(scp) || scp.includes(svc);
}

export function getBadgeColor(status: string) {
  switch (status) {
    case "Won":
    case "Payment Received":
    case "Job Done":
    case "Warranty Sent":
    case "Inspection Completed":
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold";
    case "Inspection En Route":
    case "Inspection Arrived":
    case "Inspection In Progress":
    case "Job En Route":
    case "Job Arrived":
    case "Job Started":
    case "Job In Progress":
      return "bg-amber-50 text-amber-700 border-amber-200/80 font-semibold";
    case "Lost":
      return "bg-slate-100 text-slate-500 border-slate-200/80 font-medium";
    case "New":
      return "bg-blue-50 text-blue-700 border-blue-200/80 font-semibold";
    case "Quote Sent":
    case "Quote Pending":
      return "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-semibold";
    case "Job Booked":
    case "Scheduled":
    case "Job Confirmed":
    case "Inspection Booked":
      return "bg-sky-50 text-sky-700 border-sky-200/80 font-semibold";
    case "Invoice Sent":
    case "Payment Pending":
      return "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200/80 font-medium";
  }
}

export function getFollowupPrompt(lead: Lead): string {
  const steps = [
    { step: "New", label: "New" },
    { step: "Inspection Booked", label: "Inspection Booked" },
    { step: "Inspection Completed", label: "Inspection Completed" },
    { step: "Quote Sent", label: "Quote Sent" },
    { step: "Job Booked", label: "Job Booked" },
    { step: "Invoice Sent", label: "Invoice Sent" },
    { step: "Payment Pending", label: "Payment Pending" },
    { step: "Payment Received", label: "Payment Received" },
    { step: "Warranty Sent", label: "Warranty Sent" },
    { step: "Completed", label: "Completed" },
  ];
  let latest = "New";
  for (const s of steps) {
    if (getStepActive(lead, s.step)) latest = s.label;
  }
  return latest;
}
