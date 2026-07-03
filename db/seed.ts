import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { brewLogs } from "@/db/schema/brews";
import { challenges, clubs } from "@/db/schema/clubs";
import { coffeeBeans } from "@/db/schema/coffee";
import { dripperCatalogItems, gearItems, grinderCatalogItems } from "@/db/schema/gear";
import { profiles } from "@/db/schema/profiles";
import { recipeGearItems, recipeSteps, recipes as recipesTable } from "@/db/schema/recipes";
import {
  directConversationParticipants,
  directConversations,
  directMessages,
  follows
} from "@/db/schema/social";
import {
  brewLogs as seedBrewLogs,
  challenges as seedChallenges,
  clubs as seedClubs,
  coffees as seedCoffees,
  conversations as seedConversations,
  creators as seedCreators,
  currentUser,
  dripperCatalog as seedDripperCatalog,
  gear as seedGear,
  grinderCatalog as seedGrinderCatalog,
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
      defaultVisibility: currentUser.defaultVisibility,
      defaultCommentPolicy: currentUser.defaultCommentPolicy,
      messagePolicy: currentUser.messagePolicy,
      showGearOnProfile: currentUser.showGearOnProfile,
      showCoffeeOnProfile: currentUser.showCoffeeOnProfile,
      weightUnit: currentUser.weightUnit,
      temperatureUnit: currentUser.temperatureUnit,
      ratioStyle: currentUser.ratioStyle,
      defaultGrinderId: currentUser.defaultGrinderId,
      defaultDripperId: currentUser.defaultDripperId,
      defaultFilterId: currentUser.defaultFilterId,
      favoriteMethods: currentUser.favoriteMethods
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        handle: currentUser.handle,
        displayName: currentUser.displayName,
        bio: currentUser.bio,
        location: currentUser.location,
        avatarUrl: currentUser.avatarUrl,
        coverUrl: currentUser.coverUrl,
        defaultVisibility: currentUser.defaultVisibility,
        defaultCommentPolicy: currentUser.defaultCommentPolicy,
        messagePolicy: currentUser.messagePolicy,
        showGearOnProfile: currentUser.showGearOnProfile,
        showCoffeeOnProfile: currentUser.showCoffeeOnProfile,
        weightUnit: currentUser.weightUnit,
        temperatureUnit: currentUser.temperatureUnit,
        ratioStyle: currentUser.ratioStyle,
        defaultGrinderId: currentUser.defaultGrinderId,
        defaultDripperId: currentUser.defaultDripperId,
        defaultFilterId: currentUser.defaultFilterId,
        favoriteMethods: currentUser.favoriteMethods
      }
    });

  const otherCreators = seedCreators.filter((creator) => creator.id !== currentUser.id);
  if (otherCreators.length > 0) {
    await db
      .insert(user)
      .values(
        otherCreators.map((creator) => ({
          id: creator.id,
          name: creator.displayName,
          email: `${creator.handle}@coffee-journey.local`,
          emailVerified: true,
          image: creator.avatarUrl
        }))
      )
      .onConflictDoNothing();

    await db
      .insert(profiles)
      .values(
        otherCreators.map((creator) => ({
          id: `profile_${creator.handle}`,
          userId: creator.id,
          handle: creator.handle,
          displayName: creator.displayName,
          bio: creator.bio,
          location: creator.location,
          website: creator.website,
          avatarUrl: creator.avatarUrl,
          coverUrl: creator.coverUrl,
          defaultVisibility: creator.defaultVisibility,
          defaultCommentPolicy: creator.defaultCommentPolicy,
          messagePolicy: creator.messagePolicy,
          showGearOnProfile: creator.showGearOnProfile,
          showCoffeeOnProfile: creator.showCoffeeOnProfile,
          weightUnit: creator.weightUnit,
          temperatureUnit: creator.temperatureUnit,
          ratioStyle: creator.ratioStyle,
          favoriteMethods: creator.favoriteMethods
        }))
      )
      .onConflictDoNothing();
  }

  await db
    .insert(follows)
    .values({ followerId: "dev-user", followingId: "user_alex" })
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
    .insert(grinderCatalogItems)
    .values(
      seedGrinderCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        grinderDrive: item.grinderDrive,
        burrType: item.burrType,
        filterRange: item.filterRange,
        notes: item.notes,
        imageUrl: item.imageUrl,
        status: item.status
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(dripperCatalogItems)
    .values(
      seedDripperCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        material: item.material,
        size: item.size,
        brewSpeed: item.brewSpeed,
        compatibleFilters: item.compatibleFilters,
        notes: item.notes,
        imageUrl: item.imageUrl,
        status: item.status
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(recipesTable)
    .values(
      seedRecipes.map((recipe) => ({
        id: recipe.id,
        ownerId: "dev-user",
        coffeeId: recipe.coffee?.id ?? null,
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
    .insert(recipeGearItems)
    .values(
      seedRecipes.flatMap((recipe) =>
        recipe.gear.map((item, index) => ({
          recipeId: recipe.id,
          gearId: item.id,
          position: index
        }))
      )
    )
    .onConflictDoNothing();

  await db
    .insert(directConversations)
    .values(
      seedConversations.map((conversation) => ({
        id: conversation.id,
        updatedAt: new Date(conversation.updatedAt)
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(directConversationParticipants)
    .values(
      seedConversations.flatMap((conversation) => [
        {
          conversationId: conversation.id,
          userId: "dev-user",
          unreadCount: conversation.unreadCount
        },
        {
          conversationId: conversation.id,
          userId:
            conversation.participant.id === currentUser.id
              ? "dev-user"
              : conversation.participant.id,
          unreadCount: 0
        }
      ])
    )
    .onConflictDoNothing();

  await db
    .insert(directMessages)
    .values(
      seedConversations.flatMap((conversation) =>
        conversation.messages.map((message) => ({
          id: message.id,
          conversationId: conversation.id,
          senderId: message.senderId === currentUser.id ? "dev-user" : message.senderId,
          body: message.body,
          createdAt: new Date(message.createdAt)
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
