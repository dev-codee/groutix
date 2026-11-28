// Regrouting & Resealing quote checklist.
//
// The website quote confirmation links to this detailed checklist (see
// CHECKLIST FINAL). Their answers are stored on the lead and are
// translated into standard catalog quote items so the quote "auto-picks" the
// right line items without staff retyping anything.
//
// The mapping only ever emits codes that exist in the catalog; anything the
// catalog cannot price is surfaced as a zero-dollar custom line so nothing the
// customer told us is lost.

import { uniqueTemplateForCode, type ServiceTemplate } from "./serviceTemplates";

export { CHECKLIST_OPTIONS, checklistRequestText } from "./checklistOptions";

export type ChecklistPhoto = {
  name: string;
  category?: string;
  contentType?: string;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  added?: string;
};

/** One shower (or balcony) page of the checklist, matching the DOCX questions. */
export interface ChecklistPage {
  id: string;
  service?: string;
  photoCategory?: string;
  photoCategoryLabel?: string;
  customAnswers?: Record<string, { label: string; value: string | string[] }>;
  areaName?: string;
  areaDescription?: string;
  issues?: string[];
  dimensionsLength?: string;
  dimensionsWidth?: string;
  measurementsUnknown?: boolean;
  floorTileSize?: string;
  damagedTiles?: string;
  spareTiles?: string;
  groutPreference?: string;
  preferInspection?: boolean;
  balconyLevel?: string;
  balconyBelow?: string;
  balconySkirting?: string;
  balconyWork?: string[];
  previousRepairs?: string;
  previousRepairNotes?: string;
  areaWork?: string[];
  // 1. Shower leakage
  showerLeakage?: string; // "Yes" | "No"
  leakageNotes?: string;
  // 2. Shower type
  showerType?: string; // "SS" | "DS"
  // 3. Wall height
  wallHeight?: string; // "SH" | "TC" | "ABOVE"
  // 4. Work required + selective areas
  workRequired?: string; // "WF" | "FO" | "WO"
  selectiveAreas?: string;
  // 5. Number of tiled walls
  numberOfWalls?: string; // "1" | "2" | "3"
  // 6. Tile size
  tileSize?: string; // Small | Medium | Large | Extra Large
  // 7. Mosaic tiles
  mosaic?: string; // "Yes" | "No"
  // 8. Shower screen
  showerScreen?: string; // Frameless | Semi-frameless
  // 9. Silicone joints needing replacement (catalog codes)
  siliconeJoints?: string[]; // C-V-I | C-V-O | C-H-I | C-H-O
  // 10. Cracked / loose / drummy / lifted tiles
  crackedWallTiles?: string; // "0" | "1" | "2" | "3"
  crackedFloorTiles?: string; // "0" | "1" | "2" | "3"
  tileAction?: string; // "Repair" | "Replace"
  // 11. Additional areas requiring work
  additionalAreas?: string[];
  additionalNotes?: string;
  // Balcony section
  balconyLeakage?: string; // "Yes" | "No"
  balconyArea?: string; // square metres
  balconyTileSize?: string;
  // Photos attached to this page
  photos?: ChecklistPhoto[];
}

export interface ChecklistAnswers {
  pages: ChecklistPage[];
  timeframe?: string;
  propertyType?: string;
  accessNotes?: string;
  additionalInformation?: string;
}

/** Stored on the lead under `checklist`. */
export interface ChecklistDoc {
  answers: ChecklistAnswers;
  /** Customer-facing service names derived from the matched items. */
  services?: string[];
  savedAt?: string;
  submittedAt?: string;
}

