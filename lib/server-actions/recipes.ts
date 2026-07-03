"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  recipeInputSchema,
  remixRecipeInputSchema,
  validateStepWater
} from "@/lib/validators/recipes";
import { formDataToObject } from "@/lib/server-actions/result";
import {
  createRecipeInDb,
  createRecipeRemixInDb,
  deleteRecipeInDb,
  updateRecipeInDb
} from "@/lib/data/repositories";
import type { BrewMethod, Visibility } from "@/lib/domain";

const brewMethods: BrewMethod[] = [
  "V60",
  "Origami",
  "Kalita",
  "AeroPress",
  "Espresso",
  "French Press",
  "Switch"
];
const visibilities: Visibility[] = ["private", "unlisted", "followers", "public"];

export async function saveRecipeAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = recipeInputSchema.safeParse({
    ...raw,
    steps: recipeStepsFromFormData(formData, Number(raw.waterGrams ?? 0))
  });

  if (!parsed.success) {
    throw new Error("Recipe could not be saved");
  }

  if (!validateStepWater(parsed.data.waterGrams, parsed.data.steps)) {
    throw new Error("Step water cannot exceed total recipe water");
  }

  const created = await createRecipeInDb(parsed.data);
  revalidatePath("/recipes");
  revalidatePath("/home");
  revalidatePath("/explore");
  redirect(`/recipes/${created.id}`);
}

export async function updateRecipeAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const id = String(raw.id ?? "");
  const parsed = recipeInputSchema.safeParse({
    ...raw,
    steps: recipeStepsFromFormData(formData, Number(raw.waterGrams ?? 0))
  });

  if (!id || !parsed.success) {
    throw new Error("Recipe could not be updated");
  }

  if (!validateStepWater(parsed.data.waterGrams, parsed.data.steps)) {
    throw new Error("Step water cannot exceed total recipe water");
  }

  const updated = await updateRecipeInDb({ id, ...parsed.data });
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  revalidatePath("/home");
  revalidatePath("/explore");
  redirect(`/recipes/${updated.id}`);
}

export async function deleteRecipeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Recipe could not be deleted");
  }

  await deleteRecipeInDb(id);
  revalidatePath("/recipes");
  revalidatePath("/home");
  revalidatePath("/explore");
  redirect("/recipes");
}

export async function importRecipesAction(formData: FormData): Promise<void> {
  const recipesJson = String(formData.get("recipesJson") ?? "").trim();
  const parsedPayload = parseRecipesPayload(recipesJson);

  if (!parsedPayload.ok) {
    redirect(`/recipes/import?error=${encodeURIComponent(parsedPayload.message)}`);
  }

  const importedRecipes = parsedPayload.recipes.map(normalizeImportedRecipe);
  const parsedRecipes = importedRecipes.map((recipe) => recipeInputSchema.safeParse(recipe));
  const invalidRecipeIndex = parsedRecipes.findIndex((result) => !result.success);

  if (invalidRecipeIndex >= 0) {
    const result = parsedRecipes[invalidRecipeIndex];
    const issue = result.success ? "Invalid recipe data" : result.error.issues[0]?.message;
    redirect(
      `/recipes/import?error=${encodeURIComponent(`Recipe ${invalidRecipeIndex + 1}: ${issue ?? "Invalid recipe data"}`)}`
    );
  }

  const recipesToCreate = parsedRecipes.map((result) => {
    if (!result.success) {
      throw new Error("Recipe import validation failed");
    }

    return result.data;
  });

  const gearItemIds = selectedImportGearItemIds(formData);

  const waterErrorIndex = recipesToCreate.findIndex(
    (recipe) => !validateStepWater(recipe.waterGrams, recipe.steps)
  );

  if (waterErrorIndex >= 0) {
    redirect(
      `/recipes/import?error=${encodeURIComponent(`Recipe ${waterErrorIndex + 1}: step water exceeds recipe water`)}`
    );
  }

  for (const recipe of recipesToCreate) {
    await createRecipeInDb({ ...recipe, gearItemIds });
  }

  revalidatePath("/recipes");
  revalidatePath("/home");
  revalidatePath("/explore");
  redirect(`/recipes?imported=${recipesToCreate.length}`);
}

export async function remixRecipeAction(formData: FormData): Promise<void> {
  const parsed = remixRecipeInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Recipe could not be remixed");
  }

  const remix = await createRecipeRemixInDb(parsed.data.recipeId);
  revalidatePath(parsed.data.path);
  revalidatePath("/recipes");
  revalidatePath("/home");
  revalidatePath("/notifications");
  redirect(`/recipes/${remix.id}/edit`);
}

function selectedImportGearItemIds(formData: FormData) {
  return Array.from(
    new Set(
      ["dripperId", "grinderId"]
        .map((field) => String(formData.get(field) ?? "").trim())
        .filter(Boolean)
    )
  );
}

