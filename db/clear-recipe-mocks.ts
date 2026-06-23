import { ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { brewLogs } from "@/db/schema/brews";
import { collectionItems } from "@/db/schema/collections";
import { recipes as recipesTable } from "@/db/schema/recipes";
import { comments, contentReports, reactions, saves } from "@/db/schema/social";
import { recipes as seedRecipes } from "@/lib/data/seed";

const seedRecipeIds = seedRecipes.map((recipe) => recipe.id);
const seedRecipeTitles = seedRecipes.map((recipe) => recipe.title);

async function deleteByIds(ids: string[], operation: (ids: string[]) => Promise<unknown>) {
  if (ids.length > 0) {
    await operation(ids);
  }
}

async function main() {
  const recipeRows = await db
    .select({ id: recipesTable.id, title: recipesTable.title })
    .from(recipesTable)
    .where(
      or(
        inArray(recipesTable.id, seedRecipeIds),
        ilike(recipesTable.title, "Playwright%"),
        ilike(recipesTable.coverUrl, "data:image%"),
        ...seedRecipeTitles.map((title) => ilike(recipesTable.title, `Remix of ${title}%`))
      )
    );

  const recipeIds = recipeRows.map((row) => row.id);

  await deleteByIds(recipeIds, (ids) =>
    db.delete(contentReports).where(inArray(contentReports.targetId, ids))
  );
  await deleteByIds(recipeIds, (ids) => db.delete(comments).where(inArray(comments.targetId, ids)));
  await deleteByIds(recipeIds, (ids) => db.delete(reactions).where(inArray(reactions.targetId, ids)));
  await deleteByIds(recipeIds, (ids) => db.delete(saves).where(inArray(saves.targetId, ids)));
  await deleteByIds(recipeIds, (ids) =>
    db.delete(collectionItems).where(inArray(collectionItems.targetId, ids))
  );
  await deleteByIds(recipeIds, (ids) =>
    db.update(brewLogs).set({ recipeId: null }).where(inArray(brewLogs.recipeId, ids))
  );
  await deleteByIds(recipeIds, (ids) => db.delete(recipesTable).where(inArray(recipesTable.id, ids)));

  console.log(`Cleared ${recipeIds.length} mock recipe${recipeIds.length === 1 ? "" : "s"}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
