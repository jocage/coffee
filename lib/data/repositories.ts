import "server-only";

import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { brewLogs as brewLogsTable } from "@/db/schema/brews";
import { coffeeBeans } from "@/db/schema/coffee";
import { collectionItems, collections as collectionsTable } from "@/db/schema/collections";
import {
  challengeEntries,
  challenges as challengesTable,
  clubMembers,
  clubs as clubsTable
} from "@/db/schema/clubs";
import { dripperCatalogItems, gearItems, grinderCatalogItems } from "@/db/schema/gear";
import { profiles } from "@/db/schema/profiles";
import { recipeGearItems, recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
import {
  comments,
  contentReports,
  directConversations,
  directConversationParticipants,
  directMessages,
  follows,
  notifications as notificationsTable,
  reactions,
  saves
} from "@/db/schema/social";
import {
  brewLogs as seedBrewLogs,
  challenges as seedChallenges,
  clubs as seedClubs,
  coffees as seedCoffees,
  conversations as seedConversations,
  creators as seedCreators,
  currentUser as seedCurrentUser,
  dripperCatalog as seedDripperCatalog,
  gear as seedGear,
  grinderCatalog as seedGrinderCatalog,
  notifications as seedNotifications,
  recipes as seedRecipes
} from "@/lib/data/seed";
import type {
  BrewLog,
  Challenge,
  Club,
  Collection,
  CollectionItem,
  Comment,
  CommentPolicy,
  ContentReport,
  Conversation,
  ConversationMessage,
  BrewMethod,
  CoffeeBean,
  DripperCatalogItem,
  DripperCatalogStatus,
  FeedItem,
  GearItem,
  GearType,
  GrinderCatalogItem,
  GrinderCatalogStatus,
  MessagePolicy,
  Notification,
  Recipe,
  RecipeStep,
  RatioStyle,
  RoastLevel,
  SocialTargetType,
  SocialCounts,
  TemperatureUnit,
  UserProfile,
  Visibility,
  WeightUnit
} from "@/lib/domain";
import { auth } from "@/lib/auth/auth";
import { isAdminProfile } from "@/lib/permissions/admin";
import { canReadVisibility } from "@/lib/permissions/visibility";
import { calculateRatio } from "@/modules/recipes/recipe-math";
import { calculateRecipeStats } from "@/modules/recipes/stats";

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
type DbCollection = typeof collectionsTable.$inferSelect;
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

export async function getOptionalViewerFromDb(): Promise<UserProfile | null> {
  try {
    return await getViewerFromDb();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return null;
    }

    throw error;
  }
}

export async function isFollowingInDb(followerId: string | undefined, followingId: string) {
  if (!followerId || followerId === followingId) {
    return false;
  }

  return withSeedFallback(async () => {
    const row = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    });

    return Boolean(row);
  }, false);
}

export async function getRecipesFromDb(filters?: {
  query?: string;
  method?: BrewMethod;
  visibility?: Visibility | "all";
  ownerId?: string;
}): Promise<Recipe[]> {
  return withSeedFallback(async () => {
    const where = and(
      filters?.method ? eq(recipesTable.method, filters.method) : undefined,
      filters?.visibility && filters.visibility !== "all"
        ? eq(recipesTable.visibility, filters.visibility)
        : undefined,
      filters?.ownerId ? eq(recipesTable.ownerId, filters.ownerId) : undefined,
      filters?.query
        ? or(
            ilike(recipesTable.title, `%${filters.query}%`),
            ilike(recipesTable.subtitle, `%${filters.query}%`),
            ilike(recipesTable.description, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db
      .select({
        recipe: recipesTable,
        profile: profiles,
        coffee: coffeeBeans
      })
      .from(recipesTable)
      .innerJoin(profiles, eq(recipesTable.ownerId, profiles.userId))
      .leftJoin(coffeeBeans, eq(recipesTable.coffeeId, coffeeBeans.id))
      .where(where)
      .orderBy(desc(recipesTable.updatedAt));

    if (rows.length === 0 && !filters?.query && !filters?.ownerId && shouldUseDemoData()) {
      return seedRecipes;
    }

    const steps = await getStepsForRecipes(rows.map((row) => row.recipe.id));
    const gearByRecipeId = await getGearForRecipeIds(rows.map((row) => row.recipe.id));

    return rows.map((row) =>
      mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gearByRecipeId.get(row.recipe.id) ?? []
      )
    );
  }, seedRecipes);
}

export async function getRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const recipes = await getRecipesFromDb();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function getOwnedRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const viewerId = await ensureCurrentIdentity();
  const recipes = await getRecipesFromDb({ ownerId: viewerId });
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function getPublicRecipeFromDb(handle: string, slug: string): Promise<Recipe | null> {
  return withSeedFallback(
    async () => {
      const rows = await db
        .select({
          recipe: recipesTable,
          profile: profiles,
          coffee: coffeeBeans
        })
        .from(recipesTable)
        .innerJoin(profiles, eq(recipesTable.ownerId, profiles.userId))
        .leftJoin(coffeeBeans, eq(recipesTable.coffeeId, coffeeBeans.id))
        .where(
          and(
            eq(profiles.handle, handle),
            eq(recipesTable.slug, slug),
            eq(recipesTable.visibility, "public")
          )
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        return shouldUseDemoData()
          ? (seedRecipes.find(
              (recipe) => recipe.author.handle === handle && recipe.slug === slug
            ) ?? null)
          : null;
      }

      const steps = await getStepsForRecipes([row.recipe.id]);
      const gearByRecipeId = await getGearForRecipeIds([row.recipe.id]);
      return mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gearByRecipeId.get(row.recipe.id) ?? []
      );
    },
    seedRecipes.find((recipe) => recipe.author.handle === handle && recipe.slug === slug) ?? null
  );
}

export async function getSavedRecipesFromDb(): Promise<Recipe[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({ targetId: saves.targetId })
      .from(saves)
      .where(and(eq(saves.userId, viewerId), eq(saves.targetType, "recipe")));

    if (rows.length === 0) {
      return [];
    }

    const savedIds = new Set(rows.map((row) => row.targetId));
    const recipes = await getRecipesFromDb();
    return recipes.filter((recipe) => savedIds.has(recipe.id));
  }, []);
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

export async function getCoffeesFromDb(filters?: { ownerId?: string }): Promise<CoffeeBean[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.coffeeBeans.findMany({
      where: filters?.ownerId ? eq(coffeeBeans.ownerId, filters.ownerId) : undefined,
      orderBy: desc(coffeeBeans.createdAt)
    });
    return rows.length > 0
      ? rows.map(mapCoffee)
      : !filters?.ownerId && shouldUseDemoData()
        ? seedCoffees
        : [];
  }, seedCoffees);
}

export async function getCoffeeByIdFromDb(id: string): Promise<CoffeeBean | null> {
  return withSeedFallback(
    async () => {
      const row = await db.query.coffeeBeans.findFirst({
        where: eq(coffeeBeans.id, id)
      });

      return row ? mapCoffee(row) : null;
    },
    seedCoffees.find((coffee) => coffee.id === id) ?? null
  );
}

export async function getGearFromDb(filters?: { ownerId?: string }): Promise<GearItem[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.gearItems.findMany({
      where: filters?.ownerId ? eq(gearItems.ownerId, filters.ownerId) : undefined,
      orderBy: desc(gearItems.createdAt)
    });
    return rows.length > 0
      ? rows.map(mapGear)
      : !filters?.ownerId && shouldUseDemoData()
        ? seedGear
        : [];
  }, seedGear);
}

export async function getGearItemByIdFromDb(id: string): Promise<GearItem | null> {
  return withSeedFallback(
    async () => {
      const row = await db.query.gearItems.findFirst({
        where: eq(gearItems.id, id)
      });

      return row ? mapGear(row) : null;
    },
    seedGear.find((item) => item.id === id) ?? null
  );
}

