import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { brewLogs } from "@/db/schema/brews";
import { recipes } from "@/db/schema/recipes";
import { comments, reactions, saves } from "@/db/schema/social";

type RecipeStats = {
  likes: number;
  saves: number;
  brews: number;
  averageRating: number;
  remixes: number;
  comments: number;
};

export async function recomputeRecipeStats(recipeId: string): Promise<RecipeStats | null> {
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId)
  });

  if (!recipe) {
    return null;
  }

  const [likesRows, savesRows, commentRows, brewRows] = await Promise.all([
    db
      .select({ id: reactions.id })
      .from(reactions)
      .where(and(eq(reactions.targetType, "recipe"), eq(reactions.targetId, recipeId))),
    db
      .select({ id: saves.id })
      .from(saves)
      .where(and(eq(saves.targetType, "recipe"), eq(saves.targetId, recipeId))),
    db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.targetType, "recipe"), eq(comments.targetId, recipeId))),
    db
      .select({ rating: brewLogs.rating })
      .from(brewLogs)
      .where(eq(brewLogs.recipeId, recipeId))
  ]);
  const averageRating =
    brewRows.length > 0
      ? brewRows.reduce((sum, row) => sum + row.rating, 0) / brewRows.length
      : 0;
  const nextStats = {
    likes: likesRows.length,
    saves: savesRows.length,
    brews: brewRows.length,
    averageRating,
    remixes: recipe.stats.remixes,
    comments: commentRows.length
  };

  await db.update(recipes).set({ stats: nextStats }).where(eq(recipes.id, recipeId));

  return nextStats;
}

export async function backfillRecipeStats(): Promise<number> {
  const rows = await db.select({ id: recipes.id }).from(recipes);

  for (const row of rows) {
    await recomputeRecipeStats(row.id);
  }

  return rows.length;
}
