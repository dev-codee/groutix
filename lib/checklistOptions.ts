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

function optionLabel(value: string, options: ReadonlyArray<readonly [string, string]>): string {
  return options.find(([code]) => code === value)?.[1] ?? value;
}

/** Human-readable checklist summary for the CRM "Customer Request" area. */
export function checklistRequestText(answers: ChecklistAnswers): string {
  const lines: string[] = [];
  (answers?.pages || []).forEach((page, index) => {
    const isBalcony = page.service === "Balcony" || Boolean(page.balconyLeakage || page.balconyArea || page.balconyTileSize);
    const heading = `${page.service || (isBalcony && !page.showerType ? "Balcony" : "Shower")} ${index + 1}${page.areaName ? ` — ${page.areaName}` : ""}`;
    const pageLines: string[] = [];
    if (page.issues?.length) pageLines.push(`Reported problems: ${page.issues.join(", ")}`);
    if (page.dimensionsLength || page.dimensionsWidth) pageLines.push(`Dimensions: ${page.dimensionsLength || "?"} × ${page.dimensionsWidth || "?"} ${page.service === "Shower" ? "mm" : "m"}`);
    if (page.measurementsUnknown) pageLines.push("Measurements: not sure");
    if (page.floorTileSize) pageLines.push(`Floor tiles: ${page.floorTileSize}`);
    if (page.damagedTiles) pageLines.push(`Damaged tiles: ${page.damagedTiles}`);
    if (page.spareTiles) pageLines.push(`Matching spare tiles: ${page.spareTiles}`);
    if (page.groutPreference) pageLines.push(`Grout preference: ${optionLabel(page.groutPreference, [["EG", "Premium epoxy"], ["PG", "Traditional grout"]])}`);
    if (page.balconyLevel) pageLines.push(`Balcony level: ${page.balconyLevel}`);
    if (page.balconyBelow) pageLines.push(`Below balcony: ${page.balconyBelow}`);
    if (page.balconySkirting) pageLines.push(`Skirting tiles: ${page.balconySkirting}`);
    if (page.balconyWork?.length) pageLines.push(`Balcony work: ${page.balconyWork.join(", ")}`);
    if (page.previousRepairs) pageLines.push(`Previous repairs: ${page.previousRepairs}`);
    if (page.previousRepairNotes) pageLines.push(`Previous repair notes: ${page.previousRepairNotes}`);
    if (page.areaWork?.length) pageLines.push(`Areas needing work: ${page.areaWork.join(", ")}`);
    if (page.preferInspection) pageLines.push("On-site assessment requested");
    for (const answer of Object.values(page.customAnswers || {})) {
      const value = Array.isArray(answer.value) ? answer.value.join(", ") : answer.value.trim();
      if (answer.label && value) pageLines.push(`${answer.label}: ${value}`);
    }
    if (page.showerLeakage) pageLines.push(`Shower leakage: ${page.showerLeakage}`);
    if (page.leakageNotes) pageLines.push(`Leakage notes: ${page.leakageNotes}`);
    if (page.showerType) pageLines.push(`Shower type: ${optionLabel(page.showerType, CHECKLIST_OPTIONS.showerType)}`);
    if (page.wallHeight) pageLines.push(`Wall height: ${optionLabel(page.wallHeight, CHECKLIST_OPTIONS.wallHeight)}`);
    if (page.workRequired) pageLines.push(`Work required: ${optionLabel(page.workRequired, CHECKLIST_OPTIONS.workRequired)}`);
    if (page.selectiveAreas?.trim()) pageLines.push(`Selective areas: ${page.selectiveAreas.trim()}`);
    if (page.numberOfWalls) pageLines.push(`Tiled walls: ${page.numberOfWalls}`);
    if (page.tileSize) pageLines.push(`Tile size: ${page.tileSize}`);
    if (page.mosaic) pageLines.push(`Mosaic tiles: ${page.mosaic}`);
    if (page.showerScreen) pageLines.push(`Shower screen: ${page.showerScreen}`);
    if (page.siliconeJoints?.length) pageLines.push(`Silicone joints: ${page.siliconeJoints.map(joint => optionLabel(joint, CHECKLIST_OPTIONS.siliconeJoints)).join(", ")}`);
    if (page.crackedWallTiles) pageLines.push(`Cracked or loose wall tiles: ${page.crackedWallTiles}`);
    if (page.crackedFloorTiles) pageLines.push(`Cracked or loose floor tiles: ${page.crackedFloorTiles}`);
    if (page.tileAction) pageLines.push(`Tile work: ${page.tileAction}`);
    if (page.additionalAreas?.length) pageLines.push(`Additional areas: ${page.additionalAreas.join(", ")}`);
    if (page.additionalNotes?.trim()) pageLines.push(`Additional notes: ${page.additionalNotes.trim()}`);
    if (page.balconyLeakage) pageLines.push(`Balcony leakage: ${page.balconyLeakage}`);
    if (page.balconyArea) pageLines.push(`Balcony area: ${page.balconyArea} sq m`);
    if (page.balconyTileSize) pageLines.push(`Balcony tile size: ${page.balconyTileSize}`);
    if (page.photoCategory) pageLines.push(`Selected photo category: ${page.photoCategoryLabel || page.photoCategory}`);
    if (page.photos?.length) {
      pageLines.push(`Photos: ${page.photos.length}`);
      const categories = [...new Set(page.photos.map(photo => photo.category).filter(Boolean))];
      if (categories.length) pageLines.push(`Photo categories: ${categories.join(", ")}`);
    }
    lines.push([heading, ...pageLines.map(line => `- ${line}`)].join("\n"));
  });
  if (answers.timeframe) lines.push(`Preferred timeframe: ${answers.timeframe}`);
  if (answers.propertyType) lines.push(`Property type: ${answers.propertyType}`);
  if (answers.accessNotes) lines.push(`Access / parking: ${answers.accessNotes}`);
  if (answers.additionalInformation) lines.push(`Additional information: ${answers.additionalInformation}`);
  return lines.join("\n\n");
}
