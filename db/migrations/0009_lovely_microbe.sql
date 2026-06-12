ALTER TABLE "profiles" ADD COLUMN "default_comment_policy" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "message_policy" text DEFAULT 'followers' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_gear_on_profile" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_coffee_on_profile" boolean DEFAULT true NOT NULL;