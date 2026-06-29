import { describe, expect, it } from "vitest";
import type { GearItem, Recipe, UserProfile } from "@/lib/domain";
import {
  filterRecipesForSetup,
  getRecipeSetupMatch,
  sortRecipesForSetup
} from "@/modules/recipes/recommendations";
import { calculateRecipeStats } from "@/modules/recipes/stats";
import { currentUser, gear, recipes } from "@/lib/data/seed";

const profile: UserProfile = {
  ...currentUser,
  favoriteMethods: ["V60"],
  defaultGrinderId: "gear_grinder",
  defaultDripperId: "gear_dripper"
};

const setupGear: GearItem[] = [
  {
    ...gear[0],
    id: "gear_grinder",
    type: "grinder",
    defaultForMethod: "V60"
  },
  {
    ...gear[1],
    id: "gear_dripper",
    type: "dripper",
    defaultForMethod: "V60"
  }
];

describe("recipe recommendations", () => {
  it("prioritizes recipes that match favorite methods and default gear", () => {
    const v60 = { ...recipes[0], method: "V60", doseGrams: 18 } satisfies Recipe;
    const espresso = { ...recipes[1], method: "Espresso", doseGrams: 18 } satisfies Recipe;

    expect(getRecipeSetupMatch(v60, profile, setupGear)).toMatchObject({
      compatible: true,
      reasons: ["favorite-method", "default-method-gear", "profile-default-gear", "dose-range"]
    });
    expect(sortRecipesForSetup([espresso, v60], profile, setupGear)[0].id).toBe(v60.id);
    expect(filterRecipesForSetup([espresso, v60], profile, setupGear)).toHaveLength(1);
  });

  it("aggregates recipe stats from social events and brew ratings", () => {
    expect(
      calculateRecipeStats({
        likes: 3,
        saves: 2,
        comments: 4,
        remixes: 1,
        brews: [{ rating: 4 }, { rating: 5 }, { rating: 4 }]
      })
    ).toEqual({
      likes: 3,
      saves: 2,
      brews: 3,
      averageRating: 4.3,
      remixes: 1,
      comments: 4
    });
  });
});
