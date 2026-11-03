"use server";

import { db, pool } from "@/db";
import { userWordProgress, words, topics } from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface StudyWordItem {
  id: string;
  topicId: string;
  word: string;
  partOfSpeech: string | null;
  meaning: string;
  pronunciation: string | null;
  synonyms: string[];
  isKnown: boolean;
  reviewCount: number;
}

/**
 * Đánh dấu trạng thái "Đã thuộc" hoặc "Chưa thuộc" cho một từ vựng
 * Tự động tạo mới hoặc cập nhật bản ghi trong user_word_progress
 */
export async function toggleWordKnownAction(wordId: string, isKnown: boolean) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Bạn cần đăng nhập để lưu tiến độ học tập." };
  }

  const userId = session.userId;

  try {
    const client = await pool.connect();
    try {
      // Upsert vào user_word_progress
      const query = `
        INSERT INTO user_word_progress (user_id, word_id, is_known, last_reviewed_at, review_count, updated_at)
        VALUES ($1, $2, $3, NOW(), 1, NOW())
        ON CONFLICT (user_id, word_id)
        DO UPDATE SET
          is_known = EXCLUDED.is_known,
          last_reviewed_at = NOW(),
          review_count = user_word_progress.review_count + 1,
          updated_at = NOW()
        RETURNING is_known, review_count;
      `;
      const res = await client.query(query, [userId, wordId, isKnown]);
      const row = res.rows[0];

      revalidatePath("/chu-de");
      return {
        success: true,
        isKnown: Boolean(row?.is_known),
        reviewCount: Number(row?.review_count || 1),
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Toggle word known error:", error);
    return { success: false, error: "Không thể lưu tiến độ học tập." };
  }
}

/**
 * Đặt lại trạng thái tiến độ của toàn bộ chủ đề cho học viên (Học lại từ đầu)
 */
export async function resetTopicProgressAction(topicId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(
        `
        UPDATE user_word_progress
        SET is_known = false, updated_at = NOW()
        WHERE user_id = $1 AND word_id IN (
          SELECT id FROM words WHERE topic_id = $2
        )
      `,
        [session.userId, topicId]
      );

      revalidatePath("/chu-de");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset topic progress error:", error);
    return { success: false, error: "Lỗi khi thiết lập lại tiến độ." };
  }
}

