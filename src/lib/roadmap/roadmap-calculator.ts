/**
 * Tính toán tiến độ học tập lộ trình (Từ vựng & Ngữ pháp)
 * và kiểm tra điều kiện vượt chặng / mở khóa
 */

export interface StageProgressResult {
  totalItems: number;
  completedItems: number;
  percent: number;
  isEligibleForMilestone: boolean;
  requiredPercent: number;
}

/**
 * Tính % tiến độ hoàn thành các bài học / từ vựng của chặng
 */
export function calculateStageProgress(
  completedCount: number,
  totalCount: number,
  requiredPercent = 80
): StageProgressResult {
  if (totalCount <= 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      percent: 0,
      isEligibleForMilestone: false,
      requiredPercent,
    };
  }

  const clampedCompleted = Math.max(0, Math.min(completedCount, totalCount));
  const percent = Math.round((clampedCompleted / totalCount) * 100);

  return {
    totalItems: totalCount,
    completedItems: clampedCompleted,
    percent,
    isEligibleForMilestone: percent >= requiredPercent,
    requiredPercent,
  };
}

/**
 * Kiểm tra xem chặng có được mở khóa không
 * Chặng 1 luôn mở mặc định (stageNumber === 1).
 * Các chặng sau mở khi chặng trước đã hoàn thành.
 */
export function isStageUnlocked(
  stageNumber: number,
  isPreviousCompleted: boolean,
  isExplicitlyUnlocked = false
): boolean {
  if (stageNumber <= 1) return true;
  if (isExplicitlyUnlocked) return true;
  return isPreviousCompleted;
}

/**
 * Đánh giá kết quả bài thi kiểm tra chặng (Milestone Test)
 */
export function evaluateMilestoneTest(
  scorePercent: number,
  requiredScorePercent = 80
): { isPassed: boolean; message: string } {
  const isPassed = scorePercent >= requiredScorePercent;
  return {
    isPassed,
    message: isPassed
      ? `Chúc mừng! Bạn đã đạt ${scorePercent}% điểm và vượt qua chặng thành công!`
      : `Bạn đạt ${scorePercent}%, cần tối thiểu ${requiredScorePercent}% để hoàn thành chặng. Hãy ôn tập thêm và thử lại nhé!`,
  };
}

