import type { GearItem, Recipe, UserProfile } from "@/lib/domain";

export type RecipeSetupMatch = {
  compatible: boolean;
  score: number;
  reasons: string[];
};

const POUR_OVER_METHODS = new Set(["V60", "Origami", "Kalita", "Switch"]);

export function getRecipeSetupMatch(
  recipe: Recipe,
  profile: UserProfile,
  gear: GearItem[]
): RecipeSetupMatch {
  const reasons: string[] = [];
  let score = 0;

  if (profile.favoriteMethods.includes(recipe.method)) {
    score += 4;
    reasons.push("favorite-method");
  }

  const methodDefaults = gear.filter((item) => item.defaultForMethod === recipe.method);
  if (methodDefaults.length > 0) {
    score += 3;
    reasons.push("default-method-gear");
  }

  if (hasDefaultGearForRecipe(recipe, profile, gear)) {
    score += 3;
    reasons.push("profile-default-gear");
  }

  if (isDoseInBrewingRange(recipe.doseGrams)) {
    score += 1;
    reasons.push("dose-range");
  }

  return {
    compatible: score >= 5,
    score,
    reasons
  };
}

export function sortRecipesForSetup(
  recipes: Recipe[],
  profile: UserProfile,
  gear: GearItem[]
): Recipe[] {
  return [...recipes].sort((left, right) => {
    const leftMatch = getRecipeSetupMatch(left, profile, gear);
    const rightMatch = getRecipeSetupMatch(right, profile, gear);
    if (rightMatch.score !== leftMatch.score) {
      return rightMatch.score - leftMatch.score;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

export function filterRecipesForSetup(
  recipes: Recipe[],
  profile: UserProfile,
  gear: GearItem[]
): Recipe[] {
  return sortRecipesForSetup(recipes, profile, gear).filter(
    (recipe) => getRecipeSetupMatch(recipe, profile, gear).compatible
  );
}

function hasDefaultGearForRecipe(recipe: Recipe, profile: UserProfile, gear: GearItem[]) {
  const defaultIds = [
    profile.defaultGrinderId,
    profile.defaultDripperId,
    profile.defaultFilterId
  ].filter(Boolean);
  if (defaultIds.length === 0) {
    return false;
  }

  const defaultGear = gear.filter((item) => defaultIds.includes(item.id));
  const hasGrinder = defaultGear.some((item) => item.type === "grinder");
  const hasFilter = defaultGear.some((item) => item.type === "filter");
  const hasDripper = defaultGear.some((item) => item.type === "dripper");
  const recipeGearTypes = new Set(recipe.gear.map((item) => item.type));

  if (recipe.method === "Espresso") {
    return hasGrinder;
  }

  if (POUR_OVER_METHODS.has(recipe.method)) {
    const recipeUsesDripper = recipeGearTypes.size === 0 || recipeGearTypes.has("dripper");
    const recipeUsesFilter = recipeGearTypes.has("filter");
    return hasGrinder && (!recipeUsesDripper || hasDripper) && (!recipeUsesFilter || hasFilter);
  }

  return hasGrinder || hasDripper || hasFilter;
}

function isDoseInBrewingRange(doseGrams: number) {
  return doseGrams >= 10 && doseGrams <= 30;
}
