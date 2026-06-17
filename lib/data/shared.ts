import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { brewLogs as brewLogsTable } from "@/db/schema/brews";
import { coffeeBeans } from "@/db/schema/coffee";
import { collectionItems, collections as collectionsTable } from "@/db/schema/collections";
import { challenges as challengesTable, clubs as clubsTable } from "@/db/schema/clubs";
import { dripperCatalogItems, gearItems, grinderCatalogItems } from "@/db/schema/gear";
import { profiles } from "@/db/schema/profiles";
import { recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
import {
  comments,
  contentReports,
  notifications as notificationsTable
} from "@/db/schema/social";
import {
  challenges as seedChallenges,
  clubs as seedClubs,
  coffees as seedCoffees,
  currentUser as seedCurrentUser,
  dripperCatalog as seedDripperCatalog,
  gear as seedGear,
  grinderCatalog as seedGrinderCatalog,
  recipes as seedRecipes
} from "@/lib/data/seed";
import type {
  BrewLog,
  BrewMethod,
  Challenge,
  Club,
  CoffeeBean,
  CollectionItem,
  Comment,
  ContentReport,
  DripperCatalogItem,
  DripperCatalogStatus,
  GearItem,
  GearType,
  GrinderCatalogItem,
  GrinderCatalogStatus,
  Notification,
  Recipe,
  RecipeStep,
  RoastLevel,
  SocialTargetType,
  UserProfile
} from "@/lib/domain";
import { auth } from "@/lib/auth/auth";
import { calculateRatio } from "@/modules/recipes/recipe-math";

export const DEV_USER_ID = "dev-user";
export const DEV_PROFILE_ID = "dev-profile";
let e2eSeedPromise: Promise<void> | null = null;

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}

type DbProfile = typeof profiles.$inferSelect;
type DbCoffee = typeof coffeeBeans.$inferSelect;
type DbGear = typeof gearItems.$inferSelect;
type DbDripperCatalogItem = typeof dripperCatalogItems.$inferSelect;
type DbGrinderCatalogItem = typeof grinderCatalogItems.$inferSelect;
type DbRecipe = typeof recipesTable.$inferSelect;
type DbRecipeStep = typeof recipeSteps.$inferSelect;
type DbBrewLog = typeof brewLogsTable.$inferSelect;
type DbComment = typeof comments.$inferSelect;
type DbClub = typeof clubsTable.$inferSelect;
type DbChallenge = typeof challengesTable.$inferSelect;
type DbNotification = typeof notificationsTable.$inferSelect;
type DbContentReport = typeof contentReports.$inferSelect;
type DbCollectionItem = typeof collectionItems.$inferSelect;
type NotificationTargetContext = {
  ownerId: string;
  title: string;
  href: string;
};
type CurrentSessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export function shouldUseDemoData() {
  return process.env.ENABLE_DEMO_DATA === "true" || process.env.E2E_AUTH_BYPASS === "true";
}

function getDbErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }

  return "";
}

/** A relation/table does not exist yet (e.g. migrations have not run). */
function isMissingTableError(error: unknown) {
  return getDbErrorCode(error) === "42P01";
}

/** The database itself is unreachable rather than the query being wrong. */
function isDbUnavailableError(error: unknown) {
  const code = getDbErrorCode(error);
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "CONNECT_TIMEOUT" ||
    code === "57P03" // cannot_connect_now
  );
}

/**
 * Only structural/availability failures are safe to mask with seed data.
 * Genuine query bugs (missing columns, constraint violations, type errors)
 * must surface so they are not silently hidden behind demo content.
 */
function isRecoverableDbError(error: unknown) {
  return isMissingTableError(error) || isDbUnavailableError(error);
}

export function isMissingCatalogTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";

  return (
    code === "42P01" &&
    (message.includes("grinder_catalog_items") || message.includes("dripper_catalog_items"))
  );
}

export async function withSeedFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      throw error;
    }

    if (shouldUseDemoData() && isRecoverableDbError(error)) {
      console.warn("[data] Falling back to seed data:", error);
      return fallback;
    }

    throw error;
  }
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

