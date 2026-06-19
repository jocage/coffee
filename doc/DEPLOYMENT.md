# Production deployment

## Coolify

Use the repository Dockerfile. The container starts with:

```sh
node scripts/production-preflight.mjs && node scripts/migrate.mjs && node server.js
```

The preflight step fails the container when required production env vars are missing or unsafe. Database migrations run on every start unless `SKIP_DB_MIGRATIONS=true`.

Set these Docker build args in Coolify when browser-side integrations are enabled:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

Required production variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`

Recommended production variables:

- Cloudflare R2 or S3-compatible storage variables from `.env.example`
- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- `APP_RATE_LIMIT_ENABLED=true`

## Media storage

For Cloudflare R2, configure bucket CORS to allow browser uploads from the production origin:

```json
[
  {
    "AllowedOrigins": ["https://coffee.example.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "x-amz-*"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 300
  }
]
```

Set `CLOUDFLARE_R2_PUBLIC_BASE_URL` to the public bucket/custom-domain URL. If remote storage is not configured, mount a persistent Coolify volume at `LOCAL_UPLOAD_DIR`.

## Observability

Sentry is optional but production-ready. Set `SENTRY_DSN` for server/edge events and `NEXT_PUBLIC_SENTRY_DSN` for browser events. Set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` when source map upload is wanted during Docker builds.

Umami analytics is enabled only when both `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` are present.

## Security

The app sends HSTS, frame, content-type, referrer and permissions-policy headers from `next.config.ts`. `proxy.ts` protects app routes and rate-limits mutating requests by IP; Better Auth keeps its own auth rate limit.
