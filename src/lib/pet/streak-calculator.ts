import { PetStage, PetSpeciesId } from "@/db/schema";

export type { PetStage, PetSpeciesId };

export interface StageDetail {
  stage: PetStage;
  label: string;
  minStreak: number;
  maxStreak: number | null;
  description: string;
  emoji: string;
}

export const STAGE_DETAILS: Record<PetStage, StageDetail> = {
  egg: {
    stage: "egg",
    label: "Quả Trứng",
    minStreak: 0,
    maxStreak: 3,
    description: "Quả trứng đang được ấp bởi lòng kiên trì và chăm chỉ mỗi ngày.",
    emoji: "🥚",
  },
  hatchling: {
    stage: "hatchling",
    label: "Sơ Sinh",
    minStreak: 4,
    maxStreak: 7,
    description: "Vỏ trứng vừa nứt vỡ! Thú cưng bé nhỏ cất tiếng chào thế giới từ vựng.",
    emoji: "🐣",
  },
  baby: {
    stage: "baby",
    label: "Bé Con",
    minStreak: 8,
    maxStreak: 14,
    description: "Bé con bắt đầu biết lật giở những trang sách đầu tiên.",
    emoji: "🐥",
  },
  teen: {
    stage: "teen",
    label: "Thiếu Niên",
    minStreak: 15,
    maxStreak: 30,
    description: "Người bạn đồng hành chăm chỉ, say mê học tập cùng bạn thâu đêm.",
    emoji: "🧒",
  },
  adult: {
    stage: "adult",
    label: "Trưởng Thành",
    minStreak: 31,
    maxStreak: 59,
    description: "Phong thái học giả đĩnh đạc với chiếc mũ tốt nghiệp danh giá.",
    emoji: "🎓",
  },
  legendary: {
    stage: "legendary",
    label: "Huyền Thoại",
    minStreak: 60,
    maxStreak: null,
    description: "Cốt cách uyên bác tối thượng với vầng hào quang tri thức rực rỡ.",
    emoji: "👑",
  },
};

/**
 * Tính stage của pet dựa vào số ngày streak hiện tại
 */
export function calculateStage(streak: number): PetStage {
  if (streak >= 60) return "legendary";
  if (streak >= 31) return "adult";
  if (streak >= 15) return "teen";
  if (streak >= 8) return "baby";
  if (streak >= 4) return "hatchling";
  return "egg";
}

/**
 * Lấy ngày hôm nay theo format YYYY-MM-DD theo múi giờ chỉ định hoặc local
 */
