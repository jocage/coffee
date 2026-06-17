import { notFound } from "next/navigation";
import { BrewLogForm } from "@/components/forms/brew-log-form";
import { getBrewLogById, getCoffees, getRecipes } from "@/lib/data/queries";

export default async function EditBrewLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [brewLog, recipes, coffees] = await Promise.all([
    getBrewLogById(id),
    getRecipes(),
    getCoffees()
  ]);

  if (!brewLog) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">Edit Brew Log</h1>
      <BrewLogForm
        recipes={recipes}
        coffees={coffees}
        brewLog={brewLog}
        submitLabel="Update Brew Log"
      />
    </div>
  );
}
