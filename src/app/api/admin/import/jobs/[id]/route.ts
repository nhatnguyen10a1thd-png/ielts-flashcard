import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { importJobs, topics } from "@/db/schema";
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
      id: importJobs.id,
      fileName: importJobs.fileName,
      status: importJobs.status,
      totalRows: importJobs.totalRows,
      addedRows: importJobs.addedRows,
      skippedRows: importJobs.skippedRows,
      errorRows: importJobs.errorRows,
      createdAt: importJobs.createdAt,
      completedAt: importJobs.completedAt,
      topicName: topics.name,
    })
    .from(importJobs)
    .leftJoin(topics, eq(importJobs.topicId, topics.id))
    .where(eq(importJobs.id, id));

  if (!job) {
    return NextResponse.json({ error: "Không tìm thấy phiên nhập dữ liệu" }, { status: 404 });
  }

  return NextResponse.json({ success: true, job });
}

