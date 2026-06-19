const isProduction = process.env.NODE_ENV === "production";
const usingRemoteStorage =
  Boolean(process.env.CLOUDFLARE_R2_BUCKET || process.env.S3_BUCKET) ||
  process.env.MEDIA_STORAGE_DRIVER === "s3";

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_TRUSTED_ORIGINS"
];
const remoteStorageRequired = [
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
];
const warnings = [];
const failures = [];

if (isProduction) {
  for (const name of required) {
    if (!process.env[name]) {
      failures.push(`${name} is required in production.`);
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_APP_URL should use https:// in production.");
  }

  if (
    process.env.BETTER_AUTH_SECRET === "development-only-secret-change-before-production" ||
    (process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32
  ) {
    failures.push("BETTER_AUTH_SECRET must be a non-default secret with at least 32 characters.");
  }

  if (usingRemoteStorage) {
    for (const name of remoteStorageRequired) {
      if (!process.env[name] && !process.env[name.replace("CLOUDFLARE_R2_", "S3_")]) {
        failures.push(`${name} or its S3_* equivalent is required when remote media storage is enabled.`);
      }
    }

    if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID && !process.env.CLOUDFLARE_R2_ENDPOINT && !process.env.S3_ENDPOINT) {
      failures.push("CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ENDPOINT, or S3_ENDPOINT is required for remote media storage.");
    }

    if (!process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL && !process.env.S3_PUBLIC_BASE_URL) {
      warnings.push("Remote media storage is configured without a public base URL; uploaded media may not render publicly.");
    }
  } else {
    warnings.push("Remote media storage is not configured; local uploads require a persistent Coolify volume.");
  }

  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    warnings.push("Sentry DSN is not configured; production errors will not be reported.");
  }

  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || !process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL) {
    warnings.push("Umami analytics is not configured.");
  }
}

for (const warning of warnings) {
  console.warn(`Production preflight warning: ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Production preflight failed: ${failure}`);
  }
  process.exit(1);
}

console.log("Production preflight complete.");
