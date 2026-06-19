ALTER TYPE "public"."social_target" ADD VALUE 'conversation';--> statement-breakpoint
ALTER TABLE "direct_conversation_participants" ADD COLUMN "blocked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD COLUMN "recipe_id" text;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;