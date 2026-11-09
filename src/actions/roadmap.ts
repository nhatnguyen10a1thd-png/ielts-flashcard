"use server";

import { db, pool } from "@/db";
import {
  roadmaps,
  roadmapStages,
  roadmapStageTopics,
  userRoadmapProgress,
  userStageProgress,
  topics,
  words,
  userWordProgress,
  grammarLessons,
  userGrammarProgress,
} from "@/db/schema";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface StageWithProgress {
  id: string;
  roadmapId: string;
  stageNumber: number;
  name: string;
  slug: string;
  bandRange: string;
  description: string | null;
  iconName: string;
  accentColor: string;
  requiredKnownPercent: number;
  requiredQuizScore: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  isEligibleForMilestone: boolean;
  topics?: Array<{
    id: string;
    name: string;
    slug: string;
    wordCount: number;
    knownCount: number;
  }>;
  lessons?: Array<{
    id: string;
    title: string;
    slug: string;
    targetBand: string | null;
    estimatedMinutes: number;
    isCompleted: boolean;
    exerciseScore: number;
  }>;
}

export interface RoadmapDetailResult {
  roadmap: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: "vocabulary" | "grammar";
    targetBand: string | null;
  };
  stages: StageWithProgress[];
  overallProgressPercent: number;
  completedStagesCount: number;
  totalStagesCount: number;
}

/**
 * Lấy lộ trình kèm chi tiết các chặng và tiến độ cá nhân của học viên
 */
