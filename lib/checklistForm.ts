import { CHECKLIST_OPTIONS } from "./checklistOptions";

export const CHECKLIST_FIELDS = [
  ["showerLeakage", "Is the shower leaking?"],
  ["showerType", "Shower type"],
  ["wallHeight", "Wall height"],
  ["workRequired", "Work required"],
  ["numberOfWalls", "Number of tiled walls"],
  ["tileSize", "Tile size"],
  ["mosaic", "Mosaic tiles?"],
  ["showerScreen", "Shower screen"],
  ["siliconeJoints", "Silicone joints needing replacement"],
  ["crackedTiles", "Cracked / loose / drummy / lifted tiles (for repair or replacement)"],
  ["wallTiles", "Wall tiles"],
  ["floorTiles", "Floor tiles"],
  ["tileAction", "Repair or replace?"],
  ["additionalAreas", "Additional areas requiring work"],
  ["balcony", "Balcony"],
  ["balconyLeakage", "Balcony leakage?"],
  ["balconyArea", "Balcony area (sq m)"],
  ["balconyTileSize", "Balcony tile size"],
  ["photos", "Photos (optional, recommended)"],
] as const;

export const CHECKLIST_PLACEHOLDERS = [
  ["leakageNotes", "Any additional information (optional)"],
  ["selectiveAreas", "Selective areas? Please specify (e.g. 2–3 tiles high / floor)"],
  ["additionalNotes", "Please specify any other areas"],
  ["balconyArea", "e.g. 8"],
] as const;

export const CHECKLIST_OPTION_GROUPS = [
  "yesNo", "showerType", "wallHeight", "workRequired", "numberOfWalls",
  "tileSize", "showerScreen", "siliconeJoints", "tileCount", "tileAction",
] as const;

export type ChecklistFieldKey = typeof CHECKLIST_FIELDS[number][0];
export type ChecklistPlaceholderKey = typeof CHECKLIST_PLACEHOLDERS[number][0];
export type ChecklistOptionGroup = typeof CHECKLIST_OPTION_GROUPS[number];
export type ChecklistForm = {
  title: string;
  intro: string;
  pageTitle: string;
  fields: Record<ChecklistFieldKey, string>;
  placeholders: Record<ChecklistPlaceholderKey, string>;
  optionLabels: Record<ChecklistOptionGroup, Record<string, string>>;
  additionalAreas: string[];
};

export const DEFAULT_CHECKLIST_FORM: ChecklistForm = {
  title: "Shower / Balcony Grouting & Resealing Checklist",
  intro: "answer the questions below so we can prepare your accurate quote. Add one page per shower or balcony.",
  pageTitle: "Shower / Balcony",
  fields: Object.fromEntries(CHECKLIST_FIELDS) as ChecklistForm["fields"],
  placeholders: Object.fromEntries(CHECKLIST_PLACEHOLDERS) as ChecklistForm["placeholders"],
  optionLabels: Object.fromEntries(CHECKLIST_OPTION_GROUPS.map(group => [group, Object.fromEntries(CHECKLIST_OPTIONS[group].map(([value, text]) => [value, text]))])) as ChecklistForm["optionLabels"],
  additionalAreas: [...CHECKLIST_OPTIONS.additionalAreas],
};

/** Preserve answer codes used by quote matching while allowing display copy to change. */
export function checklistOptions(form: ChecklistForm, group: ChecklistOptionGroup): [string, string][] {
  return CHECKLIST_OPTIONS[group].map(([value, defaultLabel]) => [value, form.optionLabels[group]?.[value] || defaultLabel]);
}

function requiredText(value: unknown, fallback: string, max = 240): string {
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}

export function sanitizeChecklistForm(raw: unknown): ChecklistForm {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const fields = source.fields && typeof source.fields === "object" ? source.fields as Record<string, unknown> : {};
  const placeholders = source.placeholders && typeof source.placeholders === "object" ? source.placeholders as Record<string, unknown> : {};
  const optionLabels = source.optionLabels && typeof source.optionLabels === "object" ? source.optionLabels as Record<string, unknown> : {};
  return {
    title: requiredText(source.title, DEFAULT_CHECKLIST_FORM.title),
    intro: requiredText(source.intro, DEFAULT_CHECKLIST_FORM.intro, 1000),
    pageTitle: requiredText(source.pageTitle, DEFAULT_CHECKLIST_FORM.pageTitle),
    fields: Object.fromEntries(CHECKLIST_FIELDS.map(([key, fallback]) => [key, requiredText(fields[key], fallback)])) as ChecklistForm["fields"],
    placeholders: Object.fromEntries(CHECKLIST_PLACEHOLDERS.map(([key, fallback]) => [key, requiredText(placeholders[key], fallback)])) as ChecklistForm["placeholders"],
    optionLabels: Object.fromEntries(CHECKLIST_OPTION_GROUPS.map(group => {
      const labels = optionLabels[group] && typeof optionLabels[group] === "object" ? optionLabels[group] as Record<string, unknown> : {};
      return [group, Object.fromEntries(CHECKLIST_OPTIONS[group].map(([value, fallback]) => [value, requiredText(labels[value], fallback)]))];
    })) as ChecklistForm["optionLabels"],
    additionalAreas: Array.isArray(source.additionalAreas)
      ? [...new Set(source.additionalAreas.map(value => typeof value === "string" ? value.trim().slice(0, 120) : "").filter(Boolean))].slice(0, 20)
      : [...DEFAULT_CHECKLIST_FORM.additionalAreas],
  };
}
