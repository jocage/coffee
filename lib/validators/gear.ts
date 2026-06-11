import { z } from "zod";
import { visibilitySchema } from "@/lib/validators/recipes";

export const gearTypeSchema = z.enum(["grinder", "dripper", "filter", "kettle", "scale", "server"]);

export const gearInputSchema = z.object({
  type: gearTypeSchema.default("grinder"),
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(2).max(120),
  model: z.string().trim().min(1).max(120),
  grinderDrive: z.enum(["manual", "electric"]).optional(),
  burrType: z.string().trim().max(80).optional(),
  filterRange: z.string().trim().max(80).optional(),
  material: z.string().trim().max(80).optional(),
  size: z.string().trim().max(80).optional(),
  brewSpeed: z.string().trim().max(80).optional(),
  compatibleFilters: z.string().trim().max(160).optional(),
  compatibleDrippers: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(600).optional(),
  imageUrl: z.string().trim().optional(),
  defaultForMethod: z.enum(["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"]).optional(),
  visibility: visibilitySchema.default("private")
});

export const grinderInputSchema = gearInputSchema.extend({
  type: z.literal("grinder").default("grinder"),
  grinderDrive: z.enum(["manual", "electric"]).default("manual")
});
