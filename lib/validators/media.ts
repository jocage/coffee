import { z } from "zod";

export const mediaEntitySchema = z.enum(["avatar", "cover", "recipe", "brew_log", "coffee", "gear", "export"]);

export const presignUploadSchema = z.object({
  entityType: mediaEntitySchema,
  entityId: z.string().optional(),
  fileName: z.string().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]),
  size: z.number().int().positive().max(15 * 1024 * 1024)
});
