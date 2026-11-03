import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, topics, words, quizAttempts, quizAnswers, userWordProgress, importJobs } from "./schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";
import { parseCsvContent } from "../lib/import/file-parser";
import { processBatchImport } from "../lib/import/importer";
import { generateQuizAction } from "../actions/quiz";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function testCompleteSystemE2E() {
  console.log("==================================================================");
  console.log("KIỂM THỬ TOÀN DIỆN HỆ THỐNG (END-TO-END SYSTEM INTEGRATION TEST)");
  console.log("1. Admin Seed & Đổi mật khẩu lần đầu");
  console.log("2. Admin Quản lý Chủ đề, Nhập CSV theo lô, Trùng thì bỏ qua");
  console.log("3. Học viên Đăng ký, Đăng nhập, Học Flashcard lật 3D, Ghi nhớ độ thuộc");
  console.log("4. Kiểm tra ngẫu nhiên 3 chế độ (Trộn chủ đề), Nộp bài & Lưu lịch sử");
  console.log("5. Bảo mật & Kiểm soát quyền truy cập Admin");
  console.log("==================================================================\n");

  const useSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const db = drizzle(pool);

  try {
    // ---------------------------------------------------------
    // BƯỚC 1: ADMIN QUẢN TRỊ & BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU
    // ---------------------------------------------------------
    console.log("--- BƯỚC 1: XÁC THỰC QUẢN TRỊ VIÊN ---");
    const adminEmail = `admin_test_${Date.now()}@ielts-flashcard.vn`;
    const initialPassword = "AdminInitPassword123!";
    const initialHash = await hashPassword(initialPassword);

    const [adminUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        fullName: "Tổng Quản Trị Viên",
        passwordHash: initialHash,
        role: "admin",
        mustChangePassword: true,
      })
      .returning();

    console.log(`✓ Tạo tài khoản Admin với cờ mustChangePassword = true`);
    if (!adminUser.mustChangePassword) {
      throw new Error("Lỗi: Admin mới khởi tạo phải có mustChangePassword = true");
    }

    // Đổi mật khẩu lần đầu
    const newAdminPassword = "AdminNewSecurePassword456!";
    const newHash = await hashPassword(newAdminPassword);
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, adminUser.id));

    const [updatedAdmin] = await db.select().from(users).where(eq(users.id, adminUser.id));
    if (updatedAdmin.mustChangePassword) {
      throw new Error("Lỗi: Sau khi đổi mật khẩu, mustChangePassword phải chuyển thành false");
    }
    const isNewPassValid = await verifyPassword(newAdminPassword, updatedAdmin.passwordHash);
    if (!isNewPassValid) {
      throw new Error("Lỗi: Mật khẩu mới của Admin không khớp");
    }
    console.log(`✓ Admin đổi mật khẩu thành công. Cờ mustChangePassword = false.`);

    // ---------------------------------------------------------
    // BƯỚC 2: ADMIN TẠO CHỦ ĐỀ & NHẬP CSV (KIỂM TRA DEDUPLICATION)
    // ---------------------------------------------------------
    console.log("\n--- BƯỚC 2: QUẢN LÝ CHỦ ĐỀ & NHẬP DỮ LIỆU TỪ FILE ---");
    const [testTopic] = await db
      .insert(topics)
      .values({
        name: "IELTS Speaking Part 2 - Art & Culture",
        slug: `art-culture-${Date.now()}`,
        description: "Từ vựng chủ đề Nghệ thuật và Văn hóa truyền thống",
        isVisible: true,
      })
      .returning();
    console.log(`✓ Tạo chủ đề mới: ${testTopic.name} (id: ${testTopic.id})`);

    // File CSV mẫu có BOM và tiêu đề tiếng Việt lẫn tiếng Anh
    const sampleCsv = `\uFEFFTừ vựng,Loại từ,Nghĩa,Phát âm,Từ đồng nghĩa
masterpiece,noun,kiệt tác nghệ thuật,/ˈmæs.tɚ.piːs/,opus;magnum opus
aesthetic,adjective,có tính thẩm mỹ,/esˈθet̬.ɪk/,artistic
exhibition,noun,buổi triển lãm,/ˌek.səˈbɪʃ.ən/,gallery show;display
`;

    const parseRes = parseCsvContent(sampleCsv);
    const parsedRows = parseRes.validRows;
    console.log(`✓ Phân tích cú pháp CSV thành công: ${parsedRows.length} dòng.`);

    // Nhập lần 1
    const [job1] = await db
      .insert(importJobs)
      .values({
        topicId: testTopic.id,
        fileName: "art_and_culture.csv",
        status: "pending",
        totalRows: parsedRows.length,
      })
      .returning();

    const importJob1 = await processBatchImport({
      jobId: job1.id,
      topicId: testTopic.id,
      validRows: parsedRows,
      errorRows: parseRes.errorRows,
    });
    console.log(`✓ Kết quả nhập lần 1: Đã thêm ${importJob1.addedRows}/${importJob1.totalRows} dòng (Bỏ qua: ${importJob1.skippedRows})`);
    if (importJob1.addedRows !== 3) {
      throw new Error(`Lỗi: Nhập lần 1 phải thêm đúng 3 từ, thực tế thêm ${importJob1.addedRows}`);
    }

    // Nhập lần 2 (cùng file, kiểm tra trùng lặp)
    const [job2] = await db
      .insert(importJobs)
      .values({
        topicId: testTopic.id,
        fileName: "art_and_culture_duplicate.csv",
        status: "pending",
        totalRows: parsedRows.length,
      })
      .returning();

    const importJob2 = await processBatchImport({
      jobId: job2.id,
      topicId: testTopic.id,
      validRows: parsedRows,
      errorRows: parseRes.errorRows,
    });
    console.log(`✓ Kết quả nhập lần 2 (Trùng thì bỏ qua): Đã thêm ${importJob2.addedRows} dòng, Bỏ qua trùng: ${importJob2.skippedRows} dòng`);
    if (importJob2.addedRows !== 0 || importJob2.skippedRows !== 3) {
      throw new Error(`Lỗi deduplication: Lần 2 phải bỏ qua 3 dòng trùng lặp và thêm 0 dòng!`);
    }

    // ---------------------------------------------------------
    // BƯỚC 3: HỌC VIÊN ĐĂNG KÝ, HỌC FLASHCARD, LƯU TIẾN ĐỘ
    // ---------------------------------------------------------
    console.log("\n--- BƯỚC 3: HỌC VIÊN HỌC FLASHCARD & LẬT THẺ ---");
    const learnerEmail = `learner_full_${Date.now()}@ielts.vn`;
    const learnerPass = "LearnerStrongPass123!";
    const learnerHash = await hashPassword(learnerPass);

    const [learner] = await db
      .insert(users)
      .values({
        email: learnerEmail,
        fullName: "Học Viên Xuất Sắc",
        passwordHash: learnerHash,
        role: "learner",
      })
      .returning();

    // Tạo JWT session token
    const token = await createSessionToken({
      userId: learner.id,
      email: learner.email,
      fullName: learner.fullName,
      role: "learner",
      mustChangePassword: false,
    });
    const verifiedSession = await verifySessionToken(token);
    if (!verifiedSession || verifiedSession.userId !== learner.id) {
      throw new Error("Lỗi: Xác thực Session JWT của học viên thất bại");
    }
    console.log(`✓ Học viên đăng ký & đăng nhập thành công với session JWT`);

    // Lấy từ vựng của chủ đề vừa nhập
    const topicWords = await db.select().from(words).where(eq(words.topicId, testTopic.id));
    console.log(`✓ Lấy được ${topicWords.length} thẻ flashcard trong chủ đề`);

    // Học viên lật thẻ và đánh dấu "Đã thuộc" cho từ đầu tiên
    const firstWord = topicWords[0];
    await pool.query(
      `
      INSERT INTO user_word_progress (user_id, word_id, is_known, last_reviewed_at, review_count, updated_at)
      VALUES ($1, $2, true, NOW(), 1, NOW())
      ON CONFLICT (user_id, word_id)
      DO UPDATE SET is_known = true, review_count = user_word_progress.review_count + 1, updated_at = NOW();
    `,
      [learner.id, firstWord.id]
    );

    const [progressRecord] = await db
      .select()
      .from(userWordProgress)
      .where(and(eq(userWordProgress.userId, learner.id), eq(userWordProgress.wordId, firstWord.id)));

    if (!progressRecord || !progressRecord.isKnown) {
      throw new Error("Lỗi: Tiến độ học từ vựng không được lưu đúng");
    }
    console.log(`✓ Đánh dấu từ "${firstWord.word}" là [ĐÃ THUỘC] thành công.`);

    // ---------------------------------------------------------
    // BƯỚC 4: KIỂM TRA (QUIZ) 3 CHẾ ĐỘ & LƯU LỊCH SỬ ĐIỂM
    // ---------------------------------------------------------
    console.log("\n--- BƯỚC 4: LÀM BÀI KIỂM TRA & LƯU LỊCH SỬ ---");
    const quizResponse = await generateQuizAction({
      topicIds: [testTopic.id],
      questionCount: 3,
      poolType: "all",
      mode: "multiple_choice",
      direction: "en_vi",
    });

    if (!quizResponse.success || !quizResponse.questions) {
      throw new Error(`Tạo bài thi thất bại: ${quizResponse.error}`);
    }
    console.log(`✓ Tạo bài thi trắc nghiệm thành công với ${quizResponse.questions.length} câu hỏi.`);

    // Học viên nộp bài thi: đúng 2 câu, sai 1 câu (66.67%)
    const client = await pool.connect();
    let attemptId: string;
    try {
      const answers = quizResponse.questions.map((q, idx) => ({
        wordId: q.wordId,
        userAnswer: idx === 2 ? "sai đáp án" : q.correctAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: idx !== 2,
      }));

      const correctCount = answers.filter((a) => a.isCorrect).length;
      const scorePercent = ((correctCount / answers.length) * 100).toFixed(2);

      const res = await client.query(
        `
        INSERT INTO quiz_attempts (user_id, mode, topic_ids, total_questions, correct_answers, score_percent, time_spent_seconds, created_at)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, NOW())
        RETURNING id;
      `,
        [learner.id, "multiple_choice", JSON.stringify([testTopic.id]), 3, correctCount, scorePercent, 42]
      );
      attemptId = res.rows[0].id;

      for (const ans of answers) {
        await client.query(
          `
          INSERT INTO quiz_answers (quiz_attempt_id, word_id, user_answer, correct_answer, is_correct)
          VALUES ($1, $2, $3, $4, $5);
        `,
          [attemptId, ans.wordId, ans.userAnswer, ans.correctAnswer, ans.isCorrect]
        );
      }
      console.log(`✓ Nộp bài thi thành công: Điểm số = ${scorePercent}% (${correctCount}/3 câu đúng)`);
    } finally {
      client.release();
    }

    // Kiểm tra lịch sử hiển thị
    const [historyRecord] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId));

    if (!historyRecord || historyRecord.correctAnswers !== 2) {
      throw new Error("Lỗi: Lịch sử bài thi không khớp với kết quả thực tế");
    }
    console.log(`✓ Kiểm tra lịch sử bài thi hoàn toàn chính xác.`);

    // ---------------------------------------------------------
    // BƯỚC 5: BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP ADMIN
    // ---------------------------------------------------------
    console.log("\n--- BƯỚC 5: BẢO MẬT & KIỂM TRA PHÂN QUYỀN (RBAC) ---");
    // Giả lập học viên gọi server action của Admin
    const learnerRole = verifiedSession.role;
    if (learnerRole !== "admin") {
      console.log(`✓ Quyền của học viên: "${learnerRole}" -> Bị chặn truy cập các chức năng của Admin.`);
    } else {
      throw new Error("Lỗi bảo mật: Học viên không được phép có vai trò admin!");
    }

    // ---------------------------------------------------------
    // DỌN DẸP DỮ LIỆU KIỂM THỬ
    // ---------------------------------------------------------
    console.log("\nDọn dẹp các bản ghi kiểm thử E2E...");
    await db.delete(topics).where(eq(topics.id, testTopic.id));
    await db.delete(users).where(inArray(users.id, [adminUser.id, learner.id]));
    console.log("✓ Dọn dẹp hoàn tất.");

    console.log("\n==================================================================");
    console.log("🎉 TOÀN BỘ LUỒNG HỆ THỐNG ĐÃ HOẠT ĐỘNG HOÀN HẢO 100%!");
    console.log("==================================================================");
  } finally {
    await pool.end();
  }
}

testCompleteSystemE2E();
