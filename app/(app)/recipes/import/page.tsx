import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { importRecipesAction } from "@/lib/server-actions/recipes";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/form";
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

      <form action={importRecipesAction} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardTitle>Recipes JSON</CardTitle>
          <div className="mt-5">
            <Label htmlFor="recipesJson">Paste recipes</Label>
            <Textarea
              id="recipesJson"
              name="recipesJson"
              className="min-h-[560px] font-mono text-xs leading-5"
              defaultValue={sampleRecipesJson}
              spellCheck={false}
              required
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" icon={<Upload className="h-4 w-4" aria-hidden />}>
              Import recipes
            </Button>
            <Link href="/recipes/export" prefetch={false}>
              <Button
                type="button"
                variant="secondary"
                icon={<Download className="h-4 w-4" aria-hidden />}
              >
                Download current recipes
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardTitle>Gear</CardTitle>
          <div className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="dripperId">Dripper</Label>
              <Select id="dripperId" name="dripperId" defaultValue={drippers[0]?.id ?? ""}>
                <option value="">No dripper</option>
                {drippers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="grinderId">Grinder</Label>
              <Select id="grinderId" name="grinderId" defaultValue={grinders[0]?.id ?? ""}>
                <option value="">No grinder</option>
                {grinders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Selected gear will be attached to every recipe in this import.
            </p>
          </div>
        </Card>

        <Card>
          <CardTitle>Accepted fields</CardTitle>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="font-semibold">Required shape</dt>
              <dd className="mt-1 text-[var(--text-muted)]">
                Either an array of recipes or an object with a{" "}
                <code className="text-[var(--accent)]">recipes</code> array.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Recipe aliases</dt>
              <dd className="mt-1 text-[var(--text-muted)]">
                <code className="text-[var(--accent)]">dose</code>,{" "}
                <code className="text-[var(--accent)]">water</code>,
                <code className="text-[var(--accent)]">temperature</code> and{" "}
                <code className="text-[var(--accent)]">grind</code> work.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Step aliases</dt>
              <dd className="mt-1 text-[var(--text-muted)]">
                Use <code className="text-[var(--accent)]">time</code> as seconds or{" "}
                <code className="text-[var(--accent)]">m:ss</code>.
                <code className="text-[var(--accent)]">waterGrams</code> is cumulative water.
              </dd>
            </div>
          </dl>
        </Card>
      </form>
    </div>
  );
}
