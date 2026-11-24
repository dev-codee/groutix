import { getDb, isMongoConfigured } from "./mongodb";
import { DEFAULT_CHECKLIST_FORM, sanitizeChecklistForm, type ChecklistForm } from "./checklistForm";

export async function getChecklistForm(options: { strict?: boolean } = {}): Promise<ChecklistForm> {
  if (!isMongoConfigured() && !options.strict) return DEFAULT_CHECKLIST_FORM;
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ _id: "checklist-form" as never });
    return doc?.form ? sanitizeChecklistForm(doc.form) : DEFAULT_CHECKLIST_FORM;
  } catch (error) {
    if (options.strict) throw error;
    console.error("Could not load checklist form settings:", error);
    return DEFAULT_CHECKLIST_FORM;
  }
}

export async function saveChecklistForm(form: ChecklistForm, username: string): Promise<void> {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "checklist-form" as never },
    { $set: { form: sanitizeChecklistForm(form), updatedAt: new Date().toISOString(), updatedBy: username } },
    { upsert: true }
  );
}
