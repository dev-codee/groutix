import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/emailTemplates";

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
    return docs.map((d) => ({
      id: d.id,
      category: d.category as any,
      name: d.name,
      description: d.description || "",
      subject: d.subject,
      body: d.body,
    }));
  } catch (err) {
    console.error("listDbTemplates failed, falling back to defaults:", err);
    return EMAIL_TEMPLATES;
  }
}

export async function saveDbTemplate(template: EmailTemplate): Promise<EmailTemplate> {
  if (!isMongoConfigured()) {
    return template;
  }
  const db = await getDb();
  const col = db.collection<EmailTemplateDoc>(COLLECTION_NAME);
  const now = new Date().toISOString();
  await col.updateOne(
    { id: template.id },
    {
      $set: {
        category: template.category,
        name: template.name,
        description: template.description || "",
        subject: template.subject,
        body: template.body,
        updatedAt: now,
      },
      $setOnInsert: {
        id: template.id,
        isCustom: true,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  return template;
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
