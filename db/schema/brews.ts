import { index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { coffeeBeans } from "@/db/schema/coffee";
import { visibilityEnum } from "@/db/schema/profiles";
import { brewMethodEnum, recipes } from "@/db/schema/recipes";

export const brewLogs = pgTable(
  "brew_logs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
    coffeeId: text("coffee_id").references(() => coffeeBeans.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    method: brewMethodEnum("method").notNull().default("V60"),
    doseGrams: real("dose_grams").notNull(),
    waterGrams: real("water_grams").notNull(),
    outputGrams: real("output_grams"),
    temperatureCelsius: integer("temperature_celsius").notNull(),
    grindSetting: text("grind_setting"),
    brewTimeSeconds: integer("brew_time_seconds").notNull(),
    pressureBars: real("pressure_bars"),
    rating: integer("rating").notNull(),
    tastingNotes: text("tasting_notes").notNull().default(""),
    flavorTags: jsonb("flavor_tags").$type<string[]>().notNull().default([]),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    brewedAt: timestamp("brewed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ownerIdx: index("brew_logs_owner_idx").on(table.ownerId),
    recipeIdx: index("brew_logs_recipe_idx").on(table.recipeId)
  })
);
