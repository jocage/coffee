import type { Recipe, RecipeStep } from "@/lib/domain";

export type BrewTimerState = {
  elapsedSeconds: number;
  currentStep: RecipeStep;
  nextStep: RecipeStep | null;
  progress: number;
  remainingInStep: number;
};

export function getBrewTimerState(recipe: Recipe, elapsedSeconds: number): BrewTimerState {
  const ordered = [...recipe.steps].sort((a, b) => a.startsAtSeconds - b.startsAtSeconds);
  const currentIndex = Math.max(
    0,
    ordered.findIndex((step, index) => {
      const next = ordered[index + 1];
      return elapsedSeconds >= step.startsAtSeconds && (!next || elapsedSeconds < next.startsAtSeconds);
    })
  );
  const currentStep = ordered[currentIndex] ?? ordered[0];
  const nextStep = ordered[currentIndex + 1] ?? null;
  const stepEnd = currentStep.endsAtSeconds ?? nextStep?.startsAtSeconds ?? recipe.totalTimeSeconds;
  const stepDuration = Math.max(1, stepEnd - currentStep.startsAtSeconds);

  return {
    elapsedSeconds,
    currentStep,
    nextStep,
    progress: Math.min(1, Math.max(0, elapsedSeconds / recipe.totalTimeSeconds)),
    remainingInStep: Math.max(0, stepDuration - (elapsedSeconds - currentStep.startsAtSeconds))
  };
}
