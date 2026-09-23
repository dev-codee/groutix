import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") || "photo.jpg";

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Support data URLs (e.g. captured camera or uploaded file previews)
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
    const contentType = match[1] || "application/octet-stream";
    const buffer = Buffer.from(match[2], "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Only allow secure remote URLs
  if (!url.startsWith("https://res.cloudinary.com/") && !url.startsWith("https://")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
