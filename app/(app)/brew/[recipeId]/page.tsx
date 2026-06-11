import { notFound } from "next/navigation";
import { LiveBrewMode } from "@/components/brews/live-brew-mode";
import { getRecipeById } from "@/lib/data/queries";

export default async function BrewModePage({ params }: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = await params;
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    notFound();
  }

  return <LiveBrewMode recipe={recipe} />;
}