export async function getGrinderCatalogFromDb(filters?: {
  query?: string;
  status?: GrinderCatalogStatus | "all";
}): Promise<GrinderCatalogItem[]> {
  try {
    const where = and(
      filters?.status && filters.status !== "all"
        ? eq(grinderCatalogItems.status, filters.status)
        : undefined,
      filters?.query
        ? or(
            ilike(grinderCatalogItems.name, `%${filters.query}%`),
            ilike(grinderCatalogItems.brand, `%${filters.query}%`),
            ilike(grinderCatalogItems.model, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db.query.grinderCatalogItems.findMany({
      where,
      orderBy: [asc(grinderCatalogItems.brand), asc(grinderCatalogItems.model)]
    });

    if (
      rows.length === 0 &&
      !filters?.query &&
      (!filters?.status || filters.status === "approved")
    ) {
      return seedGrinderCatalog;
    }

    return rows.map(mapGrinderCatalogItem);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return filterSeedGrinderCatalog(filters);
    }

    throw error;
  }
}

export async function getGrinderCatalogItemByIdFromDb(
  id: string
): Promise<GrinderCatalogItem | null> {
  try {
    const row = await db.query.grinderCatalogItems.findFirst({
      where: eq(grinderCatalogItems.id, id)
    });

    return row
      ? mapGrinderCatalogItem(row)
      : (seedGrinderCatalog.find((item) => item.id === id) ?? null);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return seedGrinderCatalog.find((item) => item.id === id) ?? null;
    }

    throw error;
  }
}

export async function getDripperCatalogFromDb(filters?: {
  query?: string;
  status?: DripperCatalogStatus | "all";
}): Promise<DripperCatalogItem[]> {
  try {
    const where = and(
      filters?.status && filters.status !== "all"
        ? eq(dripperCatalogItems.status, filters.status)
        : undefined,
      filters?.query
        ? or(
            ilike(dripperCatalogItems.name, `%${filters.query}%`),
            ilike(dripperCatalogItems.brand, `%${filters.query}%`),
            ilike(dripperCatalogItems.model, `%${filters.query}%`),
            ilike(dripperCatalogItems.compatibleFilters, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db.query.dripperCatalogItems.findMany({
      where,
      orderBy: [asc(dripperCatalogItems.brand), asc(dripperCatalogItems.model)]
    });

    if (
      rows.length === 0 &&
      !filters?.query &&
      (!filters?.status || filters.status === "approved")
    ) {
      return seedDripperCatalog;
    }

    return rows.map(mapDripperCatalogItem);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return filterSeedDripperCatalog(filters);
    }

    throw error;
  }
}

export async function getDripperCatalogItemByIdFromDb(
  id: string
): Promise<DripperCatalogItem | null> {
  try {
    const row = await db.query.dripperCatalogItems.findFirst({
      where: eq(dripperCatalogItems.id, id)
    });

    return row
      ? mapDripperCatalogItem(row)
      : (seedDripperCatalog.find((item) => item.id === id) ?? null);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return seedDripperCatalog.find((item) => item.id === id) ?? null;
    }

    throw error;
  }
}

export async function getCollectionsFromDb(): Promise<Collection[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({
        collection: collectionsTable,
        owner: profiles
      })
      .from(collectionsTable)
      .innerJoin(profiles, eq(collectionsTable.ownerId, profiles.userId))
      .where(eq(collectionsTable.ownerId, viewerId))
      .orderBy(desc(collectionsTable.updatedAt));

    return Promise.all(rows.map((row) => mapCollectionWithItems(row.collection, row.owner)));
  }, []);
}

export async function getCollectionByIdFromDb(id: string): Promise<Collection | null> {
  return withSeedFallback(async () => {
    const row = await db
      .select({
        collection: collectionsTable,
        owner: profiles
      })
      .from(collectionsTable)
      .innerJoin(profiles, eq(collectionsTable.ownerId, profiles.userId))
      .where(eq(collectionsTable.id, id))
      .limit(1);

    return row[0] ? mapCollectionWithItems(row[0].collection, row[0].owner) : null;
  }, null);
}

export async function getPublicCollectionFromDb(
  handle: string,
  slug: string
): Promise<Collection | null> {
  return withSeedFallback(async () => {
    const row = await db
      .select({
        collection: collectionsTable,
        owner: profiles
      })
      .from(collectionsTable)
      .innerJoin(profiles, eq(collectionsTable.ownerId, profiles.userId))
      .where(
        and(
          eq(profiles.handle, handle),
          eq(collectionsTable.slug, slug),
          eq(collectionsTable.visibility, "public")
        )
      )
      .limit(1);

    return row[0] ? mapCollectionWithItems(row[0].collection, row[0].owner) : null;
  }, null);
}

export async function getClubsFromDb(): Promise<Club[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.clubs.findMany({
      orderBy: (table, { asc }) => [asc(table.name)]
    });

    if (rows.length === 0) {
      return shouldUseDemoData() ? seedClubs : [];
    }

    const [members, challengesRows] = await Promise.all([
      db.query.clubMembers.findMany(),
      db.query.challenges.findMany()
    ]);
    return rows.map((row) =>
      mapClub(
        row,
        members.filter((member) => member.clubId === row.id).length,
        challengesRows.find((challenge) => challenge.clubId === row.id)?.id
      )
    );
  }, seedClubs);
}

export async function getClubBySlugFromDb(slug: string): Promise<Club | null> {
  const clubs = await getClubsFromDb();
  return clubs.find((club) => club.slug === slug) ?? null;
}

export async function joinClubInDb(clubId: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .insert(clubMembers)
    .values({
      clubId,
      userId: viewerId,
      role: "member"
    })
    .onConflictDoNothing();

  await createNotificationInDb({
    userId: viewerId,
    type: "system",
    title: "Club joined",
    body: "You joined a coffee club.",
    href: "/community"
  });
}

export async function getChallengesFromDb(): Promise<Challenge[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.challenges.findMany({
      orderBy: (table, { desc }) => [desc(table.startsAt)]
    });

    if (rows.length === 0) {
      return shouldUseDemoData() ? seedChallenges : [];
    }

    const clubsRows = await db.query.clubs.findMany();
    return rows.map((row) =>
      mapChallenge(row, clubsRows.find((club) => club.id === row.clubId)?.slug)
    );
  }, seedChallenges);
}

export async function getChallengeByIdFromDb(id: string): Promise<Challenge | null> {
  const challenges = await getChallengesFromDb();
  return challenges.find((challenge) => challenge.id === id) ?? null;
}

export async function enterChallengeInDb(input: {
  challengeId: string;
  brewLogId?: string;
  notes?: string;
}) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .insert(challengeEntries)
    .values({
      challengeId: input.challengeId,
      userId: viewerId,
      brewLogId: input.brewLogId,
      notes: input.notes ?? ""
    })
    .onConflictDoNothing();

  const entries = await db.query.challengeEntries.findMany({
    where: eq(challengeEntries.challengeId, input.challengeId)
  });

  await db
    .update(challengesTable)
    .set({ entryCount: entries.length })
    .where(eq(challengesTable.id, input.challengeId));

  await createNotificationInDb({
    userId: viewerId,
    type: "challenge",
    title: "Challenge entry saved",
    body: "Your brew was added to the challenge.",
    href: `/challenges/${input.challengeId}`
  });
}

export async function getBrewLogsFromDb(filters?: { ownerId?: string }): Promise<BrewLog[]> {
  return withSeedFallback(async () => {
    const rows = await db
      .select({
        brewLog: brewLogsTable,
        recipe: recipesTable,
        profile: profiles,
        coffee: coffeeBeans
      })
      .from(brewLogsTable)
      .leftJoin(recipesTable, eq(brewLogsTable.recipeId, recipesTable.id))
      .innerJoin(profiles, eq(brewLogsTable.ownerId, profiles.userId))
      .leftJoin(coffeeBeans, eq(brewLogsTable.coffeeId, coffeeBeans.id))
      .where(filters?.ownerId ? eq(brewLogsTable.ownerId, filters.ownerId) : undefined)
      .orderBy(desc(brewLogsTable.brewedAt));

    if (rows.length === 0 && !filters?.ownerId && shouldUseDemoData()) {
      return seedBrewLogs;
    }

    const recipeIds = rows.flatMap((row) => (row.recipe ? [row.recipe.id] : []));
    const steps = await getStepsForRecipes(recipeIds);
    const gearByRecipeId = await getGearForRecipeIds(recipeIds);

    return rows.map((row) => {
      const coffee = row.coffee ?? seedCoffees[0];
      const recipe = row.recipe
        ? mapRecipe(
            row.recipe,
            row.profile,
            coffee,
            steps.get(row.recipe.id) ?? [],
            gearByRecipeId.get(row.recipe.id) ?? []
          )
        : undefined;
      return mapBrewLog(row.brewLog, row.profile, recipe, coffee);
    });
  }, seedBrewLogs);
}

export async function getBrewLogByIdFromDb(id: string): Promise<BrewLog | null> {
  return withSeedFallback(
    async () => {
      const row = await db
        .select({
          brewLog: brewLogsTable,
          recipe: recipesTable,
          profile: profiles,
          coffee: coffeeBeans
        })
        .from(brewLogsTable)
        .leftJoin(recipesTable, eq(brewLogsTable.recipeId, recipesTable.id))
        .innerJoin(profiles, eq(brewLogsTable.ownerId, profiles.userId))
        .leftJoin(coffeeBeans, eq(brewLogsTable.coffeeId, coffeeBeans.id))
        .where(eq(brewLogsTable.id, id))
        .limit(1);

      if (!row[0]) {
        return null;
      }

      const steps = row[0].recipe
        ? await getStepsForRecipes([row[0].recipe.id])
        : new Map<string, RecipeStep[]>();
      const gearByRecipeId = row[0].recipe
        ? await getGearForRecipeIds([row[0].recipe.id])
        : new Map<string, GearItem[]>();
      const coffee = row[0].coffee ?? seedCoffees[0];
      const recipe = row[0].recipe
        ? mapRecipe(
            row[0].recipe,
            row[0].profile,
            coffee,
            steps.get(row[0].recipe.id) ?? [],
            gearByRecipeId.get(row[0].recipe.id) ?? []
          )
        : undefined;
      return mapBrewLog(row[0].brewLog, row[0].profile, recipe, coffee);
    },
    seedBrewLogs.find((brewLog) => brewLog.id === id) ?? null
  );
}

