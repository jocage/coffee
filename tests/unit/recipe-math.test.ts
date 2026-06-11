import { describe, expect, it } from "vitest";
import { calculateRatio, getPublishIssues, getTotalPouredWater } from "@/modules/recipes/recipe-math";
import { recipes } from "@/lib/data/seed";

describe("recipe math", () => {
  it("calculates brew ratio to one decimal", () => {
    expect(calculateRatio(18, 300)).toBe(16.7);
    expect(calculateRatio(20, 300)).toBe(15);
  });

  it("returns zero for invalid ratios", () => {
    expect(calculateRatio(0, 300)).toBe(0);
    expect(calculateRatio(20, 0)).toBe(0);
  });

  it("finds max cumulative water in steps", () => {
    expect(getTotalPouredWater(recipes[0].steps)).toBe(300);
  });

  it("reports publish blockers", () => {
    expect(
      getPublishIssues({
        title: "",
        steps: [],
        coverUrl: "",
        doseGrams: 0,
        waterGrams: 0
      })
    ).toEqual([
      "Title is required",
      "Method is required",
      "Coffee dose is required",
      "Water amount is required",
      "Public recipe needs a cover image",
      "At least one brew step is required"
    ]);
  });
});
