import { NextRequest } from "next/server";
import { materialsApi } from "@/lib/materialsApi";
import { MaterialError } from "@/lib/materials";
import { materialHistory, recordMaterialMovement } from "@/lib/materialsServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export function GET(req: NextRequest, ctx: Context) {
  return materialsApi(req, async () => {
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new MaterialError("Invalid history page.");
    return materialHistory((await ctx.params).id, page);
  });
}
export function POST(req: NextRequest, ctx: Context) {
  return materialsApi(req, async actor => ({ item: await recordMaterialMovement((await ctx.params).id, await req.json(), actor) }));
}