function parseRecipesPayload(
  raw: string
): { ok: true; recipes: unknown[] } | { ok: false; message: string } {
  if (!raw) {
    return { ok: false, message: "Paste a JSON array or an object with a recipes array" };
  }

  try {
    const payload = JSON.parse(raw) as unknown;

    if (Array.isArray(payload)) {
      return payload.length > 0
        ? { ok: true, recipes: payload }
        : { ok: false, message: "JSON must include at least one recipe" };
    }

    if (isRecord(payload) && Array.isArray(payload.recipes)) {
      return payload.recipes.length > 0
        ? { ok: true, recipes: payload.recipes }
        : { ok: false, message: "recipes must include at least one recipe" };
    }

    return { ok: false, message: "Use a JSON array or an object with a recipes array" };
  } catch {
    return { ok: false, message: "JSON could not be parsed" };
  }
}

function normalizeImportedRecipe(value: unknown, index: number) {
  const recipe = isRecord(value) ? value : {};
  const rawSteps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const steps =
    rawSteps.length > 0
      ? normalizeImportedSteps(rawSteps)
      : [defaultImportedStep(numberValue(recipe, "waterGrams", "water", "totalWaterGrams") ?? 250)];
  const waterGrams =
    numberValue(recipe, "waterGrams", "water", "totalWaterGrams") ??
    steps.at(-1)?.cumulativeWaterGrams ??
    250;

  return {
    title: stringValue(recipe, "title", "name") ?? `Imported recipe ${index + 1}`,
    subtitle: stringValue(recipe, "subtitle", "summary") ?? "",
    description: stringValue(recipe, "description", "notes") ?? "",
    coverUrl: stringValue(recipe, "coverUrl", "imageUrl") ?? "",
    coverAssetId: stringValue(recipe, "coverAssetId") ?? "",
    method: enumValue(recipe, brewMethods, "method", "brewMethod") ?? "V60",
    visibility: enumValue(recipe, visibilities, "visibility") ?? "private",
    doseGrams: numberValue(recipe, "doseGrams", "dose") ?? 15,
    waterGrams,
    temperatureCelsius: numberValue(recipe, "temperatureCelsius", "temperature", "tempC") ?? 93,
    grindLabel: stringValue(recipe, "grindLabel", "grind", "grindProfile") ?? "Medium",
    grindSetting: stringValue(recipe, "grindSetting", "setting") ?? "",
    steps
  };
}

function normalizeImportedSteps(rawSteps: unknown[]) {
  let previousCumulative = 0;

  return rawSteps.map((step, index) => {
    const normalized = normalizeImportedStep(step, index, previousCumulative);
    previousCumulative = normalized.cumulativeWaterGrams;
    return normalized;
  });
}

function normalizeImportedStep(value: unknown, index: number, previousCumulative: number) {
  const step = isRecord(value) ? value : {};
  const pourGrams = numberValue(step, "pourGrams", "pour");
  const cumulativeWaterGrams =
    numberValue(
      step,
      "cumulativeWaterGrams",
      "waterGrams",
      "totalWaterGrams",
      "cumulative",
      "total"
    ) ?? previousCumulative + (pourGrams ?? 0);

  return {
    label: stringValue(step, "label", "name") ?? `Step ${index + 1}`,
    startsAtSeconds:
      secondsValue(step, "startsAtSeconds", "startSeconds", "start", "time", "at") ?? index * 45,
    pourGrams: pourGrams ?? Math.max(cumulativeWaterGrams - previousCumulative, 0),
    cumulativeWaterGrams,
    instruction: stringValue(step, "instruction", "text", "notes") ?? "Brew steadily."
  };
}

function defaultImportedStep(waterGrams: number) {
  return {
    label: "Brew",
    startsAtSeconds: 0,
    pourGrams: waterGrams,
    cumulativeWaterGrams: waterGrams,
    instruction: "Brew using the imported recipe notes."
  };
}

function enumValue<T extends string>(
  source: Record<string, unknown>,
  allowed: T[],
  ...keys: string[]
): T | undefined {
  const value = stringValue(source, ...keys);

  return allowed.find((option) => option.toLowerCase() === value?.toLowerCase());
}

function stringValue(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function numberValue(source: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function secondsValue(source: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      const parts = trimmed.split(":").map((part) => Number(part));

      if (parts.length === 2 && parts.every(Number.isFinite)) {
        return Math.trunc(parts[0] * 60 + parts[1]);
      }

      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recipeStepsFromFormData(formData: FormData, waterGrams: number) {
  const labels = formData.getAll("stepLabel");
  const starts = formData.getAll("stepStartsAtSeconds");
  const pours = formData.getAll("stepPourGrams");
  const cumulative = formData.getAll("stepCumulativeWaterGrams");
  const instructions = formData.getAll("stepInstruction");

  return labels.map((label, index) => ({
    label: String(label ?? `Step ${index + 1}`),
    startsAtSeconds: Number(starts[index] ?? 0),
    pourGrams: Number(pours[index] ?? 0),
    cumulativeWaterGrams: Number(cumulative[index] ?? waterGrams),
    instruction: String(instructions[index] ?? "Pour gently")
  }));
}
