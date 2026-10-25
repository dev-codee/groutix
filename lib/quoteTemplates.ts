import { ObjectId, type Collection } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { SERVICE_TEMPLATES, type ServiceTemplate } from "@/lib/serviceTemplates";
import { getTemplateCategory } from "@/lib/serviceMatching";

export interface CustomQuoteTemplateDoc {
  _id?: ObjectId;
  no: string;
  code: string;
  service: string;
  scope: string;
  description?: string;
  price: number;
  category?: string;
  isCustom: boolean;
  replacesNo?: string;
  isLibraryCopy?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteTemplateJSON = ServiceTemplate & {
  id?: string;
  category?: string;
  isCustom?: boolean;
  createdAt?: string;
  replacesNo?: string;
  isLibraryCopy?: boolean;
};

// In-memory fallback if MongoDB is not configured or in development
let memoryCustomTemplates: QuoteTemplateJSON[] = [];

async function collection(): Promise<Collection<CustomQuoteTemplateDoc>> {
  const db = await getDb();
  return db.collection<CustomQuoteTemplateDoc>("quote_templates");
}

export function toQuoteTemplateJSON(doc: CustomQuoteTemplateDoc): QuoteTemplateJSON {
  return {
    id: doc._id ? doc._id.toString() : doc.no,
    no: doc.no,
    code: doc.code,
    service: doc.service,
    scope: doc.scope,
    description: doc.description || doc.service,
    price: Number(doc.price) || 0,
    category: doc.category || "Custom",
    isCustom: !doc.replacesNo,
    replacesNo: doc.replacesNo,
    isLibraryCopy: doc.isLibraryCopy,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || ""),
  };
}

/**
 * List all saved custom templates from the database.
 */
export async function listCustomQuoteTemplates(): Promise<QuoteTemplateJSON[]> {
  if (!isMongoConfigured()) {
    return memoryCustomTemplates;
  }
  try {
    const col = await collection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(toQuoteTemplateJSON);
  } catch (err) {
    console.error("Failed to list custom quote templates from DB, using fallback:", err);
    return memoryCustomTemplates;
  }
}

/**
 * Get all quote templates (Standard built-in templates + Saved custom templates).
 */
export async function getAllQuoteTemplates(): Promise<QuoteTemplateJSON[]> {
  const custom = await listCustomQuoteTemplates();
  const standard: QuoteTemplateJSON[] = SERVICE_TEMPLATES.map((t) => ({
    ...t,
    ...custom.find(item => item.replacesNo === t.no && item.code === t.code),
    isCustom: false,
  }));
  // The revised catalog owns its item codes, including codes saved as custom
  // templates under the previous catalog. Do not offer a stale duplicate scope.
  const standardCodes = new Set(standard.map((template) => template.code.toUpperCase()));
  // Retired built-in codes must not reappear through old saved copies.
  for (const code of ["MB", "MB SINGLE SHOWER WALLS & FLOOR", "MB SHOWER WALLS-FLOOR", "CT - GROUTIX TO SUPPLY & INSTA"]) {
    standardCodes.add(code);
  }
  return [...custom.filter((template) => !template.replacesNo && (template.isLibraryCopy || !standardCodes.has(template.code.toUpperCase()))), ...standard];
}

/**
 * Save (create or update) a custom template in the database.
 */
