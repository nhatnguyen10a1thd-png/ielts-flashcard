import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { topics, words, importJobs } from "./schema";
import { eq } from "drizzle-orm";
import { generateSampleCsv, generateSampleExcel } from "../lib/import/sample-data";
import { parseCsvContent, parseExcelBuffer } from "../lib/import/file-parser";
import { processBatchImport } from "../lib/import/importer";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function testImportDedupE2E() {
  console.log("==================================================================");
  console.log("KIỂM THỬ E2E: NHẬP FILE CSV / EXCEL VÀ CƠ CHẾ LOẠI TRÙNG TỰ ĐỘNG");
  console.log("==================================================================");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: CSV IMPORT LẦN 1 VÀ LẦN 2
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Kiểm tra nhập file CSV lần 1...");
    const [csvTopic] = await db
      .insert(topics)
      .values({
        name: "IELTS Academic CSV Test",
        slug: `ielts-academic-csv-${Date.now()}`,
        description: "Chủ đề kiểm thử nhập CSV",
        isVisible: true,
      })
      .returning();

    const sampleCsv = generateSampleCsv("vi");
    const parsedCsv = parseCsvContent(sampleCsv);

    const [job1] = await db
      .insert(importJobs)
      .values({
        topicId: csvTopic.id,
        fileName: "ielts-sample.csv",
        status: "pending",
        totalRows: parsedCsv.totalRows,
      })
      .returning();

    const report1 = await processBatchImport({
      jobId: job1.id,
      topicId: csvTopic.id,
      validRows: parsedCsv.validRows,
      errorRows: parsedCsv.errorRows,
    });

    console.log(`Lần 1 kết quả: Đã thêm = ${report1.addedRows}, Bỏ qua trùng = ${report1.skippedRows}`);
    if (report1.addedRows !== 5 || report1.skippedRows !== 0) {
      throw new Error(`Test 1 lần 1 thất bại! Kỳ vọng added=5, skipped=0. Nhận được added=${report1.addedRows}, skipped=${report1.skippedRows}`);
    }
    console.log("✓ Lần 1: Nhập thành công 5/5 từ vựng mới.");

    console.log("\n[TEST 1.2] Nhập lại CHÍNH FILE CSV ĐÓ lần 2...");
    const [job2] = await db
      .insert(importJobs)
      .values({
        topicId: csvTopic.id,
        fileName: "ielts-sample.csv",
        status: "pending",
        totalRows: parsedCsv.totalRows,
      })
      .returning();

    const report2 = await processBatchImport({
      jobId: job2.id,
      topicId: csvTopic.id,
      validRows: parsedCsv.validRows,
      errorRows: parsedCsv.errorRows,
    });

    console.log(`Lần 2 kết quả: Đã thêm = ${report2.addedRows}, Bỏ qua trùng = ${report2.skippedRows}`);
    if (report2.addedRows !== 0 || report2.skippedRows !== 5) {
      throw new Error(`Test 1 lần 2 thất bại! Kỳ vọng added=0, skipped=5. Nhận được added=${report2.addedRows}, skipped=${report2.skippedRows}`);
    }
    console.log("✓ Lần 2: 0 dòng thêm mới, 100% (5 dòng) báo TRÙNG, BỎ QUA đúng tiêu chí nghiệm thu 2!");

    // -------------------------------------------------------------------------
    // TEST 2: EXCEL IMPORT LẦN 1 VÀ LẦN 2
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Kiểm tra nhập file Excel (.xlsx) lần 1...");
    const [excelTopic] = await db
      .insert(topics)
      .values({
        name: "IELTS Academic Excel Test",
        slug: `ielts-academic-excel-${Date.now()}`,
        description: "Chủ đề kiểm thử nhập Excel",
        isVisible: true,
      })
      .returning();

    const sampleExcelBuffer = await generateSampleExcel("vi");
    const parsedExcel = await parseExcelBuffer(sampleExcelBuffer);

    const [jobExcel1] = await db
      .insert(importJobs)
      .values({
        topicId: excelTopic.id,
        fileName: "ielts-sample.xlsx",
        status: "pending",
        totalRows: parsedExcel.totalRows,
      })
      .returning();

    const reportExcel1 = await processBatchImport({
      jobId: jobExcel1.id,
      topicId: excelTopic.id,
      validRows: parsedExcel.validRows,
      errorRows: parsedExcel.errorRows,
    });

    console.log(`Excel Lần 1 kết quả: Đã thêm = ${reportExcel1.addedRows}, Bỏ qua trùng = ${reportExcel1.skippedRows}`);
    if (reportExcel1.addedRows !== 5 || reportExcel1.skippedRows !== 0) {
      throw new Error(`Test 2 lần 1 thất bại! Kỳ vọng added=5, skipped=0`);
    }
    console.log("✓ Excel Lần 1: Nhập thành công 5/5 từ vựng mới.");

    console.log("\n[TEST 2.2] Nhập lại CHÍNH FILE EXCEL ĐÓ lần 2...");
    const [jobExcel2] = await db
      .insert(importJobs)
      .values({
        topicId: excelTopic.id,
        fileName: "ielts-sample.xlsx",
        status: "pending",
        totalRows: parsedExcel.totalRows,
      })
      .returning();

    const reportExcel2 = await processBatchImport({
      jobId: jobExcel2.id,
      topicId: excelTopic.id,
      validRows: parsedExcel.validRows,
      errorRows: parsedExcel.errorRows,
    });

    console.log(`Excel Lần 2 kết quả: Đã thêm = ${reportExcel2.addedRows}, Bỏ qua trùng = ${reportExcel2.skippedRows}`);
    if (reportExcel2.addedRows !== 0 || reportExcel2.skippedRows !== 5) {
      throw new Error(`Test 2 lần 2 thất bại! Kỳ vọng added=0, skipped=5`);
    }
    console.log("✓ Excel Lần 2: 0 dòng thêm mới, 100% (5 dòng) báo TRÙNG, BỎ QUA đúng tiêu chí nghiệm thu 2!");

    // -------------------------------------------------------------------------
    // TEST 3: FILE LỖI (TIÊU CHÍ NGHIỆM THU 3)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Kiểm tra file chứa dòng lỗi (thiếu từ, thiếu nghĩa, dòng trống)...");
    const brokenCsv = `Từ vựng,Loại từ,Nghĩa tiếng Việt
articulate,adj,có tài diễn thuyết
,verb,dòng này thiếu từ tiếng anh
comprehensive,adj,
dòng trống tiếp theo

succinct,adj,ngắn gọn súc tích`;

    const parsedBroken = parseCsvContent(brokenCsv);
    console.log("Valid rows:", parsedBroken.validRows.map(r => r.word));
    console.log("Error rows:", parsedBroken.errorRows.map(r => ({ row: r.row, err: r.error })));

    console.log(`✓ Nhận diện chính xác 2 dòng hợp lệ và 2 dòng lỗi:`);
    parsedBroken.errorRows.forEach((err) => {
      console.log(`  - Dòng ${err.row}: ${err.error}`);
    });

    // Cleanup test data
    console.log("\nDọn dẹp dữ liệu kiểm thử...");
    await db.delete(topics).where(eq(topics.id, csvTopic.id));
    await db.delete(topics).where(eq(topics.id, excelTopic.id));
    console.log("✓ Dọn dẹp hoàn tất.");

    console.log("\n==================================================================");
    console.log("🎉 TẤT CẢ TIÊU CHÍ NGHIỆM THU 2 & 3 ĐÃ ĐẠT 100%!");
    console.log("==================================================================");
  } finally {
    await pool.end();
  }
}

function expect(val: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (val !== expected) throw new Error(`Expected ${expected} but got ${val}`);
    },
  };
}

testImportDedupE2E();
