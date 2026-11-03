import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { importJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const { id } = await params;

  const [job] = await db
    .select({
      fileName: importJobs.fileName,
      errorDetails: importJobs.errorDetails,
    })
    .from(importJobs)
    .where(eq(importJobs.id, id));

  if (!job) {
    return NextResponse.json({ error: "Không tìm thấy phiên nhập dữ liệu" }, { status: 404 });
  }

  const errorDetails = (job.errorDetails || []) as Array<{
    row: number;
    error: string;
    raw: Record<string, string>;
  }>;

  // Build CSV with UTF-8 BOM
  const BOM = "\uFEFF";
  let csv = BOM + "Dòng (Row),Lý do lỗi (Reason),Dữ liệu gốc (Raw Data)\n";

  for (const item of errorDetails) {
    const rawStr = JSON.stringify(item.raw || {}).replace(/"/g, '""');
    csv += `"${item.row}","${item.error}","${rawStr}"\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="errors-${job.fileName.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}.csv"`,
    },
  });
}

