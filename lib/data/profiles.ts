import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { currentUser as seedCurrentUser } from "@/lib/data/seed";
import type {
  BrewMethod,
  CommentPolicy,
  MessagePolicy,
  RatioStyle,
  TemperatureUnit,
  UserProfile,
  Visibility,
  WeightUnit
} from "@/lib/domain";
import { isAdminProfile } from "@/lib/permissions/admin";
import {
  AuthRequiredError,
  DEV_USER_ID,
  ensureCurrentIdentity,
  mapProfile,
  shouldUseDemoData,
  withSeedFallback
} from "@/lib/data/shared";

export async function getViewerFromDb(): Promise<UserProfile> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, viewerId)
    });

    if (!profile) {
      throw new AuthRequiredError();
    }

    return mapProfile(profile);
  }, seedCurrentUser);
}

export async function getProfilesFromDb(): Promise<UserProfile[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.profiles.findMany();
    return rows.length > 0 ? rows.map(mapProfile) : shouldUseDemoData() ? [seedCurrentUser] : [];
  }, [seedCurrentUser]);
}

export async function getProfileFromDb(handle: string): Promise<UserProfile | null> {
  const profiles = await getProfilesFromDb();
  return profiles.find((profile) => profile.handle === handle) ?? null;
}

export async function updateProfileInDb(input: {
  displayName: string;
  handle: string;
  bio: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  avatarAssetId?: string;
  coverUrl?: string;
  coverAssetId?: string;
  defaultVisibility?: Visibility;
  favoriteMethods?: BrewMethod[];
}) {
  const viewerId = await ensureCurrentIdentity();
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, viewerId)
  });

  await db
    .update(profiles)
    .set({
      displayName: input.displayName,
      handle: input.handle.toLowerCase(),
      bio: input.bio,
      location: input.location ?? "",
      website: input.website || null,
      avatarUrl: input.avatarUrl || existingProfile?.avatarUrl || seedCurrentUser.avatarUrl,
      avatarAssetId: input.avatarAssetId || existingProfile?.avatarAssetId || null,
      coverUrl: input.coverUrl || existingProfile?.coverUrl || seedCurrentUser.coverUrl,
      coverAssetId: input.coverAssetId || existingProfile?.coverAssetId || null,
      defaultVisibility: input.defaultVisibility ?? existingProfile?.defaultVisibility ?? "private",
      defaultCommentPolicy: existingProfile?.defaultCommentPolicy ?? "public",
      messagePolicy: existingProfile?.messagePolicy ?? "followers",
      showGearOnProfile: existingProfile?.showGearOnProfile ?? true,
      showCoffeeOnProfile: existingProfile?.showCoffeeOnProfile ?? true,
      weightUnit: existingProfile?.weightUnit ?? "grams",
      temperatureUnit: existingProfile?.temperatureUnit ?? "celsius",
      ratioStyle: existingProfile?.ratioStyle ?? "brew_ratio",
      favoriteMethods:
        input.favoriteMethods ??
        (existingProfile?.favoriteMethods as BrewMethod[] | undefined) ??
        [],
      updatedAt: new Date()
    })
    .where(eq(profiles.userId, viewerId));

  return { handle: input.handle.toLowerCase() };
}

export async function updateProfilePrivacyInDb(input: {
  defaultVisibility: Visibility;
  defaultCommentPolicy: CommentPolicy;
  messagePolicy: MessagePolicy;
  showGearOnProfile: boolean;
  showCoffeeOnProfile: boolean;
}) {
  const viewerId = await ensureCurrentIdentity();

  await db
    .update(profiles)
    .set({
      defaultVisibility: input.defaultVisibility,
      defaultCommentPolicy: input.defaultCommentPolicy,
      messagePolicy: input.messagePolicy,
      showGearOnProfile: input.showGearOnProfile,
      showCoffeeOnProfile: input.showCoffeeOnProfile,
      updatedAt: new Date()
    })
    .where(eq(profiles.userId, viewerId));
}

export async function updateProfileUnitsInDb(input: {
  weightUnit: WeightUnit;
  temperatureUnit: TemperatureUnit;
  ratioStyle: RatioStyle;
}) {
  const viewerId = await ensureCurrentIdentity();

  await db
    .update(profiles)
    .set({
      weightUnit: input.weightUnit,
      temperatureUnit: input.temperatureUnit,
      ratioStyle: input.ratioStyle,
      updatedAt: new Date()
    })
    .where(eq(profiles.userId, viewerId));
}

export async function isHandleAvailableInDb(handle: string, ownerUserId = DEV_USER_ID) {
  const viewerId = await ensureCurrentIdentity();
  const normalizedHandle = handle.toLowerCase();
  const existing = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.handle, normalizedHandle),
      ne(profiles.userId, ownerUserId === DEV_USER_ID ? viewerId : ownerUserId)
    )
  });

  return !existing;
}

export async function ensureCurrentUserIsAdmin() {
  const viewer = await getViewerFromDb();

  if (!isAdminProfile(viewer)) {
    throw new Error("Admin access required");
  }
}
