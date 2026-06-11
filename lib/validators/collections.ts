import { z } from "zod";
import { visibilitySchema } from "@/lib/validators/recipes";

export const collectionInputSchema = z.object({
  title: z.string().trim().min(3).max(96),
  description: z.string().trim().max(600).optional(),
  visibility: visibilitySchema.default("private")
});

export const collectionTargetSchema = z.enum(["recipe", "brew_log"]);

export const collectionItemInputSchema = z.object({
  collectionId: z.string().min(1),
  targetType: collectionTargetSchema,
  targetId: z.string().min(1),
  path: z.string().min(1).default("/collections")
});

export const removeCollectionItemInputSchema = z.object({
  collectionId: z.string().min(1),
  itemId: z.string().min(1),
  path: z.string().min(1).default("/collections")
});
