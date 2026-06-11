"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCoffeeInDb, deleteCoffeeInDb, updateCoffeeInDb } from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import { coffeeInputSchema } from "@/lib/validators/coffee";

export async function saveCoffeeAction(formData: FormData): Promise<void> {
  const parsed = coffeeInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Coffee could not be saved");
  }

  await createCoffeeInDb(parsed.data);
  revalidatePath("/coffees");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/coffees");
}

export async function updateCoffeeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = coffeeInputSchema.safeParse(formDataToObject(formData));

  if (!id || !parsed.success) {
    throw new Error("Coffee could not be updated");
  }

  await updateCoffeeInDb({ id, ...parsed.data });
  revalidatePath("/coffees");
  revalidatePath(`/coffees/${id}/edit`);
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/coffees");
}

export async function deleteCoffeeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Coffee could not be deleted");
  }

  await deleteCoffeeInDb(id);
  revalidatePath("/coffees");
  revalidatePath("/recipes/new");
  revalidatePath("/brews/new");
  redirect("/coffees");
}