export async function getOwnedBrewLogByIdFromDb(id: string): Promise<BrewLog | null> {
  const viewerId = await ensureCurrentIdentity();
  const brewLogs = await getBrewLogsFromDb({ ownerId: viewerId });
  return brewLogs.find((brewLog) => brewLog.id === id) ?? null;
}

export async function getFeedFromDb(): Promise<FeedItem[]> {
  const [recipes, brewLogs] = await Promise.all([
    getRecipesFromDb({ visibility: "public" }),
    getBrewLogsFromDb()
  ]);

  return [
    ...recipes.map(
      (recipe): FeedItem => ({
        id: `feed_recipe_${recipe.id}`,
        type: "recipe",
        recipe,
        author: recipe.author,
        createdAt: recipe.updatedAt
      })
    ),
    ...brewLogs
      .filter((brewLog) => brewLog.visibility === "public")
      .map(
        (brewLog): FeedItem => ({
          id: `feed_brew_${brewLog.id}`,
          type: "brew_log",
          brewLog,
          author: brewLog.author,
          createdAt: brewLog.brewedAt
        })
      )
  ];
}

export async function getCommentsForTargetFromDb(input: {
  targetType: SocialTargetType;
  targetId: string;
}): Promise<Comment[]> {
  return withSeedFallback(async () => {
    const rows = await db
      .select({
        comment: comments,
        profile: profiles
      })
      .from(comments)
      .innerJoin(profiles, eq(comments.userId, profiles.userId))
      .where(and(eq(comments.targetType, input.targetType), eq(comments.targetId, input.targetId)))
      .orderBy(desc(comments.createdAt));

    return rows.map((row) => mapComment(row.comment, row.profile));
  }, []);
}

export async function getSocialCountsForTargetFromDb(input: {
  targetType: SocialTargetType;
  targetId: string;
}): Promise<SocialCounts> {
  return withSeedFallback(
    async () => {
      const [likesRows, savesRows, commentsRows] = await Promise.all([
        db
          .select({ id: reactions.id })
          .from(reactions)
          .where(
            and(eq(reactions.targetType, input.targetType), eq(reactions.targetId, input.targetId))
          ),
        db
          .select({ id: saves.id })
          .from(saves)
          .where(and(eq(saves.targetType, input.targetType), eq(saves.targetId, input.targetId))),
        db
          .select({ id: comments.id })
          .from(comments)
          .where(
            and(eq(comments.targetType, input.targetType), eq(comments.targetId, input.targetId))
          )
      ]);

      return {
        likes: likesRows.length,
        saves: savesRows.length,
        comments: commentsRows.length,
        followers: 0
      };
    },
    { likes: 0, saves: 0, comments: 0, followers: 0 }
  );
}

export async function getContentReportsFromDb(
  status?: ContentReport["status"] | "all"
): Promise<ContentReport[]> {
  return withSeedFallback(async () => {
    const rows = await db
      .select({
        report: contentReports,
        reporter: profiles
      })
      .from(contentReports)
      .innerJoin(profiles, eq(contentReports.reporterId, profiles.userId))
      .where(status && status !== "all" ? eq(contentReports.status, status) : undefined)
      .orderBy(desc(contentReports.createdAt));

    return rows.map((row) => mapContentReport(row.report, row.reporter));
  }, []);
}

export async function createContentReportInDb(input: {
  targetType: ContentReport["targetType"];
  targetId: string;
  reason: ContentReport["reason"];
  details?: string;
}) {
  const viewerId = await ensureCurrentIdentity();
  await assertCanUseSocialTarget(viewerId, input, "report");

  await db.insert(contentReports).values({
    id: crypto.randomUUID(),
    reporterId: viewerId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details ?? ""
  });
}

export async function updateContentReportStatusInDb(input: {
  id: string;
  status: Exclude<ContentReport["status"], "open">;
}) {
  await ensureCurrentUserIsAdmin();

  const [updated] = await db
    .update(contentReports)
    .set({
      status: input.status,
      reviewedAt: new Date()
    })
    .where(eq(contentReports.id, input.id))
    .returning({ id: contentReports.id });

  if (!updated) {
    throw new Error("Report not found");
  }

  return updated;
}

export async function hideReportedContentInDb(reportId: string) {
  await ensureCurrentUserIsAdmin();

  const report = await db.query.contentReports.findFirst({
    where: eq(contentReports.id, reportId)
  });

  if (!report) {
    throw new Error("Report not found");
  }

  if (report.targetType === "recipe") {
    await db
      .update(recipesTable)
      .set({ visibility: "private", updatedAt: new Date() })
      .where(eq(recipesTable.id, report.targetId));
  }

  if (report.targetType === "brew_log") {
    await db
      .update(brewLogsTable)
      .set({ visibility: "private" })
      .where(eq(brewLogsTable.id, report.targetId));
  }

  if (report.targetType === "collection") {
    await db
      .update(collectionsTable)
      .set({ visibility: "private", updatedAt: new Date() })
      .where(eq(collectionsTable.id, report.targetId));
  }

  if (report.targetType === "coffee") {
    await db
      .update(coffeeBeans)
      .set({ visibility: "private" })
      .where(eq(coffeeBeans.id, report.targetId));
  }

  if (report.targetType === "gear") {
    await db
      .update(gearItems)
      .set({ visibility: "private" })
      .where(eq(gearItems.id, report.targetId));
  }

  if (report.targetType === "comment") {
    await db
      .delete(comments)
      .where(or(eq(comments.id, report.targetId), eq(comments.parentId, report.targetId)));
  }

  await db
    .update(contentReports)
    .set({ status: "resolved", reviewedAt: new Date() })
    .where(eq(contentReports.id, reportId));
}

export async function ensureCurrentUserIsAdmin() {
  const viewer = await getViewerFromDb();

  if (!isAdminProfile(viewer)) {
    throw new Error("Admin access required");
  }
}

export async function createRecipeInDb(input: {
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  coverAssetId?: string;
  method: BrewMethod;
  visibility: Visibility;
  doseGrams: number;
  waterGrams: number;
  temperatureCelsius: number;
  grindLabel: string;
  grindSetting?: string;
  gearItemIds?: string[];
  steps: Array<{
    label: string;
    startsAtSeconds: number;
    pourGrams?: number;
    cumulativeWaterGrams: number;
    instruction: string;
  }>;
}) {
  const viewerId = await ensureCurrentIdentity();
  const viewerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, viewerId)
  });
  const [coffee] = await getCoffeesFromDb();
  const ownedGearItemIds = input.gearItemIds
    ? await filterOwnedGearItemIds(input.gearItemIds, viewerId)
    : undefined;
  const recipeId = crypto.randomUUID();
  const slug = slugify(input.title);

  await db.insert(recipesTable).values({
    id: recipeId,
    ownerId: viewerId,
    coffeeId: coffee?.id ?? null,
    slug,
    title: input.title,
    subtitle: input.subtitle ?? "",
    description: input.description ?? "",
    method: input.method,
    visibility: input.visibility,
    commentPolicy: viewerProfile?.defaultCommentPolicy ?? "public",
    coverAssetId: input.coverAssetId || null,
    coverUrl: input.coverUrl || seedRecipes[0].coverUrl,
    doseGrams: input.doseGrams,
    waterGrams: input.waterGrams,
    ratio: calculateRatio(input.doseGrams, input.waterGrams),
    temperatureCelsius: input.temperatureCelsius,
    grindLabel: input.grindLabel,
    grindSetting: input.grindSetting ?? "",
    totalTimeSeconds: Math.max(...input.steps.map((step) => step.startsAtSeconds), 0) + 30,
    flavorNotes: [],
    tasteProfile: { sweetness: 60, acidity: 55, body: 55, balance: 60, finish: 58 },
    stats: { likes: 0, saves: 0, brews: 0, averageRating: 0, remixes: 0, comments: 0 }
  });

  await db.insert(recipeSteps).values(
    input.steps.map((step, index) => ({
      id: crypto.randomUUID(),
      recipeId,
      position: index,
      label: step.label,
      startsAtSeconds: step.startsAtSeconds,
      endsAtSeconds:
        index === input.steps.length - 1 ? undefined : input.steps[index + 1].startsAtSeconds,
      pourGrams: step.pourGrams,
      cumulativeWaterGrams: step.cumulativeWaterGrams,
      instruction: step.instruction,
      cue: step.instruction
    }))
  );

  if (ownedGearItemIds) {
    await syncRecipeGearIds(recipeId, ownedGearItemIds);
  } else {
    await syncRecipeGearForSetup(recipeId, viewerId, input.method);
  }

  return { id: recipeId, slug };
}

