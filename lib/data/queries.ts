import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import {
  getBrewLogsFromDb,
  getBrewLogByIdFromDb,
  getChallengeByIdFromDb,
  getChallengesFromDb,
  getClubBySlugFromDb,
  getClubsFromDb,
  getCollectionByIdFromDb,
  getCollectionsFromDb,
  getCoffeeByIdFromDb,
  getCoffeesFromDb,
  getCommentsForTargetFromDb,
  getContentReportsFromDb,
  getConversationByIdFromDb,
  getConversationsFromDb,
  getDripperCatalogFromDb,
  getDripperCatalogItemByIdFromDb,
  getFeedFromDb,
  getGearItemByIdFromDb,
  getGearFromDb,
  getGrinderCatalogFromDb,
  getGrinderCatalogItemByIdFromDb,
  getNotificationsFromDb,
  getOptionalViewerFromDb,
  getOwnedBrewLogByIdFromDb,
  getOwnedRecipeByIdFromDb,
  getProfileFromDb,
  getProfilesFromDb,
  getPublicCollectionFromDb,
  getPublicRecipeFromDb,
  getRecipeByIdFromDb,
  getRecipesFromDb,
  getSavedRecipesFromDb,
  getSocialCountsForTargetFromDb,
  getViewerFromDb,
  isFollowingInDb
} from "@/lib/data/repositories";
import type {
  BrewLog,
  BrewMethod,
  CoffeeBean,
  DripperCatalogStatus,
  FeedItem,
  GearItem,
  GrinderCatalogStatus,
  Recipe,
  SocialTargetType,
  Visibility
} from "@/lib/domain";
import { recipes as seedRecipes } from "@/lib/data/seed";
import { canReadVisibility } from "@/lib/permissions/visibility";
import { filterRecipesForSetup, sortRecipesForSetup } from "@/modules/recipes/recommendations";

export async function getCurrentUser() {
  noStore();
  return getViewerFromDb();
}

export async function getDashboardData() {
  noStore();
  const user = await getCurrentUser();
  const [recipes, brewLogs, gear, coffees, savedRecipes] = await Promise.all([
    getRecipesFromDb({ ownerId: user.id }),
    getBrewLogsFromDb({ ownerId: user.id }),
    getGearFromDb({ ownerId: user.id }),
    getCoffeesFromDb({ ownerId: user.id }),
    getSavedRecipesFromDb()
  ]);

  return {
    user,
    focusRecipe: recipes[0] ?? savedRecipes[0],
    recentBrews: brewLogs,
    favoriteRecipes: savedRecipes,
    recipes,
    gear,
    coffees
  };
}

