# Coffee Journey Production Readiness

## Required environment

- `DATABASE_URL`: production PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: high-entropy secret, at least 32 characters.
- `BETTER_AUTH_URL`: canonical app URL.
- `BETTER_AUTH_TRUSTED_ORIGINS`: comma-separated trusted origins.
- `NEXT_PUBLIC_APP_URL`: public app URL used by client auth.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: OAuth credentials, if Google sign-in is enabled.
- `ADMIN_USER_IDS` or `ADMIN_HANDLES`: moderation dashboard access.
- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_BASE_URL`: production media storage.
- `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`: error monitoring release setup.

## Deploy migrations

Run migrations before starting each deployed app version:

```sh
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
```

For CI/CD, run the same command as a release step after dependencies are installed and before traffic is shifted to the new build.

## Cloudflare R2 CORS

Apply this CORS policy to the upload bucket, replacing the origins with production domains:

```json
[
  {
    "AllowedOrigins": ["https://coffee.example.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["content-type", "content-length", "x-amz-*"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep private media behind app routes. Public recipe/profile media should use `CLOUDFLARE_R2_PUBLIC_BASE_URL`.

## Sentry

Install and configure the Next.js SDK during deployment hardening:

```sh
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Use the `SENTRY_*` variables above for source map upload and release identification. Keep `SENTRY_AUTH_TOKEN` in CI secrets only.
