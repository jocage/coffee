import { index, jsonb, pgEnum, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { visibilityEnum } from "@/db/schema/profiles";

export const roastLevelEnum = pgEnum("roast_level", ["light", "medium-light", "medium", "medium-dark", "dark"]);

export const coffeeBeans = pgTable(
  "coffee_beans",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    roaster: text("roaster").notNull(),
    origin: text("origin").notNull(),
    process: text("process"),
    roastLevel: roastLevelEnum("roast_level").notNull().default("medium-light"),
    flavorNotes: jsonb("flavor_notes").$type<string[]>().notNull().default([]),
    rating: real("rating"),
    imageUrl: text("image_url").notNull().default(""),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    slugIdx: index("coffee_beans_slug_idx").on(table.slug),
    ownerIdx: index("coffee_beans_owner_idx").on(table.ownerId)
  })
);
