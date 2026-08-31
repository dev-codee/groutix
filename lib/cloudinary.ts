import { v2 as cloudinary } from "cloudinary";

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

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        tags: options.tags,
        use_filename: true,
        unique_filename: true,
        quality: "auto",
        fetch_format: "auto",
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
