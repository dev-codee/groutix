import { createHash } from "node:crypto";
import { type ClientSession, type Collection } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";
import { MaterialError, materialBody, materialRequestId, materialVersion, movementBalance, parseMaterial, parseMovement, scaledNumber, type Material, type MaterialFields, type MaterialMovement } from "@/lib/materials";

type MaterialDoc = Omit<Material, "id" | "quantity" | "reorderLevel" | "unitCost"> & {
  _id: string; quantityMilli: number; reorderMilli: number; costCents: number; creationHash: string;
};
type MovementDoc = Omit<MaterialMovement, "id" | "quantity" | "balance"> & {
  _id: string; materialId: string; deltaMilli: number; balanceMilli: number; sequence: number; requestHash: string;
};

let indexes: Promise<unknown> | undefined;
async function collections() {
  const db = await getDb();
  const items = db.collection<MaterialDoc>("materials");
  const movements = db.collection<MovementDoc>("material_movements");
  if (!indexes) indexes = Promise.all([
    items.createIndex({ sku: 1 }, { unique: true }),
    movements.createIndex({ materialId: 1, sequence: -1 }),
  ]).catch(error => { indexes = undefined; throw error; });
  await indexes;
  return { items, movements };
}
function serialize(doc: MaterialDoc): Material {
  const { _id, quantityMilli, reorderMilli, costCents, creationHash: _creationHash, ...rest } = doc;
  return { ...rest, id: _id, quantity: quantityMilli / 1000, reorderLevel: reorderMilli / 1000, unitCost: costCents / 100 };
}
function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function storedFields(fields: MaterialFields) {
  const { reorderLevel, unitCost, ...rest } = fields;
  return { ...rest, reorderMilli: Math.round(reorderLevel * 1000), costCents: Math.round(unitCost * 100) };
}
async function findItem(items: Collection<MaterialDoc>, id: string, session?: ClientSession) {
  const item = await items.findOne({ _id: materialRequestId(id) }, { session });
  if (!item) throw new MaterialError("Material not found.", 404);
  return item;
}
function checkVersion(item: MaterialDoc, version: number) {
  if (item.version !== version) throw new MaterialError("This item changed since you opened it. Close this form and refresh before trying again.", 409);
}
async function transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    return (await session.withTransaction(() => work(session))) as T;
  } finally { await session.endSession(); }
}
export async function listMaterials() {
  const { items } = await collections();
  return (await items.find({}).sort({ archived: 1, name: 1, _id: 1 }).toArray()).map(serialize);
}
export async function createMaterial(value: unknown, actor: string) {
  const body = materialBody(value);
  const id = materialRequestId(body.requestId);
  const fields = storedFields(parseMaterial(body));
  const quantityMilli = scaledNumber(body.openingQuantity, "Opening stock");
  const creationHash = fingerprint({ fields, quantityMilli });
  const { items, movements } = await collections();
  return transaction(async session => {
    // The browser retains the request ID on a retry after a lost response.
    const existing = await items.findOne({ _id: id }, { session });
    if (existing) {
      if (existing.creationHash !== creationHash) throw new MaterialError("This request ID was already used for different material details.", 409);
      return serialize(existing);
    }
    const now = new Date().toISOString();
    const item: MaterialDoc = { ...fields, _id: id, quantityMilli, creationHash, archived: false, version: 1, createdAt: now, updatedAt: now };
    await items.insertOne(item, { session });
    await movements.insertOne({ _id: `${id}:opening`, materialId: id, type: "opening", sequence: 1, requestHash: creationHash, deltaMilli: quantityMilli, balanceMilli: quantityMilli, reason: "Opening balance", reference: "", actor, createdAt: now }, { session });
    return serialize(item);
  });
}
export async function editMaterial(id: string, value: unknown) {
  id = materialRequestId(id);
  const body = materialBody(value);
  const version = materialVersion(body.version);
  const { items } = await collections();
  const item = await findItem(items, id);
  checkVersion(item, version);
  let changes: Partial<MaterialDoc>;
  if (body.action === "archive" || body.action === "restore") {
    if (body.action === "archive" && item.quantityMilli !== 0) throw new MaterialError("Use or correct the remaining stock to zero before archiving.", 409);
    changes = { archived: body.action === "archive" };
  } else if (body.action === "edit") {
    if (item.archived) throw new MaterialError("Restore this material before editing it.", 409);
    const fields = parseMaterial(body);
    if (fields.unit !== item.unit) throw new MaterialError("Stock units cannot change after creation. Create a separate item for another unit.");
    changes = storedFields(fields);
  } else { throw new MaterialError("Invalid material action."); }
  const updated = await items.findOneAndUpdate({ _id: id, version }, { $set: { ...changes, updatedAt: new Date().toISOString() }, $inc: { version: 1 } }, { returnDocument: "after" });
  if (!updated) throw new MaterialError("This item changed. Refresh before trying again.", 409);
  return serialize(updated);
}
export async function recordMaterialMovement(id: string, value: unknown, actor: string) {
  id = materialRequestId(id);
  const movement = parseMovement(value);
  const requestHash = fingerprint(movement);
  const { items, movements } = await collections();
  return transaction(async session => {
    const movementId = `${id}:${movement.requestId}`;
    const existing = await movements.findOne({ _id: movementId }, { session });
    const item = await findItem(items, id, session);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new MaterialError("This request ID was already used for a different stock movement.", 409);
      return serialize(item);
    }
    checkVersion(item, movement.version);
    if (item.archived) throw new MaterialError("Restore this material before changing stock.", 409);
    const { balance, delta } = movementBalance(item.quantityMilli, movement.type, movement.amount);
    const now = new Date().toISOString();
    const result = await items.updateOne({ _id: id, version: item.version }, { $set: { quantityMilli: balance, updatedAt: now }, $inc: { version: 1 } }, { session });
    if (!result.matchedCount) throw new MaterialError("This item changed. Refresh before trying again.", 409);
    await movements.insertOne({ _id: movementId, materialId: id, type: movement.type, sequence: item.version + 1, requestHash, deltaMilli: delta, balanceMilli: balance, reason: movement.reason, reference: movement.reference, actor, createdAt: now }, { session });
    return serialize({ ...item, quantityMilli: balance, version: item.version + 1, updatedAt: now });
  });
}
export async function materialHistory(id: string, page: number) {
  id = materialRequestId(id);
  const { items, movements } = await collections();
  const item = await findItem(items, id);
  const docs = await movements.find({ materialId: id }).sort({ sequence: -1 }).skip((page - 1) * 25).limit(26).toArray();
  return { item: serialize(item), hasMore: docs.length > 25, movements: docs.slice(0, 25).map(doc => {
    const { _id, materialId: _materialId, deltaMilli, balanceMilli, sequence: _sequence, requestHash: _requestHash, ...rest } = doc;
    return { ...rest, id: _id, quantity: deltaMilli / 1000, balance: balanceMilli / 1000 };
  }) };
}