export function getTodayDateString(timeZone = "Asia/Ho_Chi_Minh"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Tính khoảng cách số ngày giữa 2 chuỗi YYYY-MM-DD
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00Z");
  const d2 = new Date(dateStr2 + "T00:00:00Z");
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface StreakStatus {
  isTodayCompleted: boolean;
  isYesterdayActive: boolean;
  isBroken: boolean;
  missedDays: number;
}

/**
 * Phân tích trạng thái streak dựa trên ngày hoạt động gần nhất so với hôm nay
 */
export function getStreakStatus(
  lastActivityDate: string | null,
  todayStr: string = getTodayDateString()
): StreakStatus {
  if (!lastActivityDate) {
    return {
      isTodayCompleted: false,
      isYesterdayActive: false,
      isBroken: false,
      missedDays: 0,
    };
  }

  const diff = getDaysDifference(todayStr, lastActivityDate);

  if (diff === 0) {
    // Đã học hôm nay
    return {
      isTodayCompleted: true,
      isYesterdayActive: false,
      isBroken: false,
      missedDays: 0,
    };
  }

  if (diff === 1) {
    // Hôm qua đã học, hôm nay chưa học (streak vẫn bảo toàn)
    return {
      isTodayCompleted: false,
      isYesterdayActive: true,
      isBroken: false,
      missedDays: 0,
    };
  }

  // Quên học ít nhất 1 ngày (diff >= 2)
  const missedDays = diff - 1;
  return {
    isTodayCompleted: false,
    isYesterdayActive: false,
    isBroken: true,
    missedDays,
  };
}

/**
 * Tính số streak sau khi bị gián đoạn (nhân văn, không xóa trắng nếu chỉ quên 1-3 ngày)
 */
export function calculateStreakAfterBreak(currentStreak: number, missedDays: number): number {
  if (missedDays <= 0) return currentStreak;
  if (missedDays === 1) {
    // Quên đúng 1 ngày: chỉ giảm nhẹ 3 ngày
    return Math.max(0, currentStreak - 3);
  }
  if (missedDays <= 3) {
    // Quên 2-3 ngày: giảm 50%
    return Math.max(0, Math.floor(currentStreak * 0.5));
  }
  // Quên trên 3 ngày: bắt đầu chu kỳ ấp mới
  return 0;
}

/**
 * Kiểm tra xem loài pet có đủ điều kiện mở khoá hay không
 */
export function isSpeciesUnlocked(unlockCondition: string, highestStreak: number): boolean {
  if (unlockCondition === "free") return true;
  if (unlockCondition === "streak_7") return highestStreak >= 7;
  if (unlockCondition === "streak_14") return highestStreak >= 14;
  if (unlockCondition === "streak_30") return highestStreak >= 30;
  return false;
}

/**
 * Danh sách câu thoại động viên của từng loài thú cưng
 */
export const PET_DIALOGUES: Record<
  string,
  {
    greeting: string[];
    happy: string[];
    waiting: string[];
    sad: string[];
    evolved: string;
  }
> = {
  owl: {
    greeting: [
      "Chào bạn! Cú Tri Thức đã sẵn sàng cùng bạn mở trang sách mới.",
      "Đêm nay trăng thanh gió mát, học từ vựng thôi nào!",
    ],
    happy: [
      "Tuyệt vời lắm! Mỗi từ vựng ghi nhớ là thêm một bước chạm vào ước mơ IELTS.",
      "Cú thấy sự tiến bộ rõ rệt trong từng câu trả lời của bạn!",
    ],
    waiting: [
      "Hôm nay bạn chưa nạp từ vựng nào đấy! Đừng để chuỗi ngày học bị gián đoạn nhé.",
      "Cú đang giữ sách chờ bạn ghé qua nè!",
    ],
    sad: [
      "Hôm qua Cú đã nhớ bạn cả ngày... Cùng bắt đầu lại thật mạnh mẽ nhé!",
    ],
    evolved: "Chúc mừng! Cú Tri Thức vừa tiến hoá sang tầm cao mới nhờ lòng kiên trì của bạn!",
  },
  cat: {
    greeting: [
      "Meo meo~ Mèo Văn Chương đang cuộn tròn trên cuốn từ điển chờ bạn.",
      "Trang sách ấm áp này dành riêng cho bạn hôm nay đó!",
    ],
    happy: [
      "Meo~ Bạn học giỏi quá, thưởng cho bạn một tiếng meo êm dịu!",
      "Mèo đã lật sẵn trang bài học tiếp theo rồi nè.",
    ],
    waiting: [
      "Meo... bạn đi đâu lâu thế? Mau vào luyện vài từ với Mèo đi nào.",
      "Mèo buồn ngủ rồi nhưng vẫn cố đợi bạn học xong hôm nay!",
    ],
    sad: [
      "Mèo ngồi bên cửa sổ ngóng bạn cả ngày hôm qua...",
    ],
    evolved: "Meo diệu kỳ! Mèo Văn Chương đã vươn mình tiến hoá rực rỡ!",
  },
  bunny: {
    greeting: [
      "Nhảy lò cò tới giờ học rồi! Thỏ Siêng Năng đã mài nhọn ngòi bút!",
      "Nhanh như thỏ, vững vàng như núi, cùng học nhé!",
    ],
    happy: [
      "Hoan hô! Tốc độ tiếp thu của bạn nhanh như đôi chân thỏ vậy!",
      "Bút viết hôm nay nở hoa rồi, quá xuất sắc!",
    ],
    waiting: [
      "Đôi tai thỏ đang vểnh lên ngóng bước chân bạn vào học nè!",
      "Chỉ 5 phút thôi cũng được, đừng bỏ qua ngày hôm nay nhé!",
    ],
    sad: [
      "Hôm qua thiếu bạn, trang vở của Thỏ bị bỏ trống mất rồi...",
    ],
    evolved: "Cực kỳ bất ngờ! Thỏ Siêng Năng đã bứt phá tiến hoá thần tốc!",
  },
  dragon: {
    greeting: [
      "Rồng Ngôn Ngữ thức giấc! Cùng phun ra những câu chữ quyền uy nào!",
      "Ngọn lửa tri thức trong rồng con đang bùng cháy!",
    ],
    happy: [
      "Hào khí ngút trời! Vốn từ vựng của bạn ngày càng hùng hậu!",
      "Lửa trí tuệ đã thắp sáng chặng đường IELTS của bạn!",
    ],
    waiting: [
      "Ngọn lửa của Rồng đang cần bạn tiếp thêm củi kiến thức hôm nay!",
      "Rồng không cho phép bạn lười biếng đâu đấy nhé!",
    ],
    sad: [
      "Ngọn lửa suýt tắt vì bạn vắng mặt hôm qua... Mau thắp lại nào!",
    ],
    evolved: "Gầm vang trời cao! Rồng Ngôn Ngữ đã thức tỉnh sức mạnh tiến hoá huyền thoại!",
  },
  fox: {
    greeting: [
      "Cáo Thông Minh đã tìm ra chiến thuật học siêu nhanh cho hôm nay!",
      "Học thông minh thay vì học vẹt, bắt đầu thôi bạn ơi!",
    ],
    happy: [
      "Trí nhớ siêu phàm! Cách bạn phản xạ từ vựng thật đáng nể!",
      "Cáo chấm cho bạn 10/10 điểm sắc bén hôm nay!",
    ],
    waiting: [
      "Chiến lược học của Cáo hôm nay đang chờ bạn thực thi đó!",
      "Bỏ một ngày là quên mất 20% đấy, vào ôn ngay đi!",
    ],
    sad: [
      "Cáo tính toán hết mọi việc, chỉ không tính được là bạn quên vào học...",
    ],
    evolved: "Tuyệt đỉnh trí tuệ! Cáo Thông Minh đã tiến hoá lên hình thái kiệt xuất!",
  },
  phoenix: {
    greeting: [
      "Phượng Hoàng Bất Khuất dang rộng cánh đón ánh bình minh học thuật!",
      "Dù khó khăn đến đâu, ngọn lửa kiên trì sẽ đưa bạn đến đích!",
    ],
    happy: [
      "Ý chí phi thường! Bạn đang bay cao trên đỉnh cao kiến thức!",
      "Khí chất kiên định này chắc chắn sẽ mang về điểm số mơ ước!",
    ],
    waiting: [
      "Hôm nay bạn chưa cất cánh sao? Phượng hoàng đang đợi bạn bên trang sách!",
      "Đừng để lông cánh bị nguội lạnh, vào học ngay nào!",
    ],
    sad: [
      "Phượng hoàng đã tự tái sinh từ tro tàn để chờ bạn quay lại hôm nay!",
    ],
    evolved: "Hào quang vô tận! Phượng Hoàng Bất Khuất đã tiến hoá thành Linh Vật Thần Thoại!",
  },
};
