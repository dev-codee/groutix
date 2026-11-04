import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSubmission, updateSubmission, appendSubmissionPhotos, appendActivity, type SubmissionPhoto } from "@/lib/submissions";
import { verifyRequestSession } from "@/lib/adminAuth";
import {
  getCloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Only authenticated staff can request a signature for this customer's photo folder.
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!await verifyRequestSession(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { id } = await params;
  if (!await getSubmission(id)) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!isCloudinaryConfigured()) return NextResponse.json({ direct: false });
  const uploadParams = { timestamp: Math.floor(Date.now() / 1000), folder: `groutix/leads/${id}`, format: "jpg" };
  return NextResponse.json({ direct: true, cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY, uploadParams,
    signature: getCloudinary().utils.api_sign_request(uploadParams, process.env.CLOUDINARY_API_SECRET!),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const newPhotos: SubmissionPhoto[] = [];
  const nowIso = new Date().toISOString();
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await req.json();
      if (typeof body.publicId !== "string" || !body.publicId.startsWith(`groutix/leads/${id}/`) || !isCloudinaryConfigured()) {
        return NextResponse.json({ error: "Invalid uploaded photo." }, { status: 400 });
      }
      // Resolve trusted metadata from Cloudinary; never persist a client-supplied URL.
      const asset = await getCloudinary().api.resource(body.publicId, { resource_type: "image", type: "upload" });
      newPhotos.push({ name: typeof body.name === "string" ? body.name : "photo.jpg", contentType: `image/${asset.format === "jpg" ? "jpeg" : asset.format}`,
        url: asset.secure_url, secureUrl: asset.secure_url, publicId: asset.public_id,
        width: asset.width, height: asset.height, size: asset.bytes, added: nowIso, uploadedBy: session.username || "staff" });
    } catch (error) {
      console.error("Could not verify uploaded photo:", error);
      return NextResponse.json({ error: "Could not verify uploaded photo. Please retry." }, { status: 502 });
    }
  } else {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ error: "No photos provided." }, { status: 400 });
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const isHeic = /^(heic|heif)$/.test(ext) || /^image\/hei[cf]/i.test(file.type);
      if (isHeic && !isCloudinaryConfigured()) return NextResponse.json({ error: "HEIC photos require cloud storage to be configured." }, { status: 503 });
      let mime = file.type;
      if (!mime) {
        if (ext === "png") mime = "image/png";
        else if (ext === "webp") mime = "image/webp";
        else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
        else mime = "application/octet-stream";
      }

      if (isCloudinaryConfigured()) {
        try {
          const cldRes = await uploadBufferToCloudinary(buffer, {
            folder: `groutix/leads/${id}`,
            filename: file.name,
            ...(isHeic ? { format: "jpg" as const } : {}),
            tags: ["admin_upload", `lead_${id}`],
          });
          newPhotos.push({
            name: isHeic ? file.name.replace(/\.[^.]+$/, "") + ".jpg" : file.name || "photo",
            contentType: isHeic ? "image/jpeg" : mime,
            url: cldRes.secureUrl,
            secureUrl: cldRes.secureUrl,
            publicId: cldRes.publicId,
            width: cldRes.width,
            height: cldRes.height,
            size: cldRes.bytes,
            added: nowIso,
            uploadedBy: session.username || "staff",
          });
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          if (isHeic) return NextResponse.json({ error: "Could not convert HEIC photo. Please retry." }, { status: 502 });
          newPhotos.push({
            name: file.name || "photo",
            contentType: mime,
            dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
            added: nowIso,
            uploadedBy: session.username || "staff",
          });
        }
      } else {
        newPhotos.push({
          name: file.name || "photo",
          contentType: mime,
          dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
          added: nowIso,
          uploadedBy: session.username || "staff",
        });
      }
    }
  }

  const updatedPhotos = await appendSubmissionPhotos(id, newPhotos);
  if (!updatedPhotos) {
    return NextResponse.json({ error: "Failed to update photos in database." }, { status: 500 });
  }

  await appendActivity(id, {
    time: nowIso,
    actor: session.username || "staff",
    action: "Added job photos",
    detail: `Uploaded ${newPhotos.length} photo(s)`,
  });

  return NextResponse.json({
    ok: true,
    photos: updatedPhotos,
    addedCount: newPhotos.length,
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const session = await verifyRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  let body: { publicId?: string; index?: number; url?: string } = {};
  try {
    body = await req.json();
  } catch {
    const sp = req.nextUrl.searchParams;
    const publicId = sp.get("publicId");
    const indexStr = sp.get("index");
    if (publicId) body.publicId = publicId;
    if (indexStr !== null) body.index = Number(indexStr);
  }

  const existingPhotos = lead.photos || [];
  let photoToDelete: SubmissionPhoto | undefined;
  let updatedPhotos: SubmissionPhoto[] = [];

  if (body.publicId) {
    photoToDelete = existingPhotos.find((p) => p.publicId === body.publicId);
    updatedPhotos = existingPhotos.filter((p) => p.publicId !== body.publicId);
  } else if (typeof body.index === "number" && body.index >= 0 && body.index < existingPhotos.length) {
    photoToDelete = existingPhotos[body.index];
    updatedPhotos = existingPhotos.filter((_, i) => i !== body.index);
  } else if (body.url) {
    photoToDelete = existingPhotos.find((p) => p.url === body.url || p.secureUrl === body.url || p.dataUrl === body.url);
    updatedPhotos = existingPhotos.filter((p) => p.url !== body.url && p.secureUrl !== body.url && p.dataUrl !== body.url);
  }

  if (!photoToDelete) {
    return NextResponse.json({ error: "Target photo not found." }, { status: 404 });
  }

  // If photo has a Cloudinary publicId, delete asset from Cloudinary
  if (photoToDelete.publicId) {
    try {
      await deleteFromCloudinary(photoToDelete.publicId);
    } catch (err) {
      console.error("Cloudinary delete error (non-fatal):", err);
    }
  }

  const ok = await updateSubmission(id, {
    photos: updatedPhotos,
    photosCount: updatedPhotos.length,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to remove photo from database." }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  await appendActivity(id, {
    time: nowIso,
    actor: session.username || "staff",
    action: "Deleted job photo",
    detail: photoToDelete.name || "Photo",
  });

  return NextResponse.json({
    ok: true,
    photos: updatedPhotos,
  });
}
