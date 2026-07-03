import { getMyRecipes } from "@/lib/data/queries";

export async function GET() {
  const recipes = await getMyRecipes({ visibility: "all" });
  const payload = {
    exportedAt: new Date().toISOString(),
    recipes: recipes.map((recipe) => ({
      title: recipe.title,
      subtitle: recipe.subtitle,
      description: recipe.description,
      method: recipe.method,
      visibility: recipe.visibility,
      doseGrams: recipe.doseGrams,
      waterGrams: recipe.waterGrams,
      temperatureCelsius: recipe.temperatureCelsius,
      grindLabel: recipe.grindLabel,
      grindSetting: recipe.grindSetting,
      steps: recipe.steps.map((step) => ({
        label: step.label,
        startsAtSeconds: step.startsAtSeconds,
        pourGrams: step.pourGrams,
        cumulativeWaterGrams: step.cumulativeWaterGrams,
        instruction: step.instruction
      }))
    }))
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="coffee-recipes-${new Date().toISOString().slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
