import { z } from "zod";

export const socialTargetSchema = z.enum(["recipe", "brew_log", "comment", "collection", "coffee", "gear", "conversation"]);

export const socialTargetInputSchema = z.object({
  targetType: socialTargetSchema,
  targetId: z.string().min(1),
  path: z.string().min(1).default("/home")
});

export const followInputSchema = z.object({
  userId: z.string().min(1),
  path: z.string().min(1).default("/home")
});

export const commentInputSchema = socialTargetInputSchema.extend({
  body: z.string().trim().min(1).max(1000),
  parentId: z.string().optional()
});

export const deleteCommentInputSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1).default("/home")
});

export const reportReasonSchema = z.enum(["spam", "harassment", "unsafe", "copyright", "other"]);
export const reportStatusSchema = z.enum(["reviewing", "resolved", "dismissed"]);

export const reportInputSchema = socialTargetInputSchema.extend({
  reason: reportReasonSchema,
  details: z.string().trim().max(1000).optional()
});

export const reportStatusInputSchema = z.object({
  id: z.string().min(1),
  status: reportStatusSchema,
  path: z.string().min(1).default("/admin/moderation")
});

export const hideReportedContentInputSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1).default("/admin/moderation")
});