export async function updateRecipeInDb(input: {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  coverAssetId?: string;
  method: BrewMethod;
  visibility: Visibility;
  doseGrams: number;
  waterGrams: number;
  temperatureCelsius: number;
  grindLabel: string;
  grindSetting?: string;
  steps: Array<{
    label: string;
    startsAtSeconds: number;
    pourGrams?: number;
    cumulativeWaterGrams: number;
    instruction: string;
  }>;
}) {
  const viewerId = await ensureCurrentIdentity();
  const totalTimeSeconds = Math.max(...input.steps.map((step) => step.startsAtSeconds), 0) + 30;

  const [updated] = await db
    .update(recipesTable)
    .set({
      slug: slugify(input.title),
      title: input.title,
      subtitle: input.subtitle ?? "",
      description: input.description ?? "",
      method: input.method,
      visibility: input.visibility,
      coverAssetId: input.coverAssetId || null,
      coverUrl: input.coverUrl || seedRecipes[0].coverUrl,
      doseGrams: input.doseGrams,
      waterGrams: input.waterGrams,
      ratio: calculateRatio(input.doseGrams, input.waterGrams),
      temperatureCelsius: input.temperatureCelsius,
      grindLabel: input.grindLabel,
      grindSetting: input.grindSetting ?? "",
      totalTimeSeconds,
      updatedAt: new Date()
    })
    .where(and(eq(recipesTable.id, input.id), eq(recipesTable.ownerId, viewerId)))
    .returning({ id: recipesTable.id, slug: recipesTable.slug });

  if (!updated) {
    throw new Error("Recipe not found");
  }

  await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, input.id));
  await db.insert(recipeSteps).values(
    input.steps.map((step, index) => ({
      id: crypto.randomUUID(),
      recipeId: input.id,
      position: index,
      label: step.label,
      startsAtSeconds: step.startsAtSeconds,
      endsAtSeconds:
        index === input.steps.length - 1 ? undefined : input.steps[index + 1].startsAtSeconds,
      pourGrams: step.pourGrams,
      cumulativeWaterGrams: step.cumulativeWaterGrams,
      instruction: step.instruction,
      cue: step.instruction
    }))
  );

  await syncRecipeGearForSetup(input.id, viewerId, input.method);

  return updated;
}

export async function createRecipeRemixInDb(recipeId: string) {
  const viewerId = await ensureCurrentIdentity();
  const source = await db.query.recipes.findFirst({
    where: eq(recipesTable.id, recipeId)
  });

  if (!source) {
    throw new Error("Recipe not found");
  }

  if (source.remixPolicy === "none") {
    throw new Error("Recipe cannot be remixed");
  }

  const sourceSteps = await db.query.recipeSteps.findMany({
    where: eq(recipeSteps.recipeId, source.id),
    orderBy: asc(recipeSteps.position)
  });
  const remixId = crypto.randomUUID();
  const title = `Remix of ${source.title}`;
  const slug = `${slugify(title)}-${remixId.slice(0, 8)}`;

  await db.insert(recipesTable).values({
    id: remixId,
    ownerId: viewerId,
    coffeeId: source.coffeeId,
    parentRecipeId: source.id,
    slug,
    title,
    subtitle: source.subtitle,
    description: source.description,
    method: source.method,
    visibility: "private",
    remixPolicy: source.remixPolicy,
    commentPolicy: source.commentPolicy,
    coverAssetId: source.coverAssetId,
    coverUrl: source.coverUrl,
    doseGrams: source.doseGrams,
    waterGrams: source.waterGrams,
    ratio: source.ratio,
    temperatureCelsius: source.temperatureCelsius,
    grindLabel: source.grindLabel,
    grindSetting: source.grindSetting,
    totalTimeSeconds: source.totalTimeSeconds,
    difficulty: source.difficulty,
    flavorNotes: source.flavorNotes,
    tasteProfile: source.tasteProfile,
    stats: { likes: 0, saves: 0, brews: 0, averageRating: 0, remixes: 0, comments: 0 }
  });

  if (sourceSteps.length > 0) {
    await db.insert(recipeSteps).values(
      sourceSteps.map((step) => ({
        id: crypto.randomUUID(),
        recipeId: remixId,
        position: step.position,
        label: step.label,
        startsAtSeconds: step.startsAtSeconds,
        endsAtSeconds: step.endsAtSeconds,
        pourGrams: step.pourGrams,
        cumulativeWaterGrams: step.cumulativeWaterGrams,
        instruction: step.instruction,
        cue: step.cue
      }))
    );
  }

  const copiedGear = await copyRecipeGearItems(source.id, remixId);
  if (!copiedGear) {
    await syncRecipeGearForSetup(remixId, viewerId, source.method);
  }

  await db
    .update(recipesTable)
    .set({
      stats: {
        ...(source.stats ?? {
          likes: 0,
          saves: 0,
          brews: 0,
          averageRating: 0,
          remixes: 0,
          comments: 0
        }),
        remixes: (source.stats?.remixes ?? 0) + 1
      },
      updatedAt: new Date()
    })
    .where(eq(recipesTable.id, source.id));

  await createNotificationInDb({
    userId: viewerId,
    actorId: viewerId,
    type: "recipe_remixed",
    title: "Recipe remixed",
    body: `${source.title} was copied into your drafts.`,
    href: `/recipes/${remixId}/edit`
  });

  return { id: remixId, slug };
}

export async function deleteRecipeInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(recipesTable)
    .where(and(eq(recipesTable.id, id), eq(recipesTable.ownerId, viewerId)));
}

export async function createBrewLogInDb(input: {
  recipeId?: string;
  coffeeId?: string;
  method: BrewMethod;
  doseGrams: number;
  waterGrams: number;
  outputGrams?: number;
  temperatureCelsius: number;
  grindSetting: string;
  brewTimeSeconds: number;
  pressureBars?: number;
  rating: number;
  tastingNotes: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);
  const recipe = input.recipeId ? await getRecipeByIdFromDb(input.recipeId) : null;
  const coffee = input.coffeeId
    ? await getCoffeeByIdFromDb(input.coffeeId)
    : (recipe?.coffee ?? null);
  const id = crypto.randomUUID();

  if (!recipe && !coffee) {
    throw new Error("Choose a recipe or coffee before saving a brew log");
  }

  await db.insert(brewLogsTable).values({
    id,
    ownerId: viewerId,
    recipeId: input.recipeId,
    coffeeId: input.coffeeId ?? recipe?.coffee.id,
    title: recipe ? `Brewed ${recipe.title}` : `${input.method} with ${coffee?.name ?? "coffee"}`,
    method: input.method,
    doseGrams: input.doseGrams,
    waterGrams: input.waterGrams,
    outputGrams: input.outputGrams,
    temperatureCelsius: input.temperatureCelsius,
    grindSetting: input.grindSetting,
    brewTimeSeconds: input.brewTimeSeconds,
    pressureBars: input.pressureBars,
    rating: input.rating,
    tastingNotes: input.tastingNotes,
    flavorTags: [],
    visibility: input.visibility
  });

  if (recipe) {
    await refreshRecipeStatsInDb(recipe.id);
    await createNotificationInDb({
      userId: recipe.author.id,
      actorId: viewerId,
      type: "recipe_brewed",
      title: "Recipe brewed",
      body: `${actor.displayName} brewed ${recipe.title}.`,
      href: `/brews/${id}`
    });
  }

  return { id };
}

