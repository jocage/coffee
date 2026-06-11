import { describe, expect, it } from "vitest";
import { recipes } from "@/lib/data/seed";
import { getBrewTimerState } from "@/modules/brews/timer";

describe("brew timer state", () => {
  it("selects current and next step by elapsed time", () => {
    const state = getBrewTimerState(recipes[0], 45);

    expect(state.currentStep.label).toBe("Pour 1");
    expect(state.nextStep?.label).toBe("Pour 2");
    expect(state.remainingInStep).toBe(15);
  });

  it("clamps total progress", () => {
    expect(getBrewTimerState(recipes[0], -10).progress).toBe(0);
    expect(getBrewTimerState(recipes[0], 999).progress).toBe(1);
  });
});
