import Link from "next/link";
import { Download } from "lucide-react";
import { ImportRecipesForm } from "@/components/forms/import-recipes-form";
import { Button } from "@/components/ui/button";
import { getMyGear } from "@/lib/data/queries";

const sampleRecipesJson = JSON.stringify(
  {
    recipes: [
      {
        title: "Morning V60",
        subtitle: "Clean and sweet",
        description: "My everyday recipe for light roast coffee.",
        method: "V60",
        visibility: "private",
        dose: 15,
        water: 250,
        temperature: 93,
        grind: "Medium-fine",
        grindSetting: "C40 24 clicks",
        steps: [
          {
            label: "Bloom",
            time: "0:00",
            pour: 45,
            waterGrams: 45,
            instruction: "Saturate the bed and swirl gently."
          },
          {
            label: "Main pour",
            time: "0:45",
            pour: 120,
            waterGrams: 165,
            instruction: "Pour in slow circles, keeping the bed level."
          },
          {
            label: "Finish",
            time: "1:30",
            pour: 85,
            waterGrams: 250,
            instruction: "Finish in the center and let it draw down."
          }
        ]
      }
    ]
  },
  null,
  2
);

export default async function ImportRecipesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, gear] = await Promise.all([searchParams, getMyGear()]);
  const drippers = gear.filter((item) => item.type === "dripper");
  const grinders = gear.filter((item) => item.type === "grinder");

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Recipes</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Paste JSON from your notes or export file. Imported recipes stay private unless JSON
            says otherwise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/recipes/export" prefetch={false}>
            <Button variant="secondary" icon={<Download className="h-4 w-4" aria-hidden />}>
              Export JSON
            </Button>
          </Link>
          <Link href="/recipes">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      {params.error ? (
        <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm text-[var(--text)]">
          {params.error}
        </div>
      ) : null}

      <ImportRecipesForm
        sampleRecipesJson={sampleRecipesJson}
        drippers={drippers}
        grinders={grinders}
      />
    </div>
  );
}
