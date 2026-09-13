import { NextResponse } from "next/server";
import { getSiteSettings, getLogoPublicUrl } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getSiteSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.groutix.com";
  return NextResponse.json({
    logoUrl: `${base}${getLogoPublicUrl(settings)}`,
    logoFile: settings.logoFile || "new_logo.jpeg",
    logoVersion: settings.logoVersion || 0,
  });
}
