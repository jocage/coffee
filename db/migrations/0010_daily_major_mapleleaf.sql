ALTER TABLE "profiles" ADD COLUMN "weight_unit" text DEFAULT 'grams' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "temperature_unit" text DEFAULT 'celsius' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ratio_style" text DEFAULT 'brew_ratio' NOT NULL;