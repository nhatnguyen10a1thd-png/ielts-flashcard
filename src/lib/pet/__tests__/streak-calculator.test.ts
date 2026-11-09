import { describe, it, expect } from "vitest";
import {
  calculateStage,
  getDaysDifference,
  getStreakStatus,
  calculateStreakAfterBreak,
  isSpeciesUnlocked,
  STAGE_DETAILS,
} from "../streak-calculator";

describe("streak-calculator", () => {
  it("calculates stages correctly by streak counts", () => {
    expect(calculateStage(0)).toBe("egg");
    expect(calculateStage(1)).toBe("egg");
    expect(calculateStage(3)).toBe("egg");
    expect(calculateStage(4)).toBe("hatchling");
    expect(calculateStage(7)).toBe("hatchling");
    expect(calculateStage(8)).toBe("baby");
    expect(calculateStage(14)).toBe("baby");
    expect(calculateStage(15)).toBe("teen");
    expect(calculateStage(30)).toBe("teen");
    expect(calculateStage(31)).toBe("adult");
    expect(calculateStage(59)).toBe("adult");
    expect(calculateStage(60)).toBe("legendary");
    expect(calculateStage(120)).toBe("legendary");
  });

  it("calculates day difference between date strings accurately", () => {
    expect(getDaysDifference("2026-11-09", "2026-11-09")).toBe(0);
    expect(getDaysDifference("2026-11-10", "2026-11-09")).toBe(1);
    expect(getDaysDifference("2026-11-15", "2026-11-09")).toBe(6);
    expect(getDaysDifference("2026-12-01", "2026-11-30")).toBe(1);
  });

  it("analyzes streak status properly", () => {
    // Null last activity (new pet/user)
    const newStatus = getStreakStatus(null, "2026-11-09");
    expect(newStatus.isTodayCompleted).toBe(false);
    expect(newStatus.isBroken).toBe(false);

    // Activity done today
    const todayStatus = getStreakStatus("2026-11-09", "2026-11-09");
    expect(todayStatus.isTodayCompleted).toBe(true);
    expect(todayStatus.isBroken).toBe(false);

    // Activity done yesterday (streak intact, waiting for today's activity)
    const yestStatus = getStreakStatus("2026-11-08", "2026-11-09");
    expect(yestStatus.isTodayCompleted).toBe(false);
    expect(yestStatus.isYesterdayActive).toBe(true);
    expect(yestStatus.isBroken).toBe(false);

    // Missed 1 day (last activity 2 days ago)
    const missed1Status = getStreakStatus("2026-11-07", "2026-11-09");
    expect(missed1Status.isBroken).toBe(true);
    expect(missed1Status.missedDays).toBe(1);

    // Missed 4 days (last activity 5 days ago)
    const missed4Status = getStreakStatus("2026-11-04", "2026-11-09");
    expect(missed4Status.isBroken).toBe(true);
    expect(missed4Status.missedDays).toBe(4);
  });

  it("penalizes streak breaks humanely", () => {
    // 0 missed days: no change
    expect(calculateStreakAfterBreak(10, 0)).toBe(10);

    // Missed 1 day: -3 penalty
    expect(calculateStreakAfterBreak(10, 1)).toBe(7);
    expect(calculateStreakAfterBreak(2, 1)).toBe(0);

    // Missed 2-3 days: 50% penalty
    expect(calculateStreakAfterBreak(20, 2)).toBe(10);
    expect(calculateStreakAfterBreak(15, 3)).toBe(7);

    // Missed > 3 days: reset to 0
    expect(calculateStreakAfterBreak(50, 4)).toBe(0);
    expect(calculateStreakAfterBreak(50, 10)).toBe(0);
  });

  it("validates species unlock requirements", () => {
    expect(isSpeciesUnlocked("free", 0)).toBe(true);
    expect(isSpeciesUnlocked("streak_7", 5)).toBe(false);
    expect(isSpeciesUnlocked("streak_7", 7)).toBe(true);
    expect(isSpeciesUnlocked("streak_7", 10)).toBe(true);

    expect(isSpeciesUnlocked("streak_14", 13)).toBe(false);
    expect(isSpeciesUnlocked("streak_14", 14)).toBe(true);

    expect(isSpeciesUnlocked("streak_30", 29)).toBe(false);
    expect(isSpeciesUnlocked("streak_30", 30)).toBe(true);
  });

  it("provides stage descriptions and details for all stages", () => {
    const stages = ["egg", "hatchling", "baby", "teen", "adult", "legendary"] as const;
    for (const s of stages) {
      expect(STAGE_DETAILS[s]).toBeDefined();
      expect(STAGE_DETAILS[s].label).toBeTruthy();
      expect(STAGE_DETAILS[s].description).toBeTruthy();
    }
  });
});