export async function saveCustomQuoteTemplate(data: {
  id?: string;
  no?: string;
  code: string;
  service: string;
  scope: string;
  price: number;
  category?: string;
  description?: string;
  isLibraryCopy?: boolean;
}): Promise<QuoteTemplateJSON> {
  const now = new Date();
  const code = (data.code || "CUSTOM").trim().toUpperCase();
  const service = (data.service || "Custom Service Item").trim();
  const scope = (data.scope || "").trim();
  const price = Math.max(0, Number(data.price) || 0);
  const category = (data.category || "Custom").trim();
  const description = data.description || service;

  if (isMongoConfigured()) {
    try {
      const col = await collection();

      if (data.id && ObjectId.isValid(data.id)) {
        const objId = new ObjectId(data.id);
        await col.updateOne(
          { _id: objId },
          {
            $set: {
              code,
              service,
              scope,
              price,
              category,
              description,
              updatedAt: now,
            },
          }
        );
        const updated = await col.findOne({ _id: objId });
        if (updated) return toQuoteTemplateJSON(updated);
      }

      // Generate a clean template number if none provided
      const totalCount = await col.countDocuments({});
      const templateNo = data.no || `CUST-${String(totalCount + 1).padStart(3, "0")}`;

      const doc: CustomQuoteTemplateDoc = {
        no: templateNo,
        code,
        service,
        scope,
        description,
        price,
        category,
        isCustom: true,
        isLibraryCopy: data.isLibraryCopy,
        createdAt: now,
        updatedAt: now,
      };

      const res = await col.insertOne(doc);
      doc._id = res.insertedId;
      return toQuoteTemplateJSON(doc);
    } catch (err) {
      console.error("Failed to save custom quote template to DB, saving in-memory:", err);
    }
  }

  // Fallback in-memory
  const templateNo = data.no || `CUST-${String(memoryCustomTemplates.length + 1).padStart(3, "0")}`;
  const newItem: QuoteTemplateJSON = {
    id: data.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    no: templateNo,
    code,
    service,
    scope,
    description,
    price,
    category,
    isCustom: true,
    isLibraryCopy: data.isLibraryCopy,
    createdAt: now.toISOString(),
  };

  const existingIdx = memoryCustomTemplates.findIndex(
    (t) => t.id === newItem.id || t.no === newItem.no
  );
  if (existingIdx >= 0) {
    memoryCustomTemplates[existingIdx] = newItem;
  } else {
    memoryCustomTemplates.unshift(newItem);
  }

  return newItem;
}

/** Explicitly replace one selected row; a repeated item code never identifies a row alone. */
export async function replaceQuoteTemplate(data: {
  targetNo: string;
  targetCode: string;
  service: string;
  scope: string;
  price: number;
}): Promise<QuoteTemplateJSON | null> {
  const standard = SERVICE_TEMPLATES.find(item => item.no === data.targetNo && item.code === data.targetCode);
  const now = new Date();
  const col = isMongoConfigured() ? await collection() : null;
  const previous = col
    ? await col.findOne(standard ? { replacesNo: standard.no } : { no: data.targetNo, code: data.targetCode, replacesNo: { $exists: false } })
    : memoryCustomTemplates.find(item => standard ? item.replacesNo === standard.no : item.no === data.targetNo && item.code === data.targetCode && !item.replacesNo);
  if (!standard && !previous) return null;
  const updated = {
    no: data.targetNo,
    code: data.targetCode,
    service: data.service.trim(),
    scope: data.scope.trim(),
    description: `${data.service.trim()}\n${data.scope.trim()}`.trim(),
    price: data.price,
    category: previous?.category || (standard ? getTemplateCategory(standard) : "Custom"),
    isCustom: true,
    ...(standard ? { replacesNo: standard.no } : {}),
    ...(!standard ? { isLibraryCopy: true } : {}),
    updatedAt: now,
  };
  if (col) {
    const filter = standard ? { replacesNo: standard.no } : { _id: (previous as CustomQuoteTemplateDoc)._id };
    await col.updateOne(filter, { $set: updated, $setOnInsert: { createdAt: now } }, { upsert: Boolean(standard) });
    const saved = await col.findOne(filter);
    if (!saved) throw new Error("Library item could not be saved.");
    return toQuoteTemplateJSON(saved);
  }
  const saved: QuoteTemplateJSON = {
    ...updated,
    id: previous && "id" in previous ? previous.id : `override-${data.targetNo}`,
    createdAt: previous?.createdAt ? String(previous.createdAt) : now.toISOString(),
    isCustom: !standard,
  };
  const index = memoryCustomTemplates.findIndex(item => standard ? item.replacesNo === standard.no : item.no === data.targetNo && item.code === data.targetCode);
  if (index >= 0) memoryCustomTemplates[index] = saved;
  else memoryCustomTemplates.push(saved);
  return saved;
}

/**
 * Delete a custom template from the database.
 */
export async function deleteCustomQuoteTemplate(idOrNo: string): Promise<boolean> {
  if (!idOrNo) return false;

  if (isMongoConfigured()) {
    try {
      const col = await collection();
      if (ObjectId.isValid(idOrNo)) {
        const res = await col.deleteOne({ _id: new ObjectId(idOrNo) });
        if (res.deletedCount > 0) return true;
      }
      const resByNo = await col.deleteOne({ no: idOrNo });
      if (resByNo.deletedCount > 0) return true;
    } catch (err) {
      console.error("Failed to delete custom quote template from DB:", err);
    }
  }

  // Memory fallback
  const beforeLen = memoryCustomTemplates.length;
  memoryCustomTemplates = memoryCustomTemplates.filter(
    (t) => t.id !== idOrNo && t.no !== idOrNo
  );
  return memoryCustomTemplates.length < beforeLen;
}
