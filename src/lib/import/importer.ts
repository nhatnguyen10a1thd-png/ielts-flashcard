import { db, pool } from "@/db";
import { importJobs, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ParsedWordRow } from "./normalizer";

export interface ImportProgressReport {
  jobId: string;
  topicId: string;
  topicName: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalRows: number;
  addedRows: number;
  skippedRows: number;
  errorRows: number;
  errorDetails: Array<{ row: number; error: string; raw: Record<string, string> }>;
  completedAt?: Date;
}

const BATCH_SIZE = 1000;

/**
 * Thực hiện nhập danh sách từ vựng theo lô (batch) vào database
 * Sử dụng INSERT ... ON CONFLICT (topic_id, word_normalized, COALESCE(part_of_speech, '')) DO NOTHING
 */
export async function processBatchImport({
  jobId,
  topicId,
  validRows,
  errorRows,
  onProgress,
}: {
  jobId: string;
  topicId: string;
  validRows: ParsedWordRow[];
  errorRows: Array<{ row: number; error: string; raw: Record<string, string> }>;
  onProgress?: (progress: { added: number; skipped: number; totalProcessed: number }) => void;
}): Promise<ImportProgressReport> {
  let totalAdded = 0;
  let totalSkipped = 0;

  // Cập nhật trạng thái job sang processing
  await db
    .update(importJobs)
    .set({
      status: "processing",
      totalRows: validRows.length + errorRows.length,
      errorRows: errorRows.length,
      errorDetails: errorRows,
    })
    .where(eq(importJobs.id, jobId));

  const client = await pool.connect();

  try {
    // Xử lý từng lô (1.000 dòng mỗi lô)
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      // Chuẩn bị câu lệnh parameterized multi-row insert
      const valuesPlaceholders: string[] = [];
      const queryParams: unknown[] = [];
      let paramCounter = 1;

      for (const row of batch) {
        valuesPlaceholders.push(
          `($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}::jsonb)`
        );
        queryParams.push(
          topicId,
          row.word,
          row.wordNormalized,
          row.partOfSpeech,
          row.meaning,
          row.pronunciation,
          JSON.stringify(row.synonyms || [])
        );
      }

      const sqlQuery = `
        INSERT INTO words (topic_id, word, word_normalized, part_of_speech, meaning, pronunciation, synonyms)
        VALUES ${valuesPlaceholders.join(", ")}
        ON CONFLICT (topic_id, word_normalized, COALESCE(part_of_speech, '')) DO NOTHING;
      `;

      const result = await client.query(sqlQuery, queryParams);
      const insertedCount = result.rowCount || 0;
      const skippedCount = batch.length - insertedCount;

      totalAdded += insertedCount;
      totalSkipped += skippedCount;

      // Cập nhật tiến độ tạm thời vào database để client polling có thể đọc được
      await db
        .update(importJobs)
        .set({
          addedRows: totalAdded,
          skippedRows: totalSkipped,
        })
        .where(eq(importJobs.id, jobId));

      if (onProgress) {
        onProgress({
          added: totalAdded,
          skipped: totalSkipped,
          totalProcessed: i + batch.length,
        });
      }
    }

    // Hoàn thành job
    const completedAt = new Date();
    await db
      .update(importJobs)
      .set({
        status: "completed",
        addedRows: totalAdded,
        skippedRows: totalSkipped,
        completedAt,
      })
      .where(eq(importJobs.id, jobId));

    // Lấy thông tin job và topic để trả về báo cáo
    const [job] = await db
      .select({
        fileName: importJobs.fileName,
        topicId: importJobs.topicId,
        topicName: topics.name,
      })
      .from(importJobs)
      .leftJoin(topics, eq(importJobs.topicId, topics.id))
      .where(eq(importJobs.id, jobId));

    return {
      jobId,
      topicId,
      topicName: job?.topicName || "Chủ đề",
      fileName: job?.fileName || "",
      status: "completed",
      totalRows: validRows.length + errorRows.length,
      addedRows: totalAdded,
      skippedRows: totalSkipped,
      errorRows: errorRows.length,
      errorDetails: errorRows,
      completedAt,
    };
  } catch (error) {
    console.error("Batch import failed:", error);
    await db
      .update(importJobs)
      .set({
        status: "failed",
      })
      .where(eq(importJobs.id, jobId));
    throw error;
  } finally {
    client.release();
  }
}

