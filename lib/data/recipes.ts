import "server-only";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { brewLogs as brewLogsTable } from "@/db/schema/brews";
import { coffeeBeans } from "@/db/schema/coffee";
import { profiles } from "@/db/schema/profiles";
import { recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
import { saves } from "@/db/schema/social";
import {
  brewLogs as seedBrewLogs,
  coffees as seedCoffees,
  recipes as seedRecipes
} from "@/lib/data/seed";
import type { BrewLog, BrewMethod, FeedItem, Recipe, RecipeStep, Visibility } from "@/lib/domain";
import { calculateRatio } from "@/modules/recipes/recipe-math";
import {
  createNotificationInDb,
  ensureCurrentIdentity,
  getNotificationActor,
  getStepsForRecipes,
  mapBrewLog,
  mapRecipe,
  shouldUseDemoData,
  slugify,
  withSeedFallback
} from "@/lib/data/shared";
import { getCoffeeByIdFromDb, getCoffeesFromDb, getGearFromDb } from "@/lib/data/catalog";

export async function getRecipesFromDb(filters?: {
  query?: string;
  method?: BrewMethod;
  visibility?: Visibility | "all";
  ownerId?: string;
}): Promise<Recipe[]> {
  return withSeedFallback(async () => {
    const where = and(
      filters?.method ? eq(recipesTable.method, filters.method) : undefined,
      filters?.visibility && filters.visibility !== "all"
        ? eq(recipesTable.visibility, filters.visibility)
        : undefined,
      filters?.ownerId ? eq(recipesTable.ownerId, filters.ownerId) : undefined,
      filters?.query
        ? or(
            ilike(recipesTable.title, `%${filters.query}%`),
            ilike(recipesTable.subtitle, `%${filters.query}%`),
            ilike(recipesTable.description, `%${filters.query}%`)
          )
        : undefined
    );

    const rows = await db
      .select({
        recipe: recipesTable,
        profile: profiles,
        coffee: coffeeBeans
      })
      .from(recipesTable)
      .innerJoin(profiles, eq(recipesTable.ownerId, profiles.userId))
      .leftJoin(coffeeBeans, eq(recipesTable.coffeeId, coffeeBeans.id))
      .where(where)
      .orderBy(desc(recipesTable.updatedAt));

    if (rows.length === 0 && !filters?.query && !filters?.ownerId && shouldUseDemoData()) {
      return seedRecipes;
    }

    const steps = await getStepsForRecipes(rows.map((row) => row.recipe.id));
    const gear = await getGearFromDb();

    return rows.map((row) =>
      mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gear
      )
    );
  }, seedRecipes);
}

export async function getRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const recipes = await getRecipesFromDb();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function getPublicRecipeFromDb(handle: string, slug: string): Promise<Recipe | null> {
  return withSeedFallback(
    async () => {
      const rows = await db
        .select({
          recipe: recipesTable,
          profile: profiles,
          coffee: coffeeBeans
        })
        .from(recipesTable)
        .innerJoin(profiles, eq(recipesTable.ownerId, profiles.userId))
        .leftJoin(coffeeBeans, eq(recipesTable.coffeeId, coffeeBeans.id))
        .where(
          and(
            eq(profiles.handle, handle),
            eq(recipesTable.slug, slug),
            eq(recipesTable.visibility, "public")
          )
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        return shouldUseDemoData()
          ? (seedRecipes.find(
              (recipe) => recipe.author.handle === handle && recipe.slug === slug
            ) ?? null)
          : null;
      }

      const steps = await getStepsForRecipes([row.recipe.id]);
      const gear = await getGearFromDb();
      return mapRecipe(
        row.recipe,
        row.profile,
        row.coffee ?? seedCoffees[0],
        steps.get(row.recipe.id) ?? [],
        gear
      );
    },
    seedRecipes.find((recipe) => recipe.author.handle === handle && recipe.slug === slug) ?? null
  );
}

