"use server";

import { db, pool } from "@/db";
import { userPets, petSpecies, dailyActivityLog, UserPet, PetSpecies } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  calculateStage,
  getTodayDateString,
  getStreakStatus,
  calculateStreakAfterBreak,
  isSpeciesUnlocked,
  STAGE_DETAILS,
  PET_DIALOGUES,
  StageDetail,
} from "@/lib/pet/streak-calculator";

export interface ActivePetSummary {
  pet: UserPet;
  species: PetSpecies;
  stageDetail: StageDetail;
  isTodayCompleted: boolean;
  isBroken: boolean;
  missedDays: number;
  dialogue: string;
}

export interface SpeciesWithStatus extends PetSpecies {
  isUnlocked: boolean;
  isAdopted: boolean;
}

/**
 * Lấy thú cưng đang hoạt động của người dùng
 */
export async function getActivePetAction(): Promise<{
  success: boolean;
  data: ActivePetSummary | null;
  error?: string;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, data: null, error: "Chưa đăng nhập." };
  }

  try {
    const todayStr = getTodayDateString();

    // Query active pet with species join
    const rows = await db
      .select({
        pet: userPets,
        species: petSpecies,
      })
      .from(userPets)
      .innerJoin(petSpecies, eq(userPets.speciesId, petSpecies.id))
      .where(and(eq(userPets.userId, session.userId), eq(userPets.isActive, true)))
      .limit(1);

    if (rows.length === 0) {
      // Kiểm tra xem có pet nào không
      const anyPet = await db
        .select({
          pet: userPets,
          species: petSpecies,
        })
        .from(userPets)
        .innerJoin(petSpecies, eq(userPets.speciesId, petSpecies.id))
        .where(eq(userPets.userId, session.userId))
        .orderBy(desc(userPets.updatedAt))
        .limit(1);

      if (anyPet.length === 0) {
        return { success: true, data: null };
      }

      // Kích hoạt pet đầu tiên tìm thấy
      await db
        .update(userPets)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(userPets.id, anyPet[0].pet.id));

      rows.push(anyPet[0]);
    }

    const { pet, species } = rows[0];
    const status = getStreakStatus(pet.lastActivityDate, todayStr);
    const stageDetail = STAGE_DETAILS[pet.stage] || STAGE_DETAILS.egg;

    // Chọn câu thoại phù hợp
    const dialoguePool = PET_DIALOGUES[species.id] || PET_DIALOGUES.owl;
    let dialogue = dialoguePool.greeting[0];
    if (status.isBroken) {
      dialogue = dialoguePool.sad[0] || dialogue;
    } else if (status.isTodayCompleted) {
      dialogue = dialoguePool.happy[0] || dialogue;
    } else {
      dialogue = dialoguePool.waiting[0] || dialogue;
    }

    return {
      success: true,
      data: {
        pet,
        species,
        stageDetail,
        isTodayCompleted: status.isTodayCompleted,
        isBroken: status.isBroken,
        missedDays: status.missedDays,
        dialogue,
      },
    };
  } catch (error) {
    console.error("Get active pet error:", error);
    return { success: false, data: null, error: "Không thể lấy thông tin thú cưng." };
  }
}

/**
 * Lấy tất cả thú cưng của học viên
 */