export async function updateBrewLogInDb(input: {
  id: string;
  recipeId?: string;
  coffeeId?: string;
  method: BrewMethod;
  doseGrams: number;
  waterGrams: number;
  outputGrams?: number;
  temperatureCelsius: number;
  grindSetting: string;
  brewTimeSeconds: number;
  pressureBars?: number;
  rating: number;
  tastingNotes: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.brewLogs.findFirst({
    where: and(eq(brewLogsTable.id, input.id), eq(brewLogsTable.ownerId, viewerId))
  });
  const recipe = input.recipeId ? await getRecipeByIdFromDb(input.recipeId) : null;
  const coffee = input.coffeeId
    ? await getCoffeeByIdFromDb(input.coffeeId)
    : (recipe?.coffee ?? null);

  if (!recipe && !coffee) {
    throw new Error("Choose a recipe or coffee before saving a brew log");
  }

  const [updated] = await db
    .update(brewLogsTable)
    .set({
      recipeId: input.recipeId,
      coffeeId: input.coffeeId ?? recipe?.coffee.id,
      title: recipe ? `Brewed ${recipe.title}` : `${input.method} with ${coffee?.name ?? "coffee"}`,
      method: input.method,
      doseGrams: input.doseGrams,
      waterGrams: input.waterGrams,
      outputGrams: input.outputGrams,
      temperatureCelsius: input.temperatureCelsius,
      grindSetting: input.grindSetting,
      brewTimeSeconds: input.brewTimeSeconds,
      pressureBars: input.pressureBars,
      rating: input.rating,
      tastingNotes: input.tastingNotes,
      visibility: input.visibility
    })
    .where(and(eq(brewLogsTable.id, input.id), eq(brewLogsTable.ownerId, viewerId)))
    .returning({ id: brewLogsTable.id });

  if (!updated) {
    throw new Error("Brew log not found");
  }

  await Promise.all(
    [...new Set([existing?.recipeId, input.recipeId].filter(Boolean) as string[])].map((recipeId) =>
      refreshRecipeStatsInDb(recipeId)
    )
  );

  return updated;
}

export async function deleteBrewLogInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.brewLogs.findFirst({
    where: and(eq(brewLogsTable.id, id), eq(brewLogsTable.ownerId, viewerId))
  });
  await db
    .delete(brewLogsTable)
    .where(and(eq(brewLogsTable.id, id), eq(brewLogsTable.ownerId, viewerId)));
  if (existing?.recipeId) {
    await refreshRecipeStatsInDb(existing.recipeId);
  }
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
  defaultGrinderId?: string | null;
  defaultDripperId?: string | null;
  defaultFilterId?: string | null;
  favoriteMethods?: BrewMethod[];
}) {
  const viewerId = await ensureCurrentIdentity();
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, viewerId)
  });
  const requestedDefaultGearIds = [
    input.defaultGrinderId,
    input.defaultDripperId,
    input.defaultFilterId
  ].filter((id): id is string => typeof id === "string" && id.length > 0);
  const defaultGearRows =
    requestedDefaultGearIds.length > 0
      ? await db.query.gearItems.findMany({
          where: and(
            eq(gearItems.ownerId, viewerId),
            inArray(gearItems.id, requestedDefaultGearIds)
          )
        })
      : [];
  const defaultGearById = new Map(defaultGearRows.map((item) => [item.id, item]));
  const resolveDefaultGearId = (id: string | null | undefined, type: GearType) => {
    if (!id) {
      return null;
    }
    const item = defaultGearById.get(id);
    if (!item || item.type !== type) {
      throw new Error("Selected default gear is not available");
    }
    return id;
  };

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
      defaultGrinderId:
        input.defaultGrinderId === undefined
          ? (existingProfile?.defaultGrinderId ?? null)
          : resolveDefaultGearId(input.defaultGrinderId, "grinder"),
      defaultDripperId:
        input.defaultDripperId === undefined
          ? (existingProfile?.defaultDripperId ?? null)
          : resolveDefaultGearId(input.defaultDripperId, "dripper"),
      defaultFilterId:
        input.defaultFilterId === undefined
          ? (existingProfile?.defaultFilterId ?? null)
          : resolveDefaultGearId(input.defaultFilterId, "filter"),
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

