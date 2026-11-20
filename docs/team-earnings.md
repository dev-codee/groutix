# Team Earnings

Managers and super admins can open **Team Earnings** in the CRM sidebar (`?view=earnings`). The page includes live lead/job assignments, member work counts, planned earnings, approved earnings, recorded payments, outstanding balances and an audit log. Other roles cannot access the page or its API.

## Manager workflow

1. Find a job in the working register and expand its row. Use Set team shares or Configure & approve shares to edit inline. Technicians and CRM staff are both available. Identity uses stable IDs, roster aliases, then unique usernames/names; ambiguous names require manual member selection.
2. Choose the invoice basis (excluding GST by default, or including GST), add member percentages and save the draft. No rate is assumed. Each member appears once and combined shares cannot exceed 100%. For example, a $1,100 invoice at 10% GST has a $1,000 base excluding GST; a 30% share earns $300.
3. After all active job visits are done and a valid invoice is saved, review and approve earnings. Approval preserves the invoice number, total, GST rate, calculation base, recipients and amounts. Customer payment status is shown separately; approval does not require customer payment.
4. Record full or partial payments already made to members, including date, method, reference and optional notes. The system prevents overpayment. This records bookkeeping entries; it does not transfer money or change the customer's invoice payment status.
5. Correct an erroneous payment using **Reverse record** with a reason. The original entry and reversal remain visible. Reopen an approval only when all recorded payments have been reversed, explain why, then revise and reapprove. Reversing an entry does not recover transferred money.

## Calculation and work rules

- Percentages have two decimal places and monetary calculations use integer cents. Shared-job rounding uses largest remainders with a stable member-ID tie-break, so totals reconcile to whole cents.
- Percentages apply once per lead to all saved customer invoices, including invoices created from accepted quotes. Each invoice uses its own GST rate; the job detail lists the individual invoice amounts. Inspection and job visit details show worker names, dates, status and recorded job days. Each approved member share has a button to record payment to that worker.
- Percentages apply to the whole saved invoice once per lead. Quotes and unsaved invoice defaults never become payable earnings. No automatic deductions for materials, tax withholding, fees or other costs are applied.
- The saved invoice's GST rate is used. Legacy invoices without a saved rate use the CRM's existing 10% default. A zero GST rate is supported.
- Job completion checks all active visits, including additional bookings, rather than trusting only the lead summary. Lost/cancelled jobs and unavailable sources cannot be approved.
- Assigned-lead counts show lead ownership, inspection and technician assignments. Member work counts include only visits assigned to that member, excluding cancelled visits. Inspection visits and job visits contribute to completed visits; only job visits contribute recorded job days. These are CRM progress records, not verified timesheets. Days do not multiply commission.
- Approved earnings remain fixed if invoices, assignment names or rates change later. A changed invoice, incomplete/cancelled job or removed source is flagged **Needs review**, and further payments are blocked. Deleted lead financial records remain available.
- Register totals, employee summaries and manager summaries follow search, job status, earnings status and member filters, across all pagination pages. Member filters select whole related jobs; register totals include all workers on those jobs, while the employee summary shows the selected member. Job status filters can overlap (a completed job can also be invoiced and paid). Each job can have up to 20 recipients; lists are paginated in the browser and audit history on the server.

## Persistence and verification

Uses `team_earnings`, `team_earnings_payments` and `team_earnings_events` collections with automatically created indexes. MongoDB Atlas or a replica set is required. Every mutation and its audit snapshot commit in one transaction; versions prevent stale concurrent changes, and request IDs prevent duplicate retries. Every event retains a complete ledger snapshot for audit, including earlier approvals after reopening. Payment and audit records are never deleted by this feature.

Run `node scripts/team-earnings.test.mjs` for calculations, identity/completion rules, approvals, invoice changes, partial payments, overpayment prevention, concurrency, retry safety, transaction rollback, reversals, source deletion and role restrictions. Tests inject database boundaries and do not modify production records. Run `node scripts/team-earnings-csv.test.mjs` and `node scripts/team-earnings-register.test.mjs` for exports and register rendering.

## Fixed worker amounts and display

Each worker row offers **Enter as → Share (%) / Amount (AUD)**. Fixed amounts are stored as exact cents and remain fixed when the invoice basis changes. Percentage and fixed rows can be combined, but their total cannot exceed the current invoice basis at saving or approval. Existing percentage records remain compatible.

Currency labels on the earnings page drop the decimal portion (AUD 300.90 displays as $300). Ledger calculations, payment inputs, audit records and CSV exports retain cents for reconciliation.

## Working register and dashboard links

The register follows the supplied HTML structure: seven KPI cards, status buttons, expandable job rows with individual invoice cards, inline team shares and payment controls, employee payment summary, and manager summary. Add job opens the existing CRM lead form; Manage team opens the dashboard team page. Open job and Manage customer invoices fetch the current customer record and open the existing editor. Closing that editor reloads the register.

Customer received amounts use the same invoice balance calculation as the CRM, including partial payments, legacy receipts and separately saved customer invoices. Legacy full-payment records without an invoice status are treated as paid. Receipt changes do not alter earnings approval snapshots. Manager balance is customer receipts less all approved team earnings, before expenses. Draft estimates are shown separately and are not payable.

Shares remain scoped to the whole job, across all saved invoices. The inline table explicitly labels this scope: a fixed amount is applied once per job, and percentages use the combined selected GST basis. The standalone HTML's independent per-invoice allocation model is not used for existing job ledgers. Job expenses are not stored by this ledger; the register therefore does not display a fabricated expense total or net profit. Existing approvals, payment reversals, version checks and audit history remain in place.
