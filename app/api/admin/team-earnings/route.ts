import { NextRequest } from "next/server";
import { teamEarningsApi } from "@/lib/teamEarningsApi";
import { listTeamEarnings } from "@/lib/teamEarningsServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) { return teamEarningsApi(req, async () => listTeamEarnings()); }
