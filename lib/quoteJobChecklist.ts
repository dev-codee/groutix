import type { QuoteBalcony } from "./quoteBalconies";

export type Checklist = {
  location: string; showerType: string; wallHeight: string; work: string; showerScope: string;
  wallCount: string; tileSize: string; mosaic: string; screen: string; siliconeJoints: string;
  wallTiles: string; floorTiles: string; tileAction: string; balconyArea: string;
  balconyTileSize: string; additional: string[]; notes: string;
  leakAreas: string[]; tileSizes: string[]; balconyTileSizes: string[];
  verticalJoints: string[]; horizontalJoints: string[]; tileActions: string[];
  leakNotes: string; includeBalcony: string; balconyLeakage: string;
  workDetails: string; summaryNotes: string; wallTileActions: string[]; floorTileActions: string[];
};
export const emptyChecklist: Checklist = { location: "", showerType: "", wallHeight: "", work: "", showerScope: "", wallCount: "", tileSize: "", mosaic: "", screen: "", siliconeJoints: "", wallTiles: "", floorTiles: "", tileAction: "", balconyArea: "", balconyTileSize: "", additional: [], notes: "", leakAreas: [], tileSizes: [], balconyTileSizes: [], verticalJoints: [], horizontalJoints: [], tileActions: [], leakNotes: "", includeBalcony: "", balconyLeakage: "", workDetails: "", summaryNotes: "", wallTileActions: [], floorTileActions: [] };

export type AdditionalShower = { checklist: Checklist; leaking: string };

export function parseAdditionalShowers(raw: string): AdditionalShower[] {
  if (!raw) return [];
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries)) throw new Error("Invalid shower details");
  return entries.map((entry: unknown) => {
    if (!entry || typeof entry !== "object" || !("checklist" in entry) || !("leaking" in entry) || typeof entry.leaking !== "string") {
      throw new Error("Invalid shower details");
    }
    return { checklist: normalizeJobChecklist(entry.checklist), leaking: entry.leaking };
  });
}

export function normalizeJobChecklist(raw: unknown): Checklist {
  const answers = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(emptyChecklist).map(([key, fallback]) => {
    const value = answers[key];
    if (Array.isArray(fallback)) {
      return [key, Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 30).map(item => item.slice(0, 120)) : []];
    }
    return [key, typeof value === "string" ? value.slice(0, 1000) : fallback];
  })) as Checklist;
}

export function includesJobBalcony(checklist: Checklist, additionalBalconies: QuoteBalcony[]) {
  return Boolean(checklist.includeBalcony === "Yes" || checklist.location === "Balcony" || checklist.balconyLeakage
    || checklist.balconyArea || checklist.balconyTileSize || checklist.balconyTileSizes.length || additionalBalconies.length);
}

function jobAreas(checklist: Checklist, leaking: string, additionalBalconies: QuoteBalcony[]) {
  const hasBalcony = includesJobBalcony(checklist, additionalBalconies);
  const hasShower = checklist.location !== "Balcony" && Boolean(checklist.location || leaking || checklist.leakAreas.length || checklist.showerScope || checklist.showerType);
  return { hasBalcony, balconyOnly: hasBalcony && !hasShower };
}

export function jobChecklistErrors(checklist: Checklist, leaking: string, additionalBalconies: QuoteBalcony[], additionalShowers: AdditionalShower[] = []) {
  return { ...checklistErrors(checklist, leaking, additionalBalconies), ...additionalShowerErrors(additionalShowers) };
}

export function hasSubmittedQuoteChecklist(lead: {
  quoteChecklist?: Record<string, string | string[]>;
  leaking?: string;
  additionalBalconies?: QuoteBalcony[];
  additionalShowers?: AdditionalShower[];
  checklistSubmittedAt?: string;
  checklist?: { submittedAt?: string };
}) {
  if (lead.checklistSubmittedAt || lead.checklist?.submittedAt) return true;
  if (!lead.quoteChecklist) return false;
  const checklist = normalizeJobChecklist(lead.quoteChecklist);
  if (checklist.location === "Balcony" && !checklist.balconyLeakage) {
    checklist.balconyLeakage = lead.leaking ?? "";
  }
  return Object.keys(jobChecklistErrors(checklist, lead.leaking ?? "", lead.additionalBalconies ?? [], lead.additionalShowers)).length === 0;
}

export function additionalShowerErrors(additionalShowers: AdditionalShower[]) {
  const errors: Record<string, string> = {};
  additionalShowers.forEach((shower, index) => {
    for (const [field, message] of Object.entries(checklistErrors(shower.checklist, shower.leaking, []))) {
      errors[`shower-${index + 1}-${field}`] = message;
    }
  });
  return errors;
}

