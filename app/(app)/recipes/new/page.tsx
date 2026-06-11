import { ExportPreview } from "@/components/export/export-preview";
import { RecipeForm } from "@/components/forms/recipe-form";
import { Card, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getRecipes } from "@/lib/data/queries";

export default async function NewRecipePage() {
  const [previewRecipe, user] = await Promise.all([getRecipes().then((recipes) => recipes[0]), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">New Recipe</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Desktop editor uses columns; mobile naturally becomes a wizard-like stack.</p>
      </div>
      <RecipeForm defaultVisibility={user.defaultVisibility} />
      <Card className="mt-5">
        <CardTitle>Live public preview</CardTitle>
        <div className="mt-4 max-w-xl">
          <ExportPreview recipe={previewRecipe} compact />
        </div>
      </Card>
    </div>
  );
}
