import { saveRecipeAction } from "@/lib/server-actions/recipes";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { RecipeStepEditor } from "@/components/forms/recipe-step-editor";
import type { Recipe, Visibility } from "@/lib/domain";

export function RecipeForm({
  recipe,
  action = saveRecipeAction,
  defaultVisibility = "private",
  submitLabel = "Save draft"
}: {
  recipe?: Recipe;
  action?: (formData: FormData) => Promise<void>;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  return (
    <form action={action} noValidate className="grid gap-5 xl:grid-cols-[0.9fr_0.8fr_1fr]">
      {recipe ? <input type="hidden" name="id" value={recipe.id} /> : null}
      <Card>
        <CardTitle>Basics</CardTitle>
        <div className="mt-5 grid gap-4">
          <MediaUploadField
            entityType="recipe"
            label="Add recipe cover"
            urlFieldName="coverUrl"
            assetFieldName="coverAssetId"
            initialUrl={recipe?.coverUrl}
          />
          <div>
            <Label htmlFor="title">Recipe name</Label>
            <Input
              id="title"
              name="title"
              placeholder="My new recipe"
              defaultValue={recipe?.title}
              required
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              name="subtitle"
              placeholder="Clean, bright, sweet"
              defaultValue={recipe?.subtitle}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Write about this recipe..."
              defaultValue={recipe?.description}
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              id="visibility"
              name="visibility"
              defaultValue={recipe?.visibility ?? defaultVisibility}
            >
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>Parameters</CardTitle>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="method">Brew method</Label>
            <Select id="method" name="method" defaultValue={recipe?.method ?? "V60"}>
              {["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"].map(
                (method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                )
              )}
            </Select>
          </div>
          <div>
            <Label htmlFor="doseGrams">Dose (g)</Label>
            <Input
              id="doseGrams"
              name="doseGrams"
              type="number"
              min="1"
              defaultValue={recipe?.doseGrams ?? 20}
              required
            />
          </div>
          <div>
            <Label htmlFor="waterGrams">Water (g)</Label>
            <Input
              id="waterGrams"
              name="waterGrams"
              type="number"
              min="1"
              defaultValue={recipe?.waterGrams ?? 300}
              required
            />
          </div>
          <div>
            <Label htmlFor="temperatureCelsius">Temp (C)</Label>
            <Input
              id="temperatureCelsius"
              name="temperatureCelsius"
              type="number"
              min="50"
              max="100"
              defaultValue={recipe?.temperatureCelsius ?? 93}
              required
            />
          </div>
          <div>
            <Label htmlFor="grindLabel">Grind profile</Label>
            <Input
              id="grindLabel"
              name="grindLabel"
              defaultValue={recipe?.grindLabel ?? "Medium-fine"}
              placeholder="Medium-fine, espresso fine"
              required
            />
          </div>
          <div>
            <Label htmlFor="grindSetting">Setting</Label>
            <Input
              id="grindSetting"
              name="grindSetting"
              defaultValue={recipe?.grindSetting ?? ""}
              placeholder="C40 42 clicks, Niche 18, EK43 9.0, 650 microns"
            />
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>Pour plan</CardTitle>
        <RecipeStepEditor steps={recipe?.steps} />
        <div className="mt-5 flex gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button type="submit" variant="secondary">
            Publish
          </Button>
        </div>
      </Card>
    </form>
  );
}
