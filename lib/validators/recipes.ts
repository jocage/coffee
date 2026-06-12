import { z } from "zod";

export const visibilitySchema = z.enum(["private", "unlisted", "followers", "public"]);
export const brewMethodSchema = z.enum([
  "V60",
  "Origami",
  "Kalita",
  "AeroPress",
  "Espresso",
  "French Press",
  "Switch"
]);

export const recipeStepInputSchema = z.object({
  label: z.string().min(1, "Step label is required"),
  startsAtSeconds: z.coerce.number().int().min(0),
  pourGrams: z.coerce.number().min(0).optional(),
  cumulativeWaterGrams: z.coerce.number().min(0),
  instruction: z.string().min(1, "Instruction is required")
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(3, "Recipe title is required").max(96),
  subtitle: z.string().trim().max(140).optional(),
  description: z.string().trim().max(1200).optional(),
  coverUrl: z.string().trim().optional(),
  coverAssetId: z.string().trim().optional(),
  method: brewMethodSchema,
  visibility: visibilitySchema,
  doseGrams: z.coerce.number().positive(),
  waterGrams: z.coerce.number().positive(),
  temperatureCelsius: z.coerce.number().min(50).max(100),
  grindLabel: z.string().trim().min(2).max(64),
  grindSetting: z.string().trim().max(96).optional(),
  steps: z.array(recipeStepInputSchema).min(1)
});

export const remixRecipeInputSchema = z.object({
  recipeId: z.string().min(1),
  path: z.string().min(1).default("/recipes")
});

export function validateStepWater(
  totalWaterGrams: number,
  steps: Array<{ cumulativeWaterGrams: number }>
): boolean {
  return steps.every((step) => step.cumulativeWaterGrams <= totalWaterGrams);
}
