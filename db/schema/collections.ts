import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { visibilityEnum } from "@/db/schema/profiles";
import { socialTargetEnum } from "@/db/schema/social";

export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ownerIdx: index("collections_owner_idx").on(table.ownerId),
    ownerSlugUnique: uniqueIndex("collections_owner_slug_unique").on(table.ownerId, table.slug)
  })
);

export const collectionItems = pgTable(
  "collection_items",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    targetType: socialTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    collectionIdx: index("collection_items_collection_idx").on(table.collectionId, table.position),
    uniqueItem: uniqueIndex("collection_items_unique").on(table.collectionId, table.targetType, table.targetId)
  })
);
