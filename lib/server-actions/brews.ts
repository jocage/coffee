"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brewLogInputSchema } from "@/lib/validators/brews";
import { createBrewLogInDb, deleteBrewLogInDb, updateBrewLogInDb } from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";

export async function saveBrewLogAction(formData: FormData): Promise<void> {
  const parsed = brewLogInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Brew log could not be saved");
  }

  await createBrewLogInDb(parsed.data);
  revalidatePath("/brews");
  revalidatePath("/home");
  revalidatePath("/notifications");
  revalidatePath("/community");
  redirect("/brews");
}

export async function updateBrewLogAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = brewLogInputSchema.safeParse(formDataToObject(formData));

  if (!id || !parsed.success) {
    throw new Error("Brew log could not be updated");
  }

  await updateBrewLogInDb({ id, ...parsed.data });
  revalidatePath("/brews");
  revalidatePath(`/brews/${id}/edit`);
  revalidatePath("/home");
  redirect("/brews");
}

export async function deleteBrewLogAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Brew log could not be deleted");
  }

  await deleteBrewLogInDb(id);
  revalidatePath("/brews");
  revalidatePath("/home");
  redirect("/brews");
}
