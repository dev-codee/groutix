import { NextRequest } from "next/server";
import { teamEarningsApi } from "@/lib/teamEarningsApi";
import { getTeamEarningsSettings, saveTeamEarningsSettings } from "@/lib/teamEarningsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return teamEarningsApi(req, async () => getTeamEarningsSettings());
}

export function POST(req: NextRequest) {
  return teamEarningsApi(req, async actor => saveTeamEarningsSettings(await req.json(), actor));
}
