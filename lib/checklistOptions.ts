// Checklist form options — kept free of Node-only imports so the public
// customer form (a client component) can import them directly.

import type { ChecklistAnswers } from "./checklist";

export const CHECKLIST_OPTIONS = {
  yesNo: [
    ["Yes", "Yes"],
    ["No", "No"],
  ],
  showerType: [
    ["SS", "Single (SS)"],
    ["DS", "Double (DS)"],
  ],
  wallHeight: [
    ["SH", "Up to shower screen height (~2.1m)"],
    ["TC", "To ceiling"],
    ["ABOVE", "Above shower height but not to ceiling"],
  ],
  workRequired: [
    ["WF", "Entire shower — walls & floor (WF)"],
    ["FO", "Floor only (FO)"],
    ["WO", "Walls only (WO)"],
  ],
  numberOfWalls: [
    ["1", "1 wall"],
    ["2", "2 walls"],
    ["3", "3 walls"],
  ],
  tileSize: [
    ["Small", "Small"],
    ["Medium", "Medium"],
    ["Large", "Large"],
    ["Extra Large", "Extra Large"],
  ],
  showerScreen: [
    ["Frameless", "Frameless"],
    ["Semi-frameless", "Semi-frameless"],
  ],
  siliconeJoints: [
    ["C-V-I", "Vertical — inside"],
    ["C-V-O", "Vertical — outside"],
    ["C-H-I", "Horizontal — inside"],
    ["C-H-O", "Horizontal — outside"],
  ],
  tileCount: [
    ["0", "None"],
    ["1", "1"],
    ["2", "2"],
    ["3", "3+"],
  ],
  tileAction: [
    ["Repair", "Repair"],
    ["Replace", "Replace"],
  ],
  additionalAreas: [
    "Bathroom floor outside the shower",
    "Kitchen",
    "Vanity",
    "Bathtub",
    "Niche",
    "Balcony",
  ],
} as const;

/** Human-readable checklist summary for the CRM "Customer Request" area. */
export function checklistRequestText(answers: ChecklistAnswers): string {
  const lines: string[] = [];
  (answers?.pages || []).forEach((page, index) => {
    const isBalcony = Boolean(page.balconyLeakage || page.balconyArea || page.balconyTileSize);
    const heading = isBalcony && !page.showerType ? `Balcony ${index + 1}` : `Shower ${index + 1}`;
    const pageLines: string[] = [];
    if (page.showerLeakage) pageLines.push(`Shower leakage: ${page.showerLeakage}${page.leakageNotes ? ` (${page.leakageNotes})` : ""}`);
    if (page.showerType) pageLines.push(`Shower type: ${page.showerType === "DS" ? "Double" : "Single"}`);
    if (page.wallHeight) pageLines.push(`Wall height: ${page.wallHeight}`);
    if (page.workRequired) pageLines.push(`Work required: ${page.workRequired}`);
    if (page.selectiveAreas?.trim()) pageLines.push(`Selective areas: ${page.selectiveAreas.trim()}`);
    if (page.numberOfWalls) pageLines.push(`Tiled walls: ${page.numberOfWalls}`);
    if (page.tileSize) pageLines.push(`Tile size: ${page.tileSize}`);
    if (page.mosaic) pageLines.push(`Mosaic tiles: ${page.mosaic}`);
    if (page.showerScreen) pageLines.push(`Shower screen: ${page.showerScreen}`);
    if (page.siliconeJoints?.length) pageLines.push(`Silicone joints: ${page.siliconeJoints.join(", ")}`);
    const cracked = Number(page.crackedWallTiles || 0) + Number(page.crackedFloorTiles || 0);
    if (cracked > 0) {
      pageLines.push(
        `Cracked/loose tiles: wall ${page.crackedWallTiles || 0}, floor ${page.crackedFloorTiles || 0}${page.tileAction ? ` (${page.tileAction})` : ""}`
      );
    }
    if (page.additionalAreas?.length) pageLines.push(`Additional areas: ${page.additionalAreas.join(", ")}`);
    if (page.additionalNotes?.trim()) pageLines.push(`Additional notes: ${page.additionalNotes.trim()}`);
    if (page.balconyLeakage) pageLines.push(`Balcony leakage: ${page.balconyLeakage}`);
    if (page.balconyArea) pageLines.push(`Balcony area: ${page.balconyArea} sq m`);
    if (page.balconyTileSize) pageLines.push(`Balcony tile size: ${page.balconyTileSize}`);
    if (page.photos?.length) pageLines.push(`Photos: ${page.photos.length}`);
    lines.push(`${heading}\n- ${pageLines.join("\n- ")}`);
  });
  return lines.join("\n\n");
}
