ALTER TABLE "profiles" ADD COLUMN "avatar_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cover_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "cover_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "stats" jsonb DEFAULT '{"likes":0,"saves":0,"brews":0,"averageRating":0,"remixes":0,"comments":0}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "coffee_beans" ADD COLUMN "image_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "image_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "default_for_method" text;