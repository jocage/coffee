import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/forms/recipe-form";
import { updateRecipeAction } from "@/lib/server-actions/recipes";
import { getRecipeById } from "@/lib/data/queries";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <p className="text-sm text-[var(--text-muted)]">Editing recipe</p>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {recipe.parentRecipeId ? <p className="mt-1 text-sm text-[var(--text-muted)]">Remix draft based on {recipe.parentRecipeId}</p> : null}
      </div>
      <RecipeForm recipe={recipe} action={updateRecipeAction} submitLabel="Update recipe" />
    </div>
  );
}
