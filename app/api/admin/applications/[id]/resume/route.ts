import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyRequestSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "super_admin"].includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const record = await (await getDb()).collection("careerApplications").findOne({ id }, { projection: { resumeData: 1, resumeName: 1 } });
    if (!record?.resumeData) return NextResponse.json({ error: "Résumé not found." }, { status: 404 });
    return new NextResponse(new Uint8Array(record.resumeData.buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${encodeURIComponent(record.resumeName || "resume.pdf")}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Could not load résumé." }, { status: 503 }); }
}
