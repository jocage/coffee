"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  enterChallengeInDb,
  joinClubInDb,
  markNotificationsReadInDb,
  sendMessageInDb,
  startConversationInDb
} from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import {
  challengeEntryInputSchema,
  joinClubInputSchema,
  sendMessageInputSchema,
  startConversationInputSchema
} from "@/lib/validators/community";

export async function joinClubAction(formData: FormData): Promise<void> {
  const parsed = joinClubInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Club could not be joined");

  await joinClubInDb(parsed.data.clubId);
  revalidatePath("/community");
  revalidatePath(parsed.data.path);
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

export async function startConversationAction(formData: FormData): Promise<void> {
  const parsed = startConversationInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Conversation could not be started");

  const conversation = await startConversationInDb(parsed.data);
  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}?sent=1`);
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
