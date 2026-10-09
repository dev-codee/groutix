# Service Zones — implementation handoff

Status as of this session. Delete this file once the work is merged and settled.

## What the work is

Implement the "Inspection Routing & Scheduling Plan" (1 inspector, 50 km area,
15 km daily flex, 7 day-wise zones, no coastal areas), then give it a proper
admin UI: (1) zone awareness in the staff slot pickers, (2) a read-only Zones
view, (3) manager-editable zone rules.

## Architecture

`lib/zoneRules.ts` is the dependency-free leaf (same role `lib/bookingRules.ts`
plays for hours). It owns the zone taxonomy, labels, colours, compass SECTORS,
defaults, `sanitizeZoneRules`, `validateZoneRules`, and the day-wise gate
(`isZoneDay`, `zoneWeekday`, `zoneDayName`, `zoneLabel`, `zonesByWeekday`).

`lib/scheduling.ts` imports and **re-exports** all of it, so callers can keep
importing everything from `@/lib/scheduling`. It owns `BASE_LOCATION`, the
`SUBURBS` catalogue, distance/bearing maths, `resolveArea`,
`resolveAreaByCoords`, `computeAvailability`, `isSlotOffered`.

Rules are threaded as a trailing optional parameter defaulting to
`DEFAULT_ZONE_RULES` — exactly the pattern `BookingRules` already uses:

- `resolveArea(text, zoneRules?)`
- `resolveAreaByCoords(lat, lng, zoneRules?)`
- `computeAvailability(area, booked, sameZone, type, rules?, zoneRules?)`
- `isSlotOffered(area, date, time, type, rules?, zoneRules?)`
- `getAvailableDaysSummary(area, rules?, zoneRules?)`

Server callers pass `await getZoneRules()` (`lib/zoneRulesServer.ts`).
Client components use `useZoneRules()` (`lib/useZoneRules.ts`), and after
saving call `publishZoneRules(saved)` to push to all mounted consumers.

Persistence: single Mongo `settings` doc, `_id: "zone_rules"`.
API: `app/api/admin/settings/zone-rules/route.ts` (GET any staff, PUT manager).

## Key design decisions (don't undo these by accident)

