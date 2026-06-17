import "server-only";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { coffeeBeans } from "@/db/schema/coffee";
import { dripperCatalogItems, gearItems, grinderCatalogItems } from "@/db/schema/gear";
import {
  coffees as seedCoffees,
  dripperCatalog as seedDripperCatalog,
  gear as seedGear,
  grinderCatalog as seedGrinderCatalog
} from "@/lib/data/seed";
import type {
  BrewMethod,
  CoffeeBean,
  DripperCatalogItem,
  DripperCatalogStatus,
  GearItem,
  GearType,
  GrinderCatalogItem,
  GrinderCatalogStatus,
  RoastLevel,
  Visibility
} from "@/lib/domain";
import {
  buildGearNotes,
  ensureCurrentIdentity,
  filterSeedDripperCatalog,
  filterSeedGrinderCatalog,
  isMissingCatalogTableError,
  mapCoffee,
  mapDripperCatalogItem,
  mapGear,
  mapGrinderCatalogItem,
  shouldUseDemoData,
  slugify,
  splitTags,
  withSeedFallback
} from "@/lib/data/shared";
import { getViewerFromDb } from "@/lib/data/profiles";

export async function getCoffeesFromDb(filters?: { ownerId?: string }): Promise<CoffeeBean[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.coffeeBeans.findMany({
      where: filters?.ownerId ? eq(coffeeBeans.ownerId, filters.ownerId) : undefined,
      orderBy: desc(coffeeBeans.createdAt)
    });
    return rows.length > 0
      ? rows.map(mapCoffee)
      : !filters?.ownerId && shouldUseDemoData()
        ? seedCoffees
        : [];
  }, seedCoffees);
}

export async function getCoffeeByIdFromDb(id: string): Promise<CoffeeBean | null> {
  return withSeedFallback(
    async () => {
      const row = await db.query.coffeeBeans.findFirst({
        where: eq(coffeeBeans.id, id)
      });

      return row ? mapCoffee(row) : null;
    },
    seedCoffees.find((coffee) => coffee.id === id) ?? null
  );
}

export async function getGearFromDb(filters?: { ownerId?: string }): Promise<GearItem[]> {
  return withSeedFallback(async () => {
    const rows = await db.query.gearItems.findMany({
      where: filters?.ownerId ? eq(gearItems.ownerId, filters.ownerId) : undefined,
      orderBy: desc(gearItems.createdAt)
    });
    return rows.length > 0
      ? rows.map(mapGear)
      : !filters?.ownerId && shouldUseDemoData()
        ? seedGear
        : [];
  }, seedGear);
}

export async function getGearItemByIdFromDb(id: string): Promise<GearItem | null> {
  return withSeedFallback(
    async () => {
      const row = await db.query.gearItems.findFirst({
        where: eq(gearItems.id, id)
      });

      return row ? mapGear(row) : null;
    },
    seedGear.find((item) => item.id === id) ?? null
  );
}

