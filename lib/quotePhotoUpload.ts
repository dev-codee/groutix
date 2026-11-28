import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";
import type { EmailAttachment } from "@/lib/email";
import { quotePhotoCategory } from "@/lib/quotePhotoCategories";
import type { SubmissionPhoto } from "@/lib/submissions";

const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024;

function isCloudinaryPhoto(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function readQuotePhotos(form: FormData, { cloudinaryOnly = false }: { cloudinaryOnly?: boolean } = {}) {
  // Collect optional photo attachments (Brevo wants base64-encoded content).
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  let totalBytes = 0;
  for (const file of photos) {
    totalBytes += file.size;
  }
  if (totalBytes > MAX_ATTACHMENT_BYTES) {
    return null;
  }

  const attachments: EmailAttachment[] = [];
  const submissionPhotos: SubmissionPhoto[] = [];

  // 1) Check for pre-uploaded photos from direct browser Cloudinary upload
  const uploadedPhotosRaw = form.get("uploadedPhotos");
  if (typeof uploadedPhotosRaw === "string" && uploadedPhotosRaw.trim()) {
    try {
      const parsed = JSON.parse(uploadedPhotosRaw);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          const url = typeof p?.secureUrl === "string" ? p.secureUrl : p?.url;
          if (typeof url === "string" && url && (!cloudinaryOnly || isCloudinaryPhoto(url))) {
            submissionPhotos.push({
              name: typeof p.name === "string" && p.name ? p.name : "photo",
              category: quotePhotoCategory(p.category),
              contentType: p.contentType,
              url,
              secureUrl: url,
              publicId: p.publicId,
              width: p.width,
              height: p.height,
              size: p.size,
              added: p.added || new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse uploadedPhotos:", err);
    }
  }

  // 2) Fallback: Process direct multipart file uploads (if direct upload was bypassed)
  const photoCategories = form.getAll("photoCategory");
  for (const [index, file] of photos.entries()) {
    const category = quotePhotoCategory(photoCategories[index]);
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let mime = file.type;
    if (!mime) {
      if (ext === "pdf") mime = "application/pdf";
      else if (ext === "png") mime = "image/png";
      else if (ext === "webp") mime = "image/webp";
      else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
      else mime = "application/octet-stream";
    }

    // Prepare Brevo email attachment
    attachments.push({
      name: file.name || "photo",
      content: buffer.toString("base64"),
      contentType: mime,
    });

    // Upload to Cloudinary if configured
    if (isCloudinaryConfigured()) {
      try {
        const cldRes = await uploadBufferToCloudinary(buffer, {
          folder: "groutix/quotes",
          filename: file.name,
          tags: ["quote_submission"],
        });
        submissionPhotos.push({
          name: file.name || "photo",
          category,
          contentType: mime,
          url: cldRes.secureUrl,
          secureUrl: cldRes.secureUrl,
          publicId: cldRes.publicId,
          width: cldRes.width,
          height: cldRes.height,
          size: cldRes.bytes,
          added: new Date().toISOString(),
        });
      } catch (uploadErr) {
        console.error("Cloudinary upload failed (falling back to dataUrl):", uploadErr);
        submissionPhotos.push({
          name: file.name || "photo",
          category,
          contentType: mime,
          dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
          added: new Date().toISOString(),
        });
      }
    } else {
      submissionPhotos.push({
        name: file.name || "photo",
        category,
        contentType: mime,
        dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
        added: new Date().toISOString(),
      });
    }
  }

  return { attachments, submissionPhotos };
}