export async function getRoadmapWithStagesAction(
  type: "vocabulary" | "grammar" = "vocabulary"
): Promise<{ success: boolean; data?: RoadmapDetailResult; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId;

    // 1. Tìm lộ trình mặc định theo loại
    const [roadmap] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.type, type), eq(roadmaps.isActive, true)))
      .orderBy(asc(roadmaps.sortOrder))
      .limit(1);

    if (!roadmap) {
      return { success: false, error: "Chưa tìm thấy lộ trình phù hợp." };
    }

    // 2. Lấy các chặng của lộ trình
    const stages = await db
      .select()
      .from(roadmapStages)
      .where(eq(roadmapStages.roadmapId, roadmap.id))
      .orderBy(asc(roadmapStages.stageNumber));

    if (stages.length === 0) {
      return {
        success: true,
        data: {
          roadmap,
          stages: [],
          overallProgressPercent: 0,
          completedStagesCount: 0,
          totalStagesCount: 0,
        },
      };
    }

    // 3. Lấy tiến độ các chặng của user nếu đã đăng nhập
    const stageProgressMap = new Map<
      string,
      { isUnlocked: boolean; isCompleted: boolean }
    >();

    if (userId) {
      const userStages = await db
        .select()
        .from(userStageProgress)
        .where(eq(userStageProgress.userId, userId));

      userStages.forEach((us) => {
        stageProgressMap.set(us.stageId, {
          isUnlocked: us.isUnlocked,
          isCompleted: us.isCompleted,
        });
      });
    }

    // 4. Xử lý chi tiết theo từng loại (Vocabulary hoặc Grammar)
    const stagesWithProgress: StageWithProgress[] = [];

    if (type === "vocabulary") {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        // Lấy danh sách topics gán vào chặng này
        const stageTopicsData = await db
          .select({
            topicId: topics.id,
            topicName: topics.name,
            topicSlug: topics.slug,
          })
          .from(roadmapStageTopics)
          .innerJoin(topics, eq(roadmapStageTopics.topicId, topics.id))
          .where(eq(roadmapStageTopics.stageId, stage.id))
          .orderBy(asc(roadmapStageTopics.sortOrder));

        const topicIds = stageTopicsData.map((t) => t.topicId);

        let totalWords = 0;
        let knownWords = 0;
        const topicDetails: Array<{
          id: string;
          name: string;
          slug: string;
          wordCount: number;
          knownCount: number;
        }> = [];

        if (topicIds.length > 0) {
          // Đếm tổng số từ cho từng topic
          const wordCountRes = await db
            .select({
              topicId: words.topicId,
              count: sql<number>`count(${words.id})`,
            })
            .from(words)
            .where(inArray(words.topicId, topicIds))
            .groupBy(words.topicId);

          const wordCountMap = new Map<string, number>();
          wordCountRes.forEach((r) => wordCountMap.set(r.topicId, Number(r.count)));

          // Đếm số từ đã thuộc nếu có userId
          const knownMap = new Map<string, number>();
          if (userId) {
            const knownRes = await db
              .select({
                topicId: words.topicId,
                count: sql<number>`count(distinct ${userWordProgress.wordId})`,
              })
              .from(userWordProgress)
              .innerJoin(words, eq(userWordProgress.wordId, words.id))
              .where(
                and(
                  eq(userWordProgress.userId, userId),
                  eq(userWordProgress.isKnown, true),
                  inArray(words.topicId, topicIds)
                )
              )
              .groupBy(words.topicId);

            knownRes.forEach((r) => knownMap.set(r.topicId, Number(r.count)));
          }

          stageTopicsData.forEach((t) => {
            const wCount = wordCountMap.get(t.topicId) || 0;
            const kCount = knownMap.get(t.topicId) || 0;
            totalWords += wCount;
            knownWords += kCount;
            topicDetails.push({
              id: t.topicId,
              name: t.topicName,
              slug: t.topicSlug,
              wordCount: wCount,
              knownCount: kCount,
            });
          });
        }

        const percent =
          totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0;
        const isEligible = percent >= stage.requiredKnownPercent;

        // Trạng thái mở khóa: Chặng 1 luôn mở, hoặc dựa vào db, hoặc chặng trước đã hoàn thành
        const userProgress = stageProgressMap.get(stage.id);
        const prevCompleted =
          i > 0 ? stagesWithProgress[i - 1].isCompleted : true;
        const isUnlocked =
          stage.stageNumber === 1 ||
          Boolean(userProgress?.isUnlocked) ||
          prevCompleted;
        const isCompleted = Boolean(userProgress?.isCompleted);

        stagesWithProgress.push({
          id: stage.id,
          roadmapId: stage.roadmapId,
          stageNumber: stage.stageNumber,
          name: stage.name,
          slug: stage.slug,
          bandRange: stage.bandRange,
          description: stage.description,
          iconName: stage.iconName,
          accentColor: stage.accentColor,
          requiredKnownPercent: stage.requiredKnownPercent,
          requiredQuizScore: stage.requiredQuizScore,
          isUnlocked,
          isCompleted,
          totalItems: totalWords,
          completedItems: knownWords,
          progressPercent: percent,
          isEligibleForMilestone: isEligible,
          topics: topicDetails,
        });
      }
    } else {
      // type === "grammar"
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        // Lấy danh sách bài học ngữ pháp của chặng
        const lessonsData = await db
          .select()
          .from(grammarLessons)
          .where(eq(grammarLessons.stageId, stage.id))
          .orderBy(asc(grammarLessons.sortOrder));

        const lessonIds = lessonsData.map((l) => l.id);
        const grammarProgressMap = new Map<
          string,
          { isCompleted: boolean; exerciseScore: number }
        >();

        if (userId && lessonIds.length > 0) {
          const userGrammarRes = await db
            .select()
            .from(userGrammarProgress)
            .where(
              and(
                eq(userGrammarProgress.userId, userId),
                inArray(userGrammarProgress.lessonId, lessonIds)
              )
            );

          userGrammarRes.forEach((ug) => {
            grammarProgressMap.set(ug.lessonId, {
              isCompleted: ug.isCompleted,
              exerciseScore: ug.exerciseScore,
            });
          });
        }

        let completedLessons = 0;
        const lessonDetails = lessonsData.map((l) => {
          const prog = grammarProgressMap.get(l.id);
          const isDone = Boolean(prog?.isCompleted);
          if (isDone) completedLessons++;
          return {
            id: l.id,
            title: l.title,
            slug: l.slug,
            targetBand: l.targetBand,
            estimatedMinutes: l.estimatedMinutes,
            isCompleted: isDone,
            exerciseScore: prog?.exerciseScore || 0,
          };
        });

        const totalLessons = lessonsData.length;
        const percent =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        const userProgress = stageProgressMap.get(stage.id);
        const prevCompleted =
          i > 0 ? stagesWithProgress[i - 1].isCompleted : true;
        const isUnlocked =
          stage.stageNumber === 1 ||
          Boolean(userProgress?.isUnlocked) ||
          prevCompleted;
        const isCompleted =
          Boolean(userProgress?.isCompleted) ||
          (totalLessons > 0 && completedLessons === totalLessons);

        stagesWithProgress.push({
          id: stage.id,
          roadmapId: stage.roadmapId,
          stageNumber: stage.stageNumber,
          name: stage.name,
          slug: stage.slug,
          bandRange: stage.bandRange,
          description: stage.description,
          iconName: stage.iconName,
          accentColor: stage.accentColor,
          requiredKnownPercent: stage.requiredKnownPercent,
          requiredQuizScore: stage.requiredQuizScore,
          isUnlocked,
          isCompleted,
          totalItems: totalLessons,
          completedItems: completedLessons,
          progressPercent: percent,
          isEligibleForMilestone: percent >= stage.requiredKnownPercent,
          lessons: lessonDetails,
        });
      }
    }

    const completedCount = stagesWithProgress.filter((s) => s.isCompleted).length;
    const overallPercent =
      stagesWithProgress.length > 0
        ? Math.round((completedCount / stagesWithProgress.length) * 100)
        : 0;

    return {
      success: true,
      data: {
        roadmap,
        stages: stagesWithProgress,
        overallProgressPercent: overallPercent,
        completedStagesCount: completedCount,
        totalStagesCount: stagesWithProgress.length,
      },
    };
  } catch (error) {
    console.error("Get roadmap error:", error);
    return { success: false, error: "Không thể tải dữ liệu lộ trình." };
  }
}

