import { ExportStudio } from "@/components/export/export-studio";
import { getMyRecipes, getPreviewRecipe } from "@/lib/data/queries";

export default async function ExportStudioPage() {
  const [recipe, recipes] = await Promise.all([
    getPreviewRecipe(),
    getMyRecipes({ visibility: "all" })
  ]);

  return (
    <ExportStudio recipe={recipes[0] ?? recipe} recipes={recipes.length > 0 ? recipes : [recipe]} />
  );
}
