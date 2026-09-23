import { getDb } from "./mongodb";
import path from "path";

export interface SiteSettings {
  logoFile?: string;
  logoVersion?: number;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ _id: "site" as any });
    return (doc as any) || {};
  } catch {
    return {};
  }
}

export async function updateSiteSettings(updates: Partial<SiteSettings>) {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "site" as any },
    { $set: updates },
    { upsert: true }
  );
}

export function getLogoPublicUrl(settings: SiteSettings): string {
  const file = settings.logoFile || "new_logo.jpeg";
  const v = settings.logoVersion;
  return `/${file}${v ? `?v=${v}` : ""}`;
}

export function getLogoFilePath(settings: SiteSettings): string {
  const file = settings.logoFile || "new_logo.jpeg";
  return path.join(process.cwd(), "public", file);
}

export function isLogoPng(settings: SiteSettings): boolean {
  return (settings.logoFile || "").toLowerCase().endsWith(".png");
}
