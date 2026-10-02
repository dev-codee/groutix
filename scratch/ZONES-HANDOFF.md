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

## Remaining

1. `components/admin/modals/ZoneRulesModal.tsx` — manager editor. Mirror
   `components/admin/modals/BookingRulesModal.tsx` closely (same Shell pattern,
   load -> edit -> validate -> PUT -> `publishZoneRules`). Needs to edit:
   `dayWiseEnabled`, `flexRadiusKm`, `maxRadiusKm`, `zoneDays` (a weekday select
   per zone; `validateZoneRules` rejects two zones on one day), `coastalExcluded`
   (chip add/remove), `suburbOverrides` (suburb -> zone).
2. Wire into `app/admin/page.tsx`:
   - a `zones` nav entry rendering `<ZonesView onOpenSettings={...} />`
     (follow how `currentView === "schedule"` renders `ScheduleView`, ~line 4300)
   - a "Service Zones" item in the manager Settings block (~line 3933, next to
     "Booking Hours") opening the modal, mounted near line 7975
3. `npx tsc --noEmit` and `npx next build` both clean.

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
