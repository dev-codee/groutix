# Invoices from accepted quotes

Open **Customers → Manage invoices**, or open an invoice from a job/finance card.
Choose an accepted quote in **Create / open invoice from an accepted quote**.
Each accepted quote has one invoice; selecting it again opens that invoice.
Drafts, declined quotes, and quotes owned by another customer cannot be invoiced.

The invoice preserves the accepted quote's scope, allocated line amounts and GST.
Its own number, PDF, email-open tracking, payment receipt and QuickBooks sync are
stored separately from every other invoice. Payment status is changed on the
selected invoice and saved with **Save Invoice**. A paid invoice with a receipt
cannot be reopened through this screen. Credit/refund workflows are not added.

QuickBooks invoice sync uses the saved invoice. The customer reference returned
by QuickBooks is retained on the parent customer record and reused for later
invoices. Recording a payment here does not create a QuickBooks Payment transaction.

Existing job invoices keep their original IDs, numbers, PDF links and sync state.
They are shown alongside quote invoices. New records use `customer_invoices`;
creation uses a deterministic Mongo `_id` per customer/quote, so concurrent
requests cannot create multiple local invoices for one quote. Number sequences
can have gaps after concurrent requests or failed writes.

Finance cards show total invoiced and outstanding amounts. Quote invoice payments
do not change the parent job's operational status. The older job-level automatic
invoice sender skips customers using multiple quotes; staff select the agreed
quote explicitly to avoid issuing an additional unlinked invoice.

Validation:

```sh
node scripts/customer-invoices.test.mjs
node scripts/invoice-save.test.mjs
node scripts/quickbooks.test.mjs
node scripts/quote-integrity.test.mjs
npx tsc --noEmit --incremental false
```
