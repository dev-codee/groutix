import type { Lead } from "@/components/admin/types";
import { leadBookings } from "./leadBookings";

export class EarningsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type EarningsBasis = "ex_gst" | "inclusive";
export interface EarningsMember {
  id: string; name: string; role: string; active: boolean; aliases: string[]; username?: string;
}
export interface EarningsShare { memberId: string; name: string; rateBps: number; earnedCents: number; paidCents: number }
export interface EarningsInvoice { number: string; totalCents: number; gstBps: number; baseCents: number }
export interface EarningsLedger {
  id: string; version: number; status: "draft" | "approved"; basis: EarningsBasis;
  shares: EarningsShare[]; invoice: EarningsInvoice | null; notes: string;
  approvedAt?: string; approvedBy?: string; updatedAt: string;
  jobLabel: string; customer: string;
}
export interface EarningsJob {
  id: string; jobLabel: string; customer: string; service: string; status: string;
  assignedIds: string[]; assignedNames: string[]; completedVisits: number; totalVisits: number;
  memberWork: { memberId: string; completedVisits: number; totalVisits: number; daysDone: number; daysPlanned: number }[];
  daysDone: number; daysPlanned: number; invoice: EarningsInvoice | null; invoicePaid: boolean;
  eligible: boolean; unavailableReason: string; ledger: EarningsLedger | null; changed: boolean;
}
export interface EarningsPayment {
  id: string; memberId: string; memberName: string; amountCents: number; date: string;
  method: string; reference: string; note: string; actor: string; createdAt: string;
  voidedAt?: string; voidedBy?: string; voidReason?: string;
}
export interface EarningsEvent { id: string; action: string; actor: string; createdAt: string; detail: string }
export interface EarningsData { members: EarningsMember[]; jobs: EarningsJob[] }
export function earningsBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EarningsError("Invalid request.");
  return value as Record<string, unknown>;
}
export function earningsText(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new EarningsError(`${label} must be ${required ? "non-empty " : ""}text up to ${max} characters.`);
  return value.trim();
}
export function earningsInteger(value: unknown, label: string, min = 0, max = 1_000_000_000_000): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new EarningsError(`Invalid ${label}.`);
  return value;
}
export function earningsId(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new EarningsError("Invalid request ID.");
  return value.toLowerCase();
}
export function invoiceForEarnings(lead: Pick<Lead, "invoiceNumber" | "invoiceAmount" | "invoiceDraft">, basis: EarningsBasis): EarningsInvoice | null {
  const total = lead.invoiceAmount;
  if (!lead.invoiceNumber || typeof total !== "number" || !Number.isFinite(total) || total <= 0 || total > 1_000_000_000) return null;
  const gst = lead.invoiceDraft?.gst ?? 10;
  if (!Number.isFinite(gst) || gst < 0 || gst > 100) return null;
  const totalCents = Math.round(total * 100), gstBps = Math.round(gst * 100);
  return { number: lead.invoiceNumber, totalCents, gstBps, baseCents: basis === "inclusive" ? totalCents : Math.round(totalCents * 10000 / (10000 + gstBps)) };
}
export function sameEarningsInvoice(a: EarningsInvoice | null, b: EarningsInvoice | null) {
  return !!a && !!b && a.number === b.number && a.totalCents === b.totalCents && a.gstBps === b.gstBps && a.baseCents === b.baseCents;
}
export function parseEarningsShares(value: unknown, members: EarningsMember[], existing: EarningsShare[] = []): EarningsShare[] {
  if (!Array.isArray(value) || !value.length || value.length > 20) throw new EarningsError("Choose between 1 and 20 team members.");
  const ids = new Set<string>();
  const shares = value.map(row => {
    const body = earningsBody(row);
    const member = members.find(m => m.id === body.memberId);
    if (!member || (!member.active && !existing.some(s => s.memberId === member.id))) throw new EarningsError("Choose an active team member for new shares.");
    if (ids.has(member.id)) throw new EarningsError("A team member can appear only once per job.");
    ids.add(member.id);
    return { memberId: member.id, name: member.name, rateBps: earningsInteger(body.rateBps, "percentage (0.01–100%)", 1, 10000), earnedCents: 0, paidCents: 0 };
  });
  if (shares.reduce((sum, row) => sum + row.rateBps, 0) > 10000) throw new EarningsError("Combined team shares cannot exceed 100% of the invoice basis.");
  return shares;
}
// Allocate whole cents using the largest-remainder method, with a stable ID
// tie-break. Shared jobs never create an extra cent or exceed the invoice base.
export function calculateEarnings(shares: EarningsShare[], baseCents: number): EarningsShare[] {
  const values = shares.map(s => ({ ...s, earnedCents: Math.floor(baseCents * s.rateBps / 10000), paidCents: 0 }));
  const target = Math.round(baseCents * shares.reduce((sum, s) => sum + s.rateBps, 0) / 10000);
  let remainder = target - values.reduce((sum, s) => sum + s.earnedCents, 0);
  const order = values.map((s, index) => ({ index, fraction: baseCents * s.rateBps % 10000, id: s.memberId })).sort((a, b) => b.fraction - a.fraction || a.id.localeCompare(b.id));
  for (const row of order) if (remainder-- > 0) values[row.index].earnedCents++;
  return values;
}
function resolveMember(members: EarningsMember[], ids: (string | undefined)[], names: (string | undefined)[]) {
  for (const id of ids.filter(Boolean)) {
    const member = members.find(m => m.id === id || m.aliases.includes(id!));
    if (member) return member;
  }
  for (const name of names.filter(Boolean)) {
    const normalized = name!.trim().toLowerCase();
    const byUsername = members.filter(m => m.username?.toLowerCase() === normalized);
    if (byUsername.length === 1) return byUsername[0];
    const matches = members.filter(m => m.name.trim().toLowerCase() === normalized);
    if (matches.length === 1) return matches[0];
  }
}
export function earningsJob(lead: Lead, members: EarningsMember[], ledger: EarningsLedger | null): EarningsJob {
  const visits = leadBookings(lead).filter(b => b.type === "job" && b.status !== "Cancelled");
  const assignments = [resolveMember(members, [lead.technicianId], [lead.technicianUsername, lead.technician]), resolveMember(members, [lead.inspectorId], [lead.inspectorUsername, lead.assigned]),
    ...visits.map(b => resolveMember(members, [b.technicianId], [b.technicianUsername, b.technician])),
    ...leadBookings(lead).filter(b => b.type === "inspection" && b.status !== "Cancelled").map(b => resolveMember(members, [b.inspectorId], [b.inspectorUsername, b.assigned]))].filter((m): m is EarningsMember => !!m);
  const invoice = invoiceForEarnings(lead, ledger?.basis || "ex_gst");
  const hasJobVisits = leadBookings(lead).some(b => b.type === "job");
  const completed = visits.length ? visits.every(b => b.status === "Job Done") : !hasJobVisits && ["Job Done", "Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(lead.status);
  const unavailableReason = ["Cancelled", "Lost"].includes(lead.status) ? "Job is cancelled or lost." : !invoice ? "Save a valid invoice first." : !completed ? "Complete all active job visits first." : "";
  const safeDays = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
  const memberWork = new Map<string, EarningsJob["memberWork"][number]>();
  for (const visit of leadBookings(lead).filter(b => b.status !== "Cancelled")) {
    const worker = visit.type === "job" ? resolveMember(members, [visit.technicianId], [visit.technicianUsername, visit.technician]) : resolveMember(members, [visit.inspectorId], [visit.inspectorUsername, visit.assigned]);
    if (!worker) continue;
    const work = memberWork.get(worker.id) || { memberId: worker.id, completedVisits: 0, totalVisits: 0, daysDone: 0, daysPlanned: 0 };
    work.totalVisits++;
    if (visit.status === "Job Done" || visit.status === "Inspection Completed") work.completedVisits++;
    if (visit.type === "job") { work.daysDone += safeDays(visit.jobDaysDone); work.daysPlanned += safeDays(visit.jobTotalDays); }
    memberWork.set(worker.id, work);
  }
  return { id: lead.id, jobLabel: lead.jobNo || `Lead-${lead.id.slice(-6)}`, customer: lead.name || "Customer", service: lead.service || "", status: lead.status,
    assignedIds: [...new Set(assignments.map(m => m.id))], assignedNames: [...new Set([lead.assigned, lead.technician, ...assignments.map(m => m.name), ...visits.map(b => b.technician)].filter((s): s is string => !!s))],
    memberWork: [...memberWork.values()], completedVisits: visits.filter(b => b.status === "Job Done").length, totalVisits: visits.length,
    daysDone: visits.length ? visits.reduce((sum, b) => sum + safeDays(b.jobDaysDone), 0) : safeDays(lead.jobDaysDone), daysPlanned: visits.length ? visits.reduce((sum, b) => sum + safeDays(b.jobTotalDays), 0) : safeDays(lead.jobTotalDays),
    invoice, invoicePaid: lead.invoiceStatus === "Paid" || lead.paymentType === "full", eligible: !unavailableReason, unavailableReason, ledger,
    changed: ledger?.status === "approved" && (!sameEarningsInvoice(ledger.invoice, invoice) || !!unavailableReason) || false };
}
