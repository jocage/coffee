import { z } from "zod";
import { brewMethodSchema, visibilitySchema } from "@/lib/validators/recipes";

const optionalIdSchema = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());

export const brewLogInputSchema = z.object({
    recipeId: optionalIdSchema,
    coffeeId: optionalIdSchema,
    method: brewMethodSchema.default("V60"),
    doseGrams: z.coerce.number().positive(),
    waterGrams: z.coerce.number().positive(),
    outputGrams: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().positive().optional()),
    temperatureCelsius: z.coerce.number().min(50).max(100),
    grindSetting: z.string().trim().min(1),
    brewTimeSeconds: z.coerce.number().int().positive(),
    pressureBars: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().positive().max(20).optional()),
    rating: z.coerce.number().min(1).max(5),
    tastingNotes: z.string().trim().max(1200),
    visibility: visibilitySchema
  })
  .refine((input) => input.recipeId || input.coffeeId, {
    path: ["coffeeId"],
    message: "Choose a recipe or coffee"
  });