export interface ChecklistQuoteItem {
  templateNo: string;
  code: string;
  service: string;
  scope: string;
  price: number;
  qty: number;
  matchedFrom?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function roomFromLead(lead: { service?: string; enquiry?: string; areas?: string }): string {
  const source = `${lead.service || ""} ${lead.enquiry || ""} ${lead.areas || ""}`.toLowerCase();
  return source.includes("ensuite") ? "EN" : "MB";
}

function groutFromLead(lead: { service?: string; enquiry?: string; message?: string }): string {
  const source = `${lead.service || ""} ${lead.enquiry || ""} ${lead.message || ""}`.toLowerCase();
  return /polymer|standard grout/.test(source) ? "PG" : "EG";
}

function pageDetailNote(page: ChecklistPage): string {
  const parts: string[] = [];
  if (page.showerLeakage) parts.push(`Leaking: ${page.showerLeakage}`);
  if (page.numberOfWalls) parts.push(`Tiled walls: ${page.numberOfWalls}`);
  if (page.tileSize) parts.push(`Tile size: ${page.tileSize}`);
  if (page.mosaic) parts.push(`Mosaic: ${page.mosaic}`);
  if (page.showerScreen) parts.push(`Screen: ${page.showerScreen}`);
  if (page.selectiveAreas?.trim()) parts.push(`Selective areas: ${page.selectiveAreas.trim()}`);
  return parts.join(" · ");
}

// ── Answers → quote items ────────────────────────────────────────────────────

/**
 * Translate checklist answers into standard catalog quote items.
 * Emits only real catalog codes; unmatched areas become zero-dollar customs.
 */
export function checklistToQuoteItems(
  answers: ChecklistAnswers,
  lead: { service?: string; enquiry?: string; areas?: string; message?: string } = {}
): ChecklistQuoteItem[] {
  const room = roomFromLead(lead);
  const grout = groutFromLead(lead);
  const items: ChecklistQuoteItem[] = [];

  const add = (template: ServiceTemplate | null, matchedFrom: string, note?: string, qty = 1) => {
    if (!template) return;
    // Each area is a separate scope, even when it uses the same catalog code.
    items.push({
      templateNo: template.no,
      code: template.code,
      service: template.service,
      scope: note ? `${template.scope} — ${note}` : template.scope,
      price: Number(template.price) || 0,
      qty,
      matchedFrom,
    });
  };

  for (const page of answers?.pages || []) {
    if (page.service && !["Shower", "Balcony"].includes(page.service)) {
      const scope = [page.areaDescription || page.areaName || page.service, (page.areaWork || []).join(", ") || "Review requested", page.additionalNotes].filter(Boolean).join(" — ");
      items.push({ templateNo: "", code: "", service: page.service, scope, price: 0, qty: 1, matchedFrom: "Smart quote request: manual pricing" });
      continue;
    }
    const hasShower = page.service ? page.service === "Shower" : Boolean(page.showerType || page.workRequired || page.wallHeight || page.showerLeakage);

    if (hasShower) {
      const size = page.showerType === "DS" ? "DS" : "SS";
      const height = page.wallHeight === "TC" || page.wallHeight === "ABOVE" ? "TC" : "SH";
      const surface = page.workRequired === "FO" ? "FO" : page.workRequired === "WO" ? "WO" : "WF";
      const pageRoom = page.areaName ? (/ensuite/i.test(page.areaName) ? "EN" : "MB") : room;
      const pageGrout = page.groutPreference === "PG" ? "PG" : page.groutPreference === "EG" ? "EG" : grout;
      const code =
        surface === "FO" ? `${pageRoom}-${size}-FO-${pageGrout}` : `${pageRoom}-${size}-${surface}-${height}-${pageGrout}`;
      const needsReview = page.preferInspection || (Boolean(page.service) && !["EG", "PG"].includes(page.groutPreference || "")) || page.tileSize === "Mosaic" || page.floorTileSize === "Mosaic" || page.damagedTiles === "Yes" || page.issues?.some(issue => /leak|water stains|loose/i.test(issue));
      const template = ["SS", "DS"].includes(page.showerType || "") && ["WF", "FO", "WO"].includes(page.workRequired || "")
        && (surface === "FO" || ["SH", "TC"].includes(page.wallHeight || "")) && !needsReview
        && !/guest|other/i.test(page.areaName || "") ? uniqueTemplateForCode(code) : null;
      if (template) {
        add(template, `Smart quote request: ${page.areaName || "shower"}`, pageDetailNote(page) || undefined);
      } else {
        items.push({ templateNo: "", code: "", service: `${page.areaName || "Shower"} assessment`, scope: `Review shower scope and photos${page.preferInspection ? "; on-site assessment requested" : ""}${needsReview ? "; technical details require review" : ""}`, price: 0, qty: 1, matchedFrom: "Smart quote request: manual review" });
      }
    }

    for (const joint of new Set(page.siliconeJoints || [])) {
      if (/^C-[VH]-[IO]$/.test(joint)) add(uniqueTemplateForCode(joint), "Checklist: shower screen silicone joints");
    }

    const cracked = Number(page.crackedWallTiles || 0) + Number(page.crackedFloorTiles || 0);
    if (cracked > 0) {
      const tileTemplate = page.tileAction === "Replace"
        ? uniqueTemplateForCode("CT - GROUTIX TO SUPPLY & INSTALL")
        : page.tileAction === "Repair" || !page.service ? uniqueTemplateForCode("TILE REPAIR") : null;
      if (tileTemplate) {
        add(tileTemplate, "Checklist: damaged tiles", undefined, cracked);
      } else {
        items.push({ templateNo: "", code: "", service: "Tile assessment", scope: `${cracked} damaged tile${cracked === 1 ? "" : "s"} reported; Groutix to recommend repair or replacement`, price: 0, qty: 1, matchedFrom: "Smart quote request: technical review" });
      }
    }

    for (const area of page.additionalAreas || []) {
      const label = String(area).trim();
      if (!label) continue;
      if (/balcony/i.test(label)) {
        add(uniqueTemplateForCode("BALCONY"), "Checklist: additional area — balcony");
        continue;
      }
      items.push({
        templateNo: "",
        code: "",
        service: label,
        scope: page.additionalNotes || "",
        price: 0,
        qty: 1,
        matchedFrom: "Checklist: additional area",
      });
    }

    const isBalcony = page.service ? page.service === "Balcony" : Boolean(page.balconyLeakage || page.balconyArea || page.balconyTileSize);
    if (isBalcony) {
      const note = [
        page.balconyArea ? `${page.balconyArea} sq m` : "",
        page.balconyTileSize ? `${page.balconyTileSize} tiles` : "",
        page.balconyLeakage ? `Leaking: ${page.balconyLeakage}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const requiresReview = page.preferInspection || page.issues?.some(issue => /leak|water/i.test(issue)) || page.balconyBelow === "Another apartment" || page.previousRepairs === "Yes";
      const work = page.balconyWork || [];
      if (requiresReview || (page.service && (work.length !== 1 || work[0] !== "Entire balcony regrouting and resealing"))) {
        items.push({ templateNo: "", code: "", service: `${page.areaName || "Balcony"} — review`, scope: [work.join(", "), note, "Confirm balcony work and pricing."].filter(Boolean).join(" · "), price: 0, qty: 1, matchedFrom: "Smart quote request: technical review" });
      } else {
        add(uniqueTemplateForCode("BALCONY"), `Smart quote request: ${page.areaName || "balcony"}`, note || undefined);
      }
    }
  }

  return items;
}

/** Customer-facing service names for the "Selected Services" badges. */
export function checklistServiceNames(items: ChecklistQuoteItem[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of items) {
    const name = (item.service || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

/** Merge new checklist items into the lead's existing quote items (dedupe by code). */
export function mergeQuoteItems<T extends { code?: string; service?: string }>(
  existing: T[] | undefined,
  additions: ChecklistQuoteItem[]
): ChecklistQuoteItem[] {
  const merged: ChecklistQuoteItem[] = [];
  const seenCodes = new Set<string>();
  const existingCodeCounts = new Map<string, number>();
  for (const item of existing || []) {
    const code = (item.code || "").trim().toUpperCase();
    if (code) {
      if (seenCodes.has(code)) continue;
      seenCodes.add(code);
      existingCodeCounts.set(code, (existingCodeCounts.get(code) || 0) + 1);
    }
    merged.push({
      templateNo: String((item as { templateNo?: string }).templateNo ?? ""),
      code: item.code || "",
      service: item.service || "",
      scope: (item as { scope?: string }).scope || "",
      price: Number((item as { price?: number }).price) || 0,
      qty: Number((item as { qty?: number }).qty) || 1,
    });
  }
  for (const addition of additions) {
    const code = (addition.code || "").trim().toUpperCase();
    const alreadyPresent = code ? existingCodeCounts.get(code) || 0 : 0;
    if (alreadyPresent) { existingCodeCounts.set(code, alreadyPresent - 1); continue; }
    merged.push(addition);
  }
  return merged;
}

/** Whether the customer has answered at least one field on any page. */
export function checklistHasAnswers(answers: ChecklistAnswers | undefined): boolean {
  return Boolean(
    answers?.pages?.some((page) =>
      Object.entries(page).some(([key, value]) => {
        if (key === "id" || key === "photos") return false;
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(String(value ?? "").trim());
      })
    )
  );
}
