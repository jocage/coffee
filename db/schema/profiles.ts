import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const visibilityEnum = pgEnum("visibility", ["private", "unlisted", "followers", "public"]);

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    handle: text("handle").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    location: text("location"),
    website: text("website"),
    avatarAssetId: text("avatar_asset_id"),
    coverAssetId: text("cover_asset_id"),
    avatarUrl: text("avatar_url").notNull().default(""),
    coverUrl: text("cover_url").notNull().default(""),
    defaultVisibility: visibilityEnum("default_visibility").notNull().default("private"),
    favoriteMethods: jsonb("favorite_methods").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    handleUnique: uniqueIndex("profiles_handle_unique").on(table.handle),
    userIdx: index("profiles_user_idx").on(table.userId)
  })
);