export async function getAllUserPetsAction(): Promise<{
  success: boolean;
  data: Array<{ pet: UserPet; species: PetSpecies; stageDetail: StageDetail }>;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, data: [] };
  }

  try {
    const rows = await db
      .select({
        pet: userPets,
        species: petSpecies,
      })
      .from(userPets)
      .innerJoin(petSpecies, eq(userPets.speciesId, petSpecies.id))
      .where(eq(userPets.userId, session.userId))
      .orderBy(desc(userPets.isActive), desc(userPets.updatedAt));

    const result = rows.map(({ pet, species }) => ({
      pet,
      species,
      stageDetail: STAGE_DETAILS[pet.stage] || STAGE_DETAILS.egg,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get all user pets error:", error);
    return { success: false, data: [] };
  }
}

/**
 * Lấy danh sách tất cả loài pet cùng trạng thái mở khoá cho học viên
 */
export async function getSpeciesCatalogAction(): Promise<{
  success: boolean;
  data: SpeciesWithStatus[];
  highestStreak: number;
}> {
  const session = await getSession();

  try {
    // 1. Lấy tất cả loài pet
    const speciesList = await db
      .select()
      .from(petSpecies)
      .where(eq(petSpecies.isActive, true))
      .orderBy(petSpecies.sortOrder);

    let highestStreak = 0;
    const adoptedSpeciesSet = new Set<string>();

    if (session) {
      // 2. Tìm kỷ lục streak cao nhất và các pet đã nhận
      const userPetRows = await db
        .select({
          speciesId: userPets.speciesId,
          longestStreak: userPets.longestStreak,
          currentStreak: userPets.currentStreak,
        })
        .from(userPets)
        .where(eq(userPets.userId, session.userId));

      userPetRows.forEach((p) => {
        adoptedSpeciesSet.add(p.speciesId);
        if (p.longestStreak > highestStreak) highestStreak = p.longestStreak;
        if (p.currentStreak > highestStreak) highestStreak = p.currentStreak;
      });
    }

    const result: SpeciesWithStatus[] = speciesList.map((sp) => ({
      ...sp,
      isUnlocked: isSpeciesUnlocked(sp.unlockCondition, highestStreak),
      isAdopted: adoptedSpeciesSet.has(sp.id),
    }));

    return { success: true, data: result, highestStreak };
  } catch (error) {
    console.error("Get species catalog error:", error);
    return { success: false, data: [], highestStreak: 0 };
  }
}

/**
 * Nhận một quả trứng thú cưng mới
 */
export async function adoptPetAction(params: {
  speciesId: string;
  petName: string;
}): Promise<{ success: boolean; petId?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Bạn cần đăng nhập để nhận thú cưng." };
  }

  const { speciesId, petName } = params;
  const cleanName = petName?.trim();

  if (!cleanName || cleanName.length < 1 || cleanName.length > 30) {
    return { success: false, error: "Tên thú cưng phải từ 1 đến 30 ký tự." };
  }

  try {
    // Kiểm tra loài pet hợp lệ
    const [species] = await db
      .select()
      .from(petSpecies)
      .where(and(eq(petSpecies.id, speciesId), eq(petSpecies.isActive, true)))
      .limit(1);

    if (!species) {
      return { success: false, error: "Loài thú cưng không tồn tại." };
    }

    // Kiểm tra điều kiện mở khoá
    const userPetsList = await db
      .select({ longestStreak: userPets.longestStreak, currentStreak: userPets.currentStreak })
      .from(userPets)
      .where(eq(userPets.userId, session.userId));

    let maxStreak = 0;
    userPetsList.forEach((p) => {
      if (p.longestStreak > maxStreak) maxStreak = p.longestStreak;
      if (p.currentStreak > maxStreak) maxStreak = p.currentStreak;
    });

    if (!isSpeciesUnlocked(species.unlockCondition, maxStreak)) {
      return {
        success: false,
        error: `Bạn chưa đủ điều kiện mở khoá loài ${species.name}.`,
      };
    }

    // Thực hiện trong transaction: chuyển các pet cũ thành inactive, tạo pet mới active
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE user_pets SET is_active = false, updated_at = NOW() WHERE user_id = $1`,
        [session.userId]
      );

      const insertRes = await client.query(
        `INSERT INTO user_pets (user_id, species_id, pet_name, stage, current_streak, longest_streak, total_days_active, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'egg', 0, 0, 0, true, NOW(), NOW())
         RETURNING id`,
        [session.userId, speciesId, cleanName]
      );

      await client.query("COMMIT");

      revalidatePath("/thu-cung");
      revalidatePath("/chu-de");
      revalidatePath("/");

      return { success: true, petId: insertRes.rows[0].id };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Adopt pet error:", error);
    return { success: false, error: "Không thể nhận thú cưng lúc này." };
  }
}

/**
 * Đổi pet đang active
 */
export async function setActivePetAction(petId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Chưa đăng nhập." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Xác nhận pet thuộc về user
    const checkRes = await client.query(
      `SELECT id FROM user_pets WHERE id = $1 AND user_id = $2`,
      [petId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Không tìm thấy thú cưng." };
    }

    // Chuyển toàn bộ về inactive
    await client.query(
      `UPDATE user_pets SET is_active = false, updated_at = NOW() WHERE user_id = $1`,
      [session.userId]
    );

    // Kích hoạt pet được chọn
    await client.query(
      `UPDATE user_pets SET is_active = true, updated_at = NOW() WHERE id = $1`,
      [petId]
    );

    await client.query("COMMIT");

    revalidatePath("/thu-cung");
    revalidatePath("/chu-de");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Set active pet error:", err);
    return { success: false, error: "Không thể chọn thú cưng." };
  } finally {
    client.release();
  }
}

/**
 * Đổi tên thú cưng
 */
export async function renamePetAction(
  petId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Chưa đăng nhập." };
  }

  const cleanName = newName?.trim();
  if (!cleanName || cleanName.length < 1 || cleanName.length > 30) {
    return { success: false, error: "Tên mới phải từ 1 đến 30 ký tự." };
  }

  try {
    await db
      .update(userPets)
      .set({ petName: cleanName, updatedAt: new Date() })
      .where(and(eq(userPets.id, petId), eq(userPets.userId, session.userId)));

    revalidatePath("/thu-cung");
    return { success: true };
  } catch (error) {
    console.error("Rename pet error:", error);
    return { success: false, error: "Không thể đổi tên thú cưng." };
  }
}

/**
 * Ghi nhận hoạt động học tập hàng ngày và tự động cập nhật streak/tiến hoá pet
 * Được gọi khi học viên lật flashcard hoặc hoàn thành bài quiz
 */
export async function recordDailyActivityAction(
  type: "word" | "quiz",
  count = 1,
  timeSpentSeconds = 0
): Promise<{
  success: boolean;
  streakUpdated: boolean;
  didEvolve: boolean;
  newStreak?: number;
  newStage?: string;
  petName?: string;
  speciesName?: string;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, streakUpdated: false, didEvolve: false };
  }

  const userId = session.userId;
  const todayStr = getTodayDateString();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Cập nhật bảng nhật ký daily_activity_log
    const incWord = type === "word" ? count : 0;
    const incQuiz = type === "quiz" ? count : 0;

    await client.query(
      `
      INSERT INTO daily_activity_log (user_id, activity_date, words_studied, quizzes_completed, time_spent_seconds, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, activity_date)
      DO UPDATE SET
        words_studied = daily_activity_log.words_studied + EXCLUDED.words_studied,
        quizzes_completed = daily_activity_log.quizzes_completed + EXCLUDED.quizzes_completed,
        time_spent_seconds = daily_activity_log.time_spent_seconds + EXCLUDED.time_spent_seconds;
      `,
      [userId, todayStr, incWord, incQuiz, timeSpentSeconds]
    );

    // 2. Tìm active pet của user
    const petRes = await client.query(
      `
      SELECT p.id, p.pet_name, p.stage, p.current_streak, p.longest_streak, p.total_days_active, p.last_activity_date, s.name as species_name
      FROM user_pets p
      INNER JOIN pet_species s ON p.species_id = s.id
      WHERE p.user_id = $1 AND p.is_active = true
      LIMIT 1;
      `,
      [userId]
    );

    let activePet = petRes.rows[0];

    // Nếu user chưa có pet nào, tự động nhận Cú Tri Thức làm pet đầu tiên
    if (!activePet) {
      const defaultSpeciesRes = await client.query(
        `SELECT id, name FROM pet_species WHERE id = 'owl' LIMIT 1;`
      );
      if (defaultSpeciesRes.rows.length > 0) {
        const createDefaultRes = await client.query(
          `
          INSERT INTO user_pets (user_id, species_id, pet_name, stage, current_streak, longest_streak, total_days_active, is_active, created_at, updated_at)
          VALUES ($1, 'owl', 'Cú Tri Thức', 'egg', 0, 0, 0, true, NOW(), NOW())
          RETURNING id, pet_name, stage, current_streak, longest_streak, total_days_active, last_activity_date;
          `,
          [userId]
        );
        activePet = {
          ...createDefaultRes.rows[0],
          species_name: defaultSpeciesRes.rows[0].name,
        };
      }
    }

    if (!activePet) {
      await client.query("COMMIT");
      return { success: true, streakUpdated: false, didEvolve: false };
    }

    // 3. Kiểm tra xem hôm nay đã tính chuỗi ngày học chưa
    if (activePet.last_activity_date === todayStr) {
      // Hôm nay đã ghi nhận streak trước đó, không tăng lặp lại
      await client.query("COMMIT");
      return {
        success: true,
        streakUpdated: false,
        didEvolve: false,
        newStreak: activePet.current_streak,
        newStage: activePet.stage,
        petName: activePet.pet_name,
        speciesName: activePet.species_name,
      };
    }

    // 4. Tính toán streak mới
    const status = getStreakStatus(activePet.last_activity_date, todayStr);
    let newStreak: number;

    if (status.isBroken) {
      const recoveredBase = calculateStreakAfterBreak(activePet.current_streak, status.missedDays);
      newStreak = recoveredBase + 1;
    } else {
      newStreak = activePet.current_streak + 1;
    }

    const newLongest = Math.max(newStreak, activePet.longest_streak);
    const newTotalDays = (activePet.total_days_active || 0) + 1;
    const newStage = calculateStage(newStreak);
    const didEvolve = newStage !== activePet.stage;

    // 5. Cập nhật trạng thái pet
    await client.query(
      `
      UPDATE user_pets
      SET
        current_streak = $1,
        longest_streak = $2,
        total_days_active = $3,
        last_activity_date = $4,
        stage = $5,
        updated_at = NOW()
      WHERE id = $6;
      `,
      [newStreak, newLongest, newTotalDays, todayStr, newStage, activePet.id]
    );

    await client.query("COMMIT");

    revalidatePath("/thu-cung");
    revalidatePath("/chu-de");
    revalidatePath("/");

    return {
      success: true,
      streakUpdated: true,
      didEvolve,
      newStreak,
      newStage,
      petName: activePet.pet_name,
      speciesName: activePet.species_name,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Record daily activity error:", error);
    return { success: false, streakUpdated: false, didEvolve: false };
  } finally {
    client.release();
  }
}

/**
 * Lấy lịch sử hoạt động 30 ngày gần nhất để vẽ calendar heatmap
 */
export async function getRecentActivityLogsAction(days = 30): Promise<{
  success: boolean;
  data: Array<{ date: string; words: number; quizzes: number; timeSpent: number }>;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, data: [] };
  }

  try {
    const res = await pool.query(
      `
      SELECT activity_date, words_studied, quizzes_completed, time_spent_seconds
      FROM daily_activity_log
      WHERE user_id = $1
      ORDER BY activity_date DESC
      LIMIT $2;
      `,
      [session.userId, days]
    );

    const data = res.rows.map((r) => ({
      date: r.activity_date,
      words: Number(r.words_studied || 0),
      quizzes: Number(r.quizzes_completed || 0),
      timeSpent: Number(r.time_spent_seconds || 0),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Get recent activity error:", error);
    return { success: false, data: [] };
  }
}

