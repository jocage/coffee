import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { visibilityEnum } from "@/db/schema/profiles";

export const gearTypeEnum = pgEnum("gear_type", [
  "grinder",
  "dripper",
  "filter",
  "kettle",
  "scale",
  "server",
  "espresso_machine",
  "other"
]);
export const grinderCatalogStatusEnum = pgEnum("grinder_catalog_status", [
  "pending",
  "approved",
  "rejected"
]);
export const dripperCatalogStatusEnum = pgEnum("dripper_catalog_status", [
  "pending",
  "approved",
  "rejected"
]);

export const gearItems = pgTable(
  "gear_items",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
    type: gearTypeEnum("type").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    defaultForMethod: text("default_for_method"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ownerIdx: index("gear_items_owner_idx").on(table.ownerId),
    typeIdx: index("gear_items_type_idx").on(table.type)
  })
);

export const grinderCatalogItems = pgTable(
  "grinder_catalog_items",
  {
    id: text("id").primaryKey(),
    submittedById: text("submitted_by_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    grinderDrive: text("grinder_drive").$type<"manual" | "electric">().notNull().default("manual"),
    burrType: text("burr_type").notNull().default(""),
    filterRange: text("filter_range").notNull().default(""),
    notes: text("notes").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    status: grinderCatalogStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("grinder_catalog_items_status_idx").on(table.status),
    brandModelUnique: uniqueIndex("grinder_catalog_items_brand_model_unique").on(
      table.brand,
      table.model
    )
  })
);

export const dripperCatalogItems = pgTable(
  "dripper_catalog_items",
  {
    id: text("id").primaryKey(),
    submittedById: text("submitted_by_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    material: text("material").notNull().default(""),
    size: text("size").notNull().default(""),
    brewSpeed: text("brew_speed").notNull().default(""),
    compatibleFilters: text("compatible_filters").notNull().default(""),
    notes: text("notes").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    status: dripperCatalogStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("dripper_catalog_items_status_idx").on(table.status),
    brandModelUnique: uniqueIndex("dripper_catalog_items_brand_model_unique").on(
      table.brand,
      table.model
    )
  })
);