export async function getSavedRecipesFromDb(): Promise<Recipe[]> {
  return withSeedFallback(async () => {
    const viewerId = await ensureCurrentIdentity();
    const rows = await db
      .select({ targetId: saves.targetId })
      .from(saves)
      .where(and(eq(saves.userId, viewerId), eq(saves.targetType, "recipe")));

    if (rows.length === 0) {
      return [];
    }

    const savedIds = new Set(rows.map((row) => row.targetId));
    const recipes = await getRecipesFromDb();
    return recipes.filter((recipe) => savedIds.has(recipe.id));
  }, []);
}

export async function createRecipeInDb(input: {
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  coverAssetId?: string;
  method: BrewMethod;
  visibility: Visibility;
  doseGrams: number;
  waterGrams: number;
  temperatureCelsius: number;
  grindLabel: string;
  grindSetting?: string;
  steps: Array<{
    label: string;
    startsAtSeconds: number;
    pourGrams?: number;
    cumulativeWaterGrams: number;
    instruction: string;
  }>;
}) {
  const viewerId = await ensureCurrentIdentity();
  const viewerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, viewerId)
  });
  const [coffee] = await getCoffeesFromDb();
  const recipeId = crypto.randomUUID();
  const slug = slugify(input.title);

  await db.insert(recipesTable).values({
    id: recipeId,
    ownerId: viewerId,
    coffeeId: coffee.id,
    slug,
    title: input.title,
    subtitle: input.subtitle ?? "",
    description: input.description ?? "",
    method: input.method,
    visibility: input.visibility,
    commentPolicy: viewerProfile?.defaultCommentPolicy ?? "public",
    coverAssetId: input.coverAssetId || null,
    coverUrl: input.coverUrl || seedRecipes[0].coverUrl,
    doseGrams: input.doseGrams,
    waterGrams: input.waterGrams,
    ratio: calculateRatio(input.doseGrams, input.waterGrams),
    temperatureCelsius: input.temperatureCelsius,
    grindLabel: input.grindLabel,
    grindSetting: input.grindSetting ?? "",
    totalTimeSeconds: Math.max(...input.steps.map((step) => step.startsAtSeconds), 0) + 30,
    flavorNotes: [],
    tasteProfile: { sweetness: 60, acidity: 55, body: 55, balance: 60, finish: 58 },
    stats: { likes: 0, saves: 0, brews: 0, averageRating: 0, remixes: 0, comments: 0 }
  });

  await db.insert(recipeSteps).values(
    input.steps.map((step, index) => ({
      id: crypto.randomUUID(),
      recipeId,
      position: index,
      label: step.label,
      startsAtSeconds: step.startsAtSeconds,
      endsAtSeconds:
        index === input.steps.length - 1 ? undefined : input.steps[index + 1].startsAtSeconds,
      pourGrams: step.pourGrams,
      cumulativeWaterGrams: step.cumulativeWaterGrams,
      instruction: step.instruction,
      cue: step.instruction
    }))
  );

  return { id: recipeId, slug };
}

export async function updateRecipeInDb(input: {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  coverAssetId?: string;
  method: BrewMethod;
  visibility: Visibility;
  doseGrams: number;
  waterGrams: number;
  temperatureCelsius: number;
  grindLabel: string;
  grindSetting?: string;
  steps: Array<{
    label: string;
    startsAtSeconds: number;
    pourGrams?: number;
    cumulativeWaterGrams: number;
    instruction: string;
  }>;
}) {
  const viewerId = await ensureCurrentIdentity();
  const totalTimeSeconds = Math.max(...input.steps.map((step) => step.startsAtSeconds), 0) + 30;

  const [updated] = await db
    .update(recipesTable)
    .set({
      slug: slugify(input.title),
      title: input.title,
      subtitle: input.subtitle ?? "",
      description: input.description ?? "",
      method: input.method,
      visibility: input.visibility,
      coverAssetId: input.coverAssetId || null,
      coverUrl: input.coverUrl || seedRecipes[0].coverUrl,
      doseGrams: input.doseGrams,
      waterGrams: input.waterGrams,
      ratio: calculateRatio(input.doseGrams, input.waterGrams),
      temperatureCelsius: input.temperatureCelsius,
      grindLabel: input.grindLabel,
      grindSetting: input.grindSetting ?? "",
      totalTimeSeconds,
      updatedAt: new Date()
    })
    .where(and(eq(recipesTable.id, input.id), eq(recipesTable.ownerId, viewerId)))
    .returning({ id: recipesTable.id, slug: recipesTable.slug });

  if (!updated) {
    throw new Error("Recipe not found");
  }

  await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, input.id));
  await db.insert(recipeSteps).values(
    input.steps.map((step, index) => ({
      id: crypto.randomUUID(),
      recipeId: input.id,
      position: index,
      label: step.label,
      startsAtSeconds: step.startsAtSeconds,
      endsAtSeconds:
        index === input.steps.length - 1 ? undefined : input.steps[index + 1].startsAtSeconds,
      pourGrams: step.pourGrams,
      cumulativeWaterGrams: step.cumulativeWaterGrams,
      instruction: step.instruction,
      cue: step.instruction
    }))
  );

  return updated;
}