/**
 * Đánh dấu mở khóa hoặc hoàn thành chặng (khi vượt qua bài test chặng)
 */
export async function completeStageAction(stageId: string, milestoneQuizAttemptId?: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Bạn cần đăng nhập để lưu kết quả." };
  }

  try {
    const client = await pool.connect();
    try {
      // Đánh dấu hoàn thành chặng hiện tại
      await client.query(
        `
        INSERT INTO user_stage_progress (user_id, stage_id, is_unlocked, is_completed, milestone_quiz_attempt_id, completed_at, updated_at)
        VALUES ($1, $2, true, true, $3, NOW(), NOW())
        ON CONFLICT (user_id, stage_id)
        DO UPDATE SET
          is_unlocked = true,
          is_completed = true,
          milestone_quiz_attempt_id = COALESCE(EXCLUDED.milestone_quiz_attempt_id, user_stage_progress.milestone_quiz_attempt_id),
          completed_at = NOW(),
          updated_at = NOW();
      `,
        [session.userId, stageId, milestoneQuizAttemptId || null]
      );

      // Tìm chặng tiếp theo để mở khóa
      const currentStageRes = await client.query(
        `SELECT roadmap_id, stage_number FROM roadmap_stages WHERE id = $1;`,
        [stageId]
      );
      if (currentStageRes.rows.length > 0) {
        const { roadmap_id, stage_number } = currentStageRes.rows[0];
        const nextStageRes = await client.query(
          `SELECT id FROM roadmap_stages WHERE roadmap_id = $1 AND stage_number = $2;`,
          [roadmap_id, stage_number + 1]
        );
        if (nextStageRes.rows.length > 0) {
          const nextStageId = nextStageRes.rows[0].id;
          await client.query(
            `
            INSERT INTO user_stage_progress (user_id, stage_id, is_unlocked, is_completed, updated_at)
            VALUES ($1, $2, true, false, NOW())
            ON CONFLICT (user_id, stage_id)
            DO UPDATE SET is_unlocked = true, updated_at = NOW();
          `,
            [session.userId, nextStageId]
          );
        }
      }

      revalidatePath("/lo-trinh");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Complete stage error:", error);
    return { success: false, error: "Không thể cập nhật tiến độ chặng." };
  }
}

