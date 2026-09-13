import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/adminAuth";
import { updateSiteSettings } from "@/lib/settings";
import { writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "manager" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const rawExt = (file.name.split(".").pop() || "jpeg").toLowerCase();
  if (!["jpg", "jpeg", "png"].includes(rawExt)) {
    return NextResponse.json({ error: "Only JPEG or PNG files are allowed." }, { status: 400 });
  }
  const ext = rawExt === "jpg" ? "jpeg" : rawExt;
  const fileName = `site_logo.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(process.cwd(), "public", fileName);
  await writeFile(filePath, buffer);

  const version = Date.now();
  await updateSiteSettings({ logoFile: fileName, logoVersion: version });

  return NextResponse.json({ ok: true, logoFile: fileName, logoVersion: version });
}
