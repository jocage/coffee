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
