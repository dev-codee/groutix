import { NextRequest } from "next/server";
import { teamEarningsApi } from "@/lib/teamEarningsApi";
import { earningsExpenses, mutateTeamEarningsExpense } from "@/lib/teamEarningsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export function GET(req: NextRequest, ctx: Context) {
  return teamEarningsApi(req, async () => earningsExpenses((await ctx.params).id));
}

export function POST(req: NextRequest, ctx: Context) {
  return teamEarningsApi(req, async actor => mutateTeamEarningsExpense((await ctx.params).id, await req.json(), actor));
}
