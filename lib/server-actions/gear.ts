"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGearItemInDb, deleteGearItemInDb, updateGearItemInDb } from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import { gearInputSchema } from "@/lib/validators/gear";

export async function saveGearAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = gearInputSchema.safeParse({
    ...raw,
    defaultForMethod: raw.defaultForMethod || undefined
  });

  if (!parsed.success) {
    throw new Error("Gear item could not be saved");
  }

  await createGearItemInDb(parsed.data);
  revalidatePath("/gear");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/gear");
}

export async function updateGearAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const raw = formDataToObject(formData);
  const parsed = gearInputSchema.safeParse({
    ...raw,
    defaultForMethod: raw.defaultForMethod || undefined
  });

  if (!id || !parsed.success) {
    throw new Error("Gear item could not be updated");
  }

  await updateGearItemInDb({ id, ...parsed.data });
  revalidatePath("/gear");
  revalidatePath(`/gear/${id}/edit`);
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/gear");
}

export const saveGrinderAction = saveGearAction;
export const updateGrinderAction = updateGearAction;

export async function deleteGearItemAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Gear item could not be deleted");
  }

  await deleteGearItemInDb(id);
  revalidatePath("/gear");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/gear");
}
