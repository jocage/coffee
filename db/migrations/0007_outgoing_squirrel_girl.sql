CREATE TYPE "public"."grinder_catalog_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "grinder_catalog_items" (
	"id" text PRIMARY KEY NOT NULL,
	"submitted_by_id" text,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"grinder_drive" text DEFAULT 'manual' NOT NULL,
	"burr_type" text DEFAULT '' NOT NULL,
	"filter_range" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"status" "grinder_catalog_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grinder_catalog_items" ADD CONSTRAINT "grinder_catalog_items_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grinder_catalog_items_status_idx" ON "grinder_catalog_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "grinder_catalog_items_brand_model_unique" ON "grinder_catalog_items" USING btree ("brand","model");--> statement-breakpoint
INSERT INTO "grinder_catalog_items" ("id", "name", "brand", "model", "grinder_drive", "burr_type", "filter_range", "notes", "status") VALUES
('catalog_comandante_c40_mk4', 'Comandante C40', 'Comandante', 'C40 MK4', 'manual', 'Stainless steel conical burrs', '40-45 clicks', 'Reference hand grinder for pour-over recipes.', 'approved'),
('catalog_comandante_c60', 'Comandante C60 Baracuda', 'Comandante', 'C60 Baracuda', 'manual', 'Stainless steel conical burrs', '35-45 clicks', 'High-capacity hand grinder with espresso-capable adjustment.', 'approved'),
('catalog_1zpresso_zp6_special', '1Zpresso ZP6 Special', '1Zpresso', 'ZP6 Special', 'manual', 'Stainless steel heptagonal burrs', '4.0-5.5', 'Clarity-focused hand grinder for filter coffee.', 'approved'),
('catalog_1zpresso_j_ultra', '1Zpresso J-Ultra', '1Zpresso', 'J-Ultra', 'manual', 'Stainless steel coated conical burrs', 'Espresso 1.0-2.0, filter 3.5-5.5', 'Espresso-focused hand grinder with fine external adjustment.', 'approved'),
('catalog_1zpresso_k_ultra', '1Zpresso K-Ultra', '1Zpresso', 'K-Ultra', 'manual', 'Stainless steel heptagonal burrs', '6.0-8.0', 'All-round hand grinder with external adjustment.', 'approved'),
('catalog_kingrinder_k6', 'KINGrinder K6', 'KINGrinder', 'K6', 'manual', 'Stainless steel heptagonal burrs', '90-120 clicks', 'Popular value hand grinder for filter and espresso.', 'approved'),
('catalog_timemore_chestnut_c3', 'Timemore Chestnut C3', 'Timemore', 'Chestnut C3', 'manual', 'S2C stainless steel burrs', '13-18 clicks', 'Compact entry-level hand grinder.', 'approved'),
('catalog_fellow_ode_gen_2', 'Fellow Ode Gen 2', 'Fellow', 'Ode Gen 2', 'electric', '64 mm flat burrs', '4-7', 'Single-dose electric grinder for brewed coffee.', 'approved'),
('catalog_fellow_opus', 'Fellow Opus', 'Fellow', 'Opus', 'electric', '40 mm conical burrs', 'Espresso 1-3, filter 6-9', 'Compact all-purpose grinder for espresso and brewed coffee.', 'approved'),
('catalog_df64_gen_2', 'DF64 Gen 2', 'DF64', 'Gen 2', 'electric', '64 mm flat burrs', '50-70', 'Single-dose flat burr grinder with broad burr compatibility.', 'approved'),
('catalog_baratza_encore_esp', 'Baratza Encore ESP', 'Baratza', 'Encore ESP', 'electric', '40 mm conical burrs', '18-28', 'Home grinder covering espresso and filter ranges.', 'approved'),
('catalog_baratza_vario_w_plus', 'Baratza Vario W+', 'Baratza', 'Vario W+', 'electric', '54 mm flat burrs', 'Espresso macro 1-2, filter macro 5-8', 'Weight-based grinder that can cover espresso and filter.', 'approved'),
('catalog_eureka_mignon_specialita', 'Eureka Mignon Specialita', 'Eureka', 'Mignon Specialita', 'electric', '55 mm flat burrs', '', 'Quiet espresso-focused grinder with stepless adjustment.', 'approved'),
('catalog_niche_zero', 'Niche Zero', 'Niche', 'Zero', 'electric', '63 mm conical burrs', '40-50', 'Single-dose conical burr grinder for home espresso and filter.', 'approved'),
('catalog_niche_duo', 'Niche Duo', 'Niche', 'Duo', 'electric', '83 mm flat burrs', 'Espresso 10-20, filter 35-50', 'Single-dose flat burr grinder with espresso/filter burr options.', 'approved'),
('catalog_varia_vs3', 'Varia VS3', 'Varia', 'VS3', 'electric', '38 mm conical burrs', '4-8', 'Compact single-dose grinder.', 'approved'),
('catalog_mahlkonig_ek43', 'Mahlkonig EK43', 'Mahlkonig', 'EK43', 'electric', '98 mm flat burrs', '8-11', 'Commercial grinder used as a shop benchmark.', 'approved'),
('catalog_mahlkonig_x54', 'Mahlkonig X54', 'Mahlkonig', 'X54', 'electric', '54 mm flat burrs', 'Espresso 1-3, filter 7-10', 'Home all-rounder with espresso and filter presets.', 'approved'),
('catalog_lagom_p64', 'Option-O Lagom P64', 'Option-O', 'Lagom P64', 'electric', '64 mm flat burrs', 'Espresso 0.5-2.0, filter 6.0-9.0', 'Single-dose flat burr grinder with burr-dependent settings.', 'approved'),
('catalog_lagom_mini', 'Option-O Lagom Mini', 'Option-O', 'Lagom Mini', 'electric', '48 mm conical burrs', 'Espresso 0.5-1.5, filter 3.5-6.0', 'Compact single-dose grinder for home brewing.', 'approved'),
('catalog_timemore_sculptor_078', 'Timemore Sculptor 078', 'Timemore', 'Sculptor 078', 'electric', '78 mm turbo flat burrs', '8-12', 'Filter-focused electric grinder.', 'approved'),
('catalog_timemore_sculptor_078s', 'Timemore Sculptor 078S', 'Timemore', 'Sculptor 078S', 'electric', '78 mm flat burrs', 'Espresso 2-5, filter 10-14', 'Espresso-capable version with broader adjustment.', 'approved'),
('catalog_weber_eg1', 'Weber EG-1', 'Weber Workshops', 'EG-1', 'electric', '80 mm flat burrs', 'Espresso 4-7, filter 9-12', 'High-end single-dose grinder for espresso and filter.', 'approved')
ON CONFLICT DO NOTHING;
