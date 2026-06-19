"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  blockConversationInDb,
  createClubPostInDb,
  enterChallengeInDb,
  joinClubInDb,
  markNotificationsReadInDb,
  sendMessageInDb
} from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import {
  blockConversationInputSchema,
  challengeEntryInputSchema,
  createClubPostInputSchema,
  joinClubInputSchema,
  sendMessageInputSchema
} from "@/lib/validators/community";

export async function joinClubAction(formData: FormData): Promise<void> {
  const parsed = joinClubInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Club could not be joined");

  await joinClubInDb(parsed.data.clubId);
  revalidatePath("/community");
  revalidatePath(parsed.data.path);
}

export async function createClubPostAction(formData: FormData): Promise<void> {
  const parsed = createClubPostInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Club post could not be created");

  await createClubPostInDb(parsed.data);
  revalidatePath(parsed.data.path);
  redirect(withSearchParam(parsed.data.path, "posted", "1"));
}

export async function enterChallengeAction(formData: FormData): Promise<void> {
  const parsed = challengeEntryInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Challenge entry could not be saved");

  await enterChallengeInDb(parsed.data);
  revalidatePath("/community");
  revalidatePath(parsed.data.path);
  redirect(parsed.data.path);
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const parsed = sendMessageInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Message could not be sent");

  await sendMessageInDb(parsed.data);
  revalidatePath("/messages");
  revalidatePath(parsed.data.path);
  redirect(withSearchParam(parsed.data.path, "sent", "1"));
}

export async function blockConversationAction(formData: FormData): Promise<void> {
  const parsed = blockConversationInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Conversation could not be blocked");

  await blockConversationInDb(parsed.data);
  revalidatePath("/messages");
  revalidatePath(parsed.data.path);
  redirect(withSearchParam(parsed.data.path, "blocked", "1"));
}

export async function markNotificationsReadAction(): Promise<void> {
  await markNotificationsReadInDb();
  revalidatePath("/notifications");
  redirect("/notifications?read=1");
}

function withSearchParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}
