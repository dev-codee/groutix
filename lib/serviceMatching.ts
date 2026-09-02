import { SERVICE_TEMPLATES, type ServiceTemplate } from "@/lib/serviceTemplates";

export interface MatchedQuoteItem {
  templateNo: string;
  code: string;
  service: string;
  scope: string;
  price: number;
  qty: number;
  matchedFrom?: string;
}

export type TemplateCategory =
  | "All"
  | "Ensuite"
  | "Main Bathroom"
  | "Guest Bathroom"
  | "Balcony"
  | "Tile & Grout Repairs"
  | "Silicone & Caulking"
  | "Sealers & Treatments"
  | "Screens & Upgrades";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "All",
  "Ensuite",
  "Main Bathroom",
  "Balcony",
  "Guest Bathroom",
  "Tile & Grout Repairs",
  "Silicone & Caulking",
  "Sealers & Treatments",
  "Screens & Upgrades",
];

export function getTemplateCategory(template: ServiceTemplate): TemplateCategory {
  const code = (template.code || "").toUpperCase();
  const title = (template.service || "").toUpperCase();

  if (code.startsWith("EN-") || title.startsWith("ENSUITE")) return "Ensuite";
  if (
    code.startsWith("MB-") ||
    code.startsWith("MB ") ||
    code.includes("MB") ||
    title.startsWith("MAIN BATHROOM") ||
    title.includes("MAIN BATHROOM")
  ) {
    return "Main Bathroom";
  }
  if (title.includes("GUEST BATHROOM") || code === "GUYS") return "Guest Bathroom";
  if (
    code.includes("BALCONY") ||
    title.includes("BALCONY") ||
    code === "PRESSURE WASH" ||
    code === "NOTE"
  ) {
    return "Balcony";
  }
  if (code.startsWith("CT -") || title.includes("CRACKED TILE")) return "Tile & Grout Repairs";
  if (
    code.startsWith("C-") ||
    code === "PP" ||
    title.includes("CAULKING") ||
    title.includes("PENETRATION")
  ) {
    return "Silicone & Caulking";
  }
  if (
    code.startsWith("MT -") ||
    code.startsWith("S -") ||
    code.includes("SEALER") ||
    title.includes("MOULD") ||
    title.includes("SEALER")
  ) {
    return "Sealers & Treatments";
  }
  if (
    code.includes("SCREEN") ||
    code.includes("UPGRADE") ||
    title.includes("SHOWER SCREEN") ||
    title.includes("UPGRADE")
  ) {
    return "Screens & Upgrades";
  }

  return "Main Bathroom";
}

/**
 * Split and clean compound service strings (e.g. "Balcony Leak Repair, Shower Cubicle Regrouting")
 */
export function parseCustomerServices(serviceStr?: string): string[] {
  if (!serviceStr || !serviceStr.trim()) return [];

  // Split by comma, semicolon, bullet, or ' + '
  const rawParts = serviceStr
    .split(/[,;\n•|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toLowerCase() !== "other" && s.toLowerCase() !== "none");

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  const results: string[] = [];

  for (const part of rawParts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(part);
    }
  }

  return results.length > 0 ? results : [serviceStr.trim()];
}

/**
 * Find the most appropriate standard Groutix template for a specific service requirement.
 */
