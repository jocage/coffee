"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCoffeeInDb,
  createGrinderInDb,
  followUserInDb,
  isHandleAvailableInDb,
  joinClubInDb,
  updateProfileInDb,
  updateProfilePrivacyInDb,
  updateProfileUnitsInDb
} from "@/lib/data/repositories";
import {
  onboardingInputSchema,
  profileInputSchema,
  profilePrivacyInputSchema,
  profileUnitsInputSchema
} from "@/lib/validators/profile";
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

export async function savePrivacyAction(formData: FormData): Promise<void> {
  const parsed = profilePrivacyInputSchema.safeParse({
    ...formDataToObject(formData),
    showGearOnProfile: formData.has("showGearOnProfile"),
    showCoffeeOnProfile: formData.has("showCoffeeOnProfile")
  });

  if (!parsed.success) {
    throw new Error("Privacy settings could not be saved");
  }

  await updateProfilePrivacyInDb(parsed.data);
  revalidatePath("/settings");
  revalidatePath("/settings/privacy");
  revalidatePath("/profile");
  revalidatePath("/coffees/new");
  revalidatePath("/brews/new");
  revalidatePath("/recipes/new");
  revalidatePath("/collections");
  revalidatePath("/gear");
  redirect("/settings/privacy?saved=1");
}

export async function saveUnitsAction(formData: FormData): Promise<void> {
  const parsed = profileUnitsInputSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    throw new Error("Unit settings could not be saved");
  }

  await updateProfileUnitsInDb(parsed.data);
  revalidatePath("/settings");
  revalidatePath("/settings/units");
  revalidatePath("/profile");
  revalidatePath("/recipes");
  revalidatePath("/brews");
  redirect("/settings/units?saved=1");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const parsed = onboardingInputSchema.safeParse({
    ...formDataToObject(formData),
    favoriteMethods: formData.getAll("favoriteMethods"),
    suggestedFollowIds: formData.getAll("suggestedFollowIds"),
    suggestedClubIds: formData.getAll("suggestedClubIds")
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

  await Promise.all([
    ...parsed.data.suggestedFollowIds.map((profileId) => followUserInDb(profileId)),
    ...parsed.data.suggestedClubIds.map((clubId) => joinClubInDb(clubId))
  ]);

  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  revalidatePath("/coffees");
  revalidatePath("/gear");
  revalidatePath("/community");
  revalidatePath("/notifications");
  redirect("/home");
}
