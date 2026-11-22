// Regrouting & Resealing quote checklist.
//
// After a customer submits the website quote form we email them this detailed
// checklist (see CHECKLIST FINAL). Their answers are stored on the lead and are
// translated into standard catalog quote items so the quote "auto-picks" the
// right line items without staff retyping anything.
//
// The mapping only ever emits codes that exist in the catalog; anything the
// catalog cannot price is surfaced as a zero-dollar custom line so nothing the
// customer told us is lost.

import { SERVICE_TEMPLATES, type ServiceTemplate } from "./serviceTemplates";
import { signQuoteToken, siteBaseUrl } from "./quoteToken";

export { CHECKLIST_OPTIONS, checklistRequestText } from "./checklistOptions";

export type ChecklistPhoto = {
  name: string;
  contentType?: string;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  added?: string;
};

/** One shower (or balcony) page of the checklist, matching the DOCX questions. */
export interface ChecklistPage {
  id: string;
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

function firstTemplateForCode(code: string): ServiceTemplate | null {
  return SERVICE_TEMPLATES.find((template) => template.code === code.trim().toUpperCase()) || null;
}

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
  const usedCodes = new Set<string>();

  const add = (template: ServiceTemplate | null, matchedFrom: string, note?: string) => {
    if (!template || usedCodes.has(template.code)) return;
    usedCodes.add(template.code);
    items.push({
      templateNo: template.no,
      code: template.code,
      service: template.service,
      scope: note ? `${template.scope} — ${note}` : template.scope,
      price: Number(template.price) || 0,
      qty: 1,
      matchedFrom,
    });
  };

  for (const page of answers?.pages || []) {
    const hasShower = Boolean(
      page.showerType || page.workRequired || page.wallHeight || page.showerLeakage
    );

    if (hasShower) {
      const size = page.showerType === "DS" ? "DS" : "SS";
      const height = page.wallHeight === "TC" || page.wallHeight === "ABOVE" ? "TC" : "SH";
      const surface = page.workRequired === "FO" ? "FO" : page.workRequired === "WO" ? "WO" : "WF";
      const code =
        surface === "FO" ? `${room}-${size}-FO-${grout}` : `${room}-${size}-${surface}-${height}-${grout}`;
      add(
        firstTemplateForCode(code),
        `Checklist: ${size === "DS" ? "double" : "single"} shower ${surface === "FO" ? "floor only" : surface === "WO" ? "walls only" : "walls & floor"}`,
        pageDetailNote(page) || undefined
      );
    }

    for (const joint of page.siliconeJoints || []) {
      add(firstTemplateForCode(joint), "Checklist: shower screen silicone joints");
    }

    const cracked = Number(page.crackedWallTiles || 0) + Number(page.crackedFloorTiles || 0);
    if (cracked > 0) {
      const code = page.tileAction === "Replace" ? "CT - GROUTIX TO SUPPLY & INSTALL" : "TILE REPAIR";
      add(
        firstTemplateForCode(code),
        `Checklist: ${cracked} cracked/loose tile${cracked === 1 ? "" : "s"} — ${page.tileAction || "Repair"}`
      );
    }

    for (const area of page.additionalAreas || []) {
      const label = String(area).trim();
      if (!label) continue;
      if (/balcony/i.test(label)) {
        add(firstTemplateForCode("BALCONY"), "Checklist: additional area — balcony");
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

    const isBalcony = Boolean(page.balconyLeakage || page.balconyArea || page.balconyTileSize);
    if (isBalcony) {
      const note = [
        page.balconyArea ? `${page.balconyArea} sq m` : "",
        page.balconyTileSize ? `${page.balconyTileSize} tiles` : "",
        page.balconyLeakage ? `Leaking: ${page.balconyLeakage}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      add(firstTemplateForCode("BALCONY"), "Checklist: balcony", note || undefined);
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
  for (const item of existing || []) {
    const code = (item.code || "").trim().toUpperCase();
    if (code) {
      if (seenCodes.has(code)) continue;
      seenCodes.add(code);
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
    if (code && seenCodes.has(code)) continue;
    if (code) seenCodes.add(code);
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

// ── Public link + tracking pixel ─────────────────────────────────────────────

export function buildChecklistUrl(id: string): string {
  return `${siteBaseUrl()}/checklist/${id}?token=${signQuoteToken(id)}`;
}

export function checklistTrackingPixel(id: string): string {
  return `<img src="${siteBaseUrl()}/api/track/checklist/${encodeURIComponent(id)}?token=${signQuoteToken(id)}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
}