export async function getHomeFeed(
  tab: "for-you" | "following" | "popular" | "latest" = "for-you"
): Promise<FeedItem[]> {
  noStore();
  const [viewer, feedItems] = await Promise.all([getCurrentUser(), getFeedFromDb()]);
  const visible = feedItems.filter((item) => {
    const content = item.type === "recipe" ? item.recipe : item.brewLog;
    return canReadVisibility(content.visibility, {
      ownerId: item.author.id,
      viewer,
      isFollower: tab === "following" || item.author.id !== viewer.id
    });
  });

  if (tab === "popular") {
    return [...visible].sort((a, b) => getItemPopularity(b) - getItemPopularity(a));
  }

  return [...visible].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function searchRecipes(filters: {
  query?: string;
  method?: BrewMethod;
  visibility?: Visibility | "all";
  compatible?: boolean;
  prioritizeCompatible?: boolean;
}) {
  noStore();
  const recipes = await getRecipesFromDb(filters);
  if (!filters.compatible && !filters.prioritizeCompatible) {
    return recipes;
  }

  const viewer = await getCurrentUser();
  const gear = await getGearFromDb({ ownerId: viewer.id });
  return filters.compatible
    ? filterRecipesForSetup(recipes, viewer, gear)
    : sortRecipesForSetup(recipes, viewer, gear);
}

export async function getMyRecipes(filters?: { query?: string; visibility?: Visibility | "all" }) {
  noStore();
  const viewer = await getCurrentUser();
  return getRecipesFromDb({ ...filters, ownerId: viewer.id });
}

export async function getSavedRecipes(filters?: {
  query?: string;
  visibility?: Visibility | "all";
}) {
  noStore();
  const recipes = await getSavedRecipesFromDb();
  return recipes.filter((recipe) => {
    const queryMatches = filters?.query
      ? [recipe.title, recipe.subtitle, recipe.description, recipe.author.displayName].some(
          (value) => value.toLowerCase().includes(filters.query?.toLowerCase() ?? "")
        )
      : true;
    const visibilityMatches =
      filters?.visibility && filters.visibility !== "all"
        ? recipe.visibility === filters.visibility
        : true;
    return queryMatches && visibilityMatches;
  });
}

export async function getRecipes() {
  noStore();
  return getRecipesFromDb();
}

export async function getPreviewRecipe(): Promise<Recipe> {
  noStore();
  const [recipe] = await getRecipesFromDb();
  return recipe ?? seedRecipes[0];
}

export async function getRecipeById(id: string) {
  noStore();
  const recipe = await getRecipeByIdFromDb(id);
  if (!recipe) {
    return null;
  }

  return (await canViewerReadContent(recipe.visibility, recipe.author.id)) ? recipe : null;
}

export async function getOwnedRecipeById(id: string) {
  noStore();
  return getOwnedRecipeByIdFromDb(id);
}

export async function getPublicRecipe(handle: string, slug: string): Promise<Recipe | null> {
  noStore();
  return getPublicRecipeFromDb(handle, slug);
}

export async function getProfile(handle?: string) {
  noStore();
  if (handle) {
    return getProfileFromDb(handle);
  }

  return getCurrentUser();
}

export async function getProfiles() {
  noStore();
  return getProfilesFromDb();
}

export async function getProfileContent(handle?: string) {
  noStore();
  const profile = await getProfile(handle);
  if (!profile) {
    return null;
  }
  const isOwnProfile = !handle;
  const viewer = isOwnProfile ? profile : await getOptionalViewerFromDb();
  const isFollower = viewer ? await isFollowingInDb(viewer.id, profile.id) : false;

  const [recipes, brewLogs, gear, coffees] = await Promise.all([
    getRecipesFromDb({ ownerId: profile.id }),
    getBrewLogsFromDb({ ownerId: profile.id }),
    profile.showGearOnProfile || isOwnProfile
      ? getGearFromDb({ ownerId: profile.id })
      : Promise.resolve([]),
    profile.showCoffeeOnProfile || isOwnProfile
      ? getCoffeesFromDb({ ownerId: profile.id })
      : Promise.resolve([])
  ]);

  return {
    profile,
    recipes: isOwnProfile
      ? recipes
      : recipes.filter((recipe) =>
          canReadVisibility(recipe.visibility, {
            ownerId: recipe.author.id,
            viewer,
            isFollower
          })
        ),
    brewLogs: isOwnProfile
      ? brewLogs
      : brewLogs.filter((brewLog) =>
          canReadVisibility(brewLog.visibility, {
            ownerId: brewLog.author.id,
            viewer,
            isFollower
          })
        ),
    gear,
    coffees
  };
}

export async function getCoffees() {
  noStore();
  return getCoffeesFromDb();
}

export async function getCoffeeById(id: string) {
  noStore();
  return getCoffeeByIdFromDb(id);
}

export async function getPublicCoffeeContent(slug: string): Promise<{
  coffee: CoffeeBean;
  recipes: Recipe[];
  brewLogs: BrewLog[];
} | null> {
  noStore();
  const [coffees, recipes, brewLogs] = await Promise.all([
    getCoffeesFromDb(),
    getRecipesFromDb({ visibility: "public" }),
    getBrewLogsFromDb()
  ]);
  const coffee = coffees.find((item) => item.slug === slug || item.id === slug);

  if (!coffee || !isPubliclyAddressable(coffee.visibility)) {
    return null;
  }

  return {
    coffee,
    recipes: recipes.filter(
      (recipe) => recipe.coffee.id === coffee.id && recipe.visibility === "public"
    ),
    brewLogs: brewLogs.filter(
      (brewLog) => brewLog.coffee.id === coffee.id && brewLog.visibility === "public"
    )
  };
}

export async function getGear() {
  noStore();
  return getGearFromDb();
}

export async function getMyGear() {
  noStore();
  const user = await getCurrentUser();
  return getGearFromDb({ ownerId: user.id });
}

export async function getGearItemById(id: string) {
  noStore();
  return getGearItemByIdFromDb(id);
}

export async function getGrinderCatalog(filters?: {
  query?: string;
  status?: GrinderCatalogStatus | "all";
}) {
  noStore();
  return getGrinderCatalogFromDb(filters);
}

export async function getGrinderCatalogItemById(id: string) {
  noStore();
  return getGrinderCatalogItemByIdFromDb(id);
}

export async function getDripperCatalog(filters?: {
  query?: string;
  status?: DripperCatalogStatus | "all";
}) {
  noStore();
  return getDripperCatalogFromDb(filters);
}

export async function getDripperCatalogItemById(id: string) {
  noStore();
  return getDripperCatalogItemByIdFromDb(id);
}

export async function getPublicGearContent(slug: string): Promise<{
  gear: GearItem;
  recipes: Recipe[];
  brewLogs: BrewLog[];
} | null> {
  noStore();
  const [gearItems, recipes, brewLogs] = await Promise.all([
    getGearFromDb(),
    getRecipesFromDb({ visibility: "public" }),
    getBrewLogsFromDb()
  ]);
  const gear = gearItems.find((item) => item.id === slug || slugifyGear(item) === slug);

  if (!gear || !isPubliclyAddressable(gear.visibility)) {
    return null;
  }

  const matchingRecipes = recipes.filter(
    (recipe) => recipe.visibility === "public" && recipe.gear.some((item) => item.id === gear.id)
  );

  return {
    gear,
    recipes: matchingRecipes,
    brewLogs: brewLogs.filter(
      (brewLog) =>
        brewLog.visibility === "public" &&
        brewLog.recipe &&
        matchingRecipes.some((recipe) => recipe.id === brewLog.recipe?.id)
    )
  };
}

export async function getCollections() {
  noStore();
  return getCollectionsFromDb();
}

export async function getCollectionById(id: string) {
  noStore();
  return getCollectionByIdFromDb(id);
}

export async function getPublicCollection(handle: string, slug: string) {
  noStore();
  return getPublicCollectionFromDb(handle, slug);
}

export async function getBrewLogs() {
  noStore();
  return getBrewLogsFromDb();
}

export async function getBrewLogById(id: string) {
  noStore();
  const brewLog = await getBrewLogByIdFromDb(id);
  if (!brewLog) {
    return null;
  }

  return (await canViewerReadContent(brewLog.visibility, brewLog.author.id)) ? brewLog : null;
}

export async function getOwnedBrewLogById(id: string) {
  noStore();
  return getOwnedBrewLogByIdFromDb(id);
}

export async function getCommunityOverview() {
  noStore();
  const [clubs, challenges, notifications] = await Promise.all([
    getClubsFromDb(),
    getChallengesFromDb(),
    getNotificationsFromDb()
  ]);
  return {
    clubs,
    challenges,
    notifications: notifications.slice(0, 3)
  };
}

export async function getClubs() {
  noStore();
  return getClubsFromDb();
}

export async function getClubBySlug(slug: string) {
  noStore();
  return getClubBySlugFromDb(slug);
}

export async function getChallengeById(id: string) {
  noStore();
  return getChallengeByIdFromDb(id);
}

export async function getConversations() {
  noStore();
  return getConversationsFromDb();
}

export async function getConversationById(id: string) {
  noStore();
  return getConversationByIdFromDb(id);
}

export async function getNotifications() {
  noStore();
  return getNotificationsFromDb();
}

export async function getCommentsForTarget(input: {
  targetType: SocialTargetType;
  targetId: string;
}) {
  noStore();
  return getCommentsForTargetFromDb(input);
}

export async function getSocialCountsForTarget(input: {
  targetType: SocialTargetType;
  targetId: string;
}) {
  noStore();
  return getSocialCountsForTargetFromDb(input);
}

export async function getContentReports(
  status?: "open" | "reviewing" | "resolved" | "dismissed" | "all"
) {
  noStore();
  return getContentReportsFromDb(status);
}

function getItemPopularity(item: FeedItem): number {
  if (item.type === "recipe") {
    return item.recipe.stats.likes + item.recipe.stats.saves + item.recipe.stats.brews;
  }

  return item.brewLog.rating * 100 + item.brewLog.flavorTags.length * 10;
}

async function canViewerReadContent(visibility: Visibility, ownerId: string) {
  const viewer = await getOptionalViewerFromDb();
  const isFollower = viewer ? await isFollowingInDb(viewer.id, ownerId) : false;
  return canReadVisibility(visibility, {
    ownerId,
    viewer,
    isFollower
  });
}

function isPubliclyAddressable(visibility: Visibility) {
  return visibility === "public" || visibility === "unlisted";
}

function slugifyGear(item: GearItem) {
  return `${item.brand}-${item.model}-${item.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