function checklistErrors(checklist: Checklist, leaking: string, additionalBalconies: QuoteBalcony[]) {
  const { hasBalcony, balconyOnly } = jobAreas(checklist, leaking, additionalBalconies);
  const errors: Record<string, string> = {};
  const validArea = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0;
  if (!["Silicone only", "Grout only", "Grout and silicone"].includes(checklist.work)) errors.work = "Choose the work required";
  if (!balconyOnly) {
    if (leaking !== "Yes" && leaking !== "No") errors.leaking = "Choose yes or no";
    if ((!checklist.location || checklist.location === "Balcony") && !checklist.leakAreas.length) errors.location = "Choose the shower area";
    if (!checklist.showerScope) errors.showerScope = "Choose the area to work on";
  }
  if (hasBalcony) {
    if (checklist.balconyLeakage !== "Yes" && checklist.balconyLeakage !== "No") errors.balconyLeakage = "Choose yes or no";
    if (!validArea(checklist.balconyArea)) errors.balconyArea = "Enter a balcony area greater than zero";
  }
  additionalBalconies.forEach((balcony, index) => {
    if (!balcony.leakage) errors[`balcony-${index}-leakage`] = "Choose yes or no";
    if (!validArea(balcony.area)) errors[`balcony-${index}-area`] = "Enter a balcony area greater than zero";
  });
  return errors;
}

export function additionalAreaLabel(area: AdditionalShower, index: number) {
  const { balconyOnly } = jobAreas(area.checklist, area.leaking, []);
  return `Additional ${balconyOnly ? "balcony" : "shower"} ${index + 1}`;
}

export function jobChecklistText(answers: Record<string, string | string[]> | undefined, leaking = "", additionalBalconies: QuoteBalcony[] = [], additionalShowers: AdditionalShower[] = []) {
  const first = answers ? checklistText(normalizeJobChecklist(answers), leaking, additionalBalconies, answers.photoLabels ?? []) : "";
  return [first, ...additionalShowers.map((area, index) => {
    const checklist = normalizeJobChecklist(area.checklist);
    const job = describeJobChecklist(checklist, area.leaking, []);
    return `${additionalAreaLabel({ ...area, checklist }, index)}\n${checklistText(job.quoteChecklist, job.leaking)}`;
  })].filter(Boolean).join("\n\n");
}

function checklistText(checklist: Checklist, leaking: string, additionalBalconies: QuoteBalcony[] = [], photoLabels: string | string[] = []) {
  const rows: [string, string | string[]][] = [];
  if (checklist.location !== "Balcony") {
    rows.push(
      ["Shower leakage", leaking], ["Shower areas", [checklist.location, ...checklist.leakAreas].filter(Boolean)],
      ["Shower type", checklist.showerType], ["Wall height", checklist.wallHeight], ["Shower scope", checklist.showerScope],
      ["Tiled walls", checklist.wallCount], ["Tile size", checklist.tileSizes.length ? checklist.tileSizes : checklist.tileSize],
      ["Mosaic tiles", checklist.mosaic], ["Shower screen", checklist.screen],
      ["Vertical joints", checklist.verticalJoints], ["Horizontal joints", checklist.horizontalJoints], ["Silicone joints", checklist.siliconeJoints],
      ["Leakage notes", checklist.leakNotes],
    );
  }
  rows.push(
    ["Work required", checklist.work], ["Work details", checklist.workDetails],
    ["Damaged wall tiles", [checklist.wallTiles, ...checklist.wallTileActions].filter(Boolean)],
    ["Damaged floor tiles", [checklist.floorTiles, ...checklist.floorTileActions].filter(Boolean)],
    ["Tile work", checklist.tileActions.length ? checklist.tileActions : checklist.tileAction],
    ["Additional areas", checklist.additional], ["Additional area notes", checklist.notes],
    ["Balcony leakage", checklist.balconyLeakage || (checklist.location === "Balcony" ? leaking : "")],
    ["Balcony area", checklist.balconyArea && `${checklist.balconyArea} m²`],
    ["Balcony tile size", checklist.balconyTileSizes.length ? checklist.balconyTileSizes : checklist.balconyTileSize],
  );
  additionalBalconies.forEach((balcony, index) => rows.push([
    `Balcony ${index + 2}`, [`${balcony.area} m²`, `Leakage ${balcony.leakage}`, ...balcony.tileSizes],
  ]));
  rows.push(["Additional notes", checklist.summaryNotes], ["Photos", photoLabels]);
  return rows.flatMap(([label, value]) => {
    const text = Array.isArray(value) ? value.join(", ") : value.trim();
    return text ? [`${label}: ${text}`] : [];
  }).join("\n");
}

export function describeJobChecklist(checklist: Checklist, leaking: string, additionalBalconies: QuoteBalcony[]) {
  const { hasBalcony, balconyOnly } = jobAreas(checklist, leaking, additionalBalconies);
  const location = balconyOnly ? "Balcony" : checklist.location || "Other shower";
  const damagedTiles = [
    [checklist.wallTiles && `${checklist.wallTiles} wall`, ...checklist.wallTileActions].filter(Boolean).join(" "),
    [checklist.floorTiles && `${checklist.floorTiles} floor`, ...checklist.floorTileActions].filter(Boolean).join(" "),
  ];
  return {
    message: [checklist.leakNotes, checklist.workDetails, checklist.notes, checklist.summaryNotes].map(note => note.trim()).filter(Boolean).join("\n"),
    areas: [location, hasBalcony && !balconyOnly ? "Balcony" : "", ...checklist.additional].filter(Boolean).join(", "),
    service: `${balconyOnly ? "Balcony" : "Shower"} ${checklist.work}`,
    damagedTiles: damagedTiles.filter(Boolean).join(", "),
    leaking: balconyOnly ? checklist.balconyLeakage : leaking,
    quoteChecklist: { ...checklist, location: balconyOnly ? "Balcony" : checklist.location },
  };
}
