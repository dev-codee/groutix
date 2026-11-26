import { NextRequest } from "next/server";
import { teamEarningsApi } from "@/lib/teamEarningsApi";
import { recordMemberEarningsPayment } from "@/lib/teamEarningsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return teamEarningsApi(req, async actor => recordMemberEarningsPayment(await req.json(), actor));
}
