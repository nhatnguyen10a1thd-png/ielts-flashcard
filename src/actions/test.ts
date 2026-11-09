"use server";

import { db, pool } from "@/db";
import { tests, testQuestions, testSubmissions } from "@/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { calculateIeltsBandScore, getBandEvaluation } from "@/lib/test/band-calculator";
import { recordDailyActivityAction } from "@/actions/pet";

export interface TestListItem {
  id: string;
  title: string;
  slug: string;
  category: "placement" | "milestone" | "mini_test" | "mock_test";
  targetBand: string | null;
  durationMinutes: number;
  totalQuestions: number;
  passingScorePercent: number;
  description: string | null;
  attemptCount?: number;
  bestScorePercent?: number | null;
  bestBand?: number | null;
}

/**
 * Lấy danh sách đề thi kèm thống kê số lượt làm bài của học viên
 */
export async function getAllTestsAction(
  category?: string
): Promise<{ success: boolean; data?: TestListItem[]; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId;

    const testRows = await db
      .select()
      .from(tests)
      .where(
        and(
          eq(tests.isPublished, true),
          category ? eq(tests.category, category as any) : undefined
        )
      )
      .orderBy(asc(tests.title));

    const testIds = testRows.map((t) => t.id);
    const userSubmissionsMap = new Map<
      string,
      { count: number; bestScore: number; bestBand: number }
    >();

    if (userId && testIds.length > 0) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          SELECT test_id, 
                 count(id) as attempt_count,
                 max(score_percent) as best_score,
                 max(estimated_band) as best_band
          FROM test_submissions
          WHERE user_id = $1
          GROUP BY test_id;
        `,
          [userId]
        );
        res.rows.forEach((r) => {
          userSubmissionsMap.set(r.test_id, {
            count: Number(r.attempt_count),
            bestScore: Number(r.best_score),
            bestBand: Number(r.best_band),
          });
        });
      } finally {
        client.release();
      }
    }

    const result: TestListItem[] = testRows.map((t) => {
      const subInfo = userSubmissionsMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        category: t.category,
        targetBand: t.targetBand,
        durationMinutes: t.durationMinutes,
        totalQuestions: t.totalQuestions,
        passingScorePercent: t.passingScorePercent,
        description: t.description,
        attemptCount: subInfo?.count || 0,
        bestScorePercent: subInfo?.bestScore ?? null,
        bestBand: subInfo?.bestBand ?? null,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Get all tests error:", error);
    return { success: false, error: "Không thể tải danh sách đề thi." };
  }
}

/**
 * Lấy thông tin chi tiết đề thi trước khi bắt đầu
 */
export async function getTestDetailAction(slug: string) {
  try {
    const session = await getSession();
    const userId = session?.userId;

    const [test] = await db
      .select()
      .from(tests)
      .where(and(eq(tests.slug, slug), eq(tests.isPublished, true)))
      .limit(1);

    if (!test) {
      return { success: false, error: "Không tìm thấy đề thi này." };
    }

    // Lấy lịch sử làm bài đề này của user
    let userAttempts: any[] = [];
    if (userId) {
      userAttempts = await db
        .select()
        .from(testSubmissions)
        .where(
          and(
            eq(testSubmissions.userId, userId),
            eq(testSubmissions.testId, test.id)
          )
        )
        .orderBy(desc(testSubmissions.submittedAt))
        .limit(5);
    }

    return {
      success: true,
      data: {
        test,
        userAttempts,
      },
    };
  } catch (error) {
    console.error("Get test detail error:", error);
    return { success: false, error: "Lỗi tải thông tin đề thi." };
  }
}

/**
 * Lấy đề thi và toàn bộ câu hỏi để làm bài (ẨN ĐÁP ÁN ĐÚNG để bảo mật)
 */
export async function getTestForExamAction(slug: string) {
  try {
    const [test] = await db
      .select()
      .from(tests)
      .where(and(eq(tests.slug, slug), eq(tests.isPublished, true)))
      .limit(1);

    if (!test) {
      return { success: false, error: "Không tìm thấy đề thi." };
    }

    const questions = await db
      .select({
        id: testQuestions.id,
        partNumber: testQuestions.partNumber,
        contextText: testQuestions.contextText,
        questionText: testQuestions.questionText,
        questionType: testQuestions.questionType,
        options: testQuestions.options,
        sortOrder: testQuestions.sortOrder,
      })
      .from(testQuestions)
      .where(eq(testQuestions.testId, test.id))
      .orderBy(asc(testQuestions.sortOrder));

    return {
      success: true,
      data: {
        test,
        questions: questions.map((q) => ({
          ...q,
          options: q.options || [],
        })),
      },
    };
  } catch (error) {
    console.error("Get test for exam error:", error);
    return { success: false, error: "Không thể mở phòng thi." };
  }
}

/**
 * Nộp bài thi, chấm điểm tự động, quy đổi IELTS Band Score và lưu kết quả
 */
export async function submitTestExamAction(
  testId: string,
  answers: Record<string, string>,
  timeSpentSeconds: number
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Bạn cần đăng nhập để nộp bài." };
  }

  try {
    const questions = await db
      .select()
      .from(testQuestions)
      .where(eq(testQuestions.testId, testId))
      .orderBy(asc(testQuestions.sortOrder));

    if (questions.length === 0) {
      return { success: false, error: "Đề thi không có câu hỏi." };
    }

    let correctCount = 0;
    const answersDetail: Record<string, { userAnswer: string; isCorrect: boolean }> =
      {};

    for (const q of questions) {
      const userAns = (answers[q.id] || "").trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      const isCorrect = userAns === correctAns;

      if (isCorrect) correctCount++;

      answersDetail[q.id] = {
        userAnswer: answers[q.id] || "",
        isCorrect,
      };
    }

    const totalQuestions = questions.length;
    const scorePercent = Number(((correctCount / totalQuestions) * 100).toFixed(2));
    const estimatedBand = calculateIeltsBandScore(correctCount, totalQuestions);

    // Lưu vào test_submissions
    const [submission] = await db
      .insert(testSubmissions)
      .values({
        userId: session.userId,
        testId,
        timeSpentSeconds,
        totalCorrect: correctCount,
        totalQuestions,
        scorePercent: String(scorePercent),
        estimatedBand: String(estimatedBand),
        answersDetail,
      })
      .returning();

    // Tích lũy hoạt động luyện thi cho Thú cưng / Chuỗi ngày học
    recordDailyActivityAction("quiz", 1).catch((err) =>
      console.error("Auto record test activity error:", err)
    );

    revalidatePath("/de-thi");
    revalidatePath("/lich-su");

    return {
      success: true,
      submissionId: submission.id,
      correctCount,
      totalQuestions,
      scorePercent,
      estimatedBand,
      feedback: getBandEvaluation(estimatedBand),
    };
  } catch (error) {
    console.error("Submit test exam error:", error);
    return { success: false, error: "Không thể nộp bài thi." };
  }
}

/**
 * Lấy kết quả bài thi chi tiết kèm Lời giải thích (Explanation) từng câu (Study4-style)
 */
export async function getTestSubmissionResultAction(submissionId: string) {
  try {
    const [submission] = await db
      .select()
      .from(testSubmissions)
      .where(eq(testSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return { success: false, error: "Không tìm thấy kết quả bài thi." };
    }

    const [test] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, submission.testId))
      .limit(1);

    const questions = await db
      .select()
      .from(testQuestions)
      .where(eq(testQuestions.testId, submission.testId))
      .orderBy(asc(testQuestions.sortOrder));

    const bandNumber = Number(submission.estimatedBand);
    const feedback = getBandEvaluation(bandNumber);

    return {
      success: true,
      data: {
        submission: {
          ...submission,
          scorePercent: Number(submission.scorePercent),
          estimatedBand: bandNumber,
        },
        test,
        questions: questions.map((q) => {
          const detail = submission.answersDetail[q.id];
          return {
            id: q.id,
            partNumber: q.partNumber,
            contextText: q.contextText,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sortOrder: q.sortOrder,
            userAnswer: detail?.userAnswer || "",
            isCorrect: Boolean(detail?.isCorrect),
          };
        }),
        feedback,
      },
    };
  } catch (error) {
    console.error("Get test submission result error:", error);
    return { success: false, error: "Không thể tải kết quả bài thi." };
  }
}