export async function createCoffeeInDb(input: {
  name: string;
  roaster: string;
  origin: string;
  process?: string;
  roastLevel: RoastLevel;
  flavorNotes?: string;
  rating?: number;
  imageUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const id = crypto.randomUUID();

  await db.insert(coffeeBeans).values({
    id,
    ownerId: viewerId,
    name: input.name,
    slug: slugify(`${input.roaster}-${input.name}`),
    roaster: input.roaster,
    origin: input.origin,
    process: input.process ?? "",
    roastLevel: input.roastLevel,
    flavorNotes: splitTags(input.flavorNotes),
    rating: input.rating ?? 0,
    imageUrl: input.imageUrl || seedCoffees[0].imageUrl,
    visibility: input.visibility
  });

  return { id };
}

export async function updateCoffeeInDb(input: {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  process?: string;
  roastLevel: RoastLevel;
  flavorNotes?: string;
  rating?: number;
  imageUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.coffeeBeans.findFirst({
    where: eq(coffeeBeans.id, input.id)
  });

  const [updated] = await db
    .update(coffeeBeans)
    .set({
      name: input.name,
      slug: slugify(`${input.roaster}-${input.name}`),
      roaster: input.roaster,
      origin: input.origin,
      process: input.process ?? "",
      roastLevel: input.roastLevel,
      flavorNotes: splitTags(input.flavorNotes),
      rating: input.rating ?? 0,
      imageUrl: input.imageUrl || existing?.imageUrl || seedCoffees[0].imageUrl,
      visibility: input.visibility
    })
    .where(and(eq(coffeeBeans.id, input.id), eq(coffeeBeans.ownerId, viewerId)))
    .returning({ id: coffeeBeans.id });

  if (!updated) {
    throw new Error("Coffee not found");
  }

  return updated;
}

export async function deleteCoffeeInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(coffeeBeans)
    .where(and(eq(coffeeBeans.id, id), eq(coffeeBeans.ownerId, viewerId)));
}

export async function createGearItemInDb(input: {
  type: GearType;
  name: string;
  brand: string;
  model: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  compatibleDrippers?: string;
  notes?: string;
  imageUrl?: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const id = crypto.randomUUID();
  const detailNotes = buildGearNotes(input);
  const fallbackImage =
    seedGear.find((item) => item.type === input.type)?.imageUrl ?? seedGear[0].imageUrl;

  await db.insert(gearItems).values({
    id,
    ownerId: viewerId,
    type: input.type,
    brand: input.brand,
    model: input.model,
    name: input.name,
    notes: detailNotes,
    imageUrl: input.imageUrl || fallbackImage,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });

  return { id };
}

export async function updateGearItemInDb(input: {
  id: string;
  type: GearType;
  name: string;
  brand: string;
  model: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  compatibleDrippers?: string;
  notes?: string;
  imageUrl?: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.gearItems.findFirst({
    where: eq(gearItems.id, input.id)
  });
  const detailNotes = buildGearNotes(input);
  const fallbackImage =
    seedGear.find((item) => item.type === input.type)?.imageUrl ?? seedGear[0].imageUrl;

  const [updated] = await db
    .update(gearItems)
    .set({
      type: input.type,
      brand: input.brand,
      model: input.model,
      name: input.name,
      notes: detailNotes,
      imageUrl: input.imageUrl || existing?.imageUrl || fallbackImage,
      defaultForMethod: input.defaultForMethod,
      visibility: input.visibility
    })
    .where(and(eq(gearItems.id, input.id), eq(gearItems.ownerId, viewerId)))
    .returning({ id: gearItems.id });

  if (!updated) {
    throw new Error("Gear item not found");
  }

  return updated;
}

export const createGrinderInDb = createGearItemInDb;
export const updateGrinderInDb = updateGearItemInDb;

export async function createGearItemFromGrinderCatalogInDb(input: {
  catalogItemId: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const catalogItem = await getGrinderCatalogItemByIdFromDb(input.catalogItemId);

  if (!catalogItem || catalogItem.status !== "approved") {
    throw new Error("Catalog grinder not found");
  }

  return createGearItemInDb({
    type: "grinder",
    name: catalogItem.name,
    brand: catalogItem.brand,
    model: catalogItem.model,
    grinderDrive: catalogItem.grinderDrive,
    burrType: catalogItem.burrType,
    filterRange: catalogItem.filterRange,
    notes: catalogItem.notes,
    imageUrl: catalogItem.imageUrl,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });
}

export async function createGrinderCatalogItemInDb(input: {
  name: string;
  brand: string;
  model: string;
  grinderDrive: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  notes?: string;
  imageUrl?: string;
}) {
  const viewer = await getViewerFromDb();
  const id = crypto.randomUUID();
  const status: GrinderCatalogStatus = "approved";

  const [created] = await db
    .insert(grinderCatalogItems)
    .values({
      id,
      submittedById: viewer.id,
      name: input.name,
      brand: input.brand,
      model: input.model,
      grinderDrive: input.grinderDrive,
      burrType: input.burrType ?? "",
      filterRange: input.filterRange ?? "",
      notes: input.notes ?? "",
      imageUrl: input.imageUrl ?? "",
      status
    })
    .onConflictDoNothing({
      target: [grinderCatalogItems.brand, grinderCatalogItems.model]
    })
    .returning({ id: grinderCatalogItems.id });

  return { id: created?.id ?? id, status };
}

export async function createGearItemFromDripperCatalogInDb(input: {
  catalogItemId: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const catalogItem = await getDripperCatalogItemByIdFromDb(input.catalogItemId);

  if (!catalogItem || catalogItem.status !== "approved") {
    throw new Error("Catalog dripper not found");
  }

  return createGearItemInDb({
    type: "dripper",
    name: catalogItem.name,
    brand: catalogItem.brand,
    model: catalogItem.model,
    material: catalogItem.material,
    size: catalogItem.size,
    brewSpeed: catalogItem.brewSpeed,
    compatibleFilters: catalogItem.compatibleFilters,
    notes: catalogItem.notes,
    imageUrl: catalogItem.imageUrl,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });
}

export async function createDripperCatalogItemInDb(input: {
  name: string;
  brand: string;
  model: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  notes?: string;
  imageUrl?: string;
}) {
  const viewer = await getViewerFromDb();
  const id = crypto.randomUUID();
  const status: DripperCatalogStatus = "approved";

  const [created] = await db
    .insert(dripperCatalogItems)
    .values({
      id,
      submittedById: viewer.id,
      name: input.name,
      brand: input.brand,
      model: input.model,
      material: input.material ?? "",
      size: input.size ?? "",
      brewSpeed: input.brewSpeed ?? "",
      compatibleFilters: input.compatibleFilters ?? "",
      notes: input.notes ?? "",
      imageUrl: input.imageUrl ?? "",
      status
    })
    .onConflictDoNothing({
      target: [dripperCatalogItems.brand, dripperCatalogItems.model]
    })
    .returning({ id: dripperCatalogItems.id });

  return { id: created?.id ?? id, status };
}

export async function deleteGearItemInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db.delete(gearItems).where(and(eq(gearItems.id, id), eq(gearItems.ownerId, viewerId)));
}

export async function createCollectionInDb(input: {
  title: string;
  description?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const id = crypto.randomUUID();
  const slug = `${slugify(input.title)}-${id.slice(0, 8)}`;

  await db.insert(collectionsTable).values({
    id,
    ownerId: viewerId,
    slug,
    title: input.title,
    description: input.description ?? "",
    visibility: input.visibility
  });

  return { id, slug };
}

export async function addCollectionItemInDb(input: {
  collectionId: string;
  targetType: "recipe" | "brew_log";
  targetId: string;
}) {
  const viewerId = await ensureCurrentIdentity();
  const collection = await db.query.collections.findFirst({
    where: and(eq(collectionsTable.id, input.collectionId), eq(collectionsTable.ownerId, viewerId))
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  await assertCanUseSocialTarget(viewerId, input, "save");

  const existingItems = await db.query.collectionItems.findMany({
    where: eq(collectionItems.collectionId, input.collectionId)
  });

  await db
    .insert(collectionItems)
    .values({
      id: crypto.randomUUID(),
      collectionId: input.collectionId,
      targetType: input.targetType,
      targetId: input.targetId,
      position: existingItems.length
    })
    .onConflictDoNothing();

  await db
    .update(collectionsTable)
    .set({ updatedAt: new Date() })
    .where(eq(collectionsTable.id, input.collectionId));
}

export async function removeCollectionItemInDb(input: { collectionId: string; itemId: string }) {
  const viewerId = await ensureCurrentIdentity();
  const collection = await db.query.collections.findFirst({
    where: and(eq(collectionsTable.id, input.collectionId), eq(collectionsTable.ownerId, viewerId))
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.id, input.itemId),
        eq(collectionItems.collectionId, input.collectionId)
      )
    );
  await db
    .update(collectionsTable)
    .set({ updatedAt: new Date() })
    .where(eq(collectionsTable.id, input.collectionId));
}

export async function addReactionInDb(input: { targetType: SocialTargetType; targetId: string }) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);
  await assertCanUseSocialTarget(viewerId, input, "react");

  const [created] = await db
    .insert(reactions)
    .values({
      id: crypto.randomUUID(),
      userId: viewerId,
      targetType: input.targetType,
      targetId: input.targetId,
      value: "like"
    })
    .onConflictDoNothing()
    .returning({ id: reactions.id });

  if (created) {
    if (input.targetType === "recipe") {
      await refreshRecipeStatsInDb(input.targetId);
    }
    const target = await getNotificationTargetContext(input);
    if (target) {
      await createNotificationInDb({
        userId: target.ownerId,
        actorId: viewerId,
        type: "like",
        title: "New like",
        body: `${actor.displayName} liked ${target.title}.`,
        href: target.href
      });
    }
  }
}

export async function saveTargetInDb(input: { targetType: SocialTargetType; targetId: string }) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);
  await assertCanUseSocialTarget(viewerId, input, "save");

  const [created] = await db
    .insert(saves)
    .values({
      id: crypto.randomUUID(),
      userId: viewerId,
      targetType: input.targetType,
      targetId: input.targetId
    })
    .onConflictDoNothing()
    .returning({ id: saves.id });

  if (created) {
    if (input.targetType === "recipe") {
      await refreshRecipeStatsInDb(input.targetId);
    }
    const target = await getNotificationTargetContext(input);
    if (target) {
      await createNotificationInDb({
        userId: target.ownerId,
        actorId: viewerId,
        type: "system",
        title: "Content saved",
        body: `${actor.displayName} saved ${target.title}.`,
        href: target.href
      });
    }
  }
}

export async function followUserInDb(followingId: string) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);

  if (followingId === viewerId) {
    return;
  }

  const [created] = await db
    .insert(follows)
    .values({
      followerId: viewerId,
      followingId
    })
    .onConflictDoNothing()
    .returning({ followingId: follows.followingId });

  if (created) {
    await createNotificationInDb({
      userId: followingId,
      actorId: viewerId,
      type: "follow",
      title: "New follower",
      body: `${actor.displayName} followed you.`,
      href: `/u/${actor.handle}`
    });
  }
}

export async function createCommentInDb(input: {
  targetType: SocialTargetType;
  targetId: string;
  body: string;
  parentId?: string;
}) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);
  await assertCanUseSocialTarget(viewerId, input, "comment");

  await db.insert(comments).values({
    id: crypto.randomUUID(),
    userId: viewerId,
    targetType: input.targetType,
    targetId: input.targetId,
    parentId: input.parentId,
    body: input.body
  });

  if (input.targetType === "recipe") {
    await refreshRecipeStatsInDb(input.targetId);
  }

  const target = await getNotificationTargetContext(input);
  if (target) {
    await createNotificationInDb({
      userId: target.ownerId,
      actorId: viewerId,
      type: input.parentId ? "reply" : "comment",
      title: input.parentId ? "New reply" : "New comment",
      body: `${actor.displayName} commented on ${target.title}.`,
      href: target.href
    });
  }
}

export async function deleteCommentInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  const comment = await db.query.comments.findFirst({
    where: and(eq(comments.id, id), eq(comments.userId, viewerId))
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  await db.delete(comments).where(or(eq(comments.id, id), eq(comments.parentId, id)));
  if (comment.targetType === "recipe") {
    await refreshRecipeStatsInDb(comment.targetId);
  }
}

export async function getConversationsFromDb(): Promise<Conversation[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({
        conversation: directConversations,
        unreadCount: directConversationParticipants.unreadCount
      })
      .from(directConversations)
      .innerJoin(
        directConversationParticipants,
        eq(directConversationParticipants.conversationId, directConversations.id)
      )
      .where(eq(directConversationParticipants.userId, viewerId))
      .orderBy(desc(directConversations.updatedAt));

    if (rows.length === 0) {
      return shouldUseDemoData() ? seedConversations : [];
    }

    const conversationIds = rows.map((row) => row.conversation.id);
    const [messages, participants] = await Promise.all([
      db.query.directMessages.findMany({
        where: inArray(directMessages.conversationId, conversationIds),
        orderBy: (table, { asc }) => [asc(table.createdAt)]
      }),
      db
        .select({
          conversationId: directConversationParticipants.conversationId,
          profile: profiles
        })
        .from(directConversationParticipants)
        .innerJoin(profiles, eq(directConversationParticipants.userId, profiles.userId))
        .where(
          and(
            inArray(directConversationParticipants.conversationId, conversationIds),
            ne(directConversationParticipants.userId, viewerId)
          )
        )
    ]);
    const messagesByConversation = messages.reduce((map, message) => {
      const current = map.get(message.conversationId) ?? [];
      current.push({
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt.toISOString()
      });
      map.set(message.conversationId, current);
      return map;
    }, new Map<string, ConversationMessage[]>());
    const participantByConversation = new Map(
      participants.map((row) => [row.conversationId, mapProfile(row.profile)])
    );

    return rows.map((row, index) => {
      const fallback = seedConversations[index] ?? seedConversations[0];
      const conversationMessages = messagesByConversation.get(row.conversation.id) ?? [];
      const lastMessage = conversationMessages.at(-1);
      return {
        ...fallback,
        id: row.conversation.id,
        participant: participantByConversation.get(row.conversation.id) ?? fallback.participant,
        messages: conversationMessages.length > 0 ? conversationMessages : fallback.messages,
        lastMessage: lastMessage?.body ?? fallback.lastMessage,
        unreadCount: row.unreadCount,
        updatedAt: row.conversation.updatedAt.toISOString()
      };
    });
  }, seedConversations);
}

