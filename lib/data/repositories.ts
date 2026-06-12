import "server-only";

import { and, asc, desc, eq, ilike, inArray, ne, or } from "drizzle-orm";
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
import { recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
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
  RoastLevel,
  SocialTargetType,
  SocialCounts,
  UserProfile,
  Visibility
} from "@/lib/domain";
import { auth } from "@/lib/auth/auth";
import { isAdminProfile } from "@/lib/permissions/admin";
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
    const gear = await getGearFromDb();

    return rows.map((row) =>
      mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gear
      )
    );
  }, seedRecipes);
}

export async function getRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const recipes = await getRecipesFromDb();
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
      const gear = await getGearFromDb();
      return mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gear
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
    const gear = await getGearFromDb();

    return rows.map((row) => {
      const coffee = row.coffee ?? seedCoffees[0];
      const recipe = row.recipe
        ? mapRecipe(row.recipe, row.profile, coffee, steps.get(row.recipe.id) ?? [], gear)
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
      const gear = await getGearFromDb();
      const coffee = row[0].coffee ?? seedCoffees[0];
      const recipe = row[0].recipe
        ? mapRecipe(row[0].recipe, row[0].profile, coffee, steps.get(row[0].recipe.id) ?? [], gear)
        : undefined;
      return mapBrewLog(row[0].brewLog, row[0].profile, recipe, coffee);
    },
    seedBrewLogs.find((brewLog) => brewLog.id === id) ?? null
  );
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
  const recipeId = crypto.randomUUID();
  const slug = slugify(input.title);

  await db.insert(recipesTable).values({
    id: recipeId,
    ownerId: viewerId,
    coffeeId: coffee.id,
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

  return updated;
}

export async function deleteBrewLogInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(brewLogsTable)
    .where(and(eq(brewLogsTable.id, id), eq(brewLogsTable.ownerId, viewerId)));
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

  await db.insert(comments).values({
    id: crypto.randomUUID(),
    userId: viewerId,
    targetType: input.targetType,
    targetId: input.targetId,
    parentId: input.parentId,
    body: input.body
  });

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
}

export async function getConversationsFromDb(): Promise<Conversation[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({ conversation: directConversations })
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
    const messages = await db.query.directMessages.findMany({
      where: inArray(directMessages.conversationId, conversationIds),
      orderBy: (table, { desc }) => [desc(table.createdAt)]
    });

    return rows.map((row, index) => {
      const fallback = seedConversations[index] ?? seedConversations[0];
      const lastMessage = messages.find(
        (message) => message.conversationId === row.conversation.id
      );
      return {
        ...fallback,
        id: row.conversation.id,
        lastMessage: lastMessage?.body ?? fallback.lastMessage,
        updatedAt: row.conversation.updatedAt.toISOString()
      };
    });
  }, seedConversations);
}

export async function getConversationByIdFromDb(id: string): Promise<Conversation | null> {
  const conversations = await getConversationsFromDb();
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

export async function sendMessageInDb(input: { conversationId: string; body: string }) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .insert(directConversations)
    .values({
      id: input.conversationId
    })
    .onConflictDoUpdate({
      target: directConversations.id,
      set: { updatedAt: new Date() }
    });

  await db
    .insert(directConversationParticipants)
    .values({
      conversationId: input.conversationId,
      userId: viewerId,
      unreadCount: 0
    })
    .onConflictDoNothing();

  await db.insert(directMessages).values({
    id: crypto.randomUUID(),
    conversationId: input.conversationId,
    senderId: viewerId,
    body: input.body
  });
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