export async function getGrinderCatalogFromDb(filters?: {
  query?: string;
  status?: GrinderCatalogStatus | "all";
}): Promise<GrinderCatalogItem[]> {
  try {
    const where = and(
      filters?.status && filters.status !== "all"
        ? eq(grinderCatalogItems.status, filters.status)
        : undefined,
      filters?.query
        ? or(
            ilike(grinderCatalogItems.name, `%${filters.query}%`),
            ilike(grinderCatalogItems.brand, `%${filters.query}%`),
            ilike(grinderCatalogItems.model, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db.query.grinderCatalogItems.findMany({
      where,
      orderBy: [asc(grinderCatalogItems.brand), asc(grinderCatalogItems.model)]
    });

    if (
      rows.length === 0 &&
      !filters?.query &&
      (!filters?.status || filters.status === "approved")
    ) {
      return seedGrinderCatalog;
    }

    return rows.map(mapGrinderCatalogItem);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return filterSeedGrinderCatalog(filters);
    }

    throw error;
  }
}

export async function getGrinderCatalogItemByIdFromDb(
  id: string
): Promise<GrinderCatalogItem | null> {
  try {
    const row = await db.query.grinderCatalogItems.findFirst({
      where: eq(grinderCatalogItems.id, id)
    });

    return row
      ? mapGrinderCatalogItem(row)
      : (seedGrinderCatalog.find((item) => item.id === id) ?? null);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return seedGrinderCatalog.find((item) => item.id === id) ?? null;
    }

    throw error;
  }
}

export async function getDripperCatalogFromDb(filters?: {
  query?: string;
  status?: DripperCatalogStatus | "all";
}): Promise<DripperCatalogItem[]> {
  try {
    const where = and(
      filters?.status && filters.status !== "all"
        ? eq(dripperCatalogItems.status, filters.status)
        : undefined,
      filters?.query
        ? or(
            ilike(dripperCatalogItems.name, `%${filters.query}%`),
            ilike(dripperCatalogItems.brand, `%${filters.query}%`),
            ilike(dripperCatalogItems.model, `%${filters.query}%`),
            ilike(dripperCatalogItems.compatibleFilters, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db.query.dripperCatalogItems.findMany({
      where,
      orderBy: [asc(dripperCatalogItems.brand), asc(dripperCatalogItems.model)]
    });

    if (
      rows.length === 0 &&
      !filters?.query &&
      (!filters?.status || filters.status === "approved")
    ) {
      return seedDripperCatalog;
    }

    return rows.map(mapDripperCatalogItem);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return filterSeedDripperCatalog(filters);
    }

    throw error;
  }
}

export async function getDripperCatalogItemByIdFromDb(
  id: string
): Promise<DripperCatalogItem | null> {
  try {
    const row = await db.query.dripperCatalogItems.findFirst({
      where: eq(dripperCatalogItems.id, id)
    });

    return row
      ? mapDripperCatalogItem(row)
      : (seedDripperCatalog.find((item) => item.id === id) ?? null);
  } catch (error) {
    if (isMissingCatalogTableError(error)) {
      return seedDripperCatalog.find((item) => item.id === id) ?? null;
    }

    throw error;
  }
}

export async function createCoffeeInDb(input: {
  name: string;
  roaster: string;
  origin: string;
  process?: string;
  roastLevel: RoastLevel;
  flavorNotes?: string;
  rating?: number;
  imageUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const id = crypto.randomUUID();

  await db.insert(coffeeBeans).values({
    id,
    ownerId: viewerId,
    name: input.name,
    slug: slugify(`${input.roaster}-${input.name}`),
    roaster: input.roaster,
    origin: input.origin,
    process: input.process ?? "",
    roastLevel: input.roastLevel,
    flavorNotes: splitTags(input.flavorNotes),
    rating: input.rating ?? 0,
    imageUrl: input.imageUrl || seedCoffees[0].imageUrl,
    visibility: input.visibility
  });

  return { id };
}

export async function updateCoffeeInDb(input: {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  process?: string;
  roastLevel: RoastLevel;
  flavorNotes?: string;
  rating?: number;
  imageUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.coffeeBeans.findFirst({
    where: eq(coffeeBeans.id, input.id)
  });

  const [updated] = await db
    .update(coffeeBeans)
    .set({
      name: input.name,
      slug: slugify(`${input.roaster}-${input.name}`),
      roaster: input.roaster,
      origin: input.origin,
      process: input.process ?? "",
      roastLevel: input.roastLevel,
      flavorNotes: splitTags(input.flavorNotes),
      rating: input.rating ?? 0,
      imageUrl: input.imageUrl || existing?.imageUrl || seedCoffees[0].imageUrl,
      visibility: input.visibility
    })
    .where(and(eq(coffeeBeans.id, input.id), eq(coffeeBeans.ownerId, viewerId)))
    .returning({ id: coffeeBeans.id });

  if (!updated) {
    throw new Error("Coffee not found");
  }

  return updated;
}

export async function deleteCoffeeInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(coffeeBeans)
    .where(and(eq(coffeeBeans.id, id), eq(coffeeBeans.ownerId, viewerId)));
}

export async function createGearItemInDb(input: {
  type: GearType;
  name: string;
  brand: string;
  model: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  compatibleDrippers?: string;
  notes?: string;
  imageUrl?: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const id = crypto.randomUUID();
  const detailNotes = buildGearNotes(input);
  const fallbackImage =
    seedGear.find((item) => item.type === input.type)?.imageUrl ?? seedGear[0].imageUrl;

  await db.insert(gearItems).values({
    id,
    ownerId: viewerId,
    type: input.type,
    brand: input.brand,
    model: input.model,
    name: input.name,
    notes: detailNotes,
    imageUrl: input.imageUrl || fallbackImage,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });

  return { id };
}

export async function updateGearItemInDb(input: {
  id: string;
  type: GearType;
  name: string;
  brand: string;
  model: string;
  grinderDrive?: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  compatibleDrippers?: string;
  notes?: string;
  imageUrl?: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const existing = await db.query.gearItems.findFirst({
    where: eq(gearItems.id, input.id)
  });
  const detailNotes = buildGearNotes(input);
  const fallbackImage =
    seedGear.find((item) => item.type === input.type)?.imageUrl ?? seedGear[0].imageUrl;

  const [updated] = await db
    .update(gearItems)
    .set({
      type: input.type,
      brand: input.brand,
      model: input.model,
      name: input.name,
      notes: detailNotes,
      imageUrl: input.imageUrl || existing?.imageUrl || fallbackImage,
      defaultForMethod: input.defaultForMethod,
      visibility: input.visibility
    })
    .where(and(eq(gearItems.id, input.id), eq(gearItems.ownerId, viewerId)))
    .returning({ id: gearItems.id });

  if (!updated) {
    throw new Error("Gear item not found");
  }

  return updated;
}

export const createGrinderInDb = createGearItemInDb;
export const updateGrinderInDb = updateGearItemInDb;

export async function createGearItemFromGrinderCatalogInDb(input: {
  catalogItemId: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const catalogItem = await getGrinderCatalogItemByIdFromDb(input.catalogItemId);

  if (!catalogItem || catalogItem.status !== "approved") {
    throw new Error("Catalog grinder not found");
  }

  return createGearItemInDb({
    type: "grinder",
    name: catalogItem.name,
    brand: catalogItem.brand,
    model: catalogItem.model,
    grinderDrive: catalogItem.grinderDrive,
    burrType: catalogItem.burrType,
    filterRange: catalogItem.filterRange,
    notes: catalogItem.notes,
    imageUrl: catalogItem.imageUrl,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });
}

export async function createGrinderCatalogItemInDb(input: {
  name: string;
  brand: string;
  model: string;
  grinderDrive: "manual" | "electric";
  burrType?: string;
  filterRange?: string;
  notes?: string;
  imageUrl?: string;
}) {
  const viewer = await getViewerFromDb();
  const id = crypto.randomUUID();
  const status: GrinderCatalogStatus = "approved";

  const [created] = await db
    .insert(grinderCatalogItems)
    .values({
      id,
      submittedById: viewer.id,
      name: input.name,
      brand: input.brand,
      model: input.model,
      grinderDrive: input.grinderDrive,
      burrType: input.burrType ?? "",
      filterRange: input.filterRange ?? "",
      notes: input.notes ?? "",
      imageUrl: input.imageUrl ?? "",
      status
    })
    .onConflictDoNothing({
      target: [grinderCatalogItems.brand, grinderCatalogItems.model]
    })
    .returning({ id: grinderCatalogItems.id });

  return { id: created?.id ?? id, status };
}

export async function createGearItemFromDripperCatalogInDb(input: {
  catalogItemId: string;
  defaultForMethod?: BrewMethod;
  visibility: Visibility;
}) {
  const catalogItem = await getDripperCatalogItemByIdFromDb(input.catalogItemId);

  if (!catalogItem || catalogItem.status !== "approved") {
    throw new Error("Catalog dripper not found");
  }

  return createGearItemInDb({
    type: "dripper",
    name: catalogItem.name,
    brand: catalogItem.brand,
    model: catalogItem.model,
    material: catalogItem.material,
    size: catalogItem.size,
    brewSpeed: catalogItem.brewSpeed,
    compatibleFilters: catalogItem.compatibleFilters,
    notes: catalogItem.notes,
    imageUrl: catalogItem.imageUrl,
    defaultForMethod: input.defaultForMethod,
    visibility: input.visibility
  });
}

export async function createDripperCatalogItemInDb(input: {
  name: string;
  brand: string;
  model: string;
  material?: string;
  size?: string;
  brewSpeed?: string;
  compatibleFilters?: string;
  notes?: string;
  imageUrl?: string;
}) {
  const viewer = await getViewerFromDb();
  const id = crypto.randomUUID();
  const status: DripperCatalogStatus = "approved";

  const [created] = await db
    .insert(dripperCatalogItems)
    .values({
      id,
      submittedById: viewer.id,
      name: input.name,
      brand: input.brand,
      model: input.model,
      material: input.material ?? "",
      size: input.size ?? "",
      brewSpeed: input.brewSpeed ?? "",
      compatibleFilters: input.compatibleFilters ?? "",
      notes: input.notes ?? "",
      imageUrl: input.imageUrl ?? "",
      status
    })
    .onConflictDoNothing({
      target: [dripperCatalogItems.brand, dripperCatalogItems.model]
    })
    .returning({ id: dripperCatalogItems.id });

  return { id: created?.id ?? id, status };
}

export async function deleteGearItemInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db.delete(gearItems).where(and(eq(gearItems.id, id), eq(gearItems.ownerId, viewerId)));
}
