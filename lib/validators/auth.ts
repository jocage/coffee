import { z } from "zod";

export const signInInputSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional()
});

export const signUpInputSchema = z.object({
  name: z.string().trim().min(2, "Display name must be at least 2 characters").max(80, "Display name is too long"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  acceptedTerms: z.literal(true, {
    error: "You must accept the terms to create an account"
  })
});
