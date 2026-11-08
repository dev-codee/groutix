import { calculateEarnings, type EarningsJob } from "./teamEarnings";

export const earningsStatus = (job: EarningsJob) => job.changed ? "Needs review" : job.ledger?.status === "approved" ? job.ledger.shares.every(share => share.paidCents === share.earnedCents) ? "Settled" : "Approved" : job.ledger ? "Draft" : "Not configured";
export function estimatedEarningsShares(job: EarningsJob) {
  return job.ledger?.status === "approved" ? job.ledger.shares : calculateEarnings(job.ledger?.shares || [], job.invoice?.baseCents || 0);
}

function cell(value: string | number): string {
  let text = String(value);
  // Keep customer/member text from being interpreted as a spreadsheet formula.
  if (typeof value === "string" && (/^[\s\uFEFF]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
const csv = (rows: (string | number)[][]) => rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
const amount = (cents: number) => (cents / 100).toFixed(2);

export function earningsJobsCsv(jobs: EarningsJob[]): string {
  return csv([
    ["Job / lead", "Customer", "Job status", "Service", "Assigned members", "Completed visits", "Total visits", "Recorded job days", "Planned job days", "Invoice", "Invoice total (AUD)", "Customer invoice paid", "Earnings status", "Draft estimate (AUD)", "Approved earnings (AUD)", "Paid (AUD)", "Outstanding (AUD)", "Member shares"],
    ...jobs.map(job => {
      const shares = estimatedEarningsShares(job);
      const total = shares.reduce((sum, share) => sum + share.earnedCents, 0);
      const approved = job.ledger?.status === "approved";
      const paid = approved ? shares.reduce((sum, share) => sum + share.paidCents, 0) : 0;
      return [job.jobLabel, job.customer, job.status, job.service, job.assignedNames.join("; "), job.completedVisits, job.totalVisits,
        job.daysDone, job.daysPlanned, job.invoice?.number || "", job.invoice ? amount(job.invoice.totalCents) : "", job.invoicePaid ? "Yes" : "No",
        earningsStatus(job), amount(approved ? 0 : total), amount(approved ? total : 0), amount(paid), amount(approved ? total - paid : 0),
        shares.map(share => `${share.name}: ${share.rateBps / 100}%`).join("; ")];
    }),
  ]);
}

interface MemberBalanceRow {
  name: string; role: string; active: boolean; assigned: number; visits: number; days: number;
  estimated: number; earned: number; paid: number;
}
export function earningsMembersCsv(members: MemberBalanceRow[]): string {
  return csv([
    ["Member", "Role", "Active", "Assigned leads", "Completed visits", "Recorded job days", "Draft estimate (AUD)", "Approved earnings (AUD)", "Paid (AUD)", "Outstanding (AUD)"],
    ...members.map(member => [member.name, member.role, member.active ? "Yes" : "No", member.assigned, member.visits, member.days,
      amount(member.estimated), amount(member.earned), amount(member.paid), amount(member.earned - member.paid)]),
  ]);
}
