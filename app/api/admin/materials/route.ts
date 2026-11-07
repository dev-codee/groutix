import { NextRequest } from "next/server";
import { materialsApi } from "@/lib/materialsApi";
import { createMaterial, listMaterials } from "@/lib/materialsServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return materialsApi(req, async () => ({ items: await listMaterials() }));
}
export function POST(req: NextRequest) {
  return materialsApi(req, async actor => ({ item: await createMaterial(await req.json(), actor) }));
}