export async function createRecipeRemixInDb(recipeId: string) {
  const viewerId = await ensureCurrentIdentity();
  const source = await db.query.recipes.findFirst({
    where: eq(recipesTable.id, recipeId)
  });

  if (!source) {
    throw new Error("Recipe not found");
  }

  if (source.remixPolicy === "none") {
    throw new Error("Recipe cannot be remixed");
  }

  const sourceSteps = await db.query.recipeSteps.findMany({
    where: eq(recipeSteps.recipeId, source.id),
    orderBy: asc(recipeSteps.position)
  });
  const remixId = crypto.randomUUID();
  const title = `Remix of ${source.title}`;
  const slug = `${slugify(title)}-${remixId.slice(0, 8)}`;

  await db.insert(recipesTable).values({
    id: remixId,
    ownerId: viewerId,
    coffeeId: source.coffeeId,
    parentRecipeId: source.id,
    slug,
    title,
    subtitle: source.subtitle,
    description: source.description,
    method: source.method,
    visibility: "private",
    remixPolicy: source.remixPolicy,
    commentPolicy: source.commentPolicy,
    coverAssetId: source.coverAssetId,
    coverUrl: source.coverUrl,
    doseGrams: source.doseGrams,
    waterGrams: source.waterGrams,
    ratio: source.ratio,
    temperatureCelsius: source.temperatureCelsius,
    grindLabel: source.grindLabel,
    grindSetting: source.grindSetting,
    totalTimeSeconds: source.totalTimeSeconds,
    difficulty: source.difficulty,
    flavorNotes: source.flavorNotes,
    tasteProfile: source.tasteProfile,
    stats: { likes: 0, saves: 0, brews: 0, averageRating: 0, remixes: 0, comments: 0 }
  });

  if (sourceSteps.length > 0) {
    await db.insert(recipeSteps).values(
      sourceSteps.map((step) => ({
        id: crypto.randomUUID(),
        recipeId: remixId,
        position: step.position,
        label: step.label,
        startsAtSeconds: step.startsAtSeconds,
        endsAtSeconds: step.endsAtSeconds,
        pourGrams: step.pourGrams,
        cumulativeWaterGrams: step.cumulativeWaterGrams,
        instruction: step.instruction,
        cue: step.cue
      }))
    );
  }

  await db
    .update(recipesTable)
    .set({
      stats: {
        ...(source.stats ?? {
          likes: 0,
          saves: 0,
          brews: 0,
          averageRating: 0,
          remixes: 0,
          comments: 0
        }),
        remixes: (source.stats?.remixes ?? 0) + 1
      },
      updatedAt: new Date()
    })
    .where(eq(recipesTable.id, source.id));

  await createNotificationInDb({
    userId: viewerId,
    actorId: viewerId,
    type: "recipe_remixed",
    title: "Recipe remixed",
    body: `${source.title} was copied into your drafts.`,
    href: `/recipes/${remixId}/edit`
  });

  return { id: remixId, slug };
}

