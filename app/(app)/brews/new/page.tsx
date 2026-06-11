import { getCoffees, getCurrentUser, getRecipes } from "@/lib/data/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { BrewLogForm } from "@/components/forms/brew-log-form";

export default async function NewBrewLogPage({ searchParams }: { searchParams: Promise<{ recipeId?: string }> }) {
  const params = await searchParams;
  const [recipes, coffees, user] = await Promise.all([getRecipes(), getCoffees(), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">New Brew Log</h1>
      <Card>
        <CardTitle>Actual brew</CardTitle>
        <BrewLogForm recipes={recipes} coffees={coffees} defaultRecipeId={params.recipeId} defaultVisibility={user.defaultVisibility} />
      </Card>
    </div>
  );
}
