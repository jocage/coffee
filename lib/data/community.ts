import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { collectionItems, collections as collectionsTable } from "@/db/schema/collections";
import {
  challengeEntries,
  challenges as challengesTable,
  clubs as clubsTable,
  clubMembers,
  clubPosts
} from "@/db/schema/clubs";
import { profiles } from "@/db/schema/profiles";
import {
  challenges as seedChallenges,
  clubs as seedClubs,
  creators as seedCreators,
  recipes as seedRecipes
} from "@/lib/data/seed";
import type { Challenge, Club, ClubDetail, ClubPost, Collection, Recipe, Visibility } from "@/lib/domain";
import {
  createNotificationInDb,
  ensureCurrentIdentity,
  mapChallenge,
  mapClub,
  mapCollectionItem,
  mapProfile,
  shouldUseDemoData,
  slugify,
  withSeedFallback
} from "@/lib/data/shared";
import { getBrewLogsFromDb, getRecipesFromDb } from "@/lib/data/recipes";

type DbCollection = typeof collectionsTable.$inferSelect;
type DbProfile = typeof profiles.$inferSelect;
type DbClubPost = typeof clubPosts.$inferSelect;

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

export async function getClubDetailBySlugFromDb(slug: string): Promise<ClubDetail | null> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const clubRow = await db.query.clubs.findFirst({
      where: eq(clubsTable.slug, slug)
    });

    if (!clubRow) {
      return null;
    }

    const [memberRows, challengesRows] = await Promise.all([
      db.query.clubMembers.findMany({
        where: eq(clubMembers.clubId, clubRow.id)
      }),
      db.query.challenges.findMany({
        where: eq(challengesTable.clubId, clubRow.id),
        orderBy: (table, { desc }) => [desc(table.startsAt)]
      })
    ]);
    const isMember = memberRows.some((member) => member.userId === viewerId);
    const club = mapClub(clubRow, memberRows.length, challengesRows[0]?.id);
    const canReadContent = canReadClubContent(club, isMember);

    if (!canReadContent) {
      return {
        club,
        isMember,
        canReadContent,
        canPost: false,
        posts: [],
        pinnedRecipes: [],
        members: [],
        challenges: []
      };
    }

    const memberIds = memberRows.map((member) => member.userId);
    const [memberProfiles, recipes, postRows] = await Promise.all([
      memberIds.length > 0
        ? db.query.profiles.findMany({
            where: inArray(profiles.userId, memberIds)
          })
        : [],
      getRecipesFromDb({ visibility: "public" }),
      db
        .select({
          post: clubPosts,
          author: profiles
        })
        .from(clubPosts)
        .innerJoin(profiles, eq(clubPosts.authorId, profiles.userId))
        .where(eq(clubPosts.clubId, clubRow.id))
        .orderBy(desc(clubPosts.createdAt))
    ]);
    const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    return {
      club,
      isMember,
      canReadContent,
      canPost: isMember,
      posts: postRows.map((row) => mapClubPost(row.post, row.author, recipesById)),
      pinnedRecipes: recipes.slice(0, 3),
      members: memberProfiles.map(mapProfile),
      challenges: challengesRows.map((challenge) => mapChallenge(challenge, club.slug))
    };
  }, buildSeedClubDetail(slug));
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

export async function createClubPostInDb(input: {
  clubId: string;
  body: string;
  pinnedRecipeId?: string;
  path: string;
}) {
  const viewerId = await ensureCurrentIdentity();
  const club = await db.query.clubs.findFirst({
    where: eq(clubsTable.id, input.clubId)
  });

  if (!club) {
    throw new Error("Club not found");
  }

  const membership = await db.query.clubMembers.findFirst({
    where: and(eq(clubMembers.clubId, input.clubId), eq(clubMembers.userId, viewerId))
  });

  if (!membership) {
    throw new Error("Join the club before posting");
  }

  const id = crypto.randomUUID();
  await db.insert(clubPosts).values({
    id,
    clubId: input.clubId,
    authorId: viewerId,
    body: input.body,
    pinnedRecipeId: input.pinnedRecipeId
  });

  await createNotificationInDb({
    userId: viewerId,
    type: "system",
    title: "Club post published",
    body: "Your club post is live.",
    href: input.path
  });

  return id;
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

function canReadClubContent(club: Club, isMember: boolean) {
  return club.visibility === "public" || isMember;
}

function mapClubPost(
  row: DbClubPost,
  author: DbProfile,
  recipesById: Map<string, Recipe>
): ClubPost {
  const pinnedRecipe = row.pinnedRecipeId ? recipesById.get(row.pinnedRecipeId) : undefined;

  return {
    id: row.id,
    clubId: row.clubId,
    author: mapProfile(author),
    body: row.body,
    pinnedRecipe,
    createdAt: row.createdAt.toISOString()
  };
}

function buildSeedClubDetail(slug: string): ClubDetail | null {
  const club = seedClubs.find((item) => item.slug === slug);

  if (!club) {
    return null;
  }

  const challenges = seedChallenges.filter((challenge) => challenge.clubSlug === club.slug);
  const pinnedRecipes = seedRecipes.slice(0, 2);

  return {
    club,
    isMember: false,
    canReadContent: club.visibility === "public",
    canPost: false,
    posts:
      club.visibility === "public"
        ? [
            {
              id: `${club.id}_seed_post`,
              clubId: club.id,
              author: seedCreators[1] ?? seedCreators[0],
              body: "What changed your cup most this week? Members are comparing bloom agitation, temperature drops and grinder settings.",
              pinnedRecipe: pinnedRecipes[0],
              createdAt: "2026-06-10T12:00:00.000Z"
            }
          ]
        : [],
    pinnedRecipes: club.visibility === "public" ? pinnedRecipes : [],
    members: club.visibility === "public" ? seedCreators : [],
    challenges: club.visibility === "public" ? challenges : []
  };
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
