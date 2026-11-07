# Materials inventory

Open **Materials** in the manager CRM sidebar, or use `<admin-base-path>?view=materials`.
Managers and super admins can manage inventory. Other roles cannot open the view or call its APIs.

## Stock workflow

1. Add an item with a unique SKU, name, stock unit, opening balance, low-stock threshold and current cost per unit in AUD. Category, storage location, supplier and notes are optional. SKUs are case-insensitive and remain reserved when an item is archived.
2. **Receive** adds supplier deliveries. **Use** subtracts stock consumed. **Return** adds unused stock back. Each requires a reason and can include a job or purchase reference.
3. **Stock count** records the physical total, including zero. The system logs the difference as a correction. It never allows a negative balance.
4. **History** shows the actor, time, signed quantity change, resulting balance, reason and reference for each movement. Entries are immutable. Correct mistakes with another movement.
5. Archive only when stock is zero. Archived items and history remain available and can be restored.

Quantities support three decimal places; costs support two. A stock unit is fixed after creation, so a box cannot later be reinterpreted as an individual piece. Create a separate SKU when the stocking unit changes. Location is descriptive: this version maintains one balance per SKU, not separate warehouse or technician balances. Job references are manual labels; completing a CRM job does not automatically deduct stock.

“Needs restocking” includes active items at or below their threshold, including empty items. Estimated stock value is quantity multiplied by the **current** unit cost; this is not FIFO, weighted-average costing, purchase accounting or a historical valuation.

## Persistence and safety

- Uses the existing MongoDB connection and database, with new `materials` and `material_movements` collections. Required indexes are created automatically. No seed data or migration of existing CRM records is needed.
- **MongoDB Atlas or a replica set is required.** Creation and stock movements use transactions so a balance and its history entry commit together. A standalone MongoDB server cannot execute these writes.
- Integer thousandths and cents avoid accumulated floating-point errors.
- Version checks reject stale edits, counts and stock movements. Refresh and reopen a form after a conflict.
- UUID request IDs make identical creation/movement retries idempotent, including a lost network response. Reusing an ID with a different payload is rejected.
- History is stored separately, ordered by item revision and paginated in groups of 25; it does not grow an array inside the item document.
- Item list pagination and search run in the browser. Very large catalogs may need server-side list pagination in a future extension.

## Verification

`node scripts/materials.test.mjs` exercises validation, stock calculations, duplicate SKUs, retry protection, stale updates, rollback, archive/restore, history pagination and access control. Database boundaries are injected; this suite does not modify the configured database. `npx tsc --noEmit --incremental false` checks application types.
