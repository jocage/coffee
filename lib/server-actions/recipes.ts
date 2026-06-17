"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recipeInputSchema, remixRecipeInputSchema, validateStepWater } from "@/lib/validators/recipes";
import { formDataToObject } from "@/lib/server-actions/result";
import { createRecipeInDb, createRecipeRemixInDb, deleteRecipeInDb, updateRecipeInDb } from "@/lib/data/repositories";

export async function saveRecipeAction(formData: FormData): Promise<void> {
  const raw = normalizeDraftRecipeInput(formDataToObject(formData));
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
  const raw = normalizeDraftRecipeInput(formDataToObject(formData));
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

function normalizeDraftRecipeInput(raw: Record<string, FormDataEntryValue>) {
  if (raw.intent !== "draft") {
    return raw;
  }

  return {
    ...raw,
    title: nonEmpty(raw.title) ? raw.title : "Untitled recipe",
    method: nonEmpty(raw.method) ? raw.method : "V60",
    visibility: nonEmpty(raw.visibility) ? raw.visibility : "private",
    doseGrams: nonEmpty(raw.doseGrams) ? raw.doseGrams : "20",
    waterGrams: nonEmpty(raw.waterGrams) ? raw.waterGrams : "300",
    temperatureCelsius: nonEmpty(raw.temperatureCelsius) ? raw.temperatureCelsius : "93",
    grindLabel: nonEmpty(raw.grindLabel) ? raw.grindLabel : "Medium-fine"
  };
}

function nonEmpty(value: FormDataEntryValue | undefined) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}