export function findBestTemplateForService(
  serviceName: string,
  areaHint?: string
): ServiceTemplate | null {
  const normSvc = (serviceName || "").toLowerCase();
  const normArea = (areaHint || "").toLowerCase();

  // 1. Balcony Services
  if (normSvc.includes("balcony")) {
    if (normSvc.includes("pressure") || normSvc.includes("wash")) {
      const t = SERVICE_TEMPLATES.find((x) => x.no === "74" || x.code.toLowerCase().includes("pressure"));
      if (t) return t;
    }
    // Standard Balcony Epoxy Regrouting
    const t = SERVICE_TEMPLATES.find((x) => x.no === "69" || x.code === "BALCONY");
    if (t) return t;
  }

  // 2. Cracked Tile Repair
  if (
    normSvc.includes("cracked") ||
    normSvc.includes("tile repair") ||
    normSvc.includes("loose tile") ||
    normSvc.includes("drummy")
  ) {
    const t = SERVICE_TEMPLATES.find((x) => x.no === "71" || x.code.startsWith("CT - Groutix"));
    if (t) return t;
  }

  // 3. Silicone / Caulking Replacement
  if (normSvc.includes("silicone") || normSvc.includes("caulk") || normSvc.includes("reseal")) {
    const t = SERVICE_TEMPLATES.find((x) => x.no === "81" || x.code === "C-V-I");
    if (t) return t;
  }

  // 4. Mould Treatment
  if (normSvc.includes("mould") || normSvc.includes("mold")) {
    const t = SERVICE_TEMPLATES.find((x) => x.no === "72" || x.code.startsWith("MT -"));
    if (t) return t;
  }

  // 5. Grout Sealer
  if (normSvc.includes("sealer") || normSvc.includes("penetrating")) {
    const t = SERVICE_TEMPLATES.find((x) => x.no === "73" || x.code.startsWith("S -") || x.no === "82");
    if (t) return t;
  }

  // 6. Shower Screen Replacement
  if (
    normSvc.includes("shower screen") ||
    normSvc.includes("screen replacement") ||
    normSvc.includes("screen install")
  ) {
    const t = SERVICE_TEMPLATES.find((x) => x.no === "84" || x.code.includes("screen"));
    if (t) return t;
  }

  // 7. Shower Regrouting / Leaking Shower Repair / Shower Base Repair
  if (
    normSvc.includes("shower") ||
    normSvc.includes("regrout") ||
    normSvc.includes("leak") ||
    normSvc.includes("grout")
  ) {
    const isEnsuite = normArea.includes("ensuite");
    const isGuest = normArea.includes("guest");
    const isFloorOnly = normSvc.includes("floor only") || normSvc.includes("base only");

    if (isGuest) {
      const t = SERVICE_TEMPLATES.find((x) => x.no === "31");
      if (t) return t;
    }

    if (isEnsuite) {
      if (isFloorOnly) {
        const t = SERVICE_TEMPLATES.find((x) => x.no === "12" || x.code === "EN-SS-FO-EG");
        if (t) return t;
      }
      // Ensuite Single Shower Walls & Floor Epoxy
      const t = SERVICE_TEMPLATES.find((x) => x.no === "20" || x.code === "EN-SS-WF-SH-EG");
      if (t) return t;
    }

    // Default to Main Bathroom Single Shower Walls & Floor Epoxy / Standard
    if (isFloorOnly) {
      const t = SERVICE_TEMPLATES.find((x) => x.no === "44" || x.code === "MB-SS-FO-EG");
      if (t) return t;
    }

    // Main Bathroom Single shower walls & floor (Template 55 MB-SS-WF-SH-EG or Template 48)
    const t =
      SERVICE_TEMPLATES.find((x) => x.no === "55" || x.code === "MB-SS-WF-SH-EG") ||
      SERVICE_TEMPLATES.find((x) => x.no === "48");
    if (t) return t;
  }

  // 8. Fallback: Search all 84 templates by keyword scoring
  const terms = normSvc.split(/\s+/).filter((w) => w.length > 2);
  let bestTemplate: ServiceTemplate | null = null;
  let bestScore = 0;

  for (const t of SERVICE_TEMPLATES) {
    let score = 0;
    const tTitle = t.service.toLowerCase();
    const tCode = t.code.toLowerCase();
    const tScope = t.scope.toLowerCase();

    for (const term of terms) {
      if (tTitle.includes(term)) score += 3;
      if (tCode.includes(term)) score += 2;
      if (tScope.includes(term)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTemplate = t;
    }
  }

  return bestScore >= 2 ? bestTemplate : null;
}

/**
 * Generate intelligent initial quote items for a lead based on customer choices
 */
export function getMatchedQuoteItemsForLead(lead: {
  service?: string;
  enquiry?: string;
  message?: string;
  notes?: string;
  areas?: string;
  damagedTiles?: string;
  leaking?: string;
}): MatchedQuoteItem[] {
  const customerServices = parseCustomerServices(lead.service || lead.enquiry || "");
  const areas = lead.areas || "";
  const items: MatchedQuoteItem[] = [];
  const usedTemplateNos = new Set<string>();

  for (const svc of customerServices) {
    const matched = findBestTemplateForService(svc, areas);

    if (matched) {
      usedTemplateNos.add(matched.no);
      items.push({
        templateNo: matched.no,
        code: matched.code,
        service: matched.service,
        scope: matched.scope,
        price: Number(matched.price) || 0,
        qty: 1,
        matchedFrom: svc,
      });
    } else {
      // Custom item
      items.push({
        templateNo: "",
        code: "",
        service: svc,
        scope: lead.message || lead.notes || "",
        price: 0,
        qty: 1,
        matchedFrom: svc,
      });
    }
  }

  // If customer reported cracked/loose tiles and not yet in quote, suggest cracked tile repair
  const damaged = (lead.damagedTiles || "").toLowerCase();
  if (
    (damaged.includes("cracked") || damaged.includes("loose") || damaged.includes("drummy")) &&
    !usedTemplateNos.has("71") &&
    !usedTemplateNos.has("70")
  ) {
    const ctTemplate = SERVICE_TEMPLATES.find((x) => x.no === "71");
    if (ctTemplate) {
      items.push({
        templateNo: ctTemplate.no,
        code: ctTemplate.code,
        service: ctTemplate.service,
        scope: ctTemplate.scope,
        price: Number(ctTemplate.price) || 0,
        qty: 1,
        matchedFrom: `Customer condition: ${lead.damagedTiles}`,
      });
    }
  }

  // Fallback if no services were specified
  if (items.length === 0) {
    const defaultTemplate = SERVICE_TEMPLATES.find((x) => x.no === "55") || SERVICE_TEMPLATES[0];
    items.push({
      templateNo: defaultTemplate.no,
      code: defaultTemplate.code,
      service: lead.service || defaultTemplate.service,
      scope: defaultTemplate.scope,
      price: Number(defaultTemplate.price) || 0,
      qty: 1,
    });
  }

  return items;
}
