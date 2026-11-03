import { NextRequest, NextResponse } from "next/server";
import { generateSampleCsv, generateSampleExcel } from "@/lib/import/sample-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "csv";
  const lang = (searchParams.get("lang") as "vi" | "en") || "vi";

  if (format === "xlsx") {
    const buffer = await generateSampleExcel(lang);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ielts-sample-vocabulary-${lang}.xlsx"`,
      },
    });
  }

  const csv = generateSampleCsv(lang);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ielts-sample-vocabulary-${lang}.csv"`,
    },
  });
}
