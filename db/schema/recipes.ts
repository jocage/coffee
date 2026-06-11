import { index, integer, jsonb, pgEnum, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { coffeeBeans } from "@/db/schema/coffee";
import { visibilityEnum } from "@/db/schema/profiles";

export const brewMethodEnum = pgEnum("brew_method", ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"]);
export const remixPolicyEnum = pgEnum("remix_policy", ["none", "with_credit", "ask_permission"]);
export const commentPolicyEnum = pgEnum("comment_policy", ["disabled", "followers", "public"]);

export const recipes = pgTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    coffeeId: text("coffee_id").references(() => coffeeBeans.id, { onDelete: "set null" }),
    parentRecipeId: text("parent_recipe_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    description: text("description").notNull().default(""),
    method: brewMethodEnum("method").notNull(),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    remixPolicy: remixPolicyEnum("remix_policy").notNull().default("with_credit"),
    commentPolicy: commentPolicyEnum("comment_policy").notNull().default("public"),
    coverAssetId: text("cover_asset_id"),
    coverUrl: text("cover_url").notNull().default(""),
    doseGrams: real("dose_grams").notNull(),
    waterGrams: real("water_grams").notNull(),
    ratio: real("ratio").notNull(),
    temperatureCelsius: integer("temperature_celsius").notNull(),
    grindLabel: text("grind_label").notNull(),
    grindSetting: text("grind_setting"),
    totalTimeSeconds: integer("total_time_seconds").notNull(),
    difficulty: text("difficulty").notNull().default("intermediate"),
    flavorNotes: jsonb("flavor_notes").$type<string[]>().notNull().default([]),
    tasteProfile: jsonb("taste_profile").$type<Record<string, number>>().notNull().default({}),
    stats: jsonb("stats").$type<{
      likes: number;
      saves: number;
      brews: number;
      averageRating: number;
      remixes: number;
      comments: number;
    }>().notNull().default({
      likes: 0,
      saves: 0,
      brews: 0,
      averageRating: 0,
      remixes: 0,
      comments: 0
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ownerIdx: index("recipes_owner_idx").on(table.ownerId),
    publicSlugIdx: index("recipes_slug_idx").on(table.slug)
  })
);

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    startsAtSeconds: integer("starts_at_seconds").notNull(),
    endsAtSeconds: integer("ends_at_seconds"),
    pourGrams: real("pour_grams"),
    cumulativeWaterGrams: real("cumulative_water_grams").notNull(),
    instruction: text("instruction").notNull(),
    cue: text("cue").notNull().default("")
  },
  (table) => ({
    recipeIdx: index("recipe_steps_recipe_idx").on(table.recipeId)
  })
);
