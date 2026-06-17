import { notFound } from "next/navigation";
import { RecipeRemixDiff } from "@/components/coffee/recipe-remix-diff";
import { RecipeForm } from "@/components/forms/recipe-form";
import { updateRecipeAction } from "@/lib/server-actions/recipes";
import { getRecipeById } from "@/lib/data/queries";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const originalRecipe = recipe.parentRecipeId ? await getRecipeById(recipe.parentRecipeId) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <p className="text-sm text-[var(--text-muted)]">Editing recipe</p>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {originalRecipe ? <p className="mt-1 text-sm text-[var(--text-muted)]">Remix draft based on {originalRecipe.title}</p> : null}
      </div>
      {originalRecipe ? (
        <div className="mb-5">
          <RecipeRemixDiff remix={recipe} original={originalRecipe} />
        </div>
      ) : null}
      <RecipeForm recipe={recipe} action={updateRecipeAction} submitLabel="Update recipe" />
    </div>
  );
}