export async function deleteRecipeInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(recipesTable)
    .where(and(eq(recipesTable.id, id), eq(recipesTable.ownerId, viewerId)));
}

export async function getBrewLogsFromDb(filters?: { ownerId?: string }): Promise<BrewLog[]> {
  return withSeedFallback(async () => {
    const rows = await db
      .select({
        brewLog: brewLogsTable,
        recipe: recipesTable,
        profile: profiles,
        coffee: coffeeBeans
      })
      .from(brewLogsTable)
      .leftJoin(recipesTable, eq(brewLogsTable.recipeId, recipesTable.id))
      .innerJoin(profiles, eq(brewLogsTable.ownerId, profiles.userId))
      .leftJoin(coffeeBeans, eq(brewLogsTable.coffeeId, coffeeBeans.id))
      .where(filters?.ownerId ? eq(brewLogsTable.ownerId, filters.ownerId) : undefined)
      .orderBy(desc(brewLogsTable.brewedAt));

    if (rows.length === 0 && !filters?.ownerId && shouldUseDemoData()) {
      return seedBrewLogs;
    }

    const recipeIds = rows.flatMap((row) => (row.recipe ? [row.recipe.id] : []));
    const steps = await getStepsForRecipes(recipeIds);
    const gear = await getGearFromDb();

    return rows.map((row) => {
      const coffee = row.coffee ?? seedCoffees[0];
      const recipe = row.recipe
        ? mapRecipe(row.recipe, row.profile, coffee, steps.get(row.recipe.id) ?? [], gear)
        : undefined;
      return mapBrewLog(row.brewLog, row.profile, recipe, coffee);
    });
  }, seedBrewLogs);
}

export async function getBrewLogByIdFromDb(id: string): Promise<BrewLog | null> {
  return withSeedFallback(
    async () => {
      const row = await db
        .select({
          brewLog: brewLogsTable,
          recipe: recipesTable,
          profile: profiles,
          coffee: coffeeBeans
        })
        .from(brewLogsTable)
        .leftJoin(recipesTable, eq(brewLogsTable.recipeId, recipesTable.id))
        .innerJoin(profiles, eq(brewLogsTable.ownerId, profiles.userId))
        .leftJoin(coffeeBeans, eq(brewLogsTable.coffeeId, coffeeBeans.id))
        .where(eq(brewLogsTable.id, id))
        .limit(1);

      if (!row[0]) {
        return null;
      }

      const steps = row[0].recipe
        ? await getStepsForRecipes([row[0].recipe.id])
        : new Map<string, RecipeStep[]>();
      const gear = await getGearFromDb();
      const coffee = row[0].coffee ?? seedCoffees[0];
      const recipe = row[0].recipe
        ? mapRecipe(row[0].recipe, row[0].profile, coffee, steps.get(row[0].recipe.id) ?? [], gear)
        : undefined;
      return mapBrewLog(row[0].brewLog, row[0].profile, recipe, coffee);
    },
    seedBrewLogs.find((brewLog) => brewLog.id === id) ?? null
  );
}

