import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCsvContent, parseExcelBuffer } from "@/lib/import/file-parser";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Vui lòng chọn tập tin để tải lên" }, { status: 400 });
    }

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Gợi ý tên chủ đề từ tên file (bỏ đuôi, thay _ - bằng khoảng trắng)
    const suggestedTopicName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[_\-]+/g, " ")
      .trim();

    let parseResult;

    if (extension === "csv") {
      const text = await file.text();
      parseResult = parseCsvContent(text);
    } else if (extension === "xlsx" || extension === "xls") {
      const arrayBuffer = await file.arrayBuffer();
      parseResult = await parseExcelBuffer(Buffer.from(arrayBuffer));
    } else {
      return NextResponse.json(
        { error: "Định dạng tập tin không được hỗ trợ. Vui lòng tải file .csv hoặc .xlsx" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName,
      suggestedTopicName,
      headers: parseResult.headers,
      mapping: parseResult.mapping,
      totalRows: parseResult.totalRows,
      validRowsCount: parseResult.validRows.length,
      errorRowsCount: parseResult.errorRows.length,
      previewRows: parseResult.previewRows,
      errorRowsPreview: parseResult.errorRows.slice(0, 10),
    });
  } catch (err: unknown) {
    console.error("Preview import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi khi xử lý file tải lên" },
      { status: 500 }
    );
  }
}

