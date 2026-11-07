import { NextRequest } from "next/server";
import { materialsApi } from "@/lib/materialsApi";
import { editMaterial } from "@/lib/materialsServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return materialsApi(req, async () => ({ item: await editMaterial((await ctx.params).id, await req.json()) }));
}
