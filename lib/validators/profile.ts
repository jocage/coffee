import { z } from "zod";
import { brewMethodSchema, visibilitySchema } from "@/lib/validators/recipes";

export const profileCommentPolicySchema = z.enum(["disabled", "followers", "public"]);
export const messagePolicySchema = z.enum(["none", "followers", "public"]);

export const handleSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9_]+$/i, "Handle can contain letters, numbers and underscores");

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(72),
  handle: handleSchema,
  bio: z.string().trim().max(240),
  location: z.string().trim().max(80).optional(),
  website: z.string().url().optional().or(z.literal("")),
  avatarUrl: z.string().trim().optional(),
  avatarAssetId: z.string().trim().optional(),
  coverUrl: z.string().trim().optional(),
  coverAssetId: z.string().trim().optional(),
  defaultVisibility: visibilitySchema.default("private"),
  favoriteMethods: z.array(brewMethodSchema).default([])
});

export const profilePrivacyInputSchema = z.object({
  defaultVisibility: visibilitySchema.default("private"),
  defaultCommentPolicy: profileCommentPolicySchema.default("public"),
  messagePolicy: messagePolicySchema.default("followers"),
  showGearOnProfile: z.coerce.boolean().default(false),
  showCoffeeOnProfile: z.coerce.boolean().default(false)
});

export const onboardingInputSchema = profileInputSchema.extend({
  firstCoffeeName: z.string().trim().max(120).optional(),
  firstCoffeeRoaster: z.string().trim().max(120).optional(),
  firstGearName: z.string().trim().max(120).optional(),
  firstGearBrand: z.string().trim().max(120).optional(),
  firstGearModel: z.string().trim().max(120).optional()
});
