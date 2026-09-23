// Server-only loading/saving of editable site content.
//
// Overrides live in a single MongoDB document (collection "content",
// _id: "site"). getSiteContent() is wrapped in the Next Data Cache and tagged,
// so pages stay statically generated and simply revalidate when an admin saves.

import "server-only";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import {
  DEFAULT_CONTENT,
  mergeContent,
  type SiteContent,
  type SiteContentOverrides,
} from "@/lib/siteContent";

const CONTENT_TAG = "site-content";
const DOC_ID = "site";

async function readOverrides(): Promise<SiteContentOverrides | null> {
  if (!isMongoConfigured()) return null;
  try {
    const db = await getDb();
    const doc = await db
      .collection<{ _id: string; overrides?: SiteContentOverrides }>("content")
      .findOne({ _id: DOC_ID });
    return doc?.overrides ?? null;
  } catch (err) {
    console.error("readOverrides failed (falling back to defaults):", err);
    return null;
  }
}

// Cached, tagged loader. Revalidated on-demand from saveSiteContent().
const loadMerged = unstable_cache(
  async (): Promise<SiteContent> => mergeContent(await readOverrides()),
  ["site-content-merged"],
  { tags: [CONTENT_TAG] }
);

/** Merged site content (defaults + stored overrides). Never throws. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    return await loadMerged();
  } catch (err) {
    console.error("getSiteContent failed (using defaults):", err);
    return DEFAULT_CONTENT;
  }
}

/** Raw stored overrides for the admin editor (so it can show what was saved). */
export async function getSiteContentOverrides(): Promise<SiteContentOverrides | null> {
  return readOverrides();
}

/** Upsert overrides and revalidate every page that renders site content. */
export async function saveSiteContent(overrides: SiteContentOverrides): Promise<void> {
  const db = await getDb();
  await db
    .collection<{ _id: string; overrides: SiteContentOverrides; updatedAt: Date }>("content")
    .updateOne(
      { _id: DOC_ID },
      { $set: { overrides, updatedAt: new Date() } },
      { upsert: true }
    );
  try {
    revalidateTag(CONTENT_TAG, { expire: 0 });
    revalidatePath("/", "layout");
  } catch (e) {
    console.error("Cache revalidation notice:", e);
  }
}