export function splitTags(value?: string) {
  return (
    value
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
}

export function buildGearNotes(input: {
  notes?: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  compatibleDrippers?: string;
}) {
  return [
    input.notes,
    input.grinderDrive ? `Drive: ${input.grinderDrive}` : "",
    input.burrType ? `Burr: ${input.burrType}` : "",
    input.filterRange ? `Filter range: ${input.filterRange}` : "",
    input.material ? `Material: ${input.material}` : "",
    input.size ? `Size: ${input.size}` : "",
    input.brewSpeed ? `Brew speed: ${input.brewSpeed}` : "",
    input.compatibleFilters ? `Compatible filters: ${input.compatibleFilters}` : "",
    input.compatibleDrippers ? `Compatible drippers: ${input.compatibleDrippers}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createNotificationInDb(input: {
  userId: string;
  actorId?: string;
  type: Notification["type"];
  title: string;
  body: string;
  href: string;
}) {
  await db.insert(notificationsTable).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    actorId: input.actorId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href
  });
}

export async function getNotificationActor(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId)
  });

  if (profile) {
    return {
      displayName: profile.displayName,
      handle: profile.handle
    };
  }

  return {
    displayName: seedCurrentUser.displayName,
    handle: seedCurrentUser.handle
  };
}

export async function getNotificationTargetContext(input: {
  targetType: SocialTargetType;
  targetId: string;
}): Promise<NotificationTargetContext | null> {
  if (input.targetType === "recipe") {
    const [row] = await db
      .select({
        ownerId: recipesTable.ownerId,
        title: recipesTable.title,
        slug: recipesTable.slug,
        handle: profiles.handle
      })
      .from(recipesTable)
      .innerJoin(profiles, eq(recipesTable.ownerId, profiles.userId))
      .where(eq(recipesTable.id, input.targetId))
      .limit(1);

    return row
      ? { ownerId: row.ownerId, title: row.title, href: `/r/${row.handle}/${row.slug}` }
      : null;
  }

  if (input.targetType === "brew_log") {
    const [row] = await db
      .select({
        ownerId: brewLogsTable.ownerId,
        title: brewLogsTable.title
      })
      .from(brewLogsTable)
      .where(eq(brewLogsTable.id, input.targetId))
      .limit(1);

    return row
      ? { ownerId: row.ownerId, title: row.title, href: `/brews/${input.targetId}` }
      : null;
  }

  if (input.targetType === "coffee") {
    const [row] = await db
      .select({
        ownerId: coffeeBeans.ownerId,
        name: coffeeBeans.name,
        roaster: coffeeBeans.roaster,
        slug: coffeeBeans.slug
      })
      .from(coffeeBeans)
      .where(eq(coffeeBeans.id, input.targetId))
      .limit(1);

    return row?.ownerId
      ? { ownerId: row.ownerId, title: `${row.roaster} ${row.name}`, href: `/coffee/${row.slug}` }
      : null;
  }

  if (input.targetType === "gear") {
    const [row] = await db
      .select({
        ownerId: gearItems.ownerId,
        name: gearItems.name,
        id: gearItems.id
      })
      .from(gearItems)
      .where(eq(gearItems.id, input.targetId))
      .limit(1);

    return row?.ownerId ? { ownerId: row.ownerId, title: row.name, href: `/gear/${row.id}` } : null;
  }

  if (input.targetType === "collection") {
    const [row] = await db
      .select({
        ownerId: collectionsTable.ownerId,
        title: collectionsTable.title,
        slug: collectionsTable.slug,
        handle: profiles.handle
      })
      .from(collectionsTable)
      .innerJoin(profiles, eq(collectionsTable.ownerId, profiles.userId))
      .where(eq(collectionsTable.id, input.targetId))
      .limit(1);

    return row
      ? { ownerId: row.ownerId, title: row.title, href: `/u/${row.handle}/collections/${row.slug}` }
      : null;
  }

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, input.targetId)
  });

  if (!comment) {
    return null;
  }

  const parentTarget = await getNotificationTargetContext({
    targetType: comment.targetType,
    targetId: comment.targetId
  });

  return {
    ownerId: comment.userId,
    title: parentTarget ? `a comment on ${parentTarget.title}` : "a comment",
    href: parentTarget?.href ?? "/notifications"
  };
}

export async function ensureDevIdentity() {
  await db
    .insert(user)
    .values({
      id: DEV_USER_ID,
      name: seedCurrentUser.displayName,
      email: "dev@coffee-journey.local",
      emailVerified: true,
      image: seedCurrentUser.avatarUrl
    })
    .onConflictDoNothing();

  await db
    .insert(profiles)
    .values({
      id: DEV_PROFILE_ID,
      userId: DEV_USER_ID,
      handle: seedCurrentUser.handle,
      displayName: seedCurrentUser.displayName,
      bio: seedCurrentUser.bio,
      location: seedCurrentUser.location,
      avatarUrl: seedCurrentUser.avatarUrl,
      coverUrl: seedCurrentUser.coverUrl,
      defaultVisibility: seedCurrentUser.defaultVisibility,
      defaultCommentPolicy: seedCurrentUser.defaultCommentPolicy,
      messagePolicy: seedCurrentUser.messagePolicy,
      showGearOnProfile: seedCurrentUser.showGearOnProfile,
      showCoffeeOnProfile: seedCurrentUser.showCoffeeOnProfile,
      weightUnit: seedCurrentUser.weightUnit,
      temperatureUnit: seedCurrentUser.temperatureUnit,
      ratioStyle: seedCurrentUser.ratioStyle,
      favoriteMethods: seedCurrentUser.favoriteMethods
    })
    .onConflictDoNothing();

  if (process.env.E2E_AUTH_BYPASS !== "true") {
    return;
  }

  e2eSeedPromise ??= seedE2eDemoData();
  await e2eSeedPromise;
}

async function seedE2eDemoData() {
  await db
    .insert(coffeeBeans)
    .values(
      seedCoffees.map((coffee) => ({
        id: coffee.id,
        ownerId: DEV_USER_ID,
        name: coffee.name,
        slug: coffee.slug,
        roaster: coffee.roaster,
        origin: coffee.origin,
        process: coffee.process,
        roastLevel: coffee.roastLevel,
        flavorNotes: coffee.flavorNotes,
        rating: coffee.rating,
        imageUrl: coffee.imageUrl,
        visibility: coffee.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(gearItems)
    .values(
      seedGear.map((item) => ({
        id: item.id,
        ownerId: DEV_USER_ID,
        type: item.type,
        brand: item.brand,
        model: item.model,
        name: item.name,
        notes: item.notes,
        imageUrl: item.imageUrl,
        defaultForMethod: item.defaultForMethod,
        visibility: item.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(grinderCatalogItems)
    .values(
      seedGrinderCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        grinderDrive: item.grinderDrive,
        burrType: item.burrType,
        filterRange: item.filterRange,
        notes: item.notes,
        imageUrl: item.imageUrl,
        status: item.status
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(dripperCatalogItems)
    .values(
      seedDripperCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        material: item.material,
        size: item.size,
        brewSpeed: item.brewSpeed,
        compatibleFilters: item.compatibleFilters,
        notes: item.notes,
        imageUrl: item.imageUrl,
        status: item.status
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(recipesTable)
    .values(
      seedRecipes.map((recipe) => ({
        id: recipe.id,
        ownerId: DEV_USER_ID,
        coffeeId: recipe.coffee.id,
        slug: recipe.slug,
        title: recipe.title,
        subtitle: recipe.subtitle,
        description: recipe.description,
        method: recipe.method,
        visibility: recipe.visibility,
        remixPolicy: recipe.remixPolicy,
        commentPolicy: recipe.commentPolicy,
        coverUrl: recipe.coverUrl,
        doseGrams: recipe.doseGrams,
        waterGrams: recipe.waterGrams,
        ratio: calculateRatio(recipe.doseGrams, recipe.waterGrams),
        temperatureCelsius: recipe.temperatureCelsius,
        grindLabel: recipe.grindLabel,
        grindSetting: recipe.grindSetting,
        totalTimeSeconds: recipe.totalTimeSeconds,
        difficulty: recipe.difficulty,
        flavorNotes: recipe.flavorNotes,
        tasteProfile: recipe.tasteProfile,
        stats: recipe.stats
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(recipeSteps)
    .values(
      seedRecipes.flatMap((recipe) =>
        recipe.steps.map((step, index) => ({
          id: step.id,
          recipeId: recipe.id,
          position: index,
          label: step.label,
          startsAtSeconds: step.startsAtSeconds,
          endsAtSeconds: step.endsAtSeconds,
          pourGrams: step.pourGrams,
          cumulativeWaterGrams: step.cumulativeWaterGrams,
          instruction: step.instruction,
          cue: step.cue
        }))
      )
    )
    .onConflictDoNothing();

  await db
    .insert(clubsTable)
    .values(
      seedClubs.map((club) => ({
        id: club.id,
        slug: club.slug,
        name: club.name,
        description: club.description,
        visibility: club.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(challengesTable)
    .values(
      seedChallenges.map((challenge) => ({
        id: challenge.id,
        clubId: seedClubs.find((club) => club.slug === challenge.clubSlug)?.id,
        title: challenge.title,
        description: challenge.description,
        startsAt: new Date(challenge.startsAt),
        endsAt: new Date(challenge.endsAt),
        entryCount: challenge.entryCount
      }))
    )
    .onConflictDoNothing();
}

export async function ensureCurrentIdentity(): Promise<string> {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser) {
    if (process.env.E2E_AUTH_BYPASS === "true") {
      await ensureDevIdentity();
      return DEV_USER_ID;
    }

    throw new AuthRequiredError();
  }

  await db
    .insert(user)
    .values({
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      emailVerified: true,
      image: sessionUser.image ?? ""
    })
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image ?? "",
        updatedAt: new Date()
      }
    });

  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessionUser.id)
  });

  if (!existingProfile) {
    const handle = await buildAvailableHandle(sessionUser);
    await db.insert(profiles).values({
      id: crypto.randomUUID(),
      userId: sessionUser.id,
      handle,
      displayName: sessionUser.name,
      bio: "",
      location: "",
      avatarUrl: sessionUser.image ?? seedCurrentUser.avatarUrl,
      coverUrl: seedCurrentUser.coverUrl,
      weightUnit: "grams",
      temperatureUnit: "celsius",
      ratioStyle: "brew_ratio",
      favoriteMethods: []
    });
  }

  return sessionUser.id;
}

async function getCurrentSessionUser(): Promise<CurrentSessionUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name || session.user.email || "Coffee Brewer",
      email: session.user.email,
      image: session.user.image
    };
  } catch {
    return null;
  }
}

async function buildAvailableHandle(sessionUser: CurrentSessionUser) {
  const base =
    slugify(sessionUser.name || sessionUser.email.split("@")[0]).slice(0, 24) || "brewer";
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.handle, base)
  });

  if (!existing) {
    return base;
  }

  return `${base}-${sessionUser.id.slice(0, 6).toLowerCase()}`;
}

export async function getStepsForRecipes(recipeIds: string[]) {
  if (recipeIds.length === 0) {
    return new Map<string, RecipeStep[]>();
  }

  const rows = await db.query.recipeSteps.findMany({
    where: (steps, { inArray }) => inArray(steps.recipeId, recipeIds),
    orderBy: (steps, { asc }) => [asc(steps.position)]
  });

  return rows.reduce((map, row) => {
    const current = map.get(row.recipeId) ?? [];
    current.push(mapStep(row));
    map.set(row.recipeId, current);
    return map;
  }, new Map<string, RecipeStep[]>());
}

export function mapProfile(row: DbProfile): UserProfile {
  return {
    id: row.userId,
    handle: row.handle,
    displayName: row.displayName,
    role: "Barista",
    bio: row.bio,
    location: row.location ?? "",
    website: row.website ?? "",
    avatarUrl: row.avatarUrl || seedCurrentUser.avatarUrl,
    coverUrl: row.coverUrl || seedCurrentUser.coverUrl,
    defaultVisibility: row.defaultVisibility,
    defaultCommentPolicy: row.defaultCommentPolicy ?? "public",
    messagePolicy: row.messagePolicy ?? "followers",
    showGearOnProfile: row.showGearOnProfile ?? true,
    showCoffeeOnProfile: row.showCoffeeOnProfile ?? true,
    weightUnit: row.weightUnit ?? "grams",
    temperatureUnit: row.temperatureUnit ?? "celsius",
    ratioStyle: row.ratioStyle ?? "brew_ratio",
    favoriteMethods: row.favoriteMethods as BrewMethod[],
    stats: {
      recipes: 0,
      brewLogs: 0,
      followers: 0,
      following: 0,
      totalRecipeBrews: 0
    }
  };
}

export function mapCoffee(row: DbCoffee): CoffeeBean {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    roaster: row.roaster,
    origin: row.origin,
    process: row.process ?? "",
    roastLevel: row.roastLevel as RoastLevel,
    flavorNotes: row.flavorNotes,
    rating: row.rating ?? 0,
    visibility: row.visibility,
    imageUrl: row.imageUrl || seedCoffees[0].imageUrl
  };
}

export function mapGear(row: DbGear): GearItem {
  return {
    id: row.id,
    type: row.type as GearType,
    brand: row.brand,
    model: row.model,
    name: row.name,
    notes: row.notes,
    imageUrl: row.imageUrl || seedGear[0].imageUrl,
    visibility: row.visibility,
    defaultForMethod: row.defaultForMethod as BrewMethod | undefined
  };
}

export function mapGrinderCatalogItem(row: DbGrinderCatalogItem): GrinderCatalogItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    grinderDrive: row.grinderDrive,
    burrType: row.burrType,
    filterRange: row.filterRange,
    notes: row.notes,
    imageUrl:
      row.imageUrl ||
      seedGear.find((item) => item.type === "grinder")?.imageUrl ||
      seedGear[0].imageUrl,
    status: row.status
  };
}

export function mapDripperCatalogItem(row: DbDripperCatalogItem): DripperCatalogItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    material: row.material,
    size: row.size,
    brewSpeed: row.brewSpeed,
    compatibleFilters: row.compatibleFilters,
    notes: row.notes,
    imageUrl:
      row.imageUrl ||
      seedGear.find((item) => item.type === "dripper")?.imageUrl ||
      seedGear[0].imageUrl,
    status: row.status
  };
}

export function filterSeedGrinderCatalog(filters?: {
  query?: string;
  status?: GrinderCatalogStatus | "all";
}) {
  const query = filters?.query?.trim().toLowerCase();

  return seedGrinderCatalog.filter((item) => {
    const matchesStatus =
      !filters?.status || filters.status === "all" ? true : item.status === filters.status;
    const matchesQuery = query
      ? [item.name, item.brand, item.model].some((value) => value.toLowerCase().includes(query))
      : true;

    return matchesStatus && matchesQuery;
  });
}

export function filterSeedDripperCatalog(filters?: {
  query?: string;
  status?: DripperCatalogStatus | "all";
}) {
  const query = filters?.query?.trim().toLowerCase();

  return seedDripperCatalog.filter((item) => {
    const matchesStatus =
      !filters?.status || filters.status === "all" ? true : item.status === filters.status;
    const matchesQuery = query
      ? [item.name, item.brand, item.model, item.compatibleFilters].some((value) =>
          value.toLowerCase().includes(query)
        )
      : true;

    return matchesStatus && matchesQuery;
  });
}

export function mapContentReport(row: DbContentReport, reporter: DbProfile): ContentReport {
  return {
    id: row.id,
    reporter: mapProfile(reporter),
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString()
  };
}

export function mapCollectionItem(
  item: DbCollectionItem,
  recipes: Recipe[],
  brewLogs: BrewLog[]
): CollectionItem {
  if (item.targetType === "brew_log") {
    const brewLog = brewLogs.find((candidate) => candidate.id === item.targetId);
    return {
      id: item.id,
      targetType: item.targetType,
      targetId: item.targetId,
      position: item.position,
      title: brewLog?.title ?? "Brew log",
      subtitle: brewLog?.recipe?.title ?? brewLog?.coffee.name ?? "Saved brew",
      imageUrl: brewLog?.photos[0] ?? seedRecipes[0].coverUrl
    };
  }

  const recipe = recipes.find((candidate) => candidate.id === item.targetId);
  return {
    id: item.id,
    targetType: item.targetType,
    targetId: item.targetId,
    position: item.position,
    title: recipe?.title ?? "Saved item",
    subtitle: recipe?.author.displayName ?? "Collection item",
    imageUrl: recipe?.coverUrl ?? seedRecipes[0].coverUrl
  };
}

export function mapRecipe(
  row: DbRecipe,
  profile: DbProfile,
  coffee: DbCoffee | CoffeeBean,
  steps: RecipeStep[],
  gear: GearItem[]
): Recipe {
  const mappedCoffee =
    "slug" in coffee && "imageUrl" in coffee
      ? (coffee as CoffeeBean)
      : mapCoffee(coffee as DbCoffee);

  return {
    id: row.id,
    parentRecipeId: row.parentRecipeId ?? undefined,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    method: row.method,
    visibility: row.visibility,
    remixPolicy: row.remixPolicy,
    commentPolicy: row.commentPolicy,
    coverUrl: row.coverUrl || seedRecipes[0].coverUrl,
    author: mapProfile(profile),
    coffee: mappedCoffee,
    doseGrams: row.doseGrams,
    waterGrams: row.waterGrams,
    ratio: row.ratio,
    temperatureCelsius: row.temperatureCelsius,
    grindLabel: row.grindLabel,
    grindSetting: row.grindSetting ?? "",
    totalTimeSeconds: row.totalTimeSeconds,
    difficulty: row.difficulty as Recipe["difficulty"],
    flavorNotes: row.flavorNotes,
    tasteProfile: {
      sweetness: row.tasteProfile.sweetness ?? 0,
      acidity: row.tasteProfile.acidity ?? 0,
      body: row.tasteProfile.body ?? 0,
      balance: row.tasteProfile.balance ?? 0,
      finish: row.tasteProfile.finish ?? 0
    },
    steps: steps.length > 0 ? steps : seedRecipes[0].steps,
    gear,
    stats: row.stats,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function mapStep(row: DbRecipeStep): RecipeStep {
  return {
    id: row.id,
    label: row.label,
    startsAtSeconds: row.startsAtSeconds,
    endsAtSeconds: row.endsAtSeconds ?? undefined,
    pourGrams: row.pourGrams ?? undefined,
    cumulativeWaterGrams: row.cumulativeWaterGrams,
    instruction: row.instruction,
    cue: row.cue
  };
}

export function mapBrewLog(
  row: DbBrewLog,
  profile: DbProfile,
  recipe: Recipe | undefined,
  coffee: DbCoffee | CoffeeBean
): BrewLog {
  const mappedCoffee =
    "slug" in coffee && "imageUrl" in coffee
      ? (coffee as CoffeeBean)
      : mapCoffee(coffee as DbCoffee);

  return {
    id: row.id,
    title: row.title,
    method: row.method ?? recipe?.method ?? "V60",
    author: mapProfile(profile),
    recipe,
    coffee: mappedCoffee,
    brewedAt: row.brewedAt.toISOString(),
    doseGrams: row.doseGrams,
    waterGrams: row.waterGrams,
    outputGrams: row.outputGrams ?? undefined,
    temperatureCelsius: row.temperatureCelsius,
    grindSetting: row.grindSetting ?? "",
    brewTimeSeconds: row.brewTimeSeconds,
    pressureBars: row.pressureBars ?? undefined,
    rating: row.rating,
    tastingNotes: row.tastingNotes,
    flavorTags: row.flavorTags,
    visibility: row.visibility,
    photos: [recipe?.coverUrl ?? mappedCoffee.imageUrl]
  };
}

export function mapComment(row: DbComment, profile: DbProfile): Comment {
  return {
    id: row.id,
    author: mapProfile(profile),
    targetType: row.targetType,
    targetId: row.targetId,
    parentId: row.parentId ?? undefined,
    body: row.body,
    createdAt: row.createdAt.toISOString()
  };
}

export function mapClub(row: DbClub, memberCount: number, activeChallengeId?: string): Club {
  const seedClub = seedClubs.find((club) => club.id === row.id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    coverUrl: seedClub?.coverUrl ?? seedCurrentUser.coverUrl,
    memberCount: Math.max(memberCount, seedClub?.memberCount ?? 0),
    activeChallengeId
  };
}

export function mapChallenge(row: DbChallenge, clubSlug?: string): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    clubSlug,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    entryCount: row.entryCount
  };
}

export function mapNotification(row: DbNotification, actor?: DbProfile): Notification {
  return {
    id: row.id,
    type: row.type,
    actor: actor ? mapProfile(actor) : undefined,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}
