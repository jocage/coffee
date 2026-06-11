import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminProfile } from "@/lib/permissions/admin";

describe("admin permissions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not allow seeded demo admin handle by default", () => {
    expect(isAdminProfile({ id: "dev-user", handle: "tetsu" })).toBe(false);
  });

  it("allows the seeded admin handle only in e2e bypass mode", () => {
    vi.stubEnv("E2E_AUTH_BYPASS", "true");

    expect(isAdminProfile({ id: "dev-user", handle: "tetsu" })).toBe(true);
  });

  it("uses configured admin handles when provided", () => {
    vi.stubEnv("ADMIN_HANDLES", "moderator");

    expect(isAdminProfile({ id: "u1", handle: "moderator" })).toBe(true);
    expect(isAdminProfile({ id: "dev-user", handle: "tetsu" })).toBe(false);
  });

  it("allows configured admin user ids", () => {
    vi.stubEnv("ADMIN_HANDLES", "");
    vi.stubEnv("ADMIN_USER_IDS", "u-admin");

    expect(isAdminProfile({ id: "u-admin", handle: "anyone" })).toBe(true);
    expect(isAdminProfile({ id: "u-user", handle: "anyone" })).toBe(false);
  });
});
