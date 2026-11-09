import { describe, it, expect } from "vitest";
import {
  calculateStageProgress,
  isStageUnlocked,
  evaluateMilestoneTest,
} from "../roadmap-calculator";

describe("Roadmap Calculator", () => {
  it("calculates progress percentages and milestone eligibility", () => {
    const res1 = calculateStageProgress(8, 10, 80);
    expect(res1.percent).toBe(80);
    expect(res1.isEligibleForMilestone).toBe(true);

    const res2 = calculateStageProgress(7, 10, 80);
    expect(res2.percent).toBe(70);
    expect(res2.isEligibleForMilestone).toBe(false);

    const res3 = calculateStageProgress(0, 0);
    expect(res3.percent).toBe(0);
    expect(res3.isEligibleForMilestone).toBe(false);
  });

  it("handles stage unlock logic correctly", () => {
    // Stage 1 always unlocked
    expect(isStageUnlocked(1, false)).toBe(true);
    // Stage 2 locked if previous not completed
    expect(isStageUnlocked(2, false)).toBe(false);
    // Stage 2 unlocked if previous completed
    expect(isStageUnlocked(2, true)).toBe(true);
    // Stage 2 unlocked if explicitly unlocked (fast-track)
    expect(isStageUnlocked(2, false, true)).toBe(true);
  });

  it("evaluates milestone tests properly", () => {
    expect(evaluateMilestoneTest(85, 80).isPassed).toBe(true);
    expect(evaluateMilestoneTest(80, 80).isPassed).toBe(true);
    expect(evaluateMilestoneTest(75, 80).isPassed).toBe(false);
  });
});

