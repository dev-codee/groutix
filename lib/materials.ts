// Shared inventory rules. Quantities are stored as integer thousandths and costs
// as cents so repeated fractional movements do not accumulate rounding errors.
export const MATERIAL_UNITS = ["piece", "tube", "bag", "box", "roll", "kg", "litre", "metre", "m²"] as const;
export type MaterialUnit = typeof MATERIAL_UNITS[number];
export type MovementType = "opening" | "receive" | "use" | "return" | "adjust";
export interface MaterialFields {
  name: string;
  sku: string;
  category: string;
  unit: MaterialUnit;
  location: string;
  supplier: string;
  notes: string;
  reorderLevel: number;
  unitCost: number;
}
export interface Material extends MaterialFields {
  id: string;
  quantity: number;
  archived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface MaterialMovement {
  id: string;
  type: MovementType;
  quantity: number;
  balance: number;
  reason: string;
  reference: string;
  actor: string;
  createdAt: string;
}
export class MaterialError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function materialBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MaterialError("Invalid request.");
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) {
    throw new MaterialError(`${label} ${required ? "is required and " : ""}must be text up to ${max} characters.`);
  }
  return value.trim();
}
export function scaledNumber(value: unknown, label: string, scale = 1000): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000 || Math.abs(value * scale - Math.round(value * scale)) > 0.0001) {
    throw new MaterialError(`${label} must be between 0 and 1,000,000,000 with at most ${scale === 100 ? "2" : "3"} decimal places.`);
  }
  return Math.round(value * scale);
}
export function parseMaterial(value: unknown): MaterialFields {
  const b = materialBody(value);
  const sku = text(b.sku, "SKU", 64, true).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(sku)) throw new MaterialError("SKU must use letters, numbers, dots, slashes, underscores or hyphens.");
  if (!MATERIAL_UNITS.includes(b.unit as MaterialUnit)) throw new MaterialError("Choose a valid stock unit.");
  return {
    name: text(b.name, "Name", 160, true), sku, unit: b.unit as MaterialUnit,
    category: text(b.category, "Category", 80), location: text(b.location, "Location", 120),
    supplier: text(b.supplier, "Supplier", 160), notes: text(b.notes, "Notes", 2000),
    reorderLevel: scaledNumber(b.reorderLevel, "Reorder level") / 1000,
    unitCost: scaledNumber(b.unitCost, "Unit cost", 100) / 100,
  };
}
export function materialVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new MaterialError("A valid item version is required.");
  return value;
}
export function materialRequestId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new MaterialError("A valid request ID is required.");
  return value.toLowerCase();
}
export function parseMovement(value: unknown) {
  const b = materialBody(value);
  if (!["receive", "use", "return", "adjust"].includes(b.type as string)) throw new MaterialError("Choose a valid stock movement.");
  const amount = scaledNumber(b.quantity, b.type === "adjust" ? "Counted stock" : "Quantity");
  if (b.type !== "adjust" && !amount) throw new MaterialError("Quantity must be greater than zero.");
  return { type: b.type as Exclude<MovementType, "opening">, amount,
    reason: text(b.reason, "Reason", 500, true), reference: text(b.reference, "Reference", 160),
    requestId: materialRequestId(b.requestId), version: materialVersion(b.version) };
}
export function movementBalance(current: number, type: Exclude<MovementType, "opening">, amount: number) {
  const balance = type === "adjust" ? amount : current + (type === "use" ? -amount : amount);
  if (balance < 0) throw new MaterialError("Insufficient stock. You cannot use more than the available quantity.", 409);
  if (balance > 1_000_000_000_000) throw new MaterialError("The resulting stock exceeds the supported limit.");
  if (balance === current) throw new MaterialError("Counted stock matches the current balance; no correction is needed.");
  return { balance, delta: balance - current };
}
export function materialStatus(item: Pick<Material, "quantity" | "reorderLevel" | "archived">) {
  if (item.archived) return "Archived";
  if (item.quantity === 0) return "Out of stock";
  return item.quantity <= item.reorderLevel ? "Low stock" : "In stock";
}
