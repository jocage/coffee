import { ExportStudio } from "@/components/export/export-studio";
import { getPreviewRecipe } from "@/lib/data/queries";

export default async function ExportStudioPage() {
  const recipe = await getPreviewRecipe();

  return <ExportStudio recipe={recipe} />;
}
