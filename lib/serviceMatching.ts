import { SERVICE_TEMPLATES, uniqueTemplateForCode, type ServiceTemplate } from "@/lib/serviceTemplates";

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
  if (code.startsWith("CT -") || code === "TILE REPAIR" || title.includes("CRACKED TILE")) return "Tile & Grout Repairs";
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

  // A catalog title can contain punctuation; preserve it as one request.
  const requested = serviceStr.trim().toUpperCase();
  if (SERVICE_TEMPLATES.some((t) => t.code === requested || t.service.toUpperCase() === requested)) {
    return [serviceStr.trim()];
  }

  // Split by comma, semicolon, bullet, pipe, or a spaced plus sign.
  const rawParts = serviceStr
    .split(/[,;\n•|]+|\s+\+\s+/)
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

  return results;
}

/**
 * Find the most appropriate standard Groutix template for a specific service requirement.
 */
export function findBestTemplateForService(
  serviceName: string,
  areaHint?: string
): ServiceTemplate | null {
  const requested = String(serviceName || "").trim().toUpperCase();
  if (SERVICE_TEMPLATES.some(template => template.code === requested)) return uniqueTemplateForCode(requested);
  const titles = SERVICE_TEMPLATES.filter((template) => template.service.toUpperCase() === requested);
  if (titles.length === 1) return titles[0];
  if (titles.length > 1 && new Set(titles.map(template => template.code)).size === 1) return null;

  const normSvc = (serviceName || "").toLowerCase();
  const normArea = (areaHint || "").toLowerCase();

  // 1. Balcony Services
  if (normSvc.includes("balcony")) {
    if (normSvc.includes("pressure") || normSvc.includes("wash")) {
      const t = SERVICE_TEMPLATES.find((x) => x.code === "PRESSURE WASH");
      if (t) return t;
    }
    // Standard Balcony Epoxy Regrouting
    const t = SERVICE_TEMPLATES.find((x) => x.code === "BALCONY");
    if (t) return t;
  }

  // 2. Cracked Tile Repair
  if (
    normSvc.includes("cracked") ||
    normSvc.includes("tile repair") ||
    normSvc.includes("loose tile") ||
    normSvc.includes("drummy") ||
    normSvc.includes("adhesive injection")
  ) {
    const code = /loose|drummy|injection/.test(normSvc) ? "TILE REPAIR" : "CT - GROUTIX TO SUPPLY & INSTALL";
    const t = uniqueTemplateForCode(code);
    if (t) return t;
  }

  // 3. Silicone / Caulking Replacement
  const regrouting = normSvc.includes("grout") || normSvc.includes("leak");
  if (!regrouting && (normSvc.includes("silicone") || normSvc.includes("caulk") || normSvc.includes("reseal"))) {
    // These catalog items cover screen joints only, not general silicone work.
    if (!normSvc.includes("screen")) return null;
    const direction = normSvc.includes("horizontal") ? "H" : "V";
    const side = normSvc.includes("outside") || normSvc.includes("external") ? "O" : "I";
    return SERVICE_TEMPLATES.find((x) => x.code === `C-${direction}-${side}`) || null;
  }

  // 4. Mould Treatment
  if (!regrouting && (normSvc.includes("mould") || normSvc.includes("mold"))) {
    const t = SERVICE_TEMPLATES.find((x) => x.code === "MT - MOULD TREATMENT");
    if (t) return t;
  }

  // 5. Grout Sealer
  if (normSvc.includes("sealer") || normSvc.includes("penetrating")) {
    const t = SERVICE_TEMPLATES.find((x) => x.code === "S - SEALANT");
    if (t) return t;
  }

  // 6. Shower Screen Replacement
  if (
    normSvc.includes("screen replacement") ||
    normSvc.includes("screen install") ||
    (normSvc.includes("shower screen") && !regrouting && !normSvc.includes("height"))
  ) {
    const t = SERVICE_TEMPLATES.find((x) => x.code === "SCREEN REPLECEMENT");
    if (t) return t;
  }

  // 7. Shower Regrouting / Leaking Shower Repair / Shower Base Repair
  if (
    normSvc.includes("shower") ||
    normSvc.includes("regrout") ||
    normSvc.includes("leak") ||
    normSvc.includes("grout")
  ) {
    // An explicit room in the service takes priority over the lead's area list.
    const areaText = /ensuite|guest|main bath/.test(normSvc) ? normSvc : normArea;
    const isEnsuite = areaText.includes("ensuite");
    const isGuest = areaText.includes("guest");
    const hasWalls = /\bwalls?\b/.test(normSvc);
    const isFloorOnly = normSvc.includes("floor only") || normSvc.includes("base only") ||
      (!hasWalls && /\b(floor|base)\b/.test(normSvc));

    if (isGuest) {
      const t = SERVICE_TEMPLATES.find((x) => x.code === "GUYS");
      if (t) return t;
    }

    const room = isEnsuite ? "EN" : "MB";
    const shower = normSvc.includes("double") ? "DS" : "SS";
    const grout = normSvc.includes("polymer") || normSvc.includes("standard grout") ? "PG" : "EG";
    const extent = normSvc.includes("ceiling") ? "TC" : "SH";
    const surface = isFloorOnly ? "FO"
      : normSvc.includes("walls only") || normSvc.includes("wall only") ? "WO"
      : /\bpan\b/.test(normSvc) ? "WP"
      : /\bbath\b/.test(normSvc) ? "WB" : "WF";
    const code = surface === "FO" ? `${room}-${shower}-FO-${grout}` : `${room}-${shower}-${surface}-${extent}-${grout}`;
    const specified = uniqueTemplateForCode(code);
    if (specified) return specified;
    if (SERVICE_TEMPLATES.some(template => template.code === code)) return null;

    // Never replace an unavailable specified variant with a different scope.
    if (shower === "DS" || grout === "PG" || extent === "TC" || surface === "WO" || surface === "WP" || surface === "WB") return null;

    if (isEnsuite) {
      if (isFloorOnly) {
        const t = SERVICE_TEMPLATES.find((x) => x.code === "EN-SS-FO-EG");
        if (t) return t;
      }
      // Ensuite Single Shower Walls & Floor Epoxy
      const t = SERVICE_TEMPLATES.find((x) => x.code === "EN-SS-WF-SH-EG");
      if (t) return t;
    }

    // Default to Main Bathroom Single Shower Walls & Floor Epoxy / Standard
    if (isFloorOnly) {
      const t = SERVICE_TEMPLATES.find((x) => x.code === "MB-SS-FO-EG");
      if (t) return t;
    }

    // Match stable item codes; catalog row numbers can change.
    const t = uniqueTemplateForCode("MB-SS-WF-SH-EG");
    if (t) return t;
  }

  // 8. Fallback: Search the catalog by keyword scoring
  const terms = normSvc.split(/\s+/).filter((w) => w.length > 2);
  let bestTemplate: ServiceTemplate | null = null;
  let bestScore = 0;

  for (const t of SERVICE_TEMPLATES) {
    if (!uniqueTemplateForCode(t.code)) continue;
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
  const usedTemplateCodes = new Set<string>();

  for (const svc of customerServices) {
    const matched = findBestTemplateForService(svc, areas);

    if (matched) {
      if (usedTemplateCodes.has(matched.code)) continue;
      usedTemplateCodes.add(matched.code);
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
    !usedTemplateCodes.has("CT - GROUTIX TO SUPPLY & INSTALL") &&
    !usedTemplateCodes.has("TILE REPAIR") &&
    !usedTemplateCodes.has("CT - (CLIENT TO SOURCE)")
  ) {
    const ctTemplate = uniqueTemplateForCode(/loose|drummy/.test(damaged) ? "TILE REPAIR" : "CT - GROUTIX TO SUPPLY & INSTALL");
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
    const defaultTemplate = SERVICE_TEMPLATES.find((x) => x.code === "MB-SS-WF-SH-EG") || SERVICE_TEMPLATES[0];
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
