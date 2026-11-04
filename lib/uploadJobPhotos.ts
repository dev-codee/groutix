import type { Lead } from "@/components/admin/types";
import { MAX_FILE_SIZE_BYTES, formatBytes } from "@/lib/imageCompression";

/** Upload separately to avoid hosting request limits and retain partial successes. */
export async function uploadJobPhotos(leadId: string, files: File[], onSaved: (photos: NonNullable<Lead["photos"]>) => void): Promise<string[]> {
  const endpoint = `/api/admin/submissions/${encodeURIComponent(leadId)}/photos`;
  const configResponse = await fetch(endpoint, { cache: "no-store" });
  const config = await configResponse.json();
  if (!configResponse.ok) throw new Error(config.error || "Could not start photo upload.");
  const failures: string[] = [];
  for (const file of files) {
    try {
      if (file.size > MAX_FILE_SIZE_BYTES) throw new Error(`Maximum photo size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
      let response: Response;
      if (config.direct) {
        const form = new FormData();
        form.append("file", file);
        for (const [key, value] of Object.entries(config.uploadParams)) form.append(key, String(value));
        form.append("api_key", config.apiKey);
        form.append("signature", config.signature);
        const upload = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: form });
        const asset = await upload.json();
        if (!upload.ok) throw new Error(asset.error?.message || "Cloud upload failed.");
        response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: asset.public_id, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" }) });
      } else {
        // Small installations without Cloudinary still support multiple photos.
        if (/\.hei[cf]$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type)) throw new Error("HEIC photos require cloud storage to be configured.");
        const form = new FormData();
        form.append("photos", file);
        response = await fetch(endpoint, { method: "POST", body: form });
      }
      const saved = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(saved?.photos)) throw new Error(saved?.error || "Could not save photo. Please retry.");
      onSaved(saved.photos);
    } catch (error) {
      failures.push(`${file.name}: ${error instanceof Error ? error.message : "Upload failed. Please retry."}`);
    }
  }
  return failures;
}
