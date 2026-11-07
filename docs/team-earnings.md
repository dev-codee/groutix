# Team Earnings

Managers and super admins can open **Team Earnings** in the CRM sidebar (`?view=earnings`). The page includes live lead/job assignments, member work counts, planned earnings, approved earnings, recorded payments, outstanding balances and an audit log. Other roles cannot access the page or its API.

## Manager workflow

1. Find a lead in Jobs & leads or open a member's jobs from Team balances. Technicians and CRM staff are both available. Identity uses stable IDs, roster aliases, then unique usernames/names; ambiguous names require manual member selection.
2. Select **Manage**, choose the invoice basis (excluding GST by default, or including GST), add member percentages and save the draft. No rate is assumed. Each member appears once and combined shares cannot exceed 100%. For example, a $1,100 invoice at 10% GST has a $1,000 base excluding GST; a 30% share earns $300.
3. After all active job visits are done and a valid invoice is saved, review and approve earnings. Approval preserves the invoice number, total, GST rate, calculation base, recipients and amounts. Customer payment status is shown separately; approval does not require customer payment.
4. Record full or partial payments already made to members, including date, method, reference and optional notes. The system prevents overpayment. This records bookkeeping entries; it does not transfer money or change the customer's invoice payment status.
5. Correct an erroneous payment using **Reverse record** with a reason. The original entry and reversal remain visible. Reopen an approval only when all recorded payments have been reversed, explain why, then revise and reapprove. Reversing an entry does not recover transferred money.

## Calculation and work rules

- Percentages have two decimal places and monetary calculations use integer cents. Shared-job rounding uses largest remainders with a stable member-ID tie-break, so totals reconcile to whole cents.
- Percentages apply to the whole saved invoice once per lead. Quotes and unsaved invoice defaults never become payable earnings. No automatic deductions for materials, tax withholding, fees or other costs are applied.
- The saved invoice's GST rate is used. Legacy invoices without a saved rate use the CRM's existing 10% default. A zero GST rate is supported.
- Job completion checks all active visits, including additional bookings, rather than trusting only the lead summary. Lost/cancelled jobs and unavailable sources cannot be approved.
- Assigned-lead counts show lead ownership, inspection and technician assignments. Member work counts include only visits assigned to that member, excluding cancelled visits. Inspection visits and job visits contribute to completed visits; only job visits contribute recorded job days. These are CRM progress records, not verified timesheets. Days do not multiply commission.
- Approved earnings remain fixed if invoices, assignment names or rates change later. A changed invoice, incomplete/cancelled job or removed source is flagged **Needs review**, and further payments are blocked. Deleted lead financial records remain available.
- Totals are all-time and follow the member filter. Search and status filters narrow displayed jobs. Each job can have up to 20 recipients; lists are paginated in the browser and audit history on the server.

## Persistence and verification

Uses `team_earnings`, `team_earnings_payments` and `team_earnings_events` collections with automatically created indexes. MongoDB Atlas or a replica set is required. Every mutation and its audit snapshot commit in one transaction; versions prevent stale concurrent changes, and request IDs prevent duplicate retries. Every event retains a complete ledger snapshot for audit, including earlier approvals after reopening. Payment and audit records are never deleted by this feature.

Run `node scripts/team-earnings.test.mjs` for calculations, identity/completion rules, approvals, invoice changes, partial payments, overpayment prevention, concurrency, retry safety, transaction rollback, reversals, source deletion and role restrictions. Tests inject database boundaries and do not modify production records.
