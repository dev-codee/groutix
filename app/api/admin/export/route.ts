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
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "enquiry",
  "areas",
  "heard",
  "message",
  "issue",
  "sourcePage",
  "photosCount",
  "ip",
  "emailDelivered",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  // Quote if the value contains a delimiter, quote, or newline.
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: SubmissionJSON[]): string {
  const header = CSV_FIELDS.join(",");
  const lines = rows.map((row) => CSV_FIELDS.map((f) => csvCell(row[f])).join(","));
  // Prepend a BOM so Excel opens UTF-8 correctly.
  return "﻿" + [header, ...lines].join("\r\n");
}

export async function GET(req: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "json" ? "json" : "csv";
  const params = parseListParams(sp);

  let rows: SubmissionJSON[];
  try {
    rows = await exportSubmissions(params);
  } catch (err) {
    console.error("admin/export failed:", err);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="groutix-submissions-${stamp}.json"`,
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="groutix-submissions-${stamp}.csv"`,
    },
  });
}
