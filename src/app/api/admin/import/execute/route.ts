import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { topics, importJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseCsvContent, parseExcelBuffer } from "@/lib/import/file-parser";
import { processBatchImport } from "@/lib/import/importer";

function generateSlug(text: string): string {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${normalized}-${Date.now().toString(36)}`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let topicId = formData.get("topicId")?.toString();
    const newTopicName = formData.get("newTopicName")?.toString()?.trim();

    if (!file) {
      return NextResponse.json({ error: "Thiếu tập tin tải lên" }, { status: 400 });
    }

    if (!topicId && !newTopicName) {
      return NextResponse.json(
        { error: "Vui lòng chọn một chủ đề có sẵn hoặc nhập tên chủ đề mới" },
        { status: 400 }
      );
    }

    // Nếu tạo chủ đề mới
    if (!topicId && newTopicName) {
      const slug = generateSlug(newTopicName);
      const [newTopic] = await db
        .insert(topics)
        .values({
          name: newTopicName,
          slug,
          description: `Chủ đề được tạo tự động từ tập tin ${file.name}`,
          isVisible: true,
        })
        .returning();
      topicId = newTopic.id;
    }

    if (!topicId) {
      return NextResponse.json({ error: "Không thể xác định chủ đề" }, { status: 400 });
    }

    // Parse file
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    let parseResult;

    if (extension === "csv") {
      const text = await file.text();
      parseResult = parseCsvContent(text);
    } else if (extension === "xlsx" || extension === "xls") {
      const arrayBuffer = await file.arrayBuffer();
      parseResult = await parseExcelBuffer(Buffer.from(arrayBuffer));
    } else {
      return NextResponse.json(
        { error: "Định dạng không được hỗ trợ. Chỉ chấp nhận .csv và .xlsx" },
        { status: 400 }
      );
    }

    // Tạo job nhập dữ liệu trong database
    const [job] = await db
      .insert(importJobs)
      .values({
        userId: session.userId,
        topicId,
        fileName,
        status: "pending",
        totalRows: parseResult.totalRows,
        errorRows: parseResult.errorRows.length,
        errorDetails: parseResult.errorRows,
      })
      .returning();

    // Bắt đầu xử lý nhập dữ liệu
    const report = await processBatchImport({
      jobId: job.id,
      topicId,
      validRows: parseResult.validRows,
      errorRows: parseResult.errorRows,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      report,
    });
  } catch (err: unknown) {
    console.error("Execute import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Đã xảy ra lỗi khi nhập dữ liệu" },
      { status: 500 }
    );
  }
}

