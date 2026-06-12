CREATE TYPE "public"."dripper_catalog_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "dripper_catalog_items" (
	"id" text PRIMARY KEY NOT NULL,
	"submitted_by_id" text,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"material" text DEFAULT '' NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"brew_speed" text DEFAULT '' NOT NULL,
	"compatible_filters" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"status" "dripper_catalog_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dripper_catalog_items" ADD CONSTRAINT "dripper_catalog_items_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dripper_catalog_items_status_idx" ON "dripper_catalog_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "dripper_catalog_items_brand_model_unique" ON "dripper_catalog_items" USING btree ("brand","model");--> statement-breakpoint
INSERT INTO "dripper_catalog_items" ("id", "name", "brand", "model", "material", "size", "brew_speed", "compatible_filters", "notes", "status") VALUES
('catalog_hario_v60_02', 'Hario V60 02', 'Hario', 'V60 02', 'Ceramic, plastic, glass, metal', '02', 'Fast', 'V60 02', 'Classic conical dripper with high flow and clear cups.', 'approved'),
('catalog_origami_air_s', 'Origami Air S', 'Origami', 'Air S', 'AS resin', 'S', 'Fast to balanced', 'V60 01, Kalita 155', 'Ribbed cone that supports conical and wave filters.', 'approved'),
('catalog_origami_air_m', 'Origami Air M', 'Origami', 'Air M', 'AS resin', 'M', 'Fast to balanced', 'V60 02, Kalita 185', 'Flexible dripper for one or two-cup recipes.', 'approved'),
('catalog_kalita_wave_185', 'Kalita Wave 185', 'Kalita', 'Wave 185', 'Stainless steel, glass, ceramic', '185', 'Balanced', 'Kalita 185', 'Flat-bottom dripper with repeatable extraction.', 'approved'),
('catalog_hario_switch_03', 'Hario Switch 03', 'Hario', 'Switch 03', 'Glass and silicone', '03', 'Immersion / hybrid', 'V60 03', 'Immersion-capable V60-style dripper.', 'approved'),
('catalog_orea_v4_wide', 'Orea V4 Wide', 'Orea', 'V4 Wide', 'Polypropylene', 'Wide', 'Fast', 'Orea flat, negotiated Kalita 185', 'Modern fast flat-bottom brewer with interchangeable bottoms.', 'approved'),
('catalog_april_plastic', 'April Plastic Brewer', 'April', 'Plastic Brewer', 'Plastic', '155/185 style', 'Balanced', 'April, Kalita 155/185', 'Flat-bottom brewer tuned for April-style pulse pours.', 'approved'),
('catalog_orea_big_boy', 'Orea Big Boy', 'Orea', 'Big Boy', 'Polypropylene', 'Large', 'Fast', 'Large flat-bottom filters', 'Large batch flat-bottom brewer.', 'approved'),
('catalog_cafec_flower_02', 'Cafec Flower Dripper 02', 'Cafec', 'Flower 02', 'Tritan, ceramic', '02', 'Fast', 'V60 02, Cafec cone 02', 'Cone dripper with deep petal ribs and high flow.', 'approved'),
('catalog_clever_large', 'Clever Dripper Large', 'Clever', 'Large', 'Plastic', 'Large', 'Immersion', 'Melitta #4', 'Immersion brewer with drawdown release valve.', 'approved'),
('catalog_tricolate', 'Tricolate Brewer', 'Tricolate', 'Brewer', 'Tritan', 'Standard', 'Slow / high extraction', 'Tricolate filters', 'No-bypass brewer for high extraction filter recipes.', 'approved'),
('catalog_nextlevel_pulsar', 'NextLevel Pulsar', 'NextLevel', 'Pulsar', 'Plastic', 'Standard', 'No-bypass / controllable', 'Pulsar filters', 'No-bypass brewer with flow-control valve.', 'approved')
ON CONFLICT DO NOTHING;
