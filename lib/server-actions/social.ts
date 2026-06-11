"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addReactionInDb, createCommentInDb, createContentReportInDb, deleteCommentInDb, followUserInDb, hideReportedContentInDb, saveTargetInDb, updateContentReportStatusInDb } from "@/lib/data/repositories";
import { formDataToObject } from "@/lib/server-actions/result";
import { commentInputSchema, deleteCommentInputSchema, followInputSchema, hideReportedContentInputSchema, reportInputSchema, reportStatusInputSchema, socialTargetInputSchema } from "@/lib/validators/social";

export async function likeAction(formData: FormData): Promise<void> {
  const parsed = socialTargetInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Like could not be saved");

  await addReactionInDb(parsed.data);
  revalidatePath(parsed.data.path);
  revalidatePath("/notifications");
  revalidatePath("/community");
}

export async function saveTargetAction(formData: FormData): Promise<void> {
  const parsed = socialTargetInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Save could not be saved");

  await saveTargetInDb(parsed.data);
  revalidatePath(parsed.data.path);
  revalidatePath("/notifications");
  revalidatePath("/community");
  redirect(withSearchParam(parsed.data.path, "saved", "1"));
}

export async function followAction(formData: FormData): Promise<void> {
  const parsed = followInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Follow could not be saved");

  await followUserInDb(parsed.data.userId);
  revalidatePath(parsed.data.path);
  revalidatePath("/notifications");
  revalidatePath("/community");
}

export async function commentAction(formData: FormData): Promise<void> {
  const parsed = commentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Comment could not be saved");

  await createCommentInDb(parsed.data);
  revalidatePath(parsed.data.path);
  revalidatePath("/notifications");
  revalidatePath("/community");
  redirect(withSearchParam(parsed.data.path, parsed.data.parentId ? "replied" : "commented", "1"));
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const parsed = deleteCommentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Comment could not be deleted");

  await deleteCommentInDb(parsed.data.id);
  revalidatePath(parsed.data.path);
  redirect(withSearchParam(parsed.data.path, "commentDeleted", "1"));
}

export async function reportContentAction(formData: FormData): Promise<void> {
  const parsed = reportInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Report could not be submitted");

  await createContentReportInDb(parsed.data);
  revalidatePath(parsed.data.path);
  revalidatePath("/admin/moderation");
  redirect(withSearchParam(parsed.data.path, "reported", "1"));
}

export async function updateReportStatusAction(formData: FormData): Promise<void> {
  const parsed = reportStatusInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Report status could not be updated");

  await updateContentReportStatusInDb(parsed.data);
  revalidatePath(parsed.data.path);
}

export async function hideReportedContentAction(formData: FormData): Promise<void> {
  const parsed = hideReportedContentInputSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Reported content could not be hidden");

  await hideReportedContentInDb(parsed.data.id);
  revalidatePath(parsed.data.path);
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/recipes");
  revalidatePath("/brews");
  revalidatePath("/collections");
}

function withSearchParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}
