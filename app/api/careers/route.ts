import { NextRequest, NextResponse } from "next/server";
import { Binary } from "mongodb";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/mongodb";
import { validateCareerInput } from "@/lib/careers";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(`careers:${ip}`, 5, 15 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
  if (Number(req.headers.get("content-length")) > 4 * 1024 * 1024) return NextResponse.json({ error: "Application is too large. Keep your PDF under 3 MB." }, { status: 413 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form." }, { status: 400 }); }
  if (form.get("website")) return NextResponse.json({ error: "Unable to accept this application." }, { status: 400 });
  let input;
  let resume: { resumeName: string; resumeData: Binary } | undefined;
  try {
    input = validateCareerInput(JSON.parse(String(form.get("application") || "{}")));
    const file = form.get("resume");
    if (file instanceof File && file.size) {
      if (file.size > 3 * 1024 * 1024 || file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) throw new Error("Please upload a PDF résumé under 3 MB.");
      const bytes = Buffer.from(await file.arrayBuffer());
      if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("The résumé must be a valid PDF.");
      resume = { resumeName: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(-120), resumeData: new Binary(bytes) };
    }
  } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Please check your application." }, { status: 400 }); }
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    try {
      const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret, response: String(form.get("cf-turnstile-response") || ""), remoteip: ip }), signal: AbortSignal.timeout(10000) });
      const result = await check.json();
      if (!result.success) return NextResponse.json({ error: "Please complete the security check again." }, { status: 400 });
    } catch { return NextResponse.json({ error: "Security check unavailable. Please try again." }, { status: 503 }); }
  }
  try {
    const db = await getDb();
    const id = randomUUID();
    await db.collection("careerApplications").insertOne({ ...input, ...resume, id, status: "new", notes: "", createdAt: new Date().toISOString(), consentVersion: "careers-v1" });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Career application storage failed", err instanceof Error ? err.name : "Unknown error");
    return NextResponse.json({ error: "We couldn't save your application. Please try again. Your application has not been submitted." }, { status: 503 });
  }
}
