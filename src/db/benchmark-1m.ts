import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

interface BenchmarkResult {
  name: string;
  durationMs: number;
  thresholdMs: number;
  status: "ĐẠT" | "KHÔNG ĐẠT";
  details: string;
}

async function runBenchmark() {
  console.log("==================================================================");
  console.log("KIỂM TRA HIỆU NĂNG VÀ THỜI GIAN PHẢN HỒI (QUY MÔ 1.000.000 TỪ)");
  console.log("Mục tiêu: Tất cả các truy vấn chính phải phản hồi dưới 500ms");
  console.log("==================================================================");

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const results: BenchmarkResult[] = [];

  try {
    // 0. Kiểm tra số lượng từ hiện có
    const countRes = await client.query("SELECT COUNT(*) AS total FROM words;");
    const totalWords = parseInt(countRes.rows[0].total, 10);
    console.log(`\nTổng số từ vựng hiện có trong DB: ${totalWords.toLocaleString()} từ.\n`);

    // Lấy 2 chủ đề mẫu
    const topicsRes = await client.query("SELECT id, name FROM topics LIMIT 2;");
    if (topicsRes.rows.length === 0) {
      throw new Error("Không có chủ đề nào để kiểm tra benchmark.");
    }
    const sampleTopic1 = topicsRes.rows[0];
    const sampleTopic2 = topicsRes.rows[1] || topicsRes.rows[0];

    // TEST 1: Phân trang danh sách từ phía Admin (OFFSET / LIMIT có ORDER BY id)
    console.log("[BENCHMARK 1] Phân trang danh sách từ phía Admin (Trang 100, lấy 20 từ)...");
    const t1Start = performance.now();
    const pagedWords = await client.query(
      `
      SELECT id, word, meaning, part_of_speech, pronunciation
      FROM words
      WHERE topic_id = $1
      ORDER BY id ASC
      LIMIT 20 OFFSET 2000;
    `,
      [sampleTopic1.id]
    );
    const t1End = performance.now();
    const t1Duration = Math.round((t1End - t1Start) * 100) / 100;
    results.push({
      name: "Admin Words Pagination (Trang 100 / LIMIT 20 OFFSET 2000)",
      durationMs: t1Duration,
      thresholdMs: 500,
      status: t1Duration < 500 ? "ĐẠT" : "KHÔNG ĐẠT",
      details: `Lấy được ${pagedWords.rows.length} từ trong ${t1Duration}ms`,
    });
    console.log(`  -> Thời gian: ${t1Duration}ms | Kết quả: ${t1Duration < 500 ? "✓ ĐẠT" : "✗ KHÔNG ĐẠT"}`);

    // TEST 2: Tìm kiếm mờ toàn văn (Fuzzy Search với pg_trgm GIN index)
    console.log("\n[BENCHMARK 2] Tìm kiếm từ vựng bằng pg_trgm GIN index (Từ khóa: 'struct')...");
    const t2Start = performance.now();
    const searchRes = await client.query(
      `
      SELECT id, word, meaning, part_of_speech
      FROM words
      WHERE word_normalized % 'struct' OR meaning % 'cấu trúc'
      LIMIT 20;
    `
    );
    const t2End = performance.now();
    const t2Duration = Math.round((t2End - t2Start) * 100) / 100;
    results.push({
      name: "Trigram Fuzzy Search (pg_trgm GIN index)",
      durationMs: t2Duration,
      thresholdMs: 500,
      status: t2Duration < 500 ? "ĐẠT" : "KHÔNG ĐẠT",
      details: `Tìm thấy ${searchRes.rows.length} kết quả trong ${t2Duration}ms`,
    });
    console.log(`  -> Thời gian: ${t2Duration}ms | Kết quả: ${t2Duration < 500 ? "✓ ĐẠT" : "✗ KHÔNG ĐẠT"}`);

    // TEST 3: Xáo trộn tạo bộ câu hỏi kiểm tra ngẫu nhiên (Fisher–Yates trên tập ID có Index)
    console.log("\n[BENCHMARK 3] Sinh 50 câu hỏi trắc nghiệm ngẫu nhiên từ 2 chủ đề lớn...");
    const t3Start = performance.now();
    // Bước a: Lấy tập ID của 2 chủ đề (sử dụng index words_topic_id_idx)
    const idRes = await client.query(
      `
      SELECT id FROM words WHERE topic_id IN ($1, $2);
    `,
      [sampleTopic1.id, sampleTopic2.id]
    );

    // Bước b: Chọn 50 ID ngẫu nhiên trong bộ nhớ
    const allIds = idRes.rows.map((r) => r.id);
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
    }
    const sampleIds = allIds.slice(0, 50);

    // Bước c: Lấy dữ liệu chi tiết của 50 từ (sử dụng Primary Key Index)
    const questionsRes = await client.query(
      `
      SELECT id, word, meaning, part_of_speech, pronunciation, synonyms
      FROM words
      WHERE id = ANY($1::text[]);
    `,
      [sampleIds]
    );
    const t3End = performance.now();
    const t3Duration = Math.round((t3End - t3Start) * 100) / 100;
    results.push({
      name: "Quiz Question Sampler (Index topic + Memory Fisher-Yates + PK lookup)",
      durationMs: t3Duration,
      thresholdMs: 500,
      status: t3Duration < 500 ? "ĐẠT" : "KHÔNG ĐẠT",
      details: `Sinh ${questionsRes.rows.length} câu hỏi từ ${allIds.length.toLocaleString()} từ trong ${t3Duration}ms`,
    });
    console.log(`  -> Thời gian: ${t3Duration}ms | Kết quả: ${t3Duration < 500 ? "✓ ĐẠT" : "✗ KHÔNG ĐẠT"}`);

    // TEST 4: Tải danh sách Flashcard của một chủ đề lớn
    console.log("\n[BENCHMARK 4] Tải danh sách Flashcard học tập kèm tiến độ...");
    const t4Start = performance.now();
    const flashcardRes = await client.query(
      `
      SELECT w.id, w.word, w.meaning, w.part_of_speech, w.pronunciation, w.synonyms,
             p.is_known
      FROM words w
      LEFT JOIN user_word_progress p ON p.word_id = w.id AND p.user_id = '00000000-0000-0000-0000-000000000000'
      WHERE w.topic_id = $1
      ORDER BY w.id ASC
      LIMIT 100;
    `,
      [sampleTopic1.id]
    );
    const t4End = performance.now();
    const t4Duration = Math.round((t4End - t4Start) * 100) / 100;
    results.push({
      name: "Flashcard Study Room Query (100 cards with progress LEFT JOIN)",
      durationMs: t4Duration,
      thresholdMs: 500,
      status: t4Duration < 500 ? "ĐẠT" : "KHÔNG ĐẠT",
      details: `Tải 100 thẻ trong ${t4Duration}ms`,
    });
    console.log(`  -> Thời gian: ${t4Duration}ms | Kết quả: ${t4Duration < 500 ? "✓ ĐẠT" : "✗ KHÔNG ĐẠT"}`);

    // TEST 5: Đếm tổng số từ và thống kê Admin Dashboard
    console.log("\n[BENCHMARK 5] Thống kê tổng quan Admin Dashboard (COUNT topics, words, users)...");
    const t5Start = performance.now();
    const statsRes = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM topics WHERE deleted_at IS NULL) AS total_topics,
        (SELECT COUNT(*) FROM words) AS total_words,
        (SELECT COUNT(*) FROM users) AS total_users;
    `);
    const t5End = performance.now();
    const t5Duration = Math.round((t5End - t5Start) * 100) / 100;
    results.push({
      name: "Admin Dashboard Aggregated Statistics",
      durationMs: t5Duration,
      thresholdMs: 500,
      status: t5Duration < 500 ? "ĐẠT" : "KHÔNG ĐẠT",
      details: `Đếm song song topics, words, users trong ${t5Duration}ms`,
    });
    console.log(`  -> Thời gian: ${t5Duration}ms | Kết quả: ${t5Duration < 500 ? "✓ ĐẠT" : "✗ KHÔNG ĐẠT"}`);

    // Tổng kết bảng báo cáo
    console.log("\n==================================================================");
    console.log("KẾT QUẢ ĐO LƯỜNG HIỆU NĂNG");
    console.log("==================================================================");
    console.table(
      results.map((r) => ({
        "Tính năng / Truy vấn": r.name,
        "Thời gian": `${r.durationMs} ms`,
        "Tiêu chuẩn": `< ${r.thresholdMs} ms`,
        "Trạng thái": r.status,
      }))
    );

    const allPassed = results.every((r) => r.status === "ĐẠT");
    if (!allPassed) {
      console.error("CẢNH BÁO: Có truy vấn vượt quá ngưỡng 500ms!");
      process.exit(1);
    } else {
      console.log("🎉 TẤT CẢ TRUY VẤN ĐỀU PHẢN HỒI NHANH HƠN TIÊU CHUẨN 500ms (100% ĐẠT)!");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runBenchmark();

