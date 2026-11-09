import { describe, it, expect } from "vitest";
import { calculateIeltsBandScore, getBandEvaluation } from "../band-calculator";

describe("IELTS Band Calculator", () => {
  it("converts 40-question raw scores accurately", () => {
    expect(calculateIeltsBandScore(40, 40)).toBe(9.0);
    expect(calculateIeltsBandScore(39, 40)).toBe(9.0);
    expect(calculateIeltsBandScore(37, 40)).toBe(8.5);
    expect(calculateIeltsBandScore(35, 40)).toBe(8.0);
    expect(calculateIeltsBandScore(32, 40)).toBe(7.5);
    expect(calculateIeltsBandScore(30, 40)).toBe(7.0);
    expect(calculateIeltsBandScore(26, 40)).toBe(6.5);
    expect(calculateIeltsBandScore(23, 40)).toBe(6.0);
    expect(calculateIeltsBandScore(18, 40)).toBe(5.5);
    expect(calculateIeltsBandScore(16, 40)).toBe(5.0);
    expect(calculateIeltsBandScore(13, 40)).toBe(4.5);
    expect(calculateIeltsBandScore(10, 40)).toBe(4.0);
    expect(calculateIeltsBandScore(0, 40)).toBe(1.0);
  });

  it("normalizes non-40 question tests proportionally", () => {
    // 16/20 is equivalent to 32/40 -> 7.5
    expect(calculateIeltsBandScore(16, 20)).toBe(7.5);
    // 10/20 is equivalent to 20/40 -> 5.5
    expect(calculateIeltsBandScore(10, 20)).toBe(5.5);
  });

  it("provides helpful CEFR level and evaluations", () => {
    const eval8 = getBandEvaluation(8.0);
    expect(eval8.cefrLevel).toBe("C2");
    expect(eval8.title).toContain("Xuất chúng");

    const eval6 = getBandEvaluation(6.5);
    expect(eval6.cefrLevel).toBe("B2");

    const eval4 = getBandEvaluation(4.0);
    expect(eval4.cefrLevel).toBe("A2");
  });
});

