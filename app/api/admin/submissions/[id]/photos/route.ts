import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSubmission, updateSubmission, appendActivity, type SubmissionPhoto } from "@/lib/submissions";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await getSubmission(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "No photos provided." }, { status: 400 });
  }

  const newPhotos: SubmissionPhoto[] = [];
  const nowIso = new Date().toISOString();

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "").toLowerCase();
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
          tags: ["admin_upload", `lead_${id}`],
        });
        newPhotos.push({
          name: file.name || "photo",
          contentType: mime,
          url: cldRes.secureUrl,
          secureUrl: cldRes.secureUrl,
          publicId: cldRes.publicId,
          width: cldRes.width,
          height: cldRes.height,
          size: cldRes.bytes,
          added: nowIso,
        });
      } catch (uploadErr) {
        console.error("Cloudinary upload failed (falling back to dataUrl):", uploadErr);
        newPhotos.push({
          name: file.name || "photo",
          contentType: mime,
          dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
          added: nowIso,
        });
      }
    } else {
      newPhotos.push({
        name: file.name || "photo",
        contentType: mime,
        dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
        added: nowIso,
      });
    }
  }

  const existingPhotos = lead.photos || [];
  const updatedPhotos = [...existingPhotos, ...newPhotos];

  const ok = await updateSubmission(id, {
    photos: updatedPhotos,
    photosCount: updatedPhotos.length,
  });

  if (!ok) {
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

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
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
