"use server";

import { db, pool } from "@/db";
import {
  grammarLessons,
  grammarExercises,
  userGrammarProgress,
  roadmapStages,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { recordDailyActivityAction } from "@/actions/pet";

export interface GrammarLessonDetail {
  lesson: {
    id: string;
    stageId: string;
    title: string;
    slug: string;
    targetBand: string | null;
    summary: string;
    theoryMarkdown: string;
    tips: string | null;
    estimatedMinutes: number;
    stageName?: string | null;
  };
  exercises: Array<{
    id: string;
    question: string;
    questionType: "multiple_choice" | "fill_blank";
    options: string[];
    sortOrder: number;
  }>;
  userProgress?: {
    isCompleted: boolean;
    exerciseScore: number;
    lastStudiedAt: Date | null;
  };
}

/**
 * Lấy chi tiết bài học ngữ pháp và danh sách bài tập (ẩn đáp án đúng để học viên tự làm)
 */
export async function getGrammarLessonDetailAction(
  slug: string
): Promise<{ success: boolean; data?: GrammarLessonDetail; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId;

    const [lesson] = await db
      .select({
        id: grammarLessons.id,
        stageId: grammarLessons.stageId,
        title: grammarLessons.title,
        slug: grammarLessons.slug,
        targetBand: grammarLessons.targetBand,
        summary: grammarLessons.summary,
        theoryMarkdown: grammarLessons.theoryMarkdown,
        tips: grammarLessons.tips,
        estimatedMinutes: grammarLessons.estimatedMinutes,
        stageName: roadmapStages.name,
      })
      .from(grammarLessons)
      .leftJoin(roadmapStages, eq(grammarLessons.stageId, roadmapStages.id))
      .where(eq(grammarLessons.slug, slug))
      .limit(1);

    if (!lesson) {
      return { success: false, error: "Không tìm thấy bài học ngữ pháp này." };
    }

    const exercises = await db
      .select({
        id: grammarExercises.id,
        question: grammarExercises.question,
        questionType: grammarExercises.questionType,
        options: grammarExercises.options,
        sortOrder: grammarExercises.sortOrder,
      })
      .from(grammarExercises)
      .where(eq(grammarExercises.lessonId, lesson.id))
      .orderBy(asc(grammarExercises.sortOrder));

    let userProgress;
    if (userId) {
      const [prog] = await db
        .select()
        .from(userGrammarProgress)
        .where(
          and(
            eq(userGrammarProgress.userId, userId),
            eq(userGrammarProgress.lessonId, lesson.id)
          )
        )
        .limit(1);

      if (prog) {
        userProgress = {
          isCompleted: prog.isCompleted,
          exerciseScore: prog.exerciseScore,
          lastStudiedAt: prog.lastStudiedAt,
        };
      }
    }

    return {
      success: true,
      data: {
        lesson,
        exercises: exercises.map((e) => ({
          ...e,
          options: e.options || [],
        })),
        userProgress,
      },
    };
  } catch (error) {
    console.error("Get grammar lesson detail error:", error);
    return { success: false, error: "Lỗi tải nội dung bài học." };
  }
}

/**
 * Nộp bài tập thực hành ngữ pháp, chấm điểm và trả về lời giải thích chi tiết
 */
export async function submitGrammarExerciseAction(
  lessonId: string,
  answers: Record<string, string>
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Vui lòng đăng nhập để lưu kết quả." };
  }

  try {
    const exercises = await db
      .select()
      .from(grammarExercises)
      .where(eq(grammarExercises.lessonId, lessonId))
      .orderBy(asc(grammarExercises.sortOrder));

    if (exercises.length === 0) {
      return { success: false, error: "Bài học chưa có bài tập." };
    }

    let correctCount = 0;
    const results: Record<
      string,
      {
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        explanation: string;
      }
    > = {};

    for (const ex of exercises) {
      const userAns = (answers[ex.id] || "").trim().toLowerCase();
      const correctAns = ex.correctAnswer.trim().toLowerCase();
      const isCorrect = userAns === correctAns;

      if (isCorrect) correctCount++;

      results[ex.id] = {
        userAnswer: answers[ex.id] || "",
        correctAnswer: ex.correctAnswer,
        isCorrect,
        explanation: ex.explanation,
      };
    }

    const totalQuestions = exercises.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isCompleted = scorePercent >= 70; // Đạt ≥ 70% là hoàn thành bài học

    // Lưu vào user_grammar_progress
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO user_grammar_progress (user_id, lesson_id, is_completed, exercise_score, last_studied_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET
          is_completed = CASE WHEN EXCLUDED.is_completed THEN true ELSE user_grammar_progress.is_completed END,
          exercise_score = GREATEST(user_grammar_progress.exercise_score, EXCLUDED.exercise_score),
          last_studied_at = NOW();
      `,
        [session.userId, lessonId, isCompleted, scorePercent]
      );

      // Tích lũy hoạt động cho Thú cưng / Chuỗi ngày học
      recordDailyActivityAction("word", 1).catch((err) =>
        console.error("Auto record grammar activity error:", err)
      );

      revalidatePath("/lo-trinh");

      return {
        success: true,
        correctCount,
        totalQuestions,
        scorePercent,
        isCompleted,
        results,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Submit grammar exercise error:", error);
    return { success: false, error: "Không thể chấm điểm bài tập." };
  }
}
