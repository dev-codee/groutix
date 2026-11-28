export const ITEM_CODE_GROUPS = [
  { key: "room", label: "Bathroom", options: [["EN", "Ensuite"], ["MB", "Main bathroom"]] },
  { key: "size", label: "Shower", options: [["SS", "Single shower"], ["DS", "Double shower"]] },
  { key: "surface", label: "Work area", options: [["WF", "Walls & floor"], ["WP", "Walls to pan"], ["WB", "Walls & bath"], ["FO", "Floor only"], ["WO", "Walls only"]] },
  { key: "height", label: "Height", options: [["SH", "Screen height"], ["TC", "To ceiling"]] },
  { key: "grout", label: "Grout", options: [["EG", "Epoxy grout"], ["PG", "Polymer grout"]] },
] as const;

export type ItemCodeGroup = typeof ITEM_CODE_GROUPS[number]["key"];
export type ItemCodeSelection = Partial<Record<ItemCodeGroup, string>> & { standalone?: string };

export function standaloneItemCodes(templates: readonly { code: string; service: string }[]) {
  const items = new Map<string, string>();
  for (const template of templates) {
    const code = template.code.trim().toUpperCase();
    if (!code || items.has(code)) continue;
    const tokens = code.split("-");
    const isShowerCode = ITEM_CODE_GROUPS.every(({ key, options }) =>
      (key === "height" && tokens.includes("FO")) || options.some(([part]) => tokens.includes(part))
    );
    if (!isShowerCode) items.set(code, template.service);
  }
  return [...items].sort(([a], [b]) => a.localeCompare(b));
}

export function skipsItemHeight(selection: ItemCodeSelection): boolean {
  return selection.surface === "FO" || selection.surface === "WO";
}

export function selectItemCodeOption(selection: ItemCodeSelection, group: ItemCodeGroup, code: string): ItemCodeSelection {
  const next = { ...selection, [group]: selection[group] === code ? undefined : code };
  delete next.standalone;
  if (skipsItemHeight(next)) delete next.height;
  return next;
}

export function matchesItemCodeChecklist(code: string, selection: ItemCodeSelection): boolean {
  const normalized = code.trim().toUpperCase();
  if (selection.standalone) return normalized === selection.standalone;
  const tokens = normalized.split("-");
  return ITEM_CODE_GROUPS.every(({ key }) =>
    !selection[key] || (key === "height" && skipsItemHeight(selection)) || tokens.includes(selection[key]!)
  );
}
