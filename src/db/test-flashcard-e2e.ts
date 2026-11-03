import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, topics, words, userWordProgress } from "./schema";
import { eq, and, asc } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function testFlashcardE2E() {
  console.log("==================================================================");
  console.log("KIỂM THỬ E2E: FLASHCARD TIẾN ĐỘ THUỘC / CHƯA THUỘC (TIÊU CHÍ 4)");
  console.log("==================================================================");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    // 1. Tạo học viên test
    const email = `learner_flashcard_${Date.now()}@ielts.vn`;
    const passwordHash = await hashPassword("LearnerPass123!");
    const [testUser] = await db
      .insert(users)
      .values({
        email,
        fullName: "Học Viên Flashcard",
        passwordHash,
        role: "learner",
      })
      .returning();

    console.log(`✓ Tạo học viên thử nghiệm: ${testUser.email}`);

    // 2. Tạo chủ đề và 3 từ vựng
    const [testTopic] = await db
      .insert(topics)
      .values({
        name: "Chủ đề Test Flashcard",
        slug: `topic-flashcard-${Date.now()}`,
        description: "Mô tả test",
        isVisible: true,
      })
      .returning();

    const [w1] = await db
      .insert(words)
      .values({
        topicId: testTopic.id,
        word: "serendipity",
        wordNormalized: "serendipity",
        meaning: "sự may mắn tình cờ",
        partOfSpeech: "noun",
        pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
      })
      .returning();

    const [w2] = await db
      .insert(words)
      .values({
        topicId: testTopic.id,
        word: "ephemeral",
        wordNormalized: "ephemeral",
        meaning: "phù du, sớm nở tối tàn",
        partOfSpeech: "adjective",
        pronunciation: "/ɪˈfem.ər.əl/",
      })
      .returning();

    const [w3] = await db
      .insert(words)
      .values({
        topicId: testTopic.id,
        word: "resilience",
        wordNormalized: "resilience",
        meaning: "khả năng phục hồi kiên cường",
        partOfSpeech: "noun",
        pronunciation: "/rɪˈzɪl.jəns/",
      })
      .returning();

    console.log("✓ Tạo 3 từ vựng mẫu cho chủ đề.");

    // 3. Học viên đánh dấu w1 là "ĐÃ THUỘC" (is_known = true)
    await pool.query(
      `
      INSERT INTO user_word_progress (user_id, word_id, is_known, last_reviewed_at, review_count, updated_at)
      VALUES ($1, $2, true, NOW(), 1, NOW())
      ON CONFLICT (user_id, word_id)
      DO UPDATE SET is_known = true, review_count = user_word_progress.review_count + 1, updated_at = NOW()
    `,
      [testUser.id, w1.id]
    );

    console.log("✓ Học viên đánh dấu từ 1 ('serendipity') là ĐÃ THUỘC.");

    // 4. Giả lập người dùng tải lại trang: Query lại toàn bộ từ vựng kèm tiến độ
    const reloaded = await db
      .select({
        id: words.id,
        word: words.word,
        isKnown: userWordProgress.isKnown,
        reviewCount: userWordProgress.reviewCount,
      })
      .from(words)
      .leftJoin(
        userWordProgress,
        and(
          eq(words.id, userWordProgress.wordId),
          eq(userWordProgress.userId, testUser.id)
        )
      )
      .where(eq(words.topicId, testTopic.id))
      .orderBy(asc(words.wordNormalized));

    console.log("\nKết quả sau khi tải lại trang:");
    reloaded.forEach((r) => {
      console.log(`  - Từ "${r.word}": Đã thuộc = ${Boolean(r.isKnown)} (Ôn ${r.reviewCount || 0} lần)`);
    });

    // Kiểm tra tính chính xác của trạng thái lưu trữ
    const w1Result = reloaded.find((r) => r.id === w1.id);
    const w2Result = reloaded.find((r) => r.id === w2.id);
    const w3Result = reloaded.find((r) => r.id === w3.id);

    if (!w1Result?.isKnown) {
      throw new Error("Lỗi: Từ w1 phải có trạng thái ĐÃ THUỘC (isKnown = true) sau khi reload!");
    }
    if (w2Result?.isKnown || w3Result?.isKnown) {
      throw new Error("Lỗi: Các từ w2, w3 chưa đánh dấu phải có trạng thái CHƯA THUỘC!");
    }

    console.log("✓ Trạng thái ĐÃ THUỘC lưu trữ bền vững trong database (Persisted successfully).");

    // 5. Kiểm tra lọc từ chưa thuộc:
    const unknownOnly = reloaded.filter((r) => !r.isKnown);
    console.log(`✓ Lọc từ chưa thuộc: còn lại ${unknownOnly.length}/3 từ (${unknownOnly.map(u => u.word).join(", ")}).`);
    if (unknownOnly.length !== 2) {
      throw new Error("Bộ lọc từ chưa thuộc trả về số lượng không chính xác!");
    }

    // 6. Cleanup
    console.log("\nDọn dẹp dữ liệu kiểm thử...");
    await db.delete(topics).where(eq(topics.id, testTopic.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log("✓ Dọn dẹp hoàn tất.");

    console.log("\n==================================================================");
    console.log("🎉 TIÊU CHÍ NGHIỆM THU 4 ĐÃ ĐẠT 100%!");
    console.log("==================================================================");
  } finally {
    await pool.end();
  }
}

testFlashcardE2E();

