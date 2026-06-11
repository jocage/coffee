import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { brewLogs } from "@/db/schema/brews";
import { challenges, clubs } from "@/db/schema/clubs";
import { coffeeBeans } from "@/db/schema/coffee";
import { gearItems } from "@/db/schema/gear";
import { profiles } from "@/db/schema/profiles";
import { recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
import {
  brewLogs as seedBrewLogs,
  challenges as seedChallenges,
  clubs as seedClubs,
  coffees as seedCoffees,
  currentUser,
  gear as seedGear,
  recipes as seedRecipes
} from "@/lib/data/seed";
import { calculateRatio } from "@/modules/recipes/recipe-math";

async function main() {
  await db
    .insert(user)
    .values({
      id: "dev-user",
      name: currentUser.displayName,
      email: "dev@coffee-journey.local",
      emailVerified: true,
      image: currentUser.avatarUrl
    })
    .onConflictDoNothing();

  await db
    .insert(profiles)
    .values({
      id: "dev-profile",
      userId: "dev-user",
      handle: currentUser.handle,
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      location: currentUser.location,
      avatarUrl: currentUser.avatarUrl,
      coverUrl: currentUser.coverUrl,
      favoriteMethods: currentUser.favoriteMethods
    })
    .onConflictDoNothing();

  await db
    .insert(coffeeBeans)
    .values(
      seedCoffees.map((coffee) => ({
        id: coffee.id,
        ownerId: "dev-user",
        name: coffee.name,
        slug: coffee.slug,
        roaster: coffee.roaster,
        origin: coffee.origin,
        process: coffee.process,
        roastLevel: coffee.roastLevel,
        flavorNotes: coffee.flavorNotes,
        rating: coffee.rating,
        imageUrl: coffee.imageUrl,
        visibility: coffee.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(gearItems)
    .values(
      seedGear.map((item) => ({
        id: item.id,
        ownerId: "dev-user",
        type: item.type,
        brand: item.brand,
        model: item.model,
        name: item.name,
        notes: item.notes,
        imageUrl: item.imageUrl,
        defaultForMethod: item.defaultForMethod,
        visibility: item.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(recipesTable)
    .values(
      seedRecipes.map((recipe) => ({
        id: recipe.id,
        ownerId: "dev-user",
        coffeeId: recipe.coffee.id,
        slug: recipe.slug,
        title: recipe.title,
        subtitle: recipe.subtitle,
        description: recipe.description,
        method: recipe.method,
        visibility: recipe.visibility,
        remixPolicy: recipe.remixPolicy,
        commentPolicy: recipe.commentPolicy,
        coverUrl: recipe.coverUrl,
        doseGrams: recipe.doseGrams,
        waterGrams: recipe.waterGrams,
        ratio: calculateRatio(recipe.doseGrams, recipe.waterGrams),
        temperatureCelsius: recipe.temperatureCelsius,
        grindLabel: recipe.grindLabel,
        grindSetting: recipe.grindSetting,
        totalTimeSeconds: recipe.totalTimeSeconds,
        difficulty: recipe.difficulty,
        flavorNotes: recipe.flavorNotes,
        tasteProfile: recipe.tasteProfile,
        stats: recipe.stats
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(recipeSteps)
    .values(
      seedRecipes.flatMap((recipe) =>
        recipe.steps.map((step, index) => ({
          id: step.id,
          recipeId: recipe.id,
          position: index,
          label: step.label,
          startsAtSeconds: step.startsAtSeconds,
          endsAtSeconds: step.endsAtSeconds,
          pourGrams: step.pourGrams,
          cumulativeWaterGrams: step.cumulativeWaterGrams,
          instruction: step.instruction,
          cue: step.cue
        }))
      )
    )
    .onConflictDoNothing();

  await db
    .insert(brewLogs)
    .values(
      seedBrewLogs.map((brewLog) => ({
        id: brewLog.id,
        ownerId: "dev-user",
        recipeId: brewLog.recipe?.id,
        coffeeId: brewLog.coffee.id,
        title: brewLog.title,
        method: brewLog.method,
        doseGrams: brewLog.doseGrams,
        waterGrams: brewLog.waterGrams,
        outputGrams: brewLog.outputGrams,
        temperatureCelsius: brewLog.temperatureCelsius,
        grindSetting: brewLog.grindSetting,
        brewTimeSeconds: brewLog.brewTimeSeconds,
        pressureBars: brewLog.pressureBars,
        rating: brewLog.rating,
        tastingNotes: brewLog.tastingNotes,
        flavorTags: brewLog.flavorTags,
        visibility: brewLog.visibility,
        brewedAt: new Date(brewLog.brewedAt)
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(clubs)
    .values(
      seedClubs.map((club) => ({
        id: club.id,
        slug: club.slug,
        name: club.name,
        description: club.description,
        visibility: club.visibility
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(challenges)
    .values(
      seedChallenges.map((challenge) => ({
        id: challenge.id,
        clubId: seedClubs.find((club) => club.slug === challenge.clubSlug)?.id,
        title: challenge.title,
        description: challenge.description,
        startsAt: new Date(challenge.startsAt),
        endsAt: new Date(challenge.endsAt),
        entryCount: challenge.entryCount
      }))
    )
    .onConflictDoNothing();

  console.log("Seeded Coffee Journey development data.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
