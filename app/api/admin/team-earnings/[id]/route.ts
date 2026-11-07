import { NextRequest } from "next/server";
import { teamEarningsApi } from "@/lib/teamEarningsApi";
import { earningsInteger } from "@/lib/teamEarnings";
import { earningsHistory, mutateTeamEarnings } from "@/lib/teamEarningsServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(req: NextRequest, ctx: Context) {
  return teamEarningsApi(req, async () => earningsHistory((await ctx.params).id, earningsInteger(Number(req.nextUrl.searchParams.get("page") || 1), "page", 1, 100000)));
}
export function POST(req: NextRequest, ctx: Context) {
  return teamEarningsApi(req, async actor => ({ ledger: await mutateTeamEarnings((await ctx.params).id, await req.json(), actor) }));
}
