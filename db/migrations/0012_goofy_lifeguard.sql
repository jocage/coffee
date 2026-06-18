CREATE TABLE "club_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"pinned_recipe_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_pinned_recipe_id_recipes_id_fk" FOREIGN KEY ("pinned_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;