import type { RecipeStep } from "@/lib/domain";

export function calculateRatio(doseGrams: number, waterGrams: number): number {
  if (doseGrams <= 0 || waterGrams <= 0) {
    return 0;
  }

  return Number((waterGrams / doseGrams).toFixed(1));
}

export function getTotalPouredWater(steps: RecipeStep[]): number {
  return steps.reduce((max, step) => Math.max(max, step.cumulativeWaterGrams), 0);
}

export function scaleRecipeSteps(
  steps: RecipeStep[],
  originalWaterGrams: number,
  targetWaterGrams: number
): RecipeStep[] {
  if (originalWaterGrams <= 0 || targetWaterGrams <= 0) {
    return steps;
  }

  const factor = targetWaterGrams / originalWaterGrams;
  const maxCumulativeWater = getTotalPouredWater(steps);

  return steps.map((step) => ({
    ...step,
    pourGrams:
      step.pourGrams === undefined ? undefined : Math.max(1, Math.round(step.pourGrams * factor)),
    cumulativeWaterGrams:
      step.cumulativeWaterGrams >= maxCumulativeWater
        ? Math.round(targetWaterGrams)
        : Math.max(1, Math.round(step.cumulativeWaterGrams * factor))
  }));
}

export function getPublishIssues(input: {
  title: string;
  method?: string;
  doseGrams?: number;
  waterGrams?: number;
  coverUrl?: string;
  steps: RecipeStep[];
}) {
  const issues: string[] = [];

  if (input.title.trim().length < 3) issues.push("Title is required");
  if (!input.method) issues.push("Method is required");
  if (!input.doseGrams || input.doseGrams <= 0) issues.push("Coffee dose is required");
  if (!input.waterGrams || input.waterGrams <= 0) issues.push("Water amount is required");
  if (!input.coverUrl) issues.push("Public recipe needs a cover image");
  if (input.steps.length === 0) issues.push("At least one brew step is required");

  return issues;
}