export async function getConversationByIdFromDb(id: string): Promise<Conversation | null> {
  const viewerId = await ensureCurrentIdentity();
  const conversation = (await getConversationsFromDb()).find((item) => item.id === id) ?? null;
  if (!conversation) {
    return null;
  }

  await db
    .update(directConversationParticipants)
    .set({ unreadCount: 0 })
    .where(
      and(
        eq(directConversationParticipants.conversationId, id),
        eq(directConversationParticipants.userId, viewerId)
      )
    );
  return { ...conversation, unreadCount: 0 };
}

export async function sendMessageInDb(input: { conversationId: string; body: string }) {
  const viewerId = await ensureCurrentIdentity();
  const participant = await db.query.directConversationParticipants.findFirst({
    where: and(
      eq(directConversationParticipants.conversationId, input.conversationId),
      eq(directConversationParticipants.userId, viewerId)
    )
  });

  if (!participant) {
    throw new Error("Conversation not found");
  }

  const recipients = await db
    .select({ profile: profiles })
    .from(directConversationParticipants)
    .innerJoin(profiles, eq(directConversationParticipants.userId, profiles.userId))
    .where(
      and(
        eq(directConversationParticipants.conversationId, input.conversationId),
        ne(directConversationParticipants.userId, viewerId)
      )
    );
  await assertCanMessageProfiles(
    viewerId,
    recipients.map((row) => row.profile)
  );

  await db.insert(directMessages).values({
    id: crypto.randomUUID(),
    conversationId: input.conversationId,
    senderId: viewerId,
    body: input.body
  });

  await db
    .update(directConversationParticipants)
    .set({
      unreadCount: sql`${directConversationParticipants.unreadCount} + 1`
    })
    .where(
      and(
        eq(directConversationParticipants.conversationId, input.conversationId),
        ne(directConversationParticipants.userId, viewerId)
      )
    );

  await db
    .update(directConversations)
    .set({ updatedAt: new Date() })
    .where(eq(directConversations.id, input.conversationId));
}

export async function startConversationInDb(input: { recipientId: string; body: string }) {
  const viewerId = await ensureCurrentIdentity();
  if (input.recipientId === viewerId) {
    throw new Error("Choose another recipient");
  }

  const recipient = await db.query.profiles.findFirst({
    where: eq(profiles.userId, input.recipientId)
  });
  if (!recipient) {
    throw new Error("Recipient not found");
  }

  await assertCanMessageProfiles(viewerId, [recipient]);

  const viewerParticipantRows = await db.query.directConversationParticipants.findMany({
    where: eq(directConversationParticipants.userId, viewerId)
  });
  const recipientParticipantRows = await db.query.directConversationParticipants.findMany({
    where: eq(directConversationParticipants.userId, input.recipientId)
  });
  const viewerConversationIds = new Set(
    viewerParticipantRows.map((participant) => participant.conversationId)
  );
  const existingConversationId = recipientParticipantRows.find((participant) =>
    viewerConversationIds.has(participant.conversationId)
  )?.conversationId;
  const conversationId = existingConversationId ?? crypto.randomUUID();

  if (!existingConversationId) {
    await db.insert(directConversations).values({ id: conversationId });
    await db.insert(directConversationParticipants).values([
      { conversationId, userId: viewerId, unreadCount: 0 },
      { conversationId, userId: input.recipientId, unreadCount: 0 }
    ]);
  }

  await sendMessageInDb({
    conversationId,
    body: input.body
  });

  return { id: conversationId };
}

async function assertCanMessageProfiles(viewerId: string, recipients: DbProfile[]) {
  if (recipients.length === 0) {
    throw new Error("Recipient not found");
  }

  for (const recipient of recipients) {
    const allowed =
      recipient.messagePolicy === "public" ||
      (recipient.messagePolicy === "followers" &&
        (await isFollowingInDb(viewerId, recipient.userId)));
    if (!allowed) {
      throw new Error("Recipient does not accept messages");
    }
  }
}

export async function getNotificationsFromDb(): Promise<Notification[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({
        notification: notificationsTable,
        actor: profiles
      })
      .from(notificationsTable)
      .leftJoin(profiles, eq(notificationsTable.actorId, profiles.userId))
      .where(eq(notificationsTable.userId, viewerId))
      .orderBy(desc(notificationsTable.createdAt));

    return rows.length > 0
      ? rows.map((row) => mapNotification(row.notification, row.actor ?? undefined))
      : shouldUseDemoData()
        ? seedNotifications
        : [];
  }, seedNotifications);
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

export async function markNotificationsReadInDb() {
  const viewerId = await ensureCurrentIdentity();
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(eq(notificationsTable.userId, viewerId));
}

