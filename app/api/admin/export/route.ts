import { NextRequest, NextResponse } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { exportSubmissions, parseListParams, type SubmissionJSON } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Columns included in the CSV export, in order.
const CSV_FIELDS: (keyof SubmissionJSON)[] = [
  "createdAt",
  "type",
  "status",
  "customerType",
  "agency",
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "tenants",
  "areas",
  "service",
  "enquiry",
  "damagedTiles",
  "leaking",
  "heard",
  "message",
  "issue",
  "sourcePage",
  "photosCount",
  "photos",
  "ip",
  "emailDelivered",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    // If tenants array
    if (value[0] && typeof value[0] === "object" && ("name" in value[0] || "phone" in value[0])) {
      const formatted = value
        .map(
          (t: any, i: number) =>
            `Tenant ${i + 1}: ${t.name || "-"}${t.phone ? ` (${t.phone})` : ""}${
              t.email ? ` [${t.email}]` : ""
            }`
        )
        .join(" | ");
      return csvCell(formatted);
    }
    // If photos array, list filenames or counts
    const names = value.map((p: any) => p?.name || "photo").filter(Boolean);
    return csvCell(names.length ? `${names.length} file(s): ${names.join(", ")}` : "");
  }
  const str = typeof value === "string" ? value : String(value);
  // Quote if the value contains a delimiter, quote, or newline.
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: SubmissionJSON[]): string {
  const header = CSV_FIELDS.join(",");
  const lines = rows.map((row) => CSV_FIELDS.map((f) => csvCell(row[f])).join(","));
  // Prepend a BOM so Excel opens UTF-8 correctly.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const params = parseListParams(sp);

  let rows: SubmissionJSON[];
  try {
    rows = await exportSubmissions(params);
  } catch (err: any) {
    console.error("admin/export failed:", err);
    return NextResponse.json(
      { error: `Export failed: ${err?.message || "Unknown error"}` },
      { status: 500 }
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="groutix-submissions-${stamp}.csv"`,
    },
  });
}
