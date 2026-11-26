import type { Lead } from "@/components/admin/types";
import { invoiceBalance, invoicePaymentStatus } from "./invoiceBalance";
import { isPrimaryBooking, leadBookings } from "./leadBookings";
import type { TeamEarningsSettings } from "./teamEarningsSettings";

export class EarningsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type EarningsBasis = "ex_gst" | "inclusive";
export interface EarningsMember {
  id: string; name: string; role: string; active: boolean; aliases: string[]; username?: string;
}
export interface EarningsShare { memberId: string; name: string; rateBps: number; fixedAmountCents?: number; earnedCents: number; paidCents: number }
export interface EarningsInvoice { key?: string; number: string; totalCents: number; gstBps: number; baseCents: number; items?: EarningsInvoice[] }
type InvoiceSource = Pick<Lead, "invoiceNumber" | "invoiceAmount" | "invoiceDraft" | "invoiceStatus" | "invoiceSentAt" | "paymentType" | "amountPaid" | "paymentReceipt">;
export type EarningsSourceLead = Lead & { earningsInvoices?: (InvoiceSource & { earningsKey?: string })[] };
export interface EarningsInvoiceAllocation { invoiceKey: string; shares: EarningsShare[] }
export interface EarningsLedger {
  id: string; version: number; status: "draft" | "approved"; basis: EarningsBasis;
  shares: EarningsShare[]; invoiceShares?: EarningsInvoiceAllocation[]; invoice: EarningsInvoice | null; notes: string;
  approvedAt?: string; approvedBy?: string; updatedAt: string;
  jobLabel: string; customer: string; completionDate?: string;
}
export interface EarningsJob {
  id: string; jobLabel: string; customer: string; service: string; status: string;
  scheduledAt?: string;
  receipts?: { number: string; totalCents: number; paidCents: number; remainingCents: number; status: "paid" | "partial" | "pending" | "unsent"; sentAt?: string }[];
  assignedIds: string[]; assignedNames: string[]; completedVisits: number; totalVisits: number;
  workVisits: { type: "inspection" | "job"; memberId?: string; name: string; date: string; status: string; daysDone: number; daysPlanned: number }[];
  memberWork: { memberId: string; completedVisits: number; totalVisits: number; daysDone: number; daysPlanned: number }[];
  daysDone: number; daysPlanned: number; invoice: EarningsInvoice | null; invoicePaid: boolean;
  paymentStatus: "paid" | "partial" | "pending" | "unsent" | "no_invoice";
  eligible: boolean; unavailableReason: string; ledger: EarningsLedger | null; changed: boolean;
  completionDate: string; defaultShares: EarningsShare[];
  dailyCapUsage?: { memberId: string; capCents: number; usedCents: number }[];
  expenses: EarningsExpense[]; expenseVersion?: number;
}
export interface EarningsPayment {
  id: string; memberId: string; memberName: string; amountCents: number; date: string;
  invoiceKey?: string;
  method: string; reference: string; note: string; actor: string; createdAt: string;
  voidedAt?: string; voidedBy?: string; voidReason?: string;
}
export interface EarningsExpense {
  id: string; name: string; amountCents: number; date: string; source: "manual" | "automatic";
  autoRuleId?: string; createdAt: string; createdBy: string; voidedAt?: string; voidedBy?: string;
}
export interface EarningsEvent { id: string; action: string; actor: string; createdAt: string; detail: string }
export interface EarningsData { members: EarningsMember[]; jobs: EarningsJob[]; settings?: TeamEarningsSettings; payments?: (EarningsPayment & { jobId: string; jobLabel: string })[] }
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
export function invoiceForEarnings(lead: InvoiceSource & { earningsKey?: string; earningsInvoices?: (InvoiceSource & { earningsKey?: string })[] }, basis: EarningsBasis, defaultGstBps = 1000): EarningsInvoice | null {
  if (lead.earningsInvoices?.length) {
    const items = [ ...(lead.invoiceNumber ? [{ ...lead, earningsKey: "primary" }] : []), ...lead.earningsInvoices ].map((source, index) => invoiceForEarnings({ invoiceNumber: source.invoiceNumber, invoiceAmount: source.invoiceAmount, invoiceDraft: source.invoiceDraft, earningsKey: source.earningsKey || `saved-${index}` }, basis, defaultGstBps));
    if (items.some(item => !item)) return null;
    const valid = items as EarningsInvoice[];
    return { number: valid.map(item => item.number).join(", "), totalCents: valid.reduce((sum, item) => sum + item.totalCents, 0), baseCents: valid.reduce((sum, item) => sum + item.baseCents, 0), gstBps: valid.every(item => item.gstBps === valid[0].gstBps) ? valid[0].gstBps : -1, items: valid };
  }
  const total = lead.invoiceAmount;
  if (!lead.invoiceNumber || typeof total !== "number" || !Number.isFinite(total) || total <= 0 || total > 1_000_000_000) return null;
  const gst = lead.invoiceDraft?.gst ?? defaultGstBps / 100;
  if (!Number.isFinite(gst) || gst < 0 || gst > 100) return null;
  const totalCents = Math.round(total * 100), gstBps = Math.round(gst * 100);
  return { ...(lead.earningsKey ? { key: lead.earningsKey } : {}), number: lead.invoiceNumber, totalCents, gstBps, baseCents: basis === "inclusive" ? totalCents : Math.round(totalCents * 10000 / (10000 + gstBps)) };
}
export function sameEarningsInvoice(a: EarningsInvoice | null, b: EarningsInvoice | null) {
  if (!a || !b || a.number !== b.number || a.totalCents !== b.totalCents || a.gstBps !== b.gstBps || a.baseCents !== b.baseCents) return false;
  const left = a.items || [], right = b.items || [];
  return left.length === right.length && left.every((item, index) => sameEarningsInvoice(item, right[index]));
}
export const DEFAULT_TEAM_SHARE_BPS = 3500;