async function getNotificationTargetContext(input: {
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

async function getNotificationActor(userId: string) {
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
      defaultGrinderId: seedCurrentUser.defaultGrinderId,
      defaultDripperId: seedCurrentUser.defaultDripperId,
      defaultFilterId: seedCurrentUser.defaultFilterId,
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
  const otherCreators = seedCreators.filter((creator) => creator.id !== seedCurrentUser.id);
  if (otherCreators.length > 0) {
    await db
      .insert(user)
      .values(
        otherCreators.map((creator) => ({
          id: creator.id,
          name: creator.displayName,
          email: `${creator.handle}@coffee-journey.local`,
          emailVerified: true,
          image: creator.avatarUrl
        }))
      )
      .onConflictDoNothing();

    await db
      .insert(profiles)
      .values(
        otherCreators.map((creator) => ({
          id: `profile_${creator.handle}`,
          userId: creator.id,
          handle: creator.handle,
          displayName: creator.displayName,
          bio: creator.bio,
          location: creator.location,
          website: creator.website,
          avatarUrl: creator.avatarUrl,
          coverUrl: creator.coverUrl,
          defaultVisibility: creator.defaultVisibility,
          defaultCommentPolicy: creator.defaultCommentPolicy,
          messagePolicy: creator.messagePolicy,
          showGearOnProfile: creator.showGearOnProfile,
          showCoffeeOnProfile: creator.showCoffeeOnProfile,
          weightUnit: creator.weightUnit,
          temperatureUnit: creator.temperatureUnit,
          ratioStyle: creator.ratioStyle,
          favoriteMethods: creator.favoriteMethods
        }))
      )
      .onConflictDoNothing();
  }

  await db
    .insert(follows)
    .values({ followerId: DEV_USER_ID, followingId: "user_alex" })
    .onConflictDoNothing();

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
    .insert(recipeGearItems)
    .values(
      seedRecipes.flatMap((recipe) =>
        recipe.gear.map((item, index) => ({
          recipeId: recipe.id,
          gearId: item.id,
          position: index
        }))
      )
    )
    .onConflictDoNothing();

  await db
    .insert(directConversations)
    .values(
      seedConversations.map((conversation) => ({
        id: conversation.id,
        updatedAt: new Date(conversation.updatedAt)
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(directConversationParticipants)
    .values(
      seedConversations.flatMap((conversation) => [
        {
          conversationId: conversation.id,
          userId: DEV_USER_ID,
          unreadCount: conversation.unreadCount
        },
        {
          conversationId: conversation.id,
          userId:
            conversation.participant.id === seedCurrentUser.id
              ? DEV_USER_ID
              : conversation.participant.id,
          unreadCount: 0
        }
      ])
    )
    .onConflictDoNothing();

  await db
    .insert(directMessages)
    .values(
      seedConversations.flatMap((conversation) =>
        conversation.messages.map((message) => ({
          id: message.id,
          conversationId: conversation.id,
          senderId: message.senderId === seedCurrentUser.id ? DEV_USER_ID : message.senderId,
          body: message.body,
          createdAt: new Date(message.createdAt)
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

async function getStepsForRecipes(recipeIds: string[]) {
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

async function getGearForRecipeIds(recipeIds: string[]) {
  if (recipeIds.length === 0) {
    return new Map<string, GearItem[]>();
  }

  const rows = await db
    .select({
      recipeId: recipeGearItems.recipeId,
      gear: gearItems
    })
    .from(recipeGearItems)
    .innerJoin(gearItems, eq(recipeGearItems.gearId, gearItems.id))
    .where(inArray(recipeGearItems.recipeId, recipeIds))
    .orderBy(asc(recipeGearItems.recipeId), asc(recipeGearItems.position));

  return rows.reduce((map, row) => {
    const current = map.get(row.recipeId) ?? [];
    current.push(mapGear(row.gear));
    map.set(row.recipeId, current);
    return map;
  }, new Map<string, GearItem[]>());
}

async function getDefaultRecipeGearIds(ownerId: string, method: BrewMethod) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, ownerId)
  });
  const profileGearIds = [
    profile?.defaultGrinderId,
    profile?.defaultDripperId,
    profile?.defaultFilterId
  ].filter(Boolean) as string[];

  const rows = await db.query.gearItems.findMany({
    where: and(
      eq(gearItems.ownerId, ownerId),
      or(
        eq(gearItems.defaultForMethod, method),
        profileGearIds.length > 0 ? inArray(gearItems.id, profileGearIds) : undefined
      )
    ),
    orderBy: asc(gearItems.createdAt)
  });
  const availableIds = new Set(rows.map((row) => row.id));

  return [
    ...profileGearIds.filter((id) => availableIds.has(id)),
    ...rows.filter((row) => row.defaultForMethod === method).map((row) => row.id)
  ].filter((id, index, ids) => ids.indexOf(id) === index);
}

async function syncRecipeGearForSetup(recipeId: string, ownerId: string, method: BrewMethod) {
  const gearIds = await getDefaultRecipeGearIds(ownerId, method);
  await syncRecipeGearIds(recipeId, gearIds);
}

async function syncRecipeGearIds(recipeId: string, gearIds: string[]) {
  await db.delete(recipeGearItems).where(eq(recipeGearItems.recipeId, recipeId));
  if (gearIds.length === 0) {
    return;
  }

  await db.insert(recipeGearItems).values(
    gearIds.map((gearId, index) => ({
      recipeId,
      gearId,
      position: index
    }))
  );
}

async function filterOwnedGearItemIds(gearItemIds: string[], ownerId: string) {
  const uniqueIds = Array.from(new Set(gearItemIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ id: gearItems.id })
    .from(gearItems)
    .where(and(inArray(gearItems.id, uniqueIds), eq(gearItems.ownerId, ownerId)));
  const ownedIds = new Set(rows.map((row) => row.id));

  return uniqueIds.filter((id) => ownedIds.has(id));
}

async function copyRecipeGearItems(sourceRecipeId: string, targetRecipeId: string) {
  const links = await db.query.recipeGearItems.findMany({
    where: eq(recipeGearItems.recipeId, sourceRecipeId),
    orderBy: asc(recipeGearItems.position)
  });

  if (links.length === 0) {
    return false;
  }

  await db.insert(recipeGearItems).values(
    links.map((link) => ({
      recipeId: targetRecipeId,
      gearId: link.gearId,
      position: link.position
    }))
  );
  return true;
}

function mapProfile(row: DbProfile): UserProfile {
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
    defaultGrinderId: row.defaultGrinderId ?? undefined,
    defaultDripperId: row.defaultDripperId ?? undefined,
    defaultFilterId: row.defaultFilterId ?? undefined,
    stats: {
      recipes: 0,
      brewLogs: 0,
      followers: 0,
      following: 0,
      totalRecipeBrews: 0
    }
  };
}

export async function backfillRecipeStatsInDb() {
  const rows = await db.select({ id: recipesTable.id }).from(recipesTable);
  await Promise.all(rows.map((row) => refreshRecipeStatsInDb(row.id)));
}

async function refreshRecipeStatsInDb(recipeId: string) {
  const [likesRows, savesRows, commentsRows, brewRows, remixRows] = await Promise.all([
    db
      .select({ id: reactions.id })
      .from(reactions)
      .where(and(eq(reactions.targetType, "recipe"), eq(reactions.targetId, recipeId))),
    db
      .select({ id: saves.id })
      .from(saves)
      .where(and(eq(saves.targetType, "recipe"), eq(saves.targetId, recipeId))),
    db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.targetType, "recipe"), eq(comments.targetId, recipeId))),
    db
      .select({ rating: brewLogsTable.rating })
      .from(brewLogsTable)
      .where(eq(brewLogsTable.recipeId, recipeId)),
    db
      .select({ id: recipesTable.id })
      .from(recipesTable)
      .where(eq(recipesTable.parentRecipeId, recipeId))
  ]);

  await db
    .update(recipesTable)
    .set({
      stats: calculateRecipeStats({
        likes: likesRows.length,
        saves: savesRows.length,
        comments: commentsRows.length,
        brews: brewRows,
        remixes: remixRows.length
      }),
      updatedAt: new Date()
    })
    .where(eq(recipesTable.id, recipeId));
}

type SocialTargetAccess = {
  ownerId: string;
  visibility: Visibility;
  commentPolicy?: CommentPolicy;
};

async function assertCanUseSocialTarget(
  viewerId: string,
  input: { targetType: SocialTargetType; targetId: string; parentId?: string },
  action: "react" | "save" | "comment" | "report"
) {
  const target = await getSocialTargetAccess(input);

  if (!target) {
    throw new Error("Target not found");
  }

  const isFollower = await isFollowingInDb(viewerId, target.ownerId);
  const canRead = canReadVisibility(target.visibility, {
    ownerId: target.ownerId,
    viewer: { id: viewerId },
    isFollower
  });

  if (!canRead) {
    throw new Error("Target is not available");
  }

  if (action === "comment") {
    const policy = target.commentPolicy ?? "public";
    if (policy === "disabled") {
      throw new Error("Comments are disabled");
    }
    if (policy === "followers" && viewerId !== target.ownerId && !isFollower) {
      throw new Error("Comments are limited to followers");
    }
  }
}

async function getSocialTargetAccess(input: {
  targetType: SocialTargetType;
  targetId: string;
}): Promise<SocialTargetAccess | null> {
  if (input.targetType === "recipe") {
    const row = await db.query.recipes.findFirst({
      where: eq(recipesTable.id, input.targetId)
    });

    return row
      ? {
          ownerId: row.ownerId,
          visibility: row.visibility,
          commentPolicy: row.commentPolicy
        }
      : null;
  }

  if (input.targetType === "brew_log") {
    const row = await db.query.brewLogs.findFirst({
      where: eq(brewLogsTable.id, input.targetId)
    });

    return row ? { ownerId: row.ownerId, visibility: row.visibility } : null;
  }

  if (input.targetType === "coffee") {
    const row = await db.query.coffeeBeans.findFirst({
      where: eq(coffeeBeans.id, input.targetId)
    });

    return row?.ownerId ? { ownerId: row.ownerId, visibility: row.visibility } : null;
  }

  if (input.targetType === "gear") {
    const row = await db.query.gearItems.findFirst({
      where: eq(gearItems.id, input.targetId)
    });

    return row?.ownerId ? { ownerId: row.ownerId, visibility: row.visibility } : null;
  }

  if (input.targetType === "collection") {
    const row = await db.query.collections.findFirst({
      where: eq(collectionsTable.id, input.targetId)
    });

    return row ? { ownerId: row.ownerId, visibility: row.visibility } : null;
  }

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, input.targetId)
  });

  return comment
    ? getSocialTargetAccess({ targetType: comment.targetType, targetId: comment.targetId })
    : null;
}

function mapCoffee(row: DbCoffee): CoffeeBean {
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

function mapGear(row: DbGear): GearItem {
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

function mapGrinderCatalogItem(row: DbGrinderCatalogItem): GrinderCatalogItem {
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

function mapDripperCatalogItem(row: DbDripperCatalogItem): DripperCatalogItem {
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

function filterSeedGrinderCatalog(filters?: {
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

function filterSeedDripperCatalog(filters?: {
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

function mapContentReport(row: DbContentReport, reporter: DbProfile): ContentReport {
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

async function mapCollectionWithItems(row: DbCollection, owner: DbProfile): Promise<Collection> {
  const rows = await db.query.collectionItems.findMany({
    where: eq(collectionItems.collectionId, row.id),
    orderBy: asc(collectionItems.position)
  });
  const recipes = await getRecipesFromDb();
  const brewLogs = await getBrewLogsFromDb();
  const items = rows.map((item) => mapCollectionItem(item, recipes, brewLogs));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    owner: mapProfile(owner),
    itemCount: items.length,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapCollectionItem(
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

function buildGearNotes(input: {
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

function mapRecipe(
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

function mapStep(row: DbRecipeStep): RecipeStep {
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

function mapBrewLog(
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

function mapComment(row: DbComment, profile: DbProfile): Comment {
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

function mapClub(row: DbClub, memberCount: number, activeChallengeId?: string): Club {
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

function mapChallenge(row: DbChallenge, clubSlug?: string): Challenge {
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

function mapNotification(row: DbNotification, actor?: DbProfile): Notification {
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

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

function splitTags(value?: string) {
  return (
    value
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
}

async function withSeedFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AuthRequiredError || !shouldUseDemoData()) {
      throw error;
    }

    return fallback;
  }
}

function isMissingCatalogTableError(error: unknown) {
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

function shouldUseDemoData() {
  return process.env.ENABLE_DEMO_DATA === "true" || process.env.E2E_AUTH_BYPASS === "true";
}
