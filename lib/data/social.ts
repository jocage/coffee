import "server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { brewLogs as brewLogsTable } from "@/db/schema/brews";
import { coffeeBeans } from "@/db/schema/coffee";
import { collections as collectionsTable } from "@/db/schema/collections";
import { gearItems } from "@/db/schema/gear";
import { profiles } from "@/db/schema/profiles";
import { recipes as recipesTable } from "@/db/schema/recipes";
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
  conversations as seedConversations,
  notifications as seedNotifications
} from "@/lib/data/seed";
import type {
  Comment,
  ContentReport,
  Conversation,
  Notification,
  SocialCounts,
  SocialTargetType
} from "@/lib/domain";
import {
  createNotificationInDb,
  ensureCurrentIdentity,
  getNotificationActor,
  getNotificationTargetContext,
  mapComment,
  mapContentReport,
  mapNotification,
  shouldUseDemoData,
  withSeedFallback
} from "@/lib/data/shared";
import { ensureCurrentUserIsAdmin } from "@/lib/data/profiles";

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

export async function markNotificationsReadInDb() {
  const viewerId = await ensureCurrentIdentity();
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(eq(notificationsTable.userId, viewerId));
}
