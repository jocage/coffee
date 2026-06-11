import { ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { brewLogs } from "@/db/schema/brews";
import { challenges, clubs } from "@/db/schema/clubs";
import { coffeeBeans } from "@/db/schema/coffee";
import { collections } from "@/db/schema/collections";
import { gearItems } from "@/db/schema/gear";
import { recipes as recipesTable } from "@/db/schema/recipes";
import { comments, contentReports, directMessages, notifications, reactions, saves } from "@/db/schema/social";
import {
  brewLogs as seedBrewLogs,
  challenges as seedChallenges,
  clubs as seedClubs,
  coffees as seedCoffees,
  gear as seedGear,
  recipes as seedRecipes
} from "@/lib/data/seed";

const demoUserIds = ["dev-user"];
const demoRecipeIds = seedRecipes.map((recipe) => recipe.id);
const demoBrewLogIds = seedBrewLogs.map((brewLog) => brewLog.id);
const demoCoffeeIds = seedCoffees.map((coffee) => coffee.id);
const demoGearIds = seedGear.map((item) => item.id);
const demoClubIds = seedClubs.map((club) => club.id);
const demoChallengeIds = seedChallenges.map((challenge) => challenge.id);
const demoTargetIds = [...demoRecipeIds, ...demoBrewLogIds, ...demoCoffeeIds, ...demoGearIds];

async function deleteByIds<TId extends string>(ids: TId[], operation: (ids: TId[]) => Promise<unknown>) {
  if (ids.length > 0) {
    await operation(ids);
  }
}

async function main() {
  const [
    playwrightBrewLogRows,
    playwrightCoffeeRows,
    playwrightGearRows,
    playwrightCollectionRows,
    playwrightCommentRows
  ] = await Promise.all([
    db
      .select({ id: brewLogs.id })
      .from(brewLogs)
      .where(or(ilike(brewLogs.grindSetting, "PW %"), ilike(brewLogs.tastingNotes, "%Playwright%"), ilike(brewLogs.title, "%Playwright%"))),
    db
      .select({ id: coffeeBeans.id })
      .from(coffeeBeans)
      .where(or(ilike(coffeeBeans.name, "Playwright%"), ilike(coffeeBeans.roaster, "Playwright%"))),
    db
      .select({ id: gearItems.id })
      .from(gearItems)
      .where(or(ilike(gearItems.name, "Playwright%"), ilike(gearItems.brand, "Playwright%"), ilike(gearItems.model, "Playwright%"))),
    db
      .select({ id: collections.id })
      .from(collections)
      .where(or(ilike(collections.title, "Playwright%"), ilike(collections.description, "%Playwright%"))),
    db
      .select({ id: comments.id })
      .from(comments)
      .where(ilike(comments.body, "Playwright%"))
  ]);

  const playwrightBrewLogIds = playwrightBrewLogRows.map((row) => row.id);
  const playwrightCoffeeIds = playwrightCoffeeRows.map((row) => row.id);
  const playwrightGearIds = playwrightGearRows.map((row) => row.id);
  const playwrightCollectionIds = playwrightCollectionRows.map((row) => row.id);
  const playwrightCommentIds = playwrightCommentRows.map((row) => row.id);
  const targetIds = [
    ...demoTargetIds,
    ...playwrightBrewLogIds,
    ...playwrightCoffeeIds,
    ...playwrightGearIds,
    ...playwrightCollectionIds,
    ...playwrightCommentIds
  ];

  await deleteByIds(targetIds, (ids) => db.delete(contentReports).where(inArray(contentReports.targetId, ids)));
  await db.delete(contentReports).where(ilike(contentReports.details, "%Playwright%"));
  await deleteByIds(targetIds, (ids) => db.delete(comments).where(inArray(comments.targetId, ids)));
  await deleteByIds(playwrightCommentIds, (ids) => db.delete(comments).where(or(inArray(comments.id, ids), inArray(comments.parentId, ids))));
  await db.delete(comments).where(ilike(comments.body, "Playwright%"));
  await deleteByIds(targetIds, (ids) => db.delete(reactions).where(inArray(reactions.targetId, ids)));
  await deleteByIds(targetIds, (ids) => db.delete(saves).where(inArray(saves.targetId, ids)));
  await db.delete(directMessages).where(ilike(directMessages.body, "Playwright%"));
  await db.delete(notifications).where(or(ilike(notifications.body, "%Playwright%"), ilike(notifications.body, "%PW %")));

  await deleteByIds(demoBrewLogIds, (ids) => db.delete(brewLogs).where(inArray(brewLogs.id, ids)));
  await deleteByIds(playwrightBrewLogIds, (ids) => db.delete(brewLogs).where(inArray(brewLogs.id, ids)));
  await deleteByIds(demoRecipeIds, (ids) => db.delete(recipesTable).where(inArray(recipesTable.id, ids)));
  await deleteByIds(demoGearIds, (ids) => db.delete(gearItems).where(inArray(gearItems.id, ids)));
  await deleteByIds(playwrightGearIds, (ids) => db.delete(gearItems).where(inArray(gearItems.id, ids)));
  await deleteByIds(demoCoffeeIds, (ids) => db.delete(coffeeBeans).where(inArray(coffeeBeans.id, ids)));
  await deleteByIds(playwrightCoffeeIds, (ids) => db.delete(coffeeBeans).where(inArray(coffeeBeans.id, ids)));
  await deleteByIds(playwrightCollectionIds, (ids) => db.delete(collections).where(inArray(collections.id, ids)));
  await deleteByIds(demoChallengeIds, (ids) => db.delete(challenges).where(inArray(challenges.id, ids)));
  await deleteByIds(demoClubIds, (ids) => db.delete(clubs).where(inArray(clubs.id, ids)));
  await deleteByIds(demoUserIds, (ids) => db.delete(user).where(inArray(user.id, ids)));

  console.log("Cleared Coffee Journey demo data.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
