"use server";

import { db } from "@/db";
import { words } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { normalizeWord, normalizePartOfSpeech, parseSynonyms } from "@/lib/import/normalizer";
import { revalidatePath } from "next/cache";

export async function createWordAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  const topicId = formData.get("topicId")?.toString();
  const rawWord = formData.get("word")?.toString().trim();
  const rawPos = formData.get("partOfSpeech")?.toString().trim() || null;
  const rawMeaning = formData.get("meaning")?.toString().trim();
  const rawPronunciation = formData.get("pronunciation")?.toString().trim() || null;
  const rawSynonyms = formData.get("synonyms")?.toString().trim() || "";

  if (!topicId || !rawWord || !rawMeaning) {
    return { success: false, error: "Vui lòng nhập chủ đề, từ vựng và nghĩa tiếng Việt." };
  }

  try {
    const wordNormalized = normalizeWord(rawWord);
    const partOfSpeech = normalizePartOfSpeech(rawPos);
    const synonyms = parseSynonyms(rawSynonyms);

    const [newWord] = await db
      .insert(words)
      .values({
        topicId,
        word: rawWord,
        wordNormalized,
        partOfSpeech,
        meaning: rawMeaning,
        pronunciation: rawPronunciation,
        synonyms,
      })
      .onConflictDoNothing()
      .returning();

    if (!newWord) {
      return {
        success: false,
        error: "Từ vựng này đã tồn tại trong chủ đề (trùng từ và loại từ).",
      };
    }

    revalidatePath("/admin/tu-vung");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Create word error:", err);
    return { success: false, error: "Lỗi khi thêm từ vựng mới." };
  }
}

export async function updateWordAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  const id = formData.get("id")?.toString();
  const rawWord = formData.get("word")?.toString().trim();
  const rawPos = formData.get("partOfSpeech")?.toString().trim() || null;
  const rawMeaning = formData.get("meaning")?.toString().trim();
  const rawPronunciation = formData.get("pronunciation")?.toString().trim() || null;
  const rawSynonyms = formData.get("synonyms")?.toString().trim() || "";

  if (!id || !rawWord || !rawMeaning) {
    return { success: false, error: "Từ vựng và nghĩa tiếng Việt không được để trống." };
  }

  try {
    const wordNormalized = normalizeWord(rawWord);
    const partOfSpeech = normalizePartOfSpeech(rawPos);
    const synonyms = parseSynonyms(rawSynonyms);

    await db
      .update(words)
      .set({
        word: rawWord,
        wordNormalized,
        partOfSpeech,
        meaning: rawMeaning,
        pronunciation: rawPronunciation,
        synonyms,
      })
      .where(eq(words.id, id));

    revalidatePath("/admin/tu-vung");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Update word error:", err);
    return { success: false, error: "Lỗi khi cập nhật từ vựng." };
  }
}

/**
 * Xoá cứng từ vựng: hard delete
 * Foreign key CASCADE sẽ tự động xoá toàn bộ bản ghi user_word_progress liên quan
 */
export async function deleteWordAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  try {
    await db.delete(words).where(eq(words.id, id));

    revalidatePath("/admin/tu-vung");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Delete word error:", err);
    return { success: false, error: "Lỗi khi xoá từ vựng." };
  }
}

