import { CHECKLIST_OPTIONS } from "./checklistOptions";

export const SMART_QUESTION_LABELS = [
  "What area requires attention?", "Select Photo Category", "Which shower requires attention?",
  "What should we call this area?", "What problems are you experiencing?",
  "Where do you notice water or moisture?", "How large is your shower?",
  "How many tiled walls are inside the shower?", "What would you like restored?",
  "How high are the wall tiles to be regrouted?", "What size are the tiles?",
  "What type of shower screen do you have?", "Are any tiles cracked, loose or lifting?",
  "Do you have a preferred grout?", "Anything else you would like us to quote?",
  "Where is the balcony located?", "Approximate balcony size",
  "What is directly below the balcony?", "What size are the balcony tiles?",
  "Are there skirting tiles along the walls?", "What work would you like completed?",
  "Has the balcony been repaired or investigated before?", "Which parts need attention?",
  "Approximate dimensions, if known", "Tell us more about the work",
  "Photos for your quote", "Preferred timeframe", "Property type",
  "Access or parking restrictions", "Additional information",
] as const;

export type SmartQuestion = {
  id: string;
  service: string;
  label: string;
  type: "text" | "textarea" | "number" | "single" | "multiple";
  options: string[];
  required: boolean;
};

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
  serviceChoices: string[];
  serviceLabels: Record<string, string>;
  photoCategories: string[];
  hiddenQuestions: string[];
  questionLabels: Record<string, string>;
  customQuestions: SmartQuestion[];
};

export const DEFAULT_CHECKLIST_FORM: ChecklistForm = {
  title: "Groutix — Smart Quote Request",
  intro: "Answer a few simple questions and upload photos so our team can prepare your preliminary quote.",
  pageTitle: "Area",
  fields: Object.fromEntries(CHECKLIST_FIELDS) as ChecklistForm["fields"],
  placeholders: Object.fromEntries(CHECKLIST_PLACEHOLDERS) as ChecklistForm["placeholders"],
  optionLabels: Object.fromEntries(CHECKLIST_OPTION_GROUPS.map(group => [group, Object.fromEntries(CHECKLIST_OPTIONS[group].map(([value, text]) => [value, text]))])) as ChecklistForm["optionLabels"],
  additionalAreas: [...CHECKLIST_OPTIONS.additionalAreas],
  serviceChoices: ["Shower", "Bathroom", "Balcony", "Other tiled area"],
  serviceLabels: {},
  photoCategories: ["Shower area inside", "Outside shower, bath & walls", "Shower screen height with wall tiles", "Number of walls with height & tile size", "Mosaic tiles", "Cracked, loose, drummy or lifted tiles", "Other areas · bathtub, niche, kitchen, vanity", "Balcony full view, zoomed in/out & leaking area"],
  hiddenQuestions: [],
  questionLabels: {},
  customQuestions: [],
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
    serviceChoices: Array.isArray(source.serviceChoices) && source.serviceChoices.some(value => typeof value === "string" && value.trim())
      ? [...new Set(source.serviceChoices.map(value => requiredText(value, "", 80)).filter(Boolean))].slice(0, 20)
      : [...DEFAULT_CHECKLIST_FORM.serviceChoices],
    serviceLabels: source.serviceLabels && typeof source.serviceLabels === "object"
      ? Object.fromEntries(Object.entries(source.serviceLabels as Record<string, unknown>).slice(0, 20).map(([key, value]) => [key.slice(0, 80), requiredText(value, key, 80)]))
      : {},
    photoCategories: Array.isArray(source.photoCategories)
      ? [...new Set(source.photoCategories.map(value => requiredText(value, "", 120)).filter(Boolean))].slice(0, 30)
      : [...DEFAULT_CHECKLIST_FORM.photoCategories],
    hiddenQuestions: Array.isArray(source.hiddenQuestions)
      ? source.hiddenQuestions.filter((value): value is string => typeof value === "string" && (SMART_QUESTION_LABELS as readonly string[]).includes(value))
      : [],
    questionLabels: Object.fromEntries(SMART_QUESTION_LABELS.map(key => [key, requiredText((source.questionLabels as Record<string, unknown> | undefined)?.[key], key)])),
    customQuestions: Array.isArray(source.customQuestions) ? source.customQuestions.slice(0, 50).flatMap((item): SmartQuestion[] => {
      if (!item || typeof item !== "object") return [];
      const q = item as Record<string, unknown>;
      const id = requiredText(q.id, "", 64).replace(/[^a-zA-Z0-9_-]/g, "");
      const label = requiredText(q.label, "", 160);
      if (!id || !label) return [];
      const service = requiredText(q.service, "All", 80);
      const type = ["text", "textarea", "number", "single", "multiple"].includes(String(q.type)) ? q.type as SmartQuestion["type"] : "text";
      const options = Array.isArray(q.options) ? [...new Set(q.options.map(value => requiredText(value, "", 120)).filter(Boolean))].slice(0, 30) : [];
      return [{ id, label, service, type, options, required: q.required === true }];
    }) : [],
  };
}
