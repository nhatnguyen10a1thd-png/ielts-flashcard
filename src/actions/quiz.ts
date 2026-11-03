"use server";

import { db, pool } from "@/db";
import {
  words,
  topics,
  userWordProgress,
  quizAttempts,
  quizAnswers,
} from "@/db/schema";
import { eq, inArray, and, sql, notInArray, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import {
  shuffleArray,
  generateMultipleChoiceOptions,
  checkTypingAnswer,
  QuizWordCandidate,
} from "@/lib/quiz/random-sampler";
import { revalidatePath } from "next/cache";

export interface QuizQuestion {
  wordId: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  pronunciation: string | null;
  synonyms: string[];
  questionText: string;
  subText?: string;
  correctAnswer: string;
  options?: string[]; // Cho trắc nghiệm
}

export interface GenerateQuizParams {
  topicIds: string[];
  questionCount: number;
  poolType: "all" | "unknown_only";
  mode: "flip_card" | "multiple_choice" | "typing";
  direction?: "en_vi" | "vi_en";
}

/**
 * Sinh bộ câu hỏi kiểm tra ngẫu nhiên và hiệu năng cao cho hàng triệu từ
 * Tránh ORDER BY RANDOM() trên toàn bảng, truy vấn index theo topic_id
 */
export async function generateQuizAction(params: GenerateQuizParams): Promise<{
  success: boolean;
  questions?: QuizQuestion[];
  error?: string;
}> {
  const session = await getSession();
  const { topicIds, questionCount, poolType, mode, direction = "en_vi" } = params;

  if (!topicIds || topicIds.length === 0) {
    return { success: false, error: "Vui lòng chọn ít nhất một chủ đề để kiểm tra." };
  }

  try {
    let wordIdQuery;

    if (poolType === "unknown_only" && session) {
      // Chỉ lấy từ chưa thuộc của học viên trong các chủ đề đã chọn
      wordIdQuery = await db
        .select({ id: words.id })
        .from(words)
        .leftJoin(
          userWordProgress,
          and(
            eq(words.id, userWordProgress.wordId),
            eq(userWordProgress.userId, session.userId)
          )
        )
        .where(
          and(
            inArray(words.topicId, topicIds),
            sql`(${userWordProgress.isKnown} IS NULL OR ${userWordProgress.isKnown} = false)`
          )
        );
    } else {
      // Lấy tất cả từ thuộc các chủ đề đã chọn
      wordIdQuery = await db
        .select({ id: words.id })
        .from(words)
        .where(inArray(words.topicId, topicIds));
    }

    if (wordIdQuery.length === 0) {
      return {
        success: false,
        error:
          poolType === "unknown_only"
            ? "Bạn đã thuộc tất cả từ trong các chủ đề đã chọn! Hãy chọn chế độ 'Tất cả từ vựng' để ôn tập."
            : "Chưa có từ vựng nào trong các chủ đề đã chọn.",
      };
    }

    // Xáo trộn ngẫu nhiên toàn bộ danh sách ID bằng Fisher–Yates
    const shuffledIds = shuffleArray(wordIdQuery.map((w) => w.id));
    const targetCount = Math.min(questionCount, shuffledIds.length);
    const selectedIds = shuffledIds.slice(0, targetCount);

    // Lấy chi tiết các từ đã chọn bằng WHERE id IN (...) - siêu nhanh có index
    const selectedWordsRows = await db
      .select({
        id: words.id,
        topicId: words.topicId,
        word: words.word,
        wordNormalized: words.wordNormalized,
        partOfSpeech: words.partOfSpeech,
        meaning: words.meaning,
        pronunciation: words.pronunciation,
        synonyms: words.synonyms,
      })
      .from(words)
      .where(inArray(words.id, selectedIds));

    const selectedCandidates: QuizWordCandidate[] = selectedWordsRows.map((r) => ({
      id: r.id,
      topicId: r.topicId,
      word: r.word,
      wordNormalized: r.wordNormalized,
      partOfSpeech: r.partOfSpeech,
      meaning: r.meaning,
      pronunciation: r.pronunciation,
      synonyms: (r.synonyms || []) as string[],
    }));

    // Nếu là chế độ Trắc nghiệm, cần lấy thêm ứng viên từ cùng chủ đề để làm đáp án nhiễu
    let distractorPool = selectedCandidates;
    if (mode === "multiple_choice") {
      // Lấy thêm tối đa 100 từ từ các chủ đề này để phong phú đáp án nhiễu
      const extraRows = await db
        .select({
          id: words.id,
          topicId: words.topicId,
          word: words.word,
          wordNormalized: words.wordNormalized,
          partOfSpeech: words.partOfSpeech,
          meaning: words.meaning,
          pronunciation: words.pronunciation,
          synonyms: words.synonyms,
        })
        .from(words)
        .where(inArray(words.topicId, topicIds))
        .limit(100);

      distractorPool = extraRows.map((r) => ({
        id: r.id,
        topicId: r.topicId,
        word: r.word,
        wordNormalized: r.wordNormalized,
        partOfSpeech: r.partOfSpeech,
        meaning: r.meaning,
        pronunciation: r.pronunciation,
        synonyms: (r.synonyms || []) as string[],
      }));
    }

    // Xáo trộn lại thứ tự câu hỏi trước khi trả về
    const shuffledQuestions = shuffleArray(selectedCandidates);

    const questions: QuizQuestion[] = shuffledQuestions.map((candidate) => {
      if (mode === "multiple_choice") {
        const mc = generateMultipleChoiceOptions({
          correctWord: candidate,
          allCandidates: distractorPool,
          direction,
        });

        return {
          wordId: candidate.id,
          word: candidate.word,
          meaning: candidate.meaning,
          partOfSpeech: candidate.partOfSpeech,
          pronunciation: candidate.pronunciation,
          synonyms: candidate.synonyms,
          questionText: mc.questionText,
          subText: mc.subText,
          correctAnswer: mc.correctAnswer,
          options: mc.options,
        };
      }

      if (mode === "typing") {
        return {
          wordId: candidate.id,
          word: candidate.word,
          meaning: candidate.meaning,
          partOfSpeech: candidate.partOfSpeech,
          pronunciation: candidate.pronunciation,
          synonyms: candidate.synonyms,
          questionText: candidate.meaning,
          subText: candidate.partOfSpeech || undefined,
          correctAnswer: candidate.word,
        };
      }

      // Flip card self-evaluation mode
      return {
        wordId: candidate.id,
        word: candidate.word,
        meaning: candidate.meaning,
        partOfSpeech: candidate.partOfSpeech,
        pronunciation: candidate.pronunciation,
        synonyms: candidate.synonyms,
        questionText: candidate.word,
        subText: candidate.partOfSpeech || undefined,
        correctAnswer: candidate.meaning,
      };
    });

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error("Generate quiz error:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo bài kiểm tra." };
  }
}

export interface QuizSubmissionAnswer {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface SubmitQuizParams {
  mode: "flip_card" | "multiple_choice" | "typing";
  topicIds: string[];
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  answers: QuizSubmissionAnswer[];
}

/**
 * Nộp bài kiểm tra và lưu lịch sử điểm số
 * Nếu là lật thẻ tự đánh giá: cập nhật trạng thái is_known vào user_word_progress
 */
export async function submitQuizAction(params: SubmitQuizParams) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Cần đăng nhập để lưu kết quả bài thi." };
  }

  const {
    mode,
    topicIds,
    totalQuestions,
    correctAnswers,
    timeSpentSeconds,
    answers,
  } = params;

  const scorePercent =
    totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(2) : "0.00";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Tạo bản ghi quiz_attempts
    const insertAttemptRes = await client.query(
      `
      INSERT INTO quiz_attempts (user_id, mode, topic_ids, total_questions, correct_answers, score_percent, time_spent_seconds, created_at)
      VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, NOW())
      RETURNING id;
    `,
      [
        session.userId,
        mode,
        JSON.stringify(topicIds),
        totalQuestions,
        correctAnswers,
        scorePercent,
        timeSpentSeconds,
      ]
    );

    const attemptId = insertAttemptRes.rows[0].id;

    // 2. Lưu từng câu trả lời vào quiz_answers
    if (answers.length > 0) {
      const values: string[] = [];
      const queryParams: unknown[] = [];
      let pIdx = 1;

      for (const ans of answers) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        queryParams.push(
          attemptId,
          ans.wordId,
          ans.userAnswer || "",
          ans.correctAnswer,
          ans.isCorrect
        );
      }

      await client.query(
        `
        INSERT INTO quiz_answers (quiz_attempt_id, word_id, user_answer, correct_answer, is_correct)
        VALUES ${values.join(", ")};
      `,
        queryParams
      );
    }

    // 3. Nếu là kiểu "Lật thẻ tự đánh giá", cập nhật trực tiếp tiến độ is_known
    if (mode === "flip_card") {
      for (const ans of answers) {
        await client.query(
          `
          INSERT INTO user_word_progress (user_id, word_id, is_known, last_reviewed_at, review_count, updated_at)
          VALUES ($1, $2, $3, NOW(), 1, NOW())
          ON CONFLICT (user_id, word_id)
          DO UPDATE SET
            is_known = EXCLUDED.is_known,
            last_reviewed_at = NOW(),
            review_count = user_word_progress.review_count + 1,
            updated_at = NOW();
        `,
          [session.userId, ans.wordId, ans.isCorrect]
        );
      }
    }

    await client.query("COMMIT");

    revalidatePath("/lich-su");
    revalidatePath("/chu-de");

    return {
      success: true,
      attemptId,
      scorePercent: parseFloat(scorePercent),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Submit quiz error:", error);
    return { success: false, error: "Đã xảy ra lỗi khi lưu kết quả bài thi." };
  } finally {
    client.release();
  }
}