export async function createBrewLogInDb(input: {
  recipeId?: string;
  coffeeId?: string;
  method: BrewMethod;
  doseGrams: number;
  waterGrams: number;
  outputGrams?: number;
  temperatureCelsius: number;
  grindSetting: string;
  brewTimeSeconds: number;
  pressureBars?: number;
  rating: number;
  tastingNotes: string;
  photoUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const actor = await getNotificationActor(viewerId);
  const recipe = input.recipeId ? await getRecipeByIdFromDb(input.recipeId) : null;
  const coffee = input.coffeeId
    ? await getCoffeeByIdFromDb(input.coffeeId)
    : (recipe?.coffee ?? null);
  const id = crypto.randomUUID();

  if (!recipe && !coffee) {
    throw new Error("Choose a recipe or coffee before saving a brew log");
  }

  await db.insert(brewLogsTable).values({
    id,
    ownerId: viewerId,
    recipeId: input.recipeId,
    coffeeId: input.coffeeId ?? recipe?.coffee.id,
    title: recipe ? `Brewed ${recipe.title}` : `${input.method} with ${coffee?.name ?? "coffee"}`,
    method: input.method,
    doseGrams: input.doseGrams,
    waterGrams: input.waterGrams,
    outputGrams: input.outputGrams,
    temperatureCelsius: input.temperatureCelsius,
    grindSetting: input.grindSetting,
    brewTimeSeconds: input.brewTimeSeconds,
    pressureBars: input.pressureBars,
    rating: input.rating,
    tastingNotes: input.tastingNotes,
    flavorTags: [],
    photos: input.photoUrl ? [input.photoUrl] : [],
    visibility: input.visibility
  });

  if (recipe) {
    await createNotificationInDb({
      userId: recipe.author.id,
      actorId: viewerId,
      type: "recipe_brewed",
      title: "Recipe brewed",
      body: `${actor.displayName} brewed ${recipe.title}.`,
      href: `/brews/${id}`
    });
  }

  return { id };
}

export async function updateBrewLogInDb(input: {
  id: string;
  recipeId?: string;
  coffeeId?: string;
  method: BrewMethod;
  doseGrams: number;
  waterGrams: number;
  outputGrams?: number;
  temperatureCelsius: number;
  grindSetting: string;
  brewTimeSeconds: number;
  pressureBars?: number;
  rating: number;
  tastingNotes: string;
  photoUrl?: string;
  visibility: Visibility;
}) {
  const viewerId = await ensureCurrentIdentity();
  const recipe = input.recipeId ? await getRecipeByIdFromDb(input.recipeId) : null;
  const coffee = input.coffeeId
    ? await getCoffeeByIdFromDb(input.coffeeId)
    : (recipe?.coffee ?? null);

  if (!recipe && !coffee) {
    throw new Error("Choose a recipe or coffee before saving a brew log");
  }

  const [updated] = await db
    .update(brewLogsTable)
    .set({
      recipeId: input.recipeId,
      coffeeId: input.coffeeId ?? recipe?.coffee.id,
      title: recipe ? `Brewed ${recipe.title}` : `${input.method} with ${coffee?.name ?? "coffee"}`,
      method: input.method,
      doseGrams: input.doseGrams,
      waterGrams: input.waterGrams,
      outputGrams: input.outputGrams,
      temperatureCelsius: input.temperatureCelsius,
      grindSetting: input.grindSetting,
      brewTimeSeconds: input.brewTimeSeconds,
      pressureBars: input.pressureBars,
      rating: input.rating,
      tastingNotes: input.tastingNotes,
      photos: input.photoUrl ? [input.photoUrl] : [],
      visibility: input.visibility
    })
    .where(and(eq(brewLogsTable.id, input.id), eq(brewLogsTable.ownerId, viewerId)))
    .returning({ id: brewLogsTable.id });

  if (!updated) {
    throw new Error("Brew log not found");
  }

  return updated;
}

export async function deleteBrewLogInDb(id: string) {
  const viewerId = await ensureCurrentIdentity();
  await db
    .delete(brewLogsTable)
    .where(and(eq(brewLogsTable.id, id), eq(brewLogsTable.ownerId, viewerId)));
}

export async function getFeedFromDb(): Promise<FeedItem[]> {
  const [recipes, brewLogs] = await Promise.all([
    getRecipesFromDb({ visibility: "public" }),
    getBrewLogsFromDb()
  ]);

  return [
    ...recipes.map(
      (recipe): FeedItem => ({
        id: `feed_recipe_${recipe.id}`,
        type: "recipe",
        recipe,
        author: recipe.author,
        createdAt: recipe.updatedAt
      })
    ),
    ...brewLogs
      .filter((brewLog) => brewLog.visibility === "public")
      .map(
        (brewLog): FeedItem => ({
          id: `feed_brew_${brewLog.id}`,
          type: "brew_log",
          brewLog,
          author: brewLog.author,
          createdAt: brewLog.brewedAt
        })
      )
  ];
}
