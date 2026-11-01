import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import { hasPdfHeader } from "./pdfAttachment";

let isConfigured = false;

export function getCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!isConfigured && cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
    isConfigured = true;
  }
  return cloudinary;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/** Fetch originals through the signed API when public PDF delivery is blocked. */
export function getCloudinaryOriginalDownloadUrl(value: string): string | null {
  if (!isCloudinaryConfigured()) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.port) return null;
  const match = url.pathname.match(/^\/([^/]+)\/(raw|image)\/(upload|private|authenticated)\/(?:v\d+\/)?(.+)$/);
  if (!match || match[1] !== process.env.CLOUDINARY_CLOUD_NAME) return null;
  const [, , resourceType, type, encodedId] = match;
  let publicId: string;
  try { publicId = decodeURIComponent(encodedId); } catch { return null; }
  // Only original PDF URLs are supported; never sign arbitrary transformations.
  if (!/\.pdf$/i.test(publicId)) return null;
  return getCloudinary().utils.private_download_url(
    resourceType === "raw" ? publicId : publicId.replace(/\.pdf$/i, ""),
    resourceType === "raw" ? "" : "pdf",
    { resource_type: resourceType as "raw" | "image", type: type as "upload" | "private" | "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60, attachment: true },
  );
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  originalFilename?: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  const cld = getCloudinary();
  const folder = options.folder || "groutix/submissions";
  const isPdf = /\.pdf$/i.test(options.filename || "") || hasPdfHeader(buffer);
  if (isPdf && !hasPdfHeader(buffer)) throw new Error("The uploaded PDF does not contain a PDF document.");

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? "raw" : "auto",
        tags: options.tags,
        use_filename: true,
        unique_filename: true,
        ...(isPdf
          ? { public_id: `${randomUUID()}.pdf` }
          : { quality: "auto", fetch_format: "auto" }),
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload failed with no result"));
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          originalFilename: options.filename || result.original_filename,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) return false;
  try {
    const cld = getCloudinary();
    const res = await cld.uploader.destroy(publicId);
    return res.result === "ok" || res.result === "not found";
  } catch (err) {
    console.error("deleteFromCloudinary error:", err);
    return false;
  }
}

export function getOptimizedImageUrl(
  urlOrPublicId: string,
  transformations: { width?: number; height?: number; crop?: string; quality?: string | number } = {}
): string {
  if (!urlOrPublicId) return "";
  // If it's a dataUrl (base64) or regular non-cloudinary url, return as is
  if (urlOrPublicId.startsWith("data:") || !urlOrPublicId.includes("res.cloudinary.com")) {
    return urlOrPublicId;
  }

  const { width = 400, height = 400, crop = "fill", quality = "auto" } = transformations;
  const parts = [`c_${crop}`, `q_${quality}`, `f_auto`];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);

  const transformString = parts.join(",");

  // Insert transformation after /upload/ in the cloudinary URL
  return urlOrPublicId.replace("/upload/", `/upload/${transformString}/`);
}