export function parseEarningsShares(value: unknown, members: EarningsMember[], existing: EarningsShare[] = [], maxTeamShareBps = DEFAULT_TEAM_SHARE_BPS): EarningsShare[] {
  if (!Array.isArray(value) || !value.length || value.length > 20) throw new EarningsError("Choose between 1 and 20 team members.");
  const ids = new Set<string>();
  const shares = value.map(row => {
    const body = earningsBody(row);
    const member = members.find(m => m.id === body.memberId);
    if (!member || (!member.active && !existing.some(s => s.memberId === member.id))) throw new EarningsError("Choose an active team member for new shares.");
    if (ids.has(member.id)) throw new EarningsError("A team member can appear only once per job.");
    ids.add(member.id);
    if (body.fixedAmountCents !== undefined) {
      if (body.rateBps !== undefined && body.rateBps !== 0) throw new EarningsError("Choose either a percentage or a fixed amount.");
      return { memberId: member.id, name: member.name, rateBps: 0, fixedAmountCents: earningsInteger(body.fixedAmountCents, "fixed amount", 1), earnedCents: 0, paidCents: 0 };
    }
    return { memberId: member.id, name: member.name, rateBps: earningsInteger(body.rateBps, "percentage", 1, maxTeamShareBps), earnedCents: 0, paidCents: 0 };
  });
  if (shares.reduce((sum, row) => sum + row.rateBps, 0) > maxTeamShareBps) throw new EarningsError(`Combined team shares cannot exceed ${maxTeamShareBps / 100}% of the invoice basis.`);
  return shares;
}
// Allocate whole cents using the largest-remainder method, with a stable ID
// tie-break. Fixed amounts stay exact; validate the combined total before saving or approving.
export function calculateEarnings(shares: EarningsShare[], baseCents: number): EarningsShare[] {
  const values = shares.map(s => ({ ...s, earnedCents: s.fixedAmountCents ?? Math.floor(baseCents * s.rateBps / 10000), paidCents: 0 }));
  const target = shares.reduce((sum, s) => sum + (s.fixedAmountCents ?? 0), 0) + Math.round(baseCents * shares.reduce((sum, s) => sum + s.rateBps, 0) / 10000);
  let remainder = target - values.reduce((sum, s) => sum + s.earnedCents, 0);
  const order = values.map((s, index) => ({ index, fraction: baseCents * s.rateBps % 10000, id: s.memberId })).filter(row => values[row.index].fixedAmountCents === undefined).sort((a, b) => b.fraction - a.fraction || a.id.localeCompare(b.id));
  for (const row of order) if (remainder-- > 0) values[row.index].earnedCents++;
  return values;
}
export function sumInvoiceShares(allocations: EarningsInvoiceAllocation[]): EarningsShare[] {
  const byMember = new Map<string, EarningsShare>();
  for (const allocation of allocations) for (const share of allocation.shares) {
    const total = byMember.get(share.memberId) || { memberId: share.memberId, name: share.name, rateBps: 0, earnedCents: 0, paidCents: 0 };
    total.earnedCents += share.earnedCents;
    total.paidCents += share.paidCents;
    byMember.set(share.memberId, total);
  }
  return [...byMember.values()];
}
export function applyDailyEarningsCaps(
  shares: EarningsShare[],
  capUsage: { memberId: string; capCents: number; usedCents: number }[] = [],
): EarningsShare[] {
  const usage = new Map(capUsage.map(row => [row.memberId, row]));
  return shares.map(share => {
    const cap = usage.get(share.memberId);
    return cap ? { ...share, earnedCents: Math.min(share.earnedCents, Math.max(0, cap.capCents - cap.usedCents)) } : { ...share };
  });
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
export function earningsCompletionDate(lead: EarningsSourceLead): string {
  const completed = leadBookings(lead).filter(booking => booking.type === "job" && booking.status === "Job Done");
  if (completed.length) return completed.map(booking => booking.date).sort().at(-1)!;
  const active = leadBookings(lead).filter(booking => booking.type === "job" && booking.status !== "Cancelled");
  return active.map(booking => booking.date).sort().at(-1) || lead.jobAt?.slice(0, 10) || lead.createdAt?.slice(0, 10) || "";
}
export function earningsJob(lead: EarningsSourceLead, members: EarningsMember[], ledger: EarningsLedger | null, settings: TeamEarningsSettings = { basis: "ex_gst", gstRateBps: 1000, maxTeamShareBps: DEFAULT_TEAM_SHARE_BPS, employeeSettings: [], automaticExpenses: [] }): EarningsJob {
  const visits = leadBookings(lead).filter(b => b.type === "job" && b.status !== "Cancelled");
  const assignments = [resolveMember(members, [lead.technicianId], [lead.technicianUsername, lead.technician]), resolveMember(members, [lead.inspectorId], [lead.inspectorUsername, lead.assigned]),
    ...visits.map(b => resolveMember(members, [b.technicianId], [b.technicianUsername, b.technician])),
    ...leadBookings(lead).filter(b => b.type === "inspection" && b.status !== "Cancelled").map(b => resolveMember(members, [b.inspectorId], [b.inspectorUsername, b.assigned]))].filter((m): m is EarningsMember => !!m);
  const invoice = invoiceForEarnings(lead, ledger?.basis || settings.basis, settings.gstRateBps);
  const hasJobVisits = leadBookings(lead).some(b => b.type === "job");
  const incompleteSavedVisit = lead.bookings?.some(b => b.type === "job" && b.status && !["Job Done", "Cancelled"].includes(b.status) && !(lead.status === "Completed" && isPrimaryBooking(lead, b)));
  const completed = incompleteSavedVisit ? false : visits.length ? visits.every(b => b.status === "Job Done") : !hasJobVisits && ["Job Done", "Invoice Sent", "Payment Pending", "Payment Received", "Warranty Sent", "Completed"].includes(lead.status);
  const unavailableReason = ["Cancelled", "Lost"].includes(lead.status) ? "Job is cancelled or lost." : !invoice ? "Save a valid invoice first." : !completed ? "Complete all active job visits first." : "";
  const safeDays = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
  const workVisits: EarningsJob["workVisits"] = leadBookings(lead).filter(b => b.status !== "Cancelled").map(visit => {
    const worker = visit.type === "job" ? resolveMember(members, [visit.technicianId], [visit.technicianUsername, visit.technician]) : resolveMember(members, [visit.inspectorId], [visit.inspectorUsername, visit.assigned]);
    return { type: visit.type, memberId: worker?.id, name: worker?.name || (visit.type === "job" ? visit.technician : visit.assigned) || "Unassigned", date: visit.date, status: visit.status || "", daysDone: visit.type === "job" ? safeDays(visit.jobDaysDone) : 0, daysPlanned: visit.type === "job" ? safeDays(visit.jobTotalDays) : 0 };
  });
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
  const receiptSources = [...(lead.invoiceNumber ? [lead] : []), ...(lead.earningsInvoices || [])];
  const receipts = receiptSources.filter(source => invoiceForEarnings(source, "inclusive")).map(source => {
    const balanceSource = { ...source, invoiceStatus: source.invoiceStatus || (source.paymentType === "full" ? "Paid" : undefined) };
    const balance = invoiceBalance(balanceSource);
    const status = invoicePaymentStatus(balanceSource);
    return { number: source.invoiceNumber!, ...balance, status, sentAt: source.invoiceSentAt };
  });
  const invoicePaid = receipts.length > 0 && receipts.every(receipt => receipt.status === "paid");
  const paymentStatus = !invoice ? "no_invoice" : invoicePaid ? "paid" : receipts.some(receipt => receipt.paidCents > 0) ? "partial" : receipts.some(receipt => receipt.status === "pending") ? "pending" : "unsent";
  const completionDate = ledger?.completionDate || earningsCompletionDate(lead);
  const employeeSettings = new Map(settings.employeeSettings.map(setting => [setting.memberId, setting]));
  const defaultShares = [...new Set(assignments.map(member => member.id))].map(memberId => {
    const member = members.find(item => item.id === memberId)!;
    const setting = employeeSettings.get(memberId);
    return {
      memberId, name: member.name, rateBps: setting?.mode === "percent" ? setting.rateBps : 0,
      ...(setting?.mode === "amount" && setting.fixedAmountCents ? { fixedAmountCents: setting.fixedAmountCents } : {}),
      earnedCents: 0, paidCents: 0,
    };
  });
  return { scheduledAt: lead.jobAt || (visits[0] ? `${visits[0].date}T${visits[0].time}` : undefined), receipts, id: lead.id, jobLabel: lead.jobNo || `Lead-${lead.id.slice(-6)}`, customer: lead.name || "Customer", service: lead.service || "", status: lead.status,
    assignedIds: [...new Set(assignments.map(m => m.id))], assignedNames: [...new Set([lead.assigned, lead.technician, ...assignments.map(m => m.name), ...visits.map(b => b.technician)].filter((s): s is string => !!s))],
    workVisits, memberWork: [...memberWork.values()], completedVisits: visits.filter(b => b.status === "Job Done").length, totalVisits: visits.length,
    daysDone: visits.length ? visits.reduce((sum, b) => sum + safeDays(b.jobDaysDone), 0) : safeDays(lead.jobDaysDone), daysPlanned: visits.length ? visits.reduce((sum, b) => sum + safeDays(b.jobTotalDays), 0) : safeDays(lead.jobTotalDays),
    invoice, invoicePaid, paymentStatus, eligible: !unavailableReason, unavailableReason, ledger,
    completionDate, defaultShares, expenses: [],
    changed: ledger?.status === "approved" && (!sameEarningsInvoice(ledger.invoice, invoice) || !!unavailableReason) || false };
}

export function validateEarningsTotal(shares: EarningsShare[], baseCents: number, maxTeamShareBps = DEFAULT_TEAM_SHARE_BPS) {
  if (calculateEarnings(shares, baseCents).reduce((sum, share) => sum + share.earnedCents, 0) > Math.round(baseCents * maxTeamShareBps / 10000)) {
    throw new EarningsError(`Combined team amounts and shares cannot exceed ${maxTeamShareBps / 100}% of the invoice basis.`);
  }
}

export const formatEarningsMoney = (cents: number) => (cents === 0 ? 0 : cents / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
