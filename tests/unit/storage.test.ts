import { afterEach, describe, expect, it, vi } from "vitest";
import { getStorageConfig } from "@/lib/media/storage";

describe("media storage config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses Cloudflare R2 account endpoint", () => {
    vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "account123");
    vi.stubEnv("CLOUDFLARE_R2_BUCKET", "coffee-journey");
    vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "access");
    vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("CLOUDFLARE_R2_PUBLIC_BASE_URL", "https://cdn.example.com");

    expect(getStorageConfig()).toMatchObject({
      bucket: "coffee-journey",
      endpoint: "https://account123.r2.cloudflarestorage.com",
      region: "auto",
      accessKeyId: "access",
      secretAccessKey: "secret",
      publicBaseUrl: "https://cdn.example.com"
    });
  });

  it("allows a custom Cloudflare R2 endpoint", () => {
    vi.stubEnv("CLOUDFLARE_R2_ENDPOINT", "https://custom.r2.cloudflarestorage.com");
    vi.stubEnv("CLOUDFLARE_R2_BUCKET", "coffee-journey");
    vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "access");
    vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "secret");

    expect(getStorageConfig()?.endpoint).toBe("https://custom.r2.cloudflarestorage.com");
  });

  it("falls back to local upload when Cloudflare R2 is not configured", () => {
    vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "");
    vi.stubEnv("CLOUDFLARE_R2_ENDPOINT", "");
    vi.stubEnv("CLOUDFLARE_R2_BUCKET", "");
    vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "");
    vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("S3_ENDPOINT", "");
    vi.stubEnv("S3_BUCKET", "");
    vi.stubEnv("S3_ACCESS_KEY_ID", "");
    vi.stubEnv("S3_SECRET_ACCESS_KEY", "");

    expect(getStorageConfig()).toBeNull();
  });
});
