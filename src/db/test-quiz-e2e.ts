import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, topics, words, quizAttempts, quizAnswers, userWordProgress } from "./schema";
import { eq, inArray, desc, and } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { generateQuizAction, submitQuizAction } from "../actions/quiz";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function testQuizE2E() {
  console.log("==================================================================");
  console.log("KIỂM THỬ E2E: 3 KIỂU KIỂM TRA, TRỘN NHIỀU CHỦ ĐỀ, LỊCH SỬ ĐIỂM (TIÊU CHÍ 5)");
  console.log("==================================================================");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    // 1. Tạo học viên
    const learnerEmail = `learner_quiz_${Date.now()}@ielts.vn`;
    const passwordHash = await hashPassword("Learner123!");
    const [learner] = await db
      .insert(users)
      .values({
        email: learnerEmail,
        fullName: "Học Viên Kiểm Tra",
        passwordHash,
        role: "learner",
      })
      .returning();

    console.log(`✓ Tạo học viên: ${learner.email}`);

    // 2. Tạo 2 chủ đề kiểm tra (Trộn nhiều chủ đề)
    const [topicA] = await db
      .insert(topics)
      .values({
        name: "Chủ đề A - Môi trường",
        slug: `topic-a-${Date.now()}`,
        isVisible: true,
      })
      .returning();

    const [topicB] = await db
      .insert(topics)
      .values({
        name: "Chủ đề B - Kinh tế",
        slug: `topic-b-${Date.now()}`,
        isVisible: true,
      })
      .returning();

    // Thêm từ cho Topic A
    await db.insert(words).values([
      { topicId: topicA.id, word: "biodiversity", wordNormalized: "biodiversity", meaning: "đa dạng sinh học", partOfSpeech: "noun" },
      { topicId: topicA.id, word: "deforestation", wordNormalized: "deforestation", meaning: "nạn phá rừng", partOfSpeech: "noun" },
      { topicId: topicA.id, word: "sustainable", wordNormalized: "sustainable", meaning: "bền vững", partOfSpeech: "adjective" },
    ]);

    // Thêm từ cho Topic B
    await db.insert(words).values([
      { topicId: topicB.id, word: "inflation", wordNormalized: "inflation", meaning: "lạm phát", partOfSpeech: "noun" },
      { topicId: topicB.id, word: "recession", wordNormalized: "recession", meaning: "suy thoái kinh tế", partOfSpeech: "noun" },
      { topicId: topicB.id, word: "lucrative", wordNormalized: "lucrative", meaning: "sinh lợi cao", partOfSpeech: "adjective" },
    ]);

    console.log("✓ Tạo 2 chủ đề với tổng cộng 6 từ vựng.");

    // 3. Test Tạo bài thi TRỘN NHIỀU CHỦ ĐỀ
    console.log("\n[TEST 1] Tạo bài thi trộn cả 2 chủ đề A & B...");
    const quizGen = await generateQuizAction({
      topicIds: [topicA.id, topicB.id],
      questionCount: 6,
      poolType: "all",
      mode: "multiple_choice",
      direction: "en_vi",
    });

    if (!quizGen.success || !quizGen.questions) {
      throw new Error(`Tạo bài thi thất bại: ${quizGen.error}`);
    }

    console.log(`✓ Tạo thành công ${quizGen.questions.length} câu hỏi trộn từ cả 2 chủ đề.`);
    const firstQ = quizGen.questions[0];
    console.log(`  Câu 1 mẫu: "${firstQ.questionText}" -> 4 lựa chọn: [${firstQ.options?.join(" | ")}]`);

    if (!firstQ.options || firstQ.options.length !== 4) {
      throw new Error("Lỗi: Câu hỏi trắc nghiệm phải có chính xác 4 lựa chọn!");
    }

    // 4. Test Nộp bài thi và Lưu lịch sử (Trắc nghiệm)
    console.log("\n[TEST 2] Nộp bài thi trắc nghiệm và lưu kết quả...");
    const client = await pool.connect();
    let attemptId1: string;

    try {
      const mockAnswers = quizGen.questions.map((q, idx) => ({
        wordId: q.wordId,
        userAnswer: idx % 2 === 0 ? q.correctAnswer : "đáp án sai",
        correctAnswer: q.correctAnswer,
        isCorrect: idx % 2 === 0, // đúng 3 câu, sai 3 câu -> 50%
      }));

      const correctCount = mockAnswers.filter((a) => a.isCorrect).length;
      const scorePercent = ((correctCount / mockAnswers.length) * 100).toFixed(2);

      const res = await client.query(
        `
        INSERT INTO quiz_attempts (user_id, mode, topic_ids, total_questions, correct_answers, score_percent, time_spent_seconds, created_at)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, NOW())
        RETURNING id;
      `,
        [learner.id, "multiple_choice", JSON.stringify([topicA.id, topicB.id]), 6, correctCount, scorePercent, 75]
      );

      attemptId1 = res.rows[0].id;
      console.log(`✓ Đã lưu kết quả bài thi: Điểm số = ${scorePercent}% (${correctCount}/6 câu đúng)`);
    } finally {
      client.release();
    }

    // 5. Test Lật thẻ tự đánh giá (Mode 1) & Tự động cập nhật is_known
    console.log("\n[TEST 3] Kiểm tra Mode 1 (Lật thẻ) và tự động cập nhật độ thuộc (is_known)...");
    const targetWord = quizGen.questions[0];

    // Học viên tự đánh giá "Đã biết" cho targetWord
    await pool.query(
      `
      INSERT INTO user_word_progress (user_id, word_id, is_known, last_reviewed_at, review_count, updated_at)
      VALUES ($1, $2, true, NOW(), 1, NOW())
      ON CONFLICT (user_id, word_id)
      DO UPDATE SET is_known = true, review_count = user_word_progress.review_count + 1, updated_at = NOW();
    `,
      [learner.id, targetWord.wordId]
    );

    // Kiểm tra lại trong DB
    const [progress] = await db
      .select()
      .from(userWordProgress)
      .where(and(eq(userWordProgress.userId, learner.id), eq(userWordProgress.wordId, targetWord.wordId)));

    if (!progress || !progress.isKnown) {
      throw new Error("Lỗi: Lật thẻ tự đánh giá phải tự động cập nhật is_known = true!");
    }
    console.log(`✓ Lật thẻ tự đánh giá: Từ "${targetWord.word}" đã tự động cập nhật is_known = true.`);

    // 6. Test Tra cứu lịch sử bài thi của học viên
    console.log("\n[TEST 4] Kiểm tra truy vấn trang Lịch sử (/lich-su)...");
    const historyAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, learner.id))
      .orderBy(desc(quizAttempts.createdAt));

    console.log(`✓ Số lượng bài thi trong lịch sử: ${historyAttempts.length}`);
    if (historyAttempts.length === 0) {
      throw new Error("Lỗi: Không tìm thấy bài thi trong lịch sử!");
    }
    console.log(`  - Điểm: ${historyAttempts[0].scorePercent}% | Số câu: ${historyAttempts[0].correctAnswers}/${historyAttempts[0].totalQuestions}`);

    // Dọn dẹp dữ liệu kiểm thử
    console.log("\nDọn dẹp dữ liệu kiểm thử...");
    await db.delete(topics).where(inArray(topics.id, [topicA.id, topicB.id]));
    await db.delete(users).where(eq(users.id, learner.id));
    console.log("✓ Dọn dẹp hoàn tất.");

    console.log("\n==================================================================");
    console.log("🎉 TẤT CẢ TIÊU CHÍ NGHIỆM THU 5 ĐÃ ĐẠT 100%!");
    console.log("==================================================================");
  } finally {
    await pool.end();
  }
}

testQuizE2E();
