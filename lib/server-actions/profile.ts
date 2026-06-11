"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCoffeeInDb, createGrinderInDb, isHandleAvailableInDb, updateProfileInDb } from "@/lib/data/repositories";
import { onboardingInputSchema, profileInputSchema } from "@/lib/validators/profile";
import { formDataToObject } from "@/lib/server-actions/result";

export async function saveProfileAction(formData: FormData): Promise<void> {
  const parsed = profileInputSchema.safeParse({
    ...formDataToObject(formData),
    favoriteMethods: formData.getAll("favoriteMethods")
  });

  if (!parsed.success) {
    throw new Error("Profile could not be saved");
  }

  if (!(await isHandleAvailableInDb(parsed.data.handle))) {
    throw new Error("Handle is already taken");
  }

  await updateProfileInDb(parsed.data);
  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  revalidatePath("/coffees/new");
  revalidatePath("/brews/new");
  revalidatePath("/recipes/new");
  revalidatePath("/collections");
  redirect("/settings/profile?saved=1");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const parsed = onboardingInputSchema.safeParse({
    ...formDataToObject(formData),
    favoriteMethods: formData.getAll("favoriteMethods")
  });

  if (!parsed.success) {
    throw new Error("Onboarding could not be completed");
  }

  if (!(await isHandleAvailableInDb(parsed.data.handle))) {
    throw new Error("Handle is already taken");
  }

  await updateProfileInDb(parsed.data);

  if (parsed.data.firstCoffeeName && parsed.data.firstCoffeeRoaster) {
    await createCoffeeInDb({
      name: parsed.data.firstCoffeeName,
      roaster: parsed.data.firstCoffeeRoaster,
      origin: "Not specified",
      roastLevel: "medium-light",
      visibility: parsed.data.defaultVisibility
    });
  }

  if (parsed.data.firstGearName && parsed.data.firstGearBrand && parsed.data.firstGearModel) {
    await createGrinderInDb({
      name: parsed.data.firstGearName,
      brand: parsed.data.firstGearBrand,
      model: parsed.data.firstGearModel,
      type: "grinder",
      grinderDrive: "manual",
      visibility: parsed.data.defaultVisibility
    });
  }

  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  revalidatePath("/coffees");
  revalidatePath("/gear");
  redirect("/home");
}
