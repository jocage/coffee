"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addCollectionItemInDb, createCollectionInDb, removeCollectionItemInDb } from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import { collectionInputSchema, collectionItemInputSchema, removeCollectionItemInputSchema } from "@/lib/validators/collections";

export async function createCollectionAction(formData: FormData): Promise<void> {
  const parsed = collectionInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Collection could not be created");
  }

  const collection = await createCollectionInDb(parsed.data);
  revalidatePath("/collections");
  revalidatePath("/profile");
  redirect(`/collections/${collection.id}`);
}

export async function addCollectionItemAction(formData: FormData): Promise<void> {
  const parsed = collectionItemInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Collection item could not be added");
  }

  await addCollectionItemInDb(parsed.data);
  revalidatePath(parsed.data.path);
  revalidatePath(`/collections/${parsed.data.collectionId}`);
  redirect(withSearchParam(parsed.data.path, "collected", "1"));
}

export async function removeCollectionItemAction(formData: FormData): Promise<void> {
  const parsed = removeCollectionItemInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Collection item could not be removed");
  }

  await removeCollectionItemInDb(parsed.data);
  revalidatePath(parsed.data.path);
  redirect(withSearchParam(parsed.data.path, "removed", "1"));
}

function withSearchParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}