- **The suburb table is pure geometry.** `SUBURBS[].outerZone` is the raw compass
  sector. Policy exceptions (the plan lists Oakleigh/Clarinda under Tuesday/South
  even though they're in the South-East sector) live in
  `ZoneRules.suburbOverrides` so a manager can change them without a deploy.
  Resolution order in `classify()`: coastal skip -> outside radius -> inner flex
  -> `suburbOverrides` -> catalogue sector -> raw bearing.
- **SECTORS stay in code.** Editing bearing degrees is developer-grade; managers
  move individual suburbs instead. Boundaries were chosen so every suburb the
  plan names lands on the day the plan assigns.
- **Day-wise zoning is enforced in `computeAvailability` + `isSlotOffered`**, not
  just documented. Before this work it was documented but never applied.
- **Staff can book off-zone** (Key Rule 10 allows manual override). The pickers
  warn; they do not block.
- `dayWiseEnabled: false` is the escape hatch for when more inspectors are added
  (the plan's "Future Expansion") — everything inside the radius becomes any-day.

## Done

- `lib/zoneRules.ts`, `lib/zoneRulesServer.ts`, `lib/useZoneRules.ts`
- `app/api/admin/settings/zone-rules/route.ts`
- `lib/scheduling.ts` — new zone model, coastal skip, day-wise gate, rules threaded
- `lib/dispatch.ts` — off-zone days skipped outright, rules threaded
- Server routes pass live rules: `inspection-availability`, `book/[id]`,
  `quote`, `admin/submissions/[id]`
- Customer UI: `app/book/[type]/[id]/page.tsx`, `components/HeroQuoteForm.tsx`
  (zone-day explainer + coastal messaging)
- `components/admin/ScheduleView.tsx` — new zone labels
- `components/admin/BookingPlanner.tsx` — zone banner, off-zone day badges,
  off-zone warning, off-zone days demoted in "top picks" ranking
- `components/admin/SlotBoard.tsx` — zone line + off-zone warning; takes a new
  `address` prop, passed from `LeadEditModal`
- `components/admin/views/ZonesView.tsx` — read-only overview + address lookup
  + `ZoneBadge` export
- `components/admin/modals/ZoneRulesModal.tsx` — manager editor (day-wise switch,
  both radii + live suburb-count preview, zone->day selects with clash warnings,
  suburb overrides, coastal skip chips, reset-to-defaults)
- `app/admin/page.tsx` — "Service Zones" nav entry rendering `ZonesView`, a
  Settings entry opening the modal, `zoneRulesOpen` state, page title.
  NOTE: the lucide `Map` icon is imported as `MapIcon` — importing it as `Map`
  shadows the global `Map` constructor and breaks the file's typecheck.
- `lib/roles.ts` — `"zones"` view granted to manager, super_admin and inspection

## Remaining

Nothing — all three UI pieces plus the day-shortlisting fix are built,
typechecked, linted and the production build is clean.

Nice-to-haves not done: `ZoneBadge` (exported from `ZonesView.tsx`) isn't used
on the leads/jobs rows yet; a visual map of the zone pie would be a natural
addition to `ZonesView` (`DispatchMap` already loads Google Maps).

## Day shortlisting

`shortlistDays(days, { maxOptions, maxDaysAhead })` in `lib/scheduling.ts` is the
single place that decides how many days a customer is shown. It is bounded by
BOTH a count and a calendar window, because a count alone means different things
per area: a daily-flex address has a bookable day every day (7 options = next
week), but an outer address only has its own zone day (7 options = seven WEEKS).

Call sites, previously inconsistent (7 / none / 5 with no window at all):

| surface | file | maxOptions | maxDaysAhead |
|---|---|---|---|
| quote form picker | `app/api/inspection-availability/route.ts` | 7 | 28 |
| self-booking page | `app/api/book/[id]/route.ts` | 14 | 35 |
| confirmation email | `app/api/quote/route.ts` | 5 | 28 |

Both limits are maximums, never minimums — the booking horizon and the zone day
can yield fewer.

## Verification

Behavioural test used during development (rebuild after editing scheduling.ts):

```
S=/tmp/zonetest && mkdir -p $S
npx tsc lib/scheduling.ts lib/bookingRules.ts lib/zoneRules.ts \
  --outDir $S --module commonjs --target es2020 --moduleResolution node --skipLibCheck
# then require $S/scheduling.js and assert each plan suburb resolves to its day
```

All 44 suburbs named in the plan were verified to resolve to the day the plan
assigns, including the coastal skips and the Oakleigh/Clarinda overrides.

## Gotchas

- `app/book/[type]/[id]/page.tsx` has **CRLF** line endings. Python
  `write_text` silently normalises them to LF and produces a 570-line diff.
  Restore with a CRLF rewrite if that happens.
- Pre-existing lint errors (`react-hooks/set-state-in-effect`,
  `react/no-unescaped-entities`) exist on several of these files. Compare counts
  against `git stash` before assuming you introduced one.
- A commit `b16d88a "testing"` was created mid-session from outside the session
  and contains the first batch of this work.
- Availability API still slices to 7 days; for an outer zone that is 7 *weeks*.
  Worth tightening — flagged to the user, not yet decided.

---

# Inspector role audit (second pass)

## Critical bug found and fixed: inspections were invisible to the inspector

`scopedLeads` in `app/admin/page.tsx` requires `isAssigned` for the inspection
role. But nothing ever assigned an inspection: `app/api/quote/route.ts` creates
leads with a literal `assigned: ""`, the booking route never set it, and
`inspectorId` is READ in five places and WRITTEN nowhere. `pickAssignee` /
`pickAssigneeForRole` in `lib/submissions.ts` existed, documented as "used for
auto-assignment", and were dead code — never called from anywhere.

Net effect: every customer self-booked inspection was visible to no one on the
inspection dashboard until a manager manually assigned it. With the routing
plan's "1 Inspector", that made the role non-functional out of the box.

Two-layer fix:

1. `assignInspectorOnBooking(id, currentAssigned)` in `lib/submissions.ts`,
   called from both booking paths (`app/api/book/[id]/route.ts` and the quote
   form's auto-booking in `app/api/quote/route.ts`). Booking an inspection moves
   the lead into a stage the inspection role owns, so this is a stage handoff —
   it takes the lead from another team's assignee, but never from someone already
   on the inspection team (that was a deliberate choice of WHICH inspector).
   Best-effort; a booking never fails because assignment did.
2. Safety net in `scopedLeads`: an inspection-stage lead with no assignee at all
   is visible to every inspector. Covers zero inspection accounts, a failed
   lookup, and pre-existing leads. Verified it does NOT leak an inspection
   already assigned to a different inspector.

## Other fixes

- `components/admin/rows/FieldLeadRow.tsx`: the workflow checklist rendered a
  green tick for both steps unconditionally — an incomplete step looked done.
  Now shows an empty ring until `isDone`.
- `app/admin/page.tsx` `getLeadAppointmentTimestamp`: used `new Date(naive)`,
  which reads a Melbourne wall-clock in the viewer's timezone and mis-orders the
  inspector's day off-Melbourne. Switched to `apptInstantMs` (already imported).

## Added

- `components/admin/InspectorDayStrip.tsx`, mounted at the top of `JobsView` for
  the inspection/field roles. Today's stops in time order with zone, per-leg
  drive estimate (same `calculateTravel` model as the dispatch board), total km,
  next-up, and one-tap navigate/call. The board underneath is a flat
  chronological list with no day boundary, so "what am I doing today, in what
  order" previously took counting.
- Navigate (directions) button on `FieldLeadRow` — it existed only inside
  `GpsModal`, two clicks deep, for a role that drives to every lead.
- Zone badge on `FieldLeadRow` via the new `components/admin/ZoneBadge.tsx`
  (extracted from `ZonesView` so the leads board doesn't pull the whole view in).

## Verified

Both decision tables were extracted and unit-tested standalone:
inspector visibility 9/9 (including "assigned to another inspector stays
hidden"), assignment handoff 7/7 plus the no-accounts and no-pick fallbacks.

## Known gaps NOT addressed (deliberate)

- `app/api/admin/submissions/[id]/route.ts` authenticates but does no per-role
  field gating — any signed-in role can PATCH any field. `lib/roles.ts` says
  "the pipeline step tightens per-field write access later", so this is an
  existing design choice; changing it would affect every role, not just the
  inspector.
- `app/admin/page.tsx` has 21 pre-existing lint errors (`set-state-in-effect`,
  `no-explicit-any`), unchanged by this work — verified against commit 9b3d609.

---

# Lead submission vs. inspection booking

Intended rule: **anyone can submit a lead from any address; only the self-service
inspection BOOKING is gated by the 50 km / coastal rules.**

## Server — was already correct

`app/api/quote/route.ts` records every submission regardless of area. Both
`serviced` checks sit INSIDE `if (inspectionDate && inspectionTime)` blocks and
only guard the slot lock, so an out-of-area or coastal lead is saved with no
booking and the confirmation email carries the "we'll arrange a time" CTA.

## Client — had a trap, now fixed

`handleSubmit` in `components/HeroQuoteForm.tsx` required a date AND time
whenever the inspection section was open, with no regard for whether booking was
possible. Opening the section and then entering an out-of-area address cleared
the slot list (by design) but left the section open — so submitting demanded a
date the picker had no way to supply, and the customer could not send a lead at
all. Three states were affected: outside 50 km, coastal, and in-area with no
slots free.

Fixed by gating on `canBookInspection = inspectionSectionOpen &&
!isOutsideServiceArea && inspectionDays.length > 0`. Verified 8/8 across the
matrix; the three previously-stuck states now submit.

Also: availability is now re-fetched when the address is TYPED, not only when
picked from the suggestion list. Editing "Brunswick" to "Geelong" by hand used to
leave the chosen slot on screen, so the customer believed they held a time the
server would correctly refuse to book. (The server never created a bad booking —
this was a display-truth problem only.)
