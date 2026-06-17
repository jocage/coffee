import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collectionItems, collections as collectionsTable } from "@/db/schema/collections";
import {
  challengeEntries,
  challenges as challengesTable,
  clubMembers
} from "@/db/schema/clubs";
import { profiles } from "@/db/schema/profiles";
import { challenges as seedChallenges, clubs as seedClubs } from "@/lib/data/seed";
import type { Challenge, Club, Collection, Visibility } from "@/lib/domain";
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
