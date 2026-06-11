import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const socialTargetEnum = pgEnum("social_target", ["recipe", "brew_log", "comment", "collection", "coffee", "gear"]);
export const reportReasonEnum = pgEnum("report_reason", ["spam", "harassment", "unsafe", "copyright", "other"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "reviewing", "resolved", "dismissed"]);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueFollow: uniqueIndex("follows_unique").on(table.followerId, table.followingId)
  })
);

export const reactions = pgTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    targetType: socialTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    value: text("value").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueReaction: uniqueIndex("reactions_unique").on(table.userId, table.targetType, table.targetId)
  })
);

export const saves = pgTable(
  "saves",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    targetType: socialTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueSave: uniqueIndex("saves_unique").on(table.userId, table.targetType, table.targetId)
  })
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    targetType: socialTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    parentId: text("parent_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    targetIdx: index("comments_target_idx").on(table.targetType, table.targetId)
  })
);

export const directConversations = pgTable("direct_conversations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const directConversationParticipants = pgTable(
  "direct_conversation_participants",
  {
    conversationId: text("conversation_id").notNull().references(() => directConversations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    unreadCount: integer("unread_count").notNull().default(0)
  },
  (table) => ({
    uniqueParticipant: uniqueIndex("direct_conversation_participants_unique").on(table.conversationId, table.userId)
  })
);

export const directMessages = pgTable(
  "direct_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull().references(() => directConversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    conversationIdx: index("direct_messages_conversation_idx").on(table.conversationId, table.createdAt)
  })
);

export const notificationTypeEnum = pgEnum("notification_type", [
  "follow",
  "like",
  "comment",
  "reply",
  "recipe_brewed",
  "recipe_remixed",
  "mention",
  "challenge",
  "system"
]);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href").notNull().default("/notifications"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId, table.readAt, table.createdAt)
  })
);

export const contentReports = pgTable(
  "content_reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    targetType: socialTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details").notNull().default(""),
    status: reportStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
  },
  (table) => ({
    statusIdx: index("content_reports_status_idx").on(table.status, table.createdAt),
    targetIdx: index("content_reports_target_idx").on(table.targetType, table.targetId)
  })
);
