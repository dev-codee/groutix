import { NextRequest, NextResponse } from "next/server";
import { hasPdfHeader } from "@/lib/pdfAttachment";
import { getCloudinaryOriginalDownloadUrl } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") || "photo.jpg";
  const disposition = req.nextUrl.searchParams.get("inline") === "1" && /\.pdf$/i.test(name) ? "inline" : "attachment";

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Support data URLs (e.g. captured camera or uploaded file previews)
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
    const contentType = match[1] || "application/octet-stream";
    const buffer = Buffer.from(match[2], "base64");
    if (/\.pdf$/i.test(name) && !hasPdfHeader(buffer)) return NextResponse.json({ error: "This attachment is not a valid PDF. Recover the original attachment from the customer email." }, { status: 422 });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": /\.pdf$/i.test(name) ? "application/pdf" : contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `${disposition}; filename="${name.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Only allow secure remote URLs
  if (!url.startsWith("https://res.cloudinary.com/") && !url.startsWith("https://")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Cloudinary may block public PDF URLs even though the original was stored.
    // Keep the signed API URL server-side and return the original bytes to staff.
    const signedUrl = /\.pdf$/i.test(name) ? getCloudinaryOriginalDownloadUrl(url) : null;
    const res = await fetch(signedUrl || url, { cache: "no-store", signal: AbortSignal.timeout(25000) });
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();
    if (/\.pdf$/i.test(name) && !hasPdfHeader(new Uint8Array(buffer))) {
      return NextResponse.json({ error: "This PDF was stored as an image. Sync customer emails to recover the original PDF, then download it again." }, { status: 422 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": /\.pdf$/i.test(name) ? "application/pdf" : contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `${disposition}; filename="${name.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
