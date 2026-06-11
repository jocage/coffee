import { z } from "zod";
import { visibilitySchema } from "@/lib/validators/recipes";

export const roastLevelSchema = z.enum(["light", "medium-light", "medium", "medium-dark", "dark"]);

export const coffeeInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  roaster: z.string().trim().min(2).max(120),
  origin: z.string().trim().min(2).max(160),
  process: z.string().trim().max(80).optional(),
  roastLevel: roastLevelSchema,
  flavorNotes: z.string().trim().max(300).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  imageUrl: z.string().trim().optional(),
  visibility: visibilitySchema.default("private")
});
