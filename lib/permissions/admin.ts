import type { UserProfile } from "@/lib/domain";

const E2E_ADMIN_HANDLES = ["tetsu"];

export function isAdminProfile(profile: Pick<UserProfile, "id" | "handle">): boolean {
  const adminUserIds = parseList(process.env.ADMIN_USER_IDS);
  const adminHandles = parseList(process.env.ADMIN_HANDLES);
  const handles = process.env.E2E_AUTH_BYPASS === "true" && adminHandles.length === 0 ? E2E_ADMIN_HANDLES : adminHandles;

  return adminUserIds.includes(profile.id) || handles.includes(profile.handle.toLowerCase());
}

function parseList(value?: string): string[] {
  return value
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean) ?? [];
}
