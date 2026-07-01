CREATE TABLE "recipe_gear_items" (
	"recipe_id" text NOT NULL,
	"gear_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_gear_items" ADD CONSTRAINT "recipe_gear_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recipe_gear_items" ADD CONSTRAINT "recipe_gear_items_gear_id_gear_items_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."gear_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "recipe_gear_items_recipe_idx" ON "recipe_gear_items" USING btree ("recipe_id");
--> statement-breakpoint
CREATE INDEX "recipe_gear_items_gear_idx" ON "recipe_gear_items" USING btree ("gear_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_gear_items_unique" ON "recipe_gear_items" USING btree ("recipe_id","gear_id");
--> statement-breakpoint
INSERT INTO "recipe_gear_items" ("recipe_id", "gear_id", "position")
SELECT "recipe_id", "gear_id", "position"
FROM (
	SELECT
		"recipes"."id" AS "recipe_id",
		"gear_items"."id" AS "gear_id",
		(row_number() OVER (PARTITION BY "recipes"."id" ORDER BY "gear_items"."created_at", "gear_items"."id") - 1)::integer AS "position"
	FROM "recipes"
	INNER JOIN "gear_items"
		ON "gear_items"."owner_id" = "recipes"."owner_id"
		AND "gear_items"."default_for_method" = "recipes"."method"::text
) AS "matched_recipe_gear"
ON CONFLICT DO NOTHING;
