import { saveBrewLogAction, updateBrewLogAction } from "@/lib/server-actions/brews";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import type { BrewLog, CoffeeBean, Recipe, Visibility } from "@/lib/domain";

const brewMethods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"] as const;

export function BrewLogForm({
  recipes,
  coffees,
  defaultRecipeId,
  defaultVisibility = "private",
  brewLog,
  submitLabel = "Save Brew Log"
}: {
  recipes: Recipe[];
  coffees: CoffeeBean[];
  defaultRecipeId?: string;
  defaultVisibility?: Visibility;
  brewLog?: BrewLog;
  submitLabel?: string;
}) {
  const selectedRecipe = brewLog?.recipe ?? recipes.find((recipe) => recipe.id === defaultRecipeId) ?? recipes[0];
  const selectedCoffee = brewLog?.coffee ?? selectedRecipe?.coffee ?? coffees[0];

  return (
    <form action={brewLog ? updateBrewLogAction : saveBrewLogAction} className="mt-5 grid gap-4 md:grid-cols-2">
      {brewLog ? <input type="hidden" name="id" value={brewLog.id} /> : null}
      <div className="md:col-span-2">
        <Label htmlFor="recipeId">Recipe</Label>
        <Select id="recipeId" name="recipeId" defaultValue={selectedRecipe?.id ?? ""}>
          <option value="">Free brew / no recipe</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="coffeeId">Coffee</Label>
        <Select id="coffeeId" name="coffeeId" defaultValue={selectedCoffee?.id ?? ""}>
          {coffees.length === 0 ? <option value="">Add coffee first</option> : null}
          {coffees.map((coffee) => (
            <option key={coffee.id} value={coffee.id}>
              {coffee.name} · {coffee.roaster}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="method">Brew method</Label>
        <Select id="method" name="method" defaultValue={brewLog?.method ?? selectedRecipe?.method ?? "V60"}>
          {brewMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </Select>
      </div>
      <Field id="doseGrams" label="Dose (g)" value={String(brewLog?.doseGrams ?? selectedRecipe?.doseGrams ?? 18)} />
      <Field id="waterGrams" label="Water in / total water (g)" value={String(brewLog?.waterGrams ?? selectedRecipe?.waterGrams ?? 36)} />
      <Field
        id="outputGrams"
        label="Beverage yield (g)"
        value={brewLog?.outputGrams ? String(brewLog.outputGrams) : selectedRecipe?.method === "Espresso" ? String(selectedRecipe.waterGrams) : ""}
        optional
      />
      <Field id="temperatureCelsius" label="Temp (C)" value={String(brewLog?.temperatureCelsius ?? selectedRecipe?.temperatureCelsius ?? 93)} />
      <Field id="brewTimeSeconds" label="Brew time (s)" value={String(brewLog?.brewTimeSeconds ?? selectedRecipe?.totalTimeSeconds ?? 30)} />
      <Field id="pressureBars" label="Pressure (bar)" value={brewLog?.pressureBars ? String(brewLog.pressureBars) : ""} optional />
      <div>
        <Label htmlFor="grindSetting">Grind setting</Label>
        <Input id="grindSetting" name="grindSetting" defaultValue={brewLog?.grindSetting ?? selectedRecipe?.grindSetting ?? ""} />
      </div>
      <div>
        <Label htmlFor="rating">Rating</Label>
        <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={brewLog?.rating ?? 5} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="tastingNotes">Notes</Label>
        <Textarea id="tastingNotes" name="tastingNotes" defaultValue={brewLog?.tastingNotes ?? "Tasted very clean with floral notes."} />
      </div>
      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select id="visibility" name="visibility" defaultValue={brewLog?.visibility ?? defaultVisibility}>
          <option value="private">Private</option>
          <option value="followers">Followers</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </Select>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">{submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({ id, label, value, optional = false }: { id: string; label: string; value: string; optional?: boolean }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="number" step="any" defaultValue={value} placeholder={optional ? "Optional" : undefined} />
    </div>
  );
}
