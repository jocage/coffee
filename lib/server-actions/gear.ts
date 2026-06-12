"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDripperCatalogItemInDb,
  createGearItemFromDripperCatalogInDb,
  createGearItemFromGrinderCatalogInDb,
  createGearItemInDb,
  createGrinderCatalogItemInDb,
  deleteGearItemInDb,
  updateGearItemInDb
} from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import {
  addDripperFromCatalogSchema,
  addGrinderFromCatalogSchema,
  dripperCatalogInputSchema,
  gearInputSchema,
  grinderCatalogInputSchema
} from "@/lib/validators/gear";

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

export async function addGrinderFromCatalogAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = addGrinderFromCatalogSchema.safeParse({
    ...raw,
    defaultForMethod: raw.defaultForMethod || undefined
  });

  if (!parsed.success) {
    throw new Error("Catalog grinder could not be added");
  }

  await createGearItemFromGrinderCatalogInDb(parsed.data);
  revalidatePath("/gear");
  revalidatePath("/gear/grinders/new");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/gear");
}

export async function addGrinderToCatalogAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = grinderCatalogInputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Catalog grinder could not be saved");
  }

  await createGrinderCatalogItemInDb(parsed.data);
  revalidatePath("/gear/grinders/new");
  redirect("/gear/grinders/new");
}

export async function addDripperFromCatalogAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = addDripperFromCatalogSchema.safeParse({
    ...raw,
    defaultForMethod: raw.defaultForMethod || undefined
  });

  if (!parsed.success) {
    throw new Error("Catalog dripper could not be added");
  }

  await createGearItemFromDripperCatalogInDb(parsed.data);
  revalidatePath("/gear");
  revalidatePath("/gear/drippers/new");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/gear");
}

export async function addDripperToCatalogAction(formData: FormData): Promise<void> {
  const raw = formDataToObject(formData);
  const parsed = dripperCatalogInputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Catalog dripper could not be saved");
  }

  await createDripperCatalogItemInDb(parsed.data);
  revalidatePath("/gear/drippers/new");
  redirect("/gear/drippers/new");
}

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
