import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const trustedOrigins = parseTrustedOrigins([
  authBaseUrl,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BETTER_AUTH_TRUSTED_ORIGINS
]);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-before-production",
  baseURL: authBaseUrl,
  trustedOrigins,
  rateLimit: {
    enabled: process.env.BETTER_AUTH_RATE_LIMIT_ENABLED !== "false",
    window: parsePositiveInteger(process.env.BETTER_AUTH_RATE_LIMIT_WINDOW, 60),
    max: parsePositiveInteger(process.env.BETTER_AUTH_RATE_LIMIT_MAX, 300)
  },
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret
          }
        }
      : undefined
});

function parseTrustedOrigins(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => value?.split(",") ?? [])
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => {
          try {
            return new URL(value).origin;
          } catch {
            return value;
          }
        })
    )
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
