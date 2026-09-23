import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/emailTemplates";
import { cleanEmailText } from "@/lib/email";

export interface EmailTemplateDoc {
  id: string;
  category: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = "email_templates";

export async function listDbTemplates(): Promise<EmailTemplate[]> {
  if (!isMongoConfigured()) {
    return EMAIL_TEMPLATES;
  }
  try {
    const db = await getDb();
    const col = db.collection<EmailTemplateDoc>(COLLECTION_NAME);
    const count = await col.countDocuments();
    if (count === 0) {
      // Seed default templates
      const docs: EmailTemplateDoc[] = EMAIL_TEMPLATES.map((t) => ({
        ...t,
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await col.insertMany(docs);
      return EMAIL_TEMPLATES;
    }
    const docs = await col.find({}).sort({ createdAt: 1 }).toArray();

    // Automatically sync any seeded templates that still have the old phone/URL/signature
    const defaultMap = new Map(EMAIL_TEMPLATES.map((t) => [t.id, t]));
    for (const doc of docs) {
      if (!doc.isCustom && defaultMap.has(doc.id)) {
        const def = defaultMap.get(doc.id)!;
        if (
          doc.body.includes("1300 476 884") ||
          doc.body.includes("groutix.com.au") ||
          doc.body.includes("| ✉️") ||
          doc.body.includes("(03) 7023 8094")
        ) {
          await col
            .updateOne(
              { id: doc.id },
              { $set: { subject: def.subject, body: def.body, updatedAt: new Date().toISOString() } }
            )
            .catch(() => {});
          doc.subject = def.subject;
          doc.body = def.body;
        }
      }
    }

    return docs.map((d) => ({
      id: d.id,
      category: d.category as any,
      name: d.name,
      description: d.description || "",
      subject: cleanEmailText(d.subject),
      body: cleanEmailText(d.body),
    }));
  } catch (err) {
    console.error("listDbTemplates failed, falling back to defaults:", err);
    return EMAIL_TEMPLATES;
  }
}

export async function saveDbTemplate(template: EmailTemplate): Promise<EmailTemplate> {
  const cleaned: EmailTemplate = {
    ...template,
    subject: cleanEmailText(template.subject),
    body: cleanEmailText(template.body),
  };
  if (!isMongoConfigured()) {
    return cleaned;
  }
  const db = await getDb();
  const col = db.collection<EmailTemplateDoc>(COLLECTION_NAME);
  const now = new Date().toISOString();
  await col.updateOne(
    { id: cleaned.id },
    {
      $set: {
        category: cleaned.category,
        name: cleaned.name,
        description: cleaned.description || "",
        subject: cleaned.subject,
        body: cleaned.body,
        updatedAt: now,
      },
      $setOnInsert: {
        id: cleaned.id,
        isCustom: true,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  return cleaned;
}

export async function deleteDbTemplate(id: string): Promise<boolean> {
  if (!isMongoConfigured()) {
    return true;
  }
  const db = await getDb();
  const col = db.collection<EmailTemplateDoc>(COLLECTION_NAME);
  const res = await col.deleteOne({ id });
  return res.deletedCount > 0;
}

export async function resetDbTemplates(): Promise<EmailTemplate[]> {
  if (!isMongoConfigured()) {
    return EMAIL_TEMPLATES;
  }
  const db = await getDb();
  const col = db.collection<EmailTemplateDoc>(COLLECTION_NAME);
  await col.deleteMany({});
  const docs: EmailTemplateDoc[] = EMAIL_TEMPLATES.map((t) => ({
    ...t,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  await col.insertMany(docs);
  return EMAIL_TEMPLATES;
}
