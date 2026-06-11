import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { visibilityEnum } from "@/db/schema/profiles";

export const gearTypeEnum = pgEnum("gear_type", ["grinder", "dripper", "filter", "kettle", "scale", "server", "espresso_machine", "other"]);

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
