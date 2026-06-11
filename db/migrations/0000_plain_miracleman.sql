CREATE TYPE "public"."visibility" AS ENUM('private', 'unlisted', 'followers', 'public');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."brew_method" AS ENUM('V60', 'Origami', 'Kalita', 'AeroPress', 'Espresso', 'French Press', 'Switch');--> statement-breakpoint
CREATE TYPE "public"."comment_policy" AS ENUM('disabled', 'followers', 'public');--> statement-breakpoint
CREATE TYPE "public"."remix_policy" AS ENUM('none', 'with_credit', 'ask_permission');--> statement-breakpoint
CREATE TYPE "public"."roast_level" AS ENUM('light', 'medium-light', 'medium', 'medium-dark', 'dark');--> statement-breakpoint
CREATE TYPE "public"."gear_type" AS ENUM('grinder', 'dripper', 'filter', 'kettle', 'scale', 'server', 'espresso_machine', 'other');--> statement-breakpoint
CREATE TYPE "public"."social_target" AS ENUM('recipe', 'brew_log', 'comment', 'collection');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"location" text,
	"website" text,
	"avatar_asset_id" text,
	"cover_asset_id" text,
	"default_visibility" "visibility" DEFAULT 'private' NOT NULL,
	"favorite_methods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"starts_at_seconds" integer NOT NULL,
	"ends_at_seconds" integer,
	"pour_grams" real,
	"cumulative_water_grams" real NOT NULL,
	"instruction" text NOT NULL,
	"cue" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"coffee_id" text,
	"parent_recipe_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"method" "brew_method" NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"remix_policy" "remix_policy" DEFAULT 'with_credit' NOT NULL,
	"comment_policy" "comment_policy" DEFAULT 'public' NOT NULL,
	"cover_asset_id" text,
	"dose_grams" real NOT NULL,
	"water_grams" real NOT NULL,
	"ratio" real NOT NULL,
	"temperature_celsius" integer NOT NULL,
	"grind_label" text NOT NULL,
	"grind_setting" text,
	"total_time_seconds" integer NOT NULL,
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"flavor_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"taste_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brew_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"recipe_id" text,
	"coffee_id" text,
	"title" text NOT NULL,
	"dose_grams" real NOT NULL,
	"water_grams" real NOT NULL,
	"temperature_celsius" integer NOT NULL,
	"grind_setting" text,
	"brew_time_seconds" integer NOT NULL,
	"rating" integer NOT NULL,
	"tasting_notes" text DEFAULT '' NOT NULL,
	"flavor_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"brewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coffee_beans" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"roaster" text NOT NULL,
	"origin" text NOT NULL,
	"process" text,
	"roast_level" "roast_level" DEFAULT 'medium-light' NOT NULL,
	"flavor_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" real,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gear_items" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text,
	"type" "gear_type" NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"name" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "social_target" NOT NULL,
	"target_id" text NOT NULL,
	"parent_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "social_target" NOT NULL,
	"target_id" text NOT NULL,
	"value" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saves" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_type" "social_target" NOT NULL,
	"target_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_coffee_id_coffee_beans_id_fk" FOREIGN KEY ("coffee_id") REFERENCES "public"."coffee_beans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_logs" ADD CONSTRAINT "brew_logs_coffee_id_coffee_beans_id_fk" FOREIGN KEY ("coffee_id") REFERENCES "public"."coffee_beans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coffee_beans" ADD CONSTRAINT "coffee_beans_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gear_items" ADD CONSTRAINT "gear_items_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_unique" ON "profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_assets_owner_idx" ON "media_assets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "media_assets_entity_idx" ON "media_assets" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "recipe_steps_recipe_idx" ON "recipe_steps" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_owner_idx" ON "recipes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "recipes_slug_idx" ON "recipes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "brew_logs_owner_idx" ON "brew_logs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "brew_logs_recipe_idx" ON "brew_logs" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "coffee_beans_slug_idx" ON "coffee_beans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "coffee_beans_owner_idx" ON "coffee_beans" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "gear_items_owner_idx" ON "gear_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "gear_items_type_idx" ON "gear_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "comments_target_idx" ON "comments" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_unique" ON "reactions" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saves_unique" ON "saves" USING btree ("user_id","target_type","target_id");