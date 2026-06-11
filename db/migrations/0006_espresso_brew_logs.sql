ALTER TABLE "brew_logs" ADD COLUMN "method" "brew_method";--> statement-breakpoint
UPDATE "brew_logs"
SET "method" = "recipes"."method"
FROM "recipes"
WHERE "brew_logs"."recipe_id" = "recipes"."id";--> statement-breakpoint
UPDATE "brew_logs" SET "method" = 'V60' WHERE "method" IS NULL;--> statement-breakpoint
ALTER TABLE "brew_logs" ALTER COLUMN "method" SET DEFAULT 'V60';--> statement-breakpoint
ALTER TABLE "brew_logs" ALTER COLUMN "method" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "output_grams" real;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD COLUMN "pressure_bars" real;
