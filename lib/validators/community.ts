import { z } from "zod";

export const joinClubInputSchema = z.object({
  clubId: z.string().min(1),
  path: z.string().min(1).default("/community")
});

export const challengeEntryInputSchema = z.object({
  challengeId: z.string().min(1),
  brewLogId: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  notes: z.string().trim().max(800).optional(),
  path: z.string().min(1).default("/community")
});

export const sendMessageInputSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1).max(1200),
  path: z.string().min(1).default("/messages")
});
