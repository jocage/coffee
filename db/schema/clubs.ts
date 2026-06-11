import { integer, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { brewLogs } from "@/db/schema/brews";
import { visibilityEnum } from "@/db/schema/profiles";

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const clubRoleEnum = pgEnum("club_role", ["member", "moderator", "owner"]);

export const clubMembers = pgTable(
  "club_members",
  {
    clubId: text("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: clubRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.clubId, table.userId] })
  })
);

export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  clubId: text("club_id").references(() => clubs.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  entryCount: integer("entry_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const challengeEntries = pgTable(
  "challenge_entries",
  {
    challengeId: text("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    brewLogId: text("brew_log_id").references(() => brewLogs.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.challengeId, table.userId] })
  })
);
